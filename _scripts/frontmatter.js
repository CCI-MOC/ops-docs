import { load as parseYaml } from "js-yaml";

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export function extractFrontmatter(source) {
	const match = FRONTMATTER_PATTERN.exec(source);
	if (!match) {
		return {};
	}
	return parseYaml(match[1]) ?? {};
}
