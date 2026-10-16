export default {
	permalink: (data) => {
		// If the file path stem ends with README, replace it with index
		if (data.page.filePathStem.endsWith("/README")) {
			return `${data.page.filePathStem.replace(/\/README$/, "/index")}.html`;
		}
		// Otherwise, leave the permalink alone (returns undefined to use Eleventy's default behavior)
		return undefined;
	},

	// `page.fileSlug` is a reserved Eleventy property and cannot be
	// overridden by computed data, so we expose the corrected value here
	// instead. Use `fileSlug` (not `page.fileSlug`) wherever the slug is
	// needed in templates.
	fileSlug: (data) => {
		if (data.page.filePathStem.endsWith("/README")) {
			const segments = data.page.filePathStem.split("/");
			const lastDir = segments[segments.length - 2] ?? "";
			// Match Eleventy's own index.md behavior, which also strips a
			// leading YYYY-MM-DD date from the parent directory name.
			const dateMatch = lastDir.match(/^\d{4}-\d{2}-\d{2}-(.*)/);
			return dateMatch ? dateMatch[1] : lastDir;
		}
		return data.page.fileSlug;
	},

	pageId: (data) => {
		if (data.page.filePathStem.endsWith("/README")) {
			return data.page.filePathStem.replace(/\/README$/, "").replace(/^\//, "");
		}
		const segments = data.page.filePathStem.split("/");
		const baseName = segments[segments.length - 1];
		return baseName;
	},

	// Only show the pageId on actual documents (ADRs, docs, policies,
	// production changes), not on collection index pages, the top-level
	// README, or templates.
	showPageId: (data) =>
		/^\/(adrs|docs|policies|production-changes)\/.*\/README$/.test(
			data.page.filePathStem,
		),
};
