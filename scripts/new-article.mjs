#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const args = parseArgs(process.argv.slice(2));
const title = args.title || args._[0];

if (!title) {
  console.error('用法：npm.cmd run article:new -- --title "文章标题" --slug article-slug');
  process.exit(1);
}

const slug = slugify(args.slug || title);
const target = path.resolve("articles", "drafts", `${slug}.md`);

if (await exists(target)) {
  console.error(`稿件已存在：${target}`);
  process.exit(1);
}

const now = new Date().toISOString().slice(0, 10);
const content = `---
title: ${title}
author: ${args.author || ""}
digest: ${args.digest || ""}
date: ${now}
---

开头导语：这里写一个能抓住读者的开头。

## 正文

这里展开核心观点、案例和论证。

## 结尾

这里给出总结、提醒或行动建议。
`;

await fs.mkdir(path.dirname(target), { recursive: true });
await fs.writeFile(target, content, "utf8");
console.log(`已创建：${path.relative(process.cwd(), target)}`);

function parseArgs(argv) {
  const parsed = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      parsed._.push(token);
      continue;
    }

    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      i += 1;
    }
  }
  return parsed;
}

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "article";
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
