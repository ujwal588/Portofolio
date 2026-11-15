import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcesPath = resolve(root, "src/content/blog-sources.json");
const cachePath = resolve(root, "src/content/blog-cache.json");
const sources = JSON.parse(await readFile(sourcesPath, "utf8"));
const old = JSON.parse(await readFile(cachePath, "utf8"));
const manualPosts = sources.manualPosts || [];
const feeds = sources.feeds || [];
if (!feeds.length) {
  await writeFile(cachePath, `${JSON.stringify({ posts: manualPosts }, null, 2)}\n`);
  console.log("No blog feeds configured; wrote only manually curated posts.");
  process.exit(0);
}
const decode = (text = "") => text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const tag = (block, name) => block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"))?.[1] || "";
const cached = new Map((old.posts || []).map((post) => [post.url, post]));
for (const source of feeds) {
  try {
    const response = await fetch(source.url, { headers: { "User-Agent": "owner-configured-portfolio-feed-reader", Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml" } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const xml = await response.text();
    const blocks = [...xml.matchAll(/<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map((m) => m[2]);
    for (const block of blocks) {
      const title = decode(tag(block, "title"));
      const linkAttr = block.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*\/?\s*>/i)?.[1];
      const url = linkAttr || decode(tag(block, "link"));
      if (!title || !/^https?:\/\//i.test(url)) continue;
      cached.set(url, { title, url, date: decode(tag(block, "pubDate") || tag(block, "published") || tag(block, "updated")), source: source.name, excerpt: decode(tag(block, "description") || tag(block, "summary")).slice(0, 240) });
    }
    console.log(`Read configured feed: ${source.name}`);
  } catch (error) {
    console.warn(`Could not refresh ${source.name}; keeping cached posts. ${error.message}`);
  }
}
for (const post of manualPosts) cached.set(post.url, post);
const posts = [...cached.values()].sort((a, b) => Date.parse(b.date || "") - Date.parse(a.date || "")).slice(0, 30);
await writeFile(cachePath, `${JSON.stringify({ posts }, null, 2)}\n`);
