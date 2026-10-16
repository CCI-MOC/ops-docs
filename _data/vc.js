import { execSync } from "node:child_process";

export default function () {
  try {
    const revision = execSync("git rev-parse HEAD", {
      encoding: "utf8",
    }).trim();
    const author_name = execSync("git show -q --format=%an HEAD", {
      encoding: "utf8",
    }).trim();
    const author_email = execSync("git show -q --format=%ae HEAD", {
      encoding: "utf8",
    }).trim();
    const date = execSync("git show -q --format=%ai HEAD", {
      encoding: "utf8",
    }).trim();

    return {
      revision,
      author_name,
      author_email,
      date,
    };
  } catch (_error) {
    // Fallback if git command fails
    return {
      revision: "unknown",
      author_name: "unknown",
      author_email: "unknown",
      date: "unknown",
    };
  }
}
