#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { isInsideDirectory, parseArgs } from "./wechat-official-lib.mjs";

const args = parseArgs(process.argv.slice(2));
const article = args.article || args._[0];
const inbox = args.inbox;

if (!article) {
  console.error("用法：node scripts/render-styled-wechat-html.mjs --article articles/approved/<slug>.md [--inbox articles/wemd-inbox/<slug>.md]");
  process.exit(1);
}

const approvedRoot = path.resolve("articles", "approved");
const articlePath = path.resolve(article);
if (!isInsideDirectory(articlePath, approvedRoot)) {
  console.error(`只允许处理 articles/approved/ 下的最终稿：${article}`);
  process.exit(1);
}

const slug = path.basename(articlePath, ".md");
const sourcePath = inbox ? path.resolve(inbox) : articlePath;
const outputPath = path.resolve("articles", "approved-html", `${slug}.html`);
const outputDir = path.dirname(outputPath);
const sourceDir = path.dirname(sourcePath);

const S = {
  root: "max-width:100%;box-sizing:border-box;color:#27364a;font-size:16px;line-height:1.9;letter-spacing:0;background:#ffffff;",
  p: "margin:0 0 16px 0;color:#27364a;font-size:16px;line-height:1.9;text-align:left;",
  h2Wrap: "display:flex;align-items:center;margin:34px 0 18px 0;padding:0 0 0 0;",
  h2Bar: "display:inline-block;width:5px;height:24px;background:#45b36b;border-radius:2px;margin-right:10px;vertical-align:middle;",
  h2: "display:inline-block;margin:0;color:#1f2d3d;font-size:22px;line-height:1.35;font-weight:700;",
  list: "margin:0 0 18px 0;padding:0 0 0 24px;color:#27364a;font-size:16px;line-height:1.9;",
  li: "margin:0 0 8px 0;color:#27364a;font-size:16px;line-height:1.9;",
  figure: "margin:24px 0 28px 0;text-align:center;",
  img: "display:block;width:100%;max-width:100%;height:auto;border-radius:6px;margin:0 auto;",
  caption: "margin-top:8px;color:#7b8794;font-size:13px;line-height:1.6;text-align:center;",
  codeWrap: "margin:18px 0 22px 0;padding:14px 16px;background:#f7f8fa;border-left:4px solid #45b36b;border-radius:6px;box-sizing:border-box;",
  pre: "margin:0;white-space:pre-wrap;word-break:break-word;color:#465468;font-size:14px;line-height:1.8;font-family:Menlo,Consolas,monospace;",
  inlineCode: "padding:2px 5px;margin:0 2px;background:#f2f4f7;border-radius:4px;color:#2f6f4e;font-size:90%;font-family:Menlo,Consolas,monospace;",
  strong: "font-weight:700;color:#1f2d3d;"
};

let markdown = await fs.readFile(sourcePath, "utf8");
markdown = markdown.replace(/^\uFEFF/, "").replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").trim();

const html = render(markdown);
await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, html, "utf8");
console.log(`已生成带样式公众号 HTML：${path.relative(process.cwd(), outputPath)}`);

function render(raw) {
  const lines = raw.split(/\r?\n/);
  const chunks = [];
  let paragraph = [];
  let list = null;
  let code = null;

  function flushParagraph() {
    if (paragraph.length === 0) return;
    chunks.push(p(paragraph.join("")));
    paragraph = [];
  }

  function flushList() {
    if (!list) return;
    const items = list.items.map((item) => `<li style="${S.li}">${inline(item)}</li>`).join("");
    chunks.push(`<${list.type} style="${S.list}">${items}</${list.type}>`);
    list = null;
  }

  function flushCode() {
    if (!code) return;
    chunks.push(`<section style="${S.codeWrap}"><pre style="${S.pre}"><code>${escapeHtml(code.lines.join("\n"))}</code></pre></section>`);
    code = null;
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (code) {
      if (/^```/.test(trimmed)) flushCode();
      else code.lines.push(line);
      continue;
    }
    if (/^```/.test(trimmed)) {
      flushParagraph();
      flushList();
      code = { lines: [] };
      continue;
    }
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    const image = trimmed.match(/^!\[(.*?)\]\(([\s\S]+?)\)$/);
    if (image) {
      flushParagraph();
      flushList();
      const alt = escapeHtml(image[1]);
      const src = normalizeImageSrc(image[2].trim());
      chunks.push(`<figure style="${S.figure}"><img src="${escapeHtml(src)}" alt="${alt}" style="${S.img}" /><figcaption style="${S.caption}">${alt}</figcaption></figure>`);
      continue;
    }

    const heading = trimmed.match(/^##\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      chunks.push(`<section style="${S.h2Wrap}"><span style="${S.h2Bar}"></span><h2 style="${S.h2}">${inline(heading[1])}</h2></section>`);
      continue;
    }

    const bullet = trimmed.match(/^-\s+(.+)$/);
    if (bullet) {
      flushParagraph();
      if (!list || list.type !== "ul") {
        flushList();
        list = { type: "ul", items: [] };
      }
      list.items.push(bullet[1]);
      continue;
    }

    const ordered = trimmed.match(/^\d+\.\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      if (!list || list.type !== "ol") {
        flushList();
        list = { type: "ol", items: [] };
      }
      list.items.push(ordered[1]);
      continue;
    }

    flushList();
    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();
  flushCode();

  return `<section style="${S.root}">\n${chunks.join("\n")}\n</section>\n`;
}

function p(text) {
  return `<p style="${S.p}">${inline(text)}</p>`;
}

function inline(text) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, `<code style="${S.inlineCode}">$1</code>`)
    .replace(/\*\*([^*]+)\*\*/g, `<strong style="${S.strong}">$1</strong>`);
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function normalizeImageSrc(src) {
  if (/^(?:data:image\/|https?:\/\/|file:)/i.test(src)) return src;
  const absolute = path.resolve(sourceDir, src);
  return path.relative(outputDir, absolute).replaceAll(path.sep, "/");
}
