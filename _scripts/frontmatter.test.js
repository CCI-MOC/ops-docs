import assert from "node:assert/strict";
import { test } from "node:test";
import { extractFrontmatter } from "./frontmatter.js";

test("extractFrontmatter parses YAML frontmatter", () => {
	const source =
		"---\ntitle: Example\nstandards:\n- nist-ia\n---\n\nBody text";
	assert.deepEqual(extractFrontmatter(source), {
		title: "Example",
		standards: ["nist-ia"],
	});
});

test("extractFrontmatter returns an empty object when there is no frontmatter", () => {
	assert.deepEqual(extractFrontmatter("Just body text"), {});
});
