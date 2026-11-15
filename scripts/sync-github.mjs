import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const registryPath = resolve(root, "src/content/project-registry.json");
const cachePath = resolve(root, "src/content/github-cache.json");
const registry = JSON.parse(await readFile(registryPath, "utf8"));
const cache = JSON.parse(await readFile(cachePath, "utf8")).repositories || [];
const projects = registry.projects || [];
if (projects.length > 0 && projects.filter((p) => p.featured).length > 5) {
  throw new Error("The project registry allows at most five featured projects.");
}

// Only repositories explicitly entered by the owner are ever queried.
if (!projects.length) {
  console.log("No repositories are in the manual curation registry; GitHub was not queried.");
  process.exit(0);
}

const byName = new Map(cache.map((item) => [item.repository.toLowerCase(), item]));
let failures = 0;
for (const project of projects) {
  const repository = String(project.repository || "").trim();
  if (!repository || repository.includes("/") || !/^[\w.-]+$/.test(repository)) {
    console.warn(`Skipping invalid repository entry: ${repository || "(empty)"}`);
    failures++;
    continue;
  }
  const key = repository.toLowerCase();
  const previous = byName.get(key);
  const headers = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "owner-curated-portfolio-sync" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  if (previous?.etag) headers["If-None-Match"] = previous.etag;
  try {
    const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(registry.owner)}/${encodeURIComponent(repository)}`, { headers });
    if (response.status === 304 && previous) continue;
    if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
    const data = await response.json();
    byName.set(key, {
      repository,
      name: data.name,
      description: data.description || "",
      url: data.html_url,
      language: data.language,
      topics: data.topics || [],
      stars: data.stargazers_count,
      forks: data.forks_count,
      updatedAt: data.updated_at,
      etag: response.headers.get("etag") || undefined,
    });
    console.log(`Updated metadata for manually curated repository: ${repository}`);
  } catch (error) {
    failures++;
    console.warn(`Could not refresh ${repository}; keeping any cached metadata. ${error.message}`);
  }
}
const allowed = new Set(projects.map((p) => String(p.repository).toLowerCase()));
await writeFile(cachePath, `${JSON.stringify({ repositories: [...byName.values()].filter((item) => allowed.has(item.repository.toLowerCase())) }, null, 2)}\n`);
if (failures) console.warn(`${failures} repository refresh(es) failed; cached content is preserved where available.`);
