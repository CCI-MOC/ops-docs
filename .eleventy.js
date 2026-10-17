import markdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";
import markdownItGithubAlerts from "markdown-it-github-alerts";

export default function (eleventyConfig) {
	eleventyConfig.addPassthroughCopy("_assets");

	const markdownLibrary = markdownIt({ html: true })
		.use(markdownItGithubAlerts)
		.use(markdownItAnchor, { level: [2, 3, 4] });
	eleventyConfig.setLibrary("md", markdownLibrary);

	// Builds a collapsed, non-printing table of contents from the h2-h4
	// headings (and their anchor ids, added by markdown-it-anchor above)
	// found in a page's rendered content.
	eleventyConfig.addShortcode("toc", function (content) {
		const headingRegex = /<h([234])\s[^>]*\bid="([^"]+)"[^>]*>(.*?)<\/h\1>/gis;
		const headings = [];
		let match;
		while ((match = headingRegex.exec(content))) {
			headings.push({
				level: Number(match[1]),
				id: match[2],
				text: match[3].replace(/<[^>]+>/g, ""),
			});
		}
		if (headings.length === 0) {
			return "";
		}

		// Nest headings into a tree so that each sub-list lives inside its
		// parent's <li>, as required for valid HTML.
		const root = { level: -Infinity, children: [] };
		const stack = [root];
		for (const heading of headings) {
			while (stack[stack.length - 1].level >= heading.level) {
				stack.pop();
			}
			const node = { ...heading, children: [] };
			stack[stack.length - 1].children.push(node);
			stack.push(node);
		}

		const renderList = (node) => {
			if (node.children.length === 0) {
				return "";
			}
			const items = node.children
				.map(
					(child) =>
						`<li><a href="#${child.id}">${child.text}</a>${renderList(child)}</li>`,
				)
				.join("");
			return `<ul>${items}</ul>`;
		};

		return `<nav class="toc noprint"><details><summary>Table of contents</summary>${renderList(root)}</details></nav>`;
	});
}
