#!/usr/bin/env node
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { isInsideDirectory, parseArgs, readArticle, validateArticleMetadata } from "./wechat-official-lib.mjs";

const args = parseArgs(process.argv.slice(2));
const article = args.article || args._[0];

if (!article) {
  console.error("用法：npm.cmd run preview:wechat -- --article articles/approved/article.md");
  process.exit(1);
}

const approvedRoot = path.resolve("articles", "approved");
const articlePath = path.resolve(article);
if (!isInsideDirectory(articlePath, approvedRoot)) {
  console.error(`预检查只允许处理 articles/approved/ 下的最终稿：${article}`);
  process.exit(1);
}
if (!fsSync.existsSync(articlePath)) {
  console.error(`文章不存在：${article}`);
  process.exit(1);
}

const slug = path.basename(articlePath, ".md");
const htmlPath = path.resolve("articles", "approved-html", `${slug}.html`);

try {
  const { metadata } = await readArticle(articlePath);
  validateArticleMetadata(metadata, articlePath);

  if (!fsSync.existsSync(htmlPath)) {
    console.error(`缺少 WeMD HTML：articles/approved-html/${slug}.html
请先在 WeMD 打开文章，点击“复制 HTML”，再运行：
npm.cmd run save:wemd-html -- --article articles/approved/${slug}.md`);
    process.exit(1);
  }

  const html = await fs.readFile(htmlPath, "utf8");
  const frontmatterLeak = html.match(/(?:^|<[^>]+>)\s*(title|author|digest|date):/i);
  if (frontmatterLeak) {
    console.error(`WeMD HTML 疑似包含 frontmatter 残留：articles/approved-html/${slug}.html
请重新生成 HTML，确保正文不包含 title:/author:/digest:/date:。`);
    process.exit(1);
  }
  const imageCount = [...html.matchAll(/<img\b/gi)].length;
  console.log(JSON.stringify({
    success: true,
    article: path.relative(process.cwd(), articlePath),
    html: path.relative(process.cwd(), htmlPath),
    title: metadata.title,
    digest: metadata.digest || "",
    html_length: html.length,
    image_count: imageCount
  }, null, 2));
} catch (error) {
  console.error(error.message || error);
  process.exit(1);
}
