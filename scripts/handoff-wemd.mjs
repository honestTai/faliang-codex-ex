#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const input = process.argv[2];
if (!input) {
  console.error("用法：npm.cmd run handoff:wemd -- articles/drafts/<slug>.md");
  process.exit(1);
}

const source = path.resolve(input);
const name = path.basename(source);
const target = path.resolve("articles", "wemd-inbox", name);
const targetDir = path.dirname(target);
const draftsRoot = path.resolve("articles", "drafts");

if (!isInsideDirectory(source, draftsRoot)) {
  console.error(`WeMD handoff 只允许处理 articles/drafts/ 下的草稿：${input}`);
  process.exit(1);
}

await fs.access(source);
const raw = await fs.readFile(source, "utf8");
const content = raw.trim();
const inlinedContent = await inlineImagesAsDataUris(content, path.dirname(source));
const handoff = `${inlinedContent}
`;

await fs.mkdir(targetDir, { recursive: true });
await fs.writeFile(target, handoff, "utf8");
console.log(`已生成 WeMD 审稿副本：${path.relative(process.cwd(), target)}`);

async function inlineImagesAsDataUris(content, sourceDir) {
  const imagePattern = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  const matches = [...content.matchAll(imagePattern)];
  if (matches.length === 0) {
    return content;
  }

  let updated = content;
  const unresolved = [];
  for (const match of matches) {
    const [full, alt, imageRef] = match;
    if (/^data:image\//i.test(imageRef)) {
      continue;
    }
    if (/^(https?:|file:)/i.test(imageRef)) {
      unresolved.push(`${imageRef}（请先下载为本地图片，再用相对路径引用）`);
      continue;
    }

    const imagePath = path.resolve(sourceDir, imageRef);
    try {
      await fs.access(imagePath);
    } catch {
      unresolved.push(imageRef);
      continue;
    }

    const data = await fs.readFile(imagePath);
    const mime = mimeTypeForImage(data, imagePath);
    const dataUri = `data:${mime};base64,${data.toString("base64")}`;
    updated = updated.replace(full, `![${alt}](${dataUri})`);
  }
  if (unresolved.length > 0) {
    throw new Error(`WeMD handoff 要求图片内嵌为 data URI，以下图片未能内联：\n- ${unresolved.join("\n- ")}`);
  }
  const remainingImages = [...updated.matchAll(/!\[[^\]]*\]\((?!data:image\/)[^)]+\)/gi)].map((match) => match[0]);
  if (remainingImages.length > 0) {
    throw new Error(`WeMD handoff 中仍有未内联图片，请改成本地相对路径后重试：\n- ${remainingImages.join("\n- ")}`);
  }
  return updated;
}

function mimeTypeForImage(data, filePath) {
  if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return "image/jpeg";
  if (data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47) return "image/png";
  if (data[0] === 0x47 && data[1] === 0x49 && data[2] === 0x46) return "image/gif";
  if (data[0] === 0x52 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x46) return "image/webp";
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".gif") return "image/gif";
  if (ext === ".webp") return "image/webp";
  if (ext === ".svg") return "image/svg+xml";
  return "image/png";
}

function isInsideDirectory(filePath, directoryPath) {
  const relative = path.relative(directoryPath, filePath);
  return relative && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}
