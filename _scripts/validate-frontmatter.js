import { globSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { extractFrontmatter } from "./frontmatter.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaDir = path.join(__dirname, "..", "_schema");

const baseSchema = JSON.parse(
	readFileSync(path.join(schemaDir, "base.schema.json"), "utf8"),
);
const productionChangeSchema = JSON.parse(
	readFileSync(path.join(schemaDir, "production-change.schema.json"), "utf8"),
);

const schemaByCategory = {
	adrs: baseSchema,
	docs: baseSchema,
	policies: baseSchema,
	"production-changes": productionChangeSchema,
};

const ajv = new Ajv2020({ allErrors: true });
addFormats(ajv);
ajv.addSchema(baseSchema);
ajv.addSchema(productionChangeSchema);

function categoryFor(file) {
	return file.split(path.sep)[0];
}

const files =
	process.argv.length > 2
		? process.argv.slice(2)
		: Object.keys(schemaByCategory).flatMap((category) =>
				globSync(`${category}/**/*.md`),
			);
let hasErrors = false;

for (const file of files) {
	const schema = schemaByCategory[categoryFor(file)];
	if (!schema) {
		continue;
	}

	const frontmatter = extractFrontmatter(readFileSync(file, "utf8"));
	const validate = ajv.getSchema(schema.$id);

	if (!validate(frontmatter)) {
		hasErrors = true;
		console.error(`${file}:`);
		for (const error of validate.errors) {
			console.error(`  ${error.instancePath || "/"} ${error.message}`);
		}
	}
}

process.exit(hasErrors ? 1 : 0);
