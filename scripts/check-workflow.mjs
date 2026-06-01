#!/usr/bin/env node
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";

const required = [
  "README.md",
  "LICENSE",
  ".env.example",
  "sources/WeMD/package.json",
  "sources/WeMD/LICENSE",
  "prompts/codex-writing.md",
  "prompts/wemd-review.md",
  "prompts/wechat-publish.md",
  "workflow/WORKFLOW.md",
  "workflow/CODEX_BLOGGER_WORKFLOW.md",
  "workflow/CONTENT_PIPELINE.md",
  "workflow/WECHAT_DRAFT_SETTINGS.md",
  "workflow/SOURCES.md",
  "scripts/new-article.mjs",
  "scripts/handoff-wemd.mjs",
  "scripts/render-styled-wechat-html.mjs",
  "scripts/save-wemd-html-from-clipboard.mjs",
  "scripts/wechat-official-lib.mjs",
  "scripts/preview-wechat-draft.mjs",
  "scripts/publish-draft.mjs",
  "articles/drafts/.gitkeep",
  "articles/wemd-inbox/.gitkeep",
  "articles/approved/.gitkeep",
  "articles/approved-html/.gitkeep",
  "assets/covers/.gitkeep"
];

const forbidden = [
  ".env",
  ".env.local",
  "scripts/batch-paper-articles.py",
  "workflow/FREE_LEAD_PROJECTS.md",
  "videos",
  "output",
  ".tools",
  ".cache",
  "archive"
];

for (const item of required) {
  await fs.access(path.resolve(item));
}

for (const item of forbidden) {
  if (fsSync.existsSync(path.resolve(item))) {
    throw new Error(`公开仓库不应包含：${item}`);
  }
}

const wemdPkg = JSON.parse(await fs.readFile("sources/WeMD/package.json", "utf8"));
if (!wemdPkg.name) {
  throw new Error("WeMD package.json 读取失败。");
}

console.log("工作流检查通过。");
console.log(`WeMD metadata: ${wemdPkg.name}`);
console.log("Publish channel: styled HTML + official WeChat API");
