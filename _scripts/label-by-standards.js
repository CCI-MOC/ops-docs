import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { extractFrontmatter } from "./frontmatter.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const LABEL_COLOR = "0e8a16";

export const DOC_PATTERN =
	/^(adrs|docs|policies|production-changes)\/[^/]+\/README\.md$/;

export function loadKnownStandards() {
	const schema = JSON.parse(
		readFileSync(
			path.join(__dirname, "..", "_schema", "base.schema.json"),
			"utf8",
		),
	);
	return new Set(schema.properties.standards.items.enum);
}

export function collectStandards(fileContents) {
	const standards = new Set();
	for (const content of fileContents) {
		const frontmatter = extractFrontmatter(content);
		for (const standard of frontmatter.standards ?? []) {
			standards.add(standard);
		}
	}
	return standards;
}

export function diffLabels(currentLabels, desiredStandards, knownStandards) {
	const toAdd = [...desiredStandards].filter(
		(name) => !currentLabels.includes(name),
	);
	const toRemove = currentLabels.filter(
		(name) => knownStandards.has(name) && !desiredStandards.has(name),
	);
	return { toAdd, toRemove };
}

async function githubRequest(token, apiPath, options = {}) {
	const response = await fetch(`https://api.github.com${apiPath}`, {
		...options,
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: "application/vnd.github+json",
			"X-GitHub-Api-Version": "2022-11-28",
			...options.headers,
		},
	});
	if (!response.ok && response.status !== 404) {
		throw new Error(
			`${options.method ?? "GET"} ${apiPath} failed: ${response.status} ${await response.text()}`,
		);
	}
	return response;
}

async function listChangedFiles(token, repo, pullNumber) {
	const files = [];
	for (let page = 1; ; page++) {
		const response = await githubRequest(
			token,
			`/repos/${repo}/pulls/${pullNumber}/files?per_page=100&page=${page}`,
		);
		const batch = await response.json();
		files.push(...batch);
		if (batch.length < 100) {
			break;
		}
	}
	return files;
}

async function fetchFileContent(token, repo, filePath, ref) {
	const response = await githubRequest(
		token,
		`/repos/${repo}/contents/${filePath}?ref=${ref}`,
	);
	if (response.status === 404) {
		return null;
	}
	const data = await response.json();
	return Buffer.from(data.content, "base64").toString("utf8");
}

async function ensureLabelExists(token, repo, name) {
	const response = await githubRequest(
		token,
		`/repos/${repo}/labels/${encodeURIComponent(name)}`,
	);
	if (response.status === 404) {
		await githubRequest(token, `/repos/${repo}/labels`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				name,
				color: LABEL_COLOR,
				description: `Document addresses the ${name} standard`,
			}),
		});
	}
}

async function main() {
	const token = process.env.GITHUB_TOKEN;
	const repo = process.env.GITHUB_REPOSITORY;
	const eventPath = process.env.GITHUB_EVENT_PATH;
	if (!token || !repo || !eventPath) {
		throw new Error(
			"GITHUB_TOKEN, GITHUB_REPOSITORY, and GITHUB_EVENT_PATH are required",
		);
	}

	const event = JSON.parse(readFileSync(eventPath, "utf8"));
	const pullNumber = event.pull_request.number;
	const headSha = event.pull_request.head.sha;

	const changedFiles = await listChangedFiles(token, repo, pullNumber);
	const docFiles = changedFiles
		.filter((file) => file.status !== "removed")
		.map((file) => file.filename)
		.filter((filename) => DOC_PATTERN.test(filename));

	const fileContents = [];
	for (const filename of docFiles) {
		const content = await fetchFileContent(token, repo, filename, headSha);
		if (content !== null) {
			fileContents.push(content);
		}
	}

	const desiredStandards = collectStandards(fileContents);
	const knownStandards = loadKnownStandards();

	const currentLabelsResponse = await githubRequest(
		token,
		`/repos/${repo}/issues/${pullNumber}/labels`,
	);
	const currentLabels = (await currentLabelsResponse.json()).map(
		(label) => label.name,
	);

	const { toAdd, toRemove } = diffLabels(
		currentLabels,
		desiredStandards,
		knownStandards,
	);

	for (const name of toAdd) {
		await ensureLabelExists(token, repo, name);
	}

	if (toAdd.length > 0) {
		await githubRequest(token, `/repos/${repo}/issues/${pullNumber}/labels`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ labels: toAdd }),
		});
	}

	for (const name of toRemove) {
		await githubRequest(
			token,
			`/repos/${repo}/issues/${pullNumber}/labels/${encodeURIComponent(name)}`,
			{ method: "DELETE" },
		);
	}
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
	await main();
}
