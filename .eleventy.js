import markdownIt from "markdown-it";
import markdownItGithubAlerts from "markdown-it-github-alerts";

export default function (eleventyConfig) {
	eleventyConfig.addPassthroughCopy("_assets");

	const markdownLibrary = markdownIt({ html: true }).use(
		markdownItGithubAlerts,
	);
	eleventyConfig.setLibrary("md", markdownLibrary);
}
