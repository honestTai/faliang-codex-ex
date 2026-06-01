#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { isInsideDirectory, parseArgs } from "./wechat-official-lib.mjs";

const args = parseArgs(process.argv.slice(2));
const article = args.article || args._[0];

if (!article) {
  console.error("用法：npm.cmd run save:wemd-html -- --article articles/approved/article.md");
  process.exit(1);
}

const approvedRoot = path.resolve("articles", "approved");
const articlePath = path.resolve(article);
if (!isInsideDirectory(articlePath, approvedRoot)) {
  console.error(`只允许为 articles/approved/ 下的最终稿保存 WeMD HTML：${article}`);
  process.exit(1);
}

const slug = path.basename(articlePath, ".md");
const outputPath = path.resolve("articles", "approved-html", `${slug}.html`);
const html = readClipboard();

if (!/<[a-z][\s\S]*>/i.test(html)) {
  console.error("剪贴板里不是 HTML。请先在 WeMD 点击“复制 HTML”。");
  process.exit(1);
}

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, html.trim() + "\n", "utf8");
console.log(`已保存 WeMD HTML：${path.relative(process.cwd(), outputPath)}`);

function readClipboard() {
  if (process.platform !== "win32") {
    throw new Error("当前脚本只实现了 Windows 剪贴板读取。");
  }
  const result = spawnSync("powershell.exe", ["-NoProfile", "-Command", "Get-Clipboard -Raw"], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 80
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || "读取剪贴板失败。");
  }
  return result.stdout;
}
