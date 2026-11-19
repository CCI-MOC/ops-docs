#!/bin/bash
#
# Create an AWS KMS key and import a locally generated 4096-bit RSA
# private key as its key material.
#
# KMS does not let you hand it key material directly; the only route in
# is the "import key material" workflow: create a key with no material
# (Origin=EXTERNAL), fetch a one-time RSA wrapping key + import token,
# wrap the private key locally, then import it.
#
# Because a 4096-bit RSA private key (~2.3KB as PKCS#1 DER) is far
# larger than an RSA-OAEP wrapping key can encrypt directly, this uses
# the RSA_AES_KEY_WRAP_SHA_256 wrapping algorithm: a random AES-256 key
# is RSA-OAEP-wrapped, and the private key is wrapped with that AES key
# using RFC 5649 (AES-KWP). AWS requires EncryptedKeyMaterial to be the
# wrapped AES key followed immediately by the AES-wrapped key material.

set -euo pipefail

PRIVATE_KEY_FILE="${1:-privateKey.pem}"
KEY_SPEC="${KEY_SPEC:-RSA_4096}"
KEY_USAGE="${KEY_USAGE:-SIGN_VERIFY}"
DESCRIPTION="${DESCRIPTION:-Imported from $PRIVATE_KEY_FILE}"
WRAPPING_KEY_SPEC="${WRAPPING_KEY_SPEC:-RSA_2048}"
EXPIRATION_MODEL="${EXPIRATION_MODEL:-KEY_MATERIAL_DOES_NOT_EXPIRE}"

for cmd in aws openssl jq; do
  command -v "$cmd" >/dev/null || {
    echo "ERROR: required command '$cmd' not found" >&2
    exit 1
  }
done

[ -r "$PRIVATE_KEY_FILE" ] || {
  echo "ERROR: cannot read private key file: $PRIVATE_KEY_FILE" >&2
  exit 1
}

BITS=$(openssl rsa -in "$PRIVATE_KEY_FILE" -noout -text 2>/dev/null | grep -oP '\(\K[0-9]+(?= bit)') || {
  echo "ERROR: $PRIVATE_KEY_FILE is not a readable RSA private key" >&2
  exit 1
}
[ "$BITS" = "4096" ] || {
  echo "ERROR: expected a 4096-bit RSA key, got ${BITS}-bit" >&2
  exit 1
}

WORKDIR=$(mktemp -d)
trap 'shred -u "$WORKDIR"/* 2>/dev/null; rm -rf "$WORKDIR"' EXIT

echo "Creating KMS key (origin=EXTERNAL, key-spec=$KEY_SPEC, key-usage=$KEY_USAGE)..." >&2
KEY_ID=$(aws kms create-key \
  --origin EXTERNAL \
  --key-spec "$KEY_SPEC" \
  --key-usage "$KEY_USAGE" \
  --description "$DESCRIPTION" \
  --query 'KeyMetadata.KeyId' --output text)
echo "Created key: $KEY_ID" >&2

echo "Fetching wrapping key and import token..." >&2
aws kms get-parameters-for-import \
  --key-id "$KEY_ID" \
  --wrapping-algorithm RSA_AES_KEY_WRAP_SHA_256 \
  --wrapping-key-spec "$WRAPPING_KEY_SPEC" \
  >"$WORKDIR/import-params.json"

jq -r '.PublicKey' "$WORKDIR/import-params.json" | base64 -d >"$WORKDIR/wrapping_key.der"
jq -r '.ImportToken' "$WORKDIR/import-params.json" | base64 -d >"$WORKDIR/import_token.bin"
openssl rsa -pubin -inform DER -in "$WORKDIR/wrapping_key.der" -outform PEM -out "$WORKDIR/wrapping_key.pem" >/dev/null 2>&1

echo "Wrapping private key material..." >&2
# AWS KMS requires RSA private key material as PKCS#8 DER (NOT PKCS#1/"traditional" DER).
openssl pkcs8 -topk8 -nocrypt -outform DER \
  -in "$PRIVATE_KEY_FILE" -out "$WORKDIR/target_key.der"

openssl rand -out "$WORKDIR/aes_key.bin" 32
AES_KEY_HEX=$(xxd -p "$WORKDIR/aes_key.bin" | tr -d '\n')

openssl pkeyutl -encrypt \
  -pubin -inkey "$WORKDIR/wrapping_key.pem" \
  -in "$WORKDIR/aes_key.bin" -out "$WORKDIR/encrypted_aes_key.bin" \
  -pkeyopt rsa_padding_mode:oaep \
  -pkeyopt rsa_oaep_md:sha256 \
  -pkeyopt rsa_mgf1_md:sha256

openssl enc -id-aes256-wrap-pad -e -K "$AES_KEY_HEX" -iv A65959A6 \
  -in "$WORKDIR/target_key.der" -out "$WORKDIR/wrapped_target_key.bin"

cat "$WORKDIR/encrypted_aes_key.bin" "$WORKDIR/wrapped_target_key.bin" \
  >"$WORKDIR/encrypted_key_material.bin"

echo "Importing key material into $KEY_ID..." >&2
aws kms import-key-material \
  --key-id "$KEY_ID" \
  --encrypted-key-material "fileb://$WORKDIR/encrypted_key_material.bin" \
  --import-token "fileb://$WORKDIR/import_token.bin" \
  --expiration-model "$EXPIRATION_MODEL"

echo "Done. KMS key ID: $KEY_ID" >&2
echo "$KEY_ID"
