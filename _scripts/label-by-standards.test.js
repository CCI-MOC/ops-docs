import assert from "node:assert/strict";
import { test } from "node:test";
import {
	DOC_PATTERN,
	collectStandards,
	diffLabels,
} from "./label-by-standards.js";

test("DOC_PATTERN matches tracked document READMEs", () => {
	assert.ok(DOC_PATTERN.test("adrs/2026-10-16-ldap-and-keycloak/README.md"));
	assert.ok(DOC_PATTERN.test("docs/some-doc/README.md"));
	assert.ok(DOC_PATTERN.test("policies/some-policy/README.md"));
	assert.ok(DOC_PATTERN.test("production-changes/some-change/README.md"));
});

test("DOC_PATTERN rejects unrelated paths", () => {
	assert.equal(DOC_PATTERN.test("adrs/README.md"), false);
	assert.equal(DOC_PATTERN.test("adrs/foo/bar/README.md"), false);
	assert.equal(DOC_PATTERN.test("README.md"), false);
	assert.equal(DOC_PATTERN.test("_assets/style.css"), false);
});

test("collectStandards gathers unique standards from frontmatter across files", () => {
	const fileA = "---\ntitle: A\nstandards:\n- nist-ia\n- nist-au\n---\n";
	const fileB = "---\ntitle: B\nstandards:\n- nist-au\n---\n";
	const fileC = "---\ntitle: C\n---\n";

	const result = collectStandards([fileA, fileB, fileC]);

	assert.deepEqual([...result].sort(), ["nist-au", "nist-ia"]);
});

test("diffLabels adds missing standards and leaves unrelated labels alone", () => {
	const known = new Set(["nist-ia", "nist-au", "nist-ac"]);

	const { toAdd, toRemove } = diffLabels(
		["nist-ac", "ops-adr"],
		new Set(["nist-ia", "nist-ac"]),
		known,
	);

	assert.deepEqual(toAdd, ["nist-ia"]);
	assert.deepEqual(toRemove, []);
});

test("diffLabels only removes stale labels within the known standards set", () => {
	const known = new Set(["nist-ia", "nist-au"]);

	const { toRemove } = diffLabels(["nist-au", "ops-adr"], new Set(), known);

	assert.deepEqual(toRemove, ["nist-au"]);
});
