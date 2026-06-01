import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath as nodeFileURLToPath } from "node:url";

const WECHAT_API = "https://api.weixin.qq.com";

export function parseArgs(argv) {
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

export function isInsideDirectory(filePath, directoryPath) {
  const relative = path.relative(directoryPath, filePath);
  return relative && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

export async function loadLocalEnv() {
  for (const envFile of [".env", ".env.local"]) {
    if (!fsSync.existsSync(envFile)) continue;
    const content = await fs.readFile(envFile, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const [rawKey, ...rest] = trimmed.split("=");
      const key = rawKey.trim();
      const value = rest.join("=").trim().replace(/^['"]|['"]$/g, "");
      if (key && process.env[key] === undefined) process.env[key] = value;
    }
  }
}

export async function loadWechatConfig() {
  await loadLocalEnv();
  const fallback = await readGlobalWechatConfig();
  const appid = firstRealValue(process.env.WECHAT_APPID, fallback.appid);
  const secret = firstRealValue(process.env.WECHAT_SECRET, fallback.secret);
  const author = firstRealValue(process.env.PUBLIC_ACCOUNT_AUTHOR, "");
  const sourceUrl = firstRealValue(process.env.PUBLIC_ACCOUNT_SOURCE_URL, "");
  const openComment = firstRealValue(process.env.WECHAT_OPEN_COMMENT, "1");
  const fansComment = firstRealValue(process.env.WECHAT_FANS_COMMENT, "0");
  const showCoverPic = firstRealValue(process.env.WECHAT_SHOW_COVER_PIC, "0");
  const articleType = firstRealValue(process.env.WECHAT_ARTICLE_TYPE, "news");
  return { appid, secret, author, sourceUrl, openComment, fansComment, showCoverPic, articleType };
}

export async function readArticle(articlePath) {
  const raw = await fs.readFile(articlePath, "utf8");
  const { data, body } = parseFrontmatter(raw);
  return { metadata: data, body };
}

export function validateArticleMetadata(metadata, articlePath) {
  const title = String(metadata.title || "").trim();
  const digest = String(metadata.digest || "").trim();
  const articleType = firstRealValue(metadata.article_type, metadata.articleType, "");
  const errors = [];
  if (!title) errors.push("frontmatter 缺少 title");
  if (title.length > 64) errors.push(`title 超过 64 个字符：${title.length}`);
  if (digest.length > 120) errors.push(`digest 超过 120 个字符：${digest.length}`);
  if (articleType && !["news", "newspic"].includes(articleType)) errors.push(`article_type 只能是 news 或 newspic：${articleType}`);
  if (errors.length > 0) {
    throw new Error(`${articlePath} 元数据不符合公众号草稿要求：\n- ${errors.join("\n- ")}`);
  }
}

export async function getAccessToken(config) {
  const cached = await readTokenCache(config.appid);
  if (cached) return cached;
  const url = `${WECHAT_API}/cgi-bin/token?grant_type=client_credential&appid=${encodeURIComponent(config.appid)}&secret=${encodeURIComponent(config.secret)}`;
  const data = await fetchJson(url);
  if (!data.access_token) {
    throw new Error(`微信 access_token 获取失败：${JSON.stringify(data)}`);
  }
  await writeTokenCache(config.appid, data.access_token, Number(data.expires_in || 7200));
  return data.access_token;
}

export async function uploadPermanentImage(accessToken, imagePath) {
  const data = await uploadFile(`${WECHAT_API}/cgi-bin/material/add_material?access_token=${encodeURIComponent(accessToken)}&type=image`, imagePath);
  if (!data.media_id) throw new Error(`封面上传失败：${JSON.stringify(data)}`);
  return data;
}

export async function uploadPermanentVideo(accessToken, videoPath, title, introduction = "") {
  await assertLocalFile(videoPath);
  const buffer = await fs.readFile(videoPath);
  const form = new FormData();
  form.append("media", new Blob([buffer], { type: mimeTypeForFile(videoPath) }), path.basename(videoPath));
  form.append("description", JSON.stringify({
    title: String(title || path.basename(videoPath, path.extname(videoPath))).slice(0, 64),
    introduction: String(introduction || "").slice(0, 120)
  }));
  const data = await fetchJson(`${WECHAT_API}/cgi-bin/material/add_material?access_token=${encodeURIComponent(accessToken)}&type=video`, {
    method: "POST",
    body: form
  });
  if (!data.media_id) throw new Error(`视频素材上传失败：${JSON.stringify(data)}`);
  return data;
}

export async function uploadArticleImage(accessToken, imagePath) {
  const data = await uploadFile(`${WECHAT_API}/cgi-bin/media/uploadimg?access_token=${encodeURIComponent(accessToken)}`, imagePath);
  if (!data.url) throw new Error(`正文图片上传失败：${imagePath}\n${JSON.stringify(data)}`);
  return data.url;
}

export async function addDraft(accessToken, article) {
  return fetchJson(`${WECHAT_API}/cgi-bin/draft/add?access_token=${encodeURIComponent(accessToken)}`, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ articles: [article] })
  });
}

export async function getDraft(accessToken, mediaId) {
  return fetchJson(`${WECHAT_API}/cgi-bin/draft/get?access_token=${encodeURIComponent(accessToken)}`, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ media_id: mediaId })
  });
}

export async function updateDraft(accessToken, mediaId, article, index = 0) {
  return fetchJson(`${WECHAT_API}/cgi-bin/draft/update?access_token=${encodeURIComponent(accessToken)}`, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      media_id: mediaId,
      index,
      articles: article
    })
  });
}

export async function prepareHtmlImages(html, htmlDir, accessToken) {
  const imagePattern = /<img\b[^>]*\bsrc=(["'])(.*?)\1[^>]*>/gi;
  const matches = [...html.matchAll(imagePattern)];
  let updated = html;
  const replacements = [];

  for (const match of matches) {
    const src = match[2];
    if (!src || /^https:\/\/mmbiz\.qpic\.cn\//i.test(src)) continue;
    let imagePath = "";
    if (/^data:image\//i.test(src)) {
      imagePath = await dataUriToTempImage(src);
    } else if (/^file:/i.test(src)) {
      imagePath = fileURLToPath(src);
    } else if (/^https?:/i.test(src)) {
      continue;
    } else {
      imagePath = path.resolve(htmlDir, src);
    }
    const url = await uploadArticleImage(accessToken, imagePath);
    replacements.push({ from: src, to: url });
  }

  for (const item of replacements) {
    updated = updated.split(item.from).join(item.to);
  }

  return { html: updated, uploadedImages: replacements.length };
}

export function requireWechatConfig(config) {
  const missing = [];
  if (!config.appid) missing.push("WECHAT_APPID");
  if (!config.secret) missing.push("WECHAT_SECRET");
  if (missing.length > 0) {
    throw new Error(`缺少公众号接口配置：${missing.join(", ")}\n请写入 .env、~/.config/wechat-official/config.yaml 或当前目录的 wechat-official.yaml。这个直连流程不需要第三方服务 key。`);
  }
}

export async function assertLocalImage(imagePath) {
  if (typeof imagePath !== "string") return;
  await assertLocalFile(imagePath, "图片");
}

export async function assertLocalFile(filePath, label = "文件") {
  if (typeof filePath !== "string") return;
  try {
    await fs.access(filePath);
  } catch {
    throw new Error(`${label}不存在：${filePath}`);
  }
}

export function mimeTypeForImage(filePath) {
  return mimeTypeForFile(filePath);
}

export function mimeTypeForFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".gif") return "image/gif";
  if (ext === ".webp") return "image/webp";
  if (ext === ".mp4") return "video/mp4";
  return "application/octet-stream";
}

function parseFrontmatter(raw) {
  const normalized = raw.replace(/^\uFEFF/, "");
  if (!normalized.startsWith("---\n") && !normalized.startsWith("---\r\n")) {
    return { data: {}, body: normalized.trim() };
  }
  const match = normalized.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { data: {}, body: normalized.trim() };
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim().replace(/^['"]|['"]$/g, "");
    data[key] = value;
  }
  return { data, body: normalized.slice(match[0].length).trim() };
}

async function readGlobalWechatConfig() {
  const home = process.env.USERPROFILE || process.env.HOME || "";
  const candidates = [
    path.join(home, ".config", "wechat-official", "config.yaml"),
    path.join(home, ".wechat-official.yaml"),
    path.resolve("wechat-official.yaml")
  ];
  for (const file of candidates) {
    if (!file || !fsSync.existsSync(file)) continue;
    const content = await fs.readFile(file, "utf8");
    const appid = matchYamlValue(content, "appid");
    const secret = matchYamlValue(content, "secret");
    return { appid, secret };
  }
  return {};
}

function matchYamlValue(content, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = content.match(new RegExp(`^\\s*${escaped}:\\s*(.+?)\\s*$`, "m"));
  if (!match) return "";
  return match[1].replace(/^['"]|['"]$/g, "").trim();
}

function firstRealValue(...values) {
  for (const value of values) {
    const text = String(value || "").trim();
    if (!text) continue;
    if (/^(your_|你的|wx1234567890abcdef|your_wechat_|your_app_secret)/i.test(text)) continue;
    return text;
  }
  return "";
}

async function uploadFile(url, filePath) {
  await assertLocalImage(filePath);
  const buffer = await fs.readFile(filePath);
  const form = new FormData();
  form.append("media", new Blob([buffer], { type: mimeTypeForImage(filePath) }), path.basename(filePath));
  return fetchJson(url, { method: "POST", body: form });
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`微信接口返回非 JSON：${response.status} ${text.slice(0, 300)}`);
  }
  if (!response.ok || (data.errcode && data.errcode !== 0)) {
    throw new Error(formatWechatError(data));
  }
  return data;
}

function formatWechatError(data) {
  const code = data.errcode ?? "UNKNOWN";
  const msg = data.errmsg || JSON.stringify(data);
  if (code === 40164) return `微信接口调用失败：${code} ${msg}\n通常是当前公网 IP 没加到公众号 IP 白名单。`;
  if (code === 40013 || code === 40125) return `微信接口调用失败：${code} ${msg}\n请检查 WECHAT_APPID / WECHAT_SECRET 是否对应同一个公众号。`;
  return `微信接口调用失败：${code} ${msg}`;
}

async function dataUriToTempImage(src) {
  const match = src.match(/^data:(image\/(?:png|jpeg|jpg|gif|webp));base64,([\s\S]+)$/i);
  if (!match) throw new Error("无法识别 HTML 中的 data URI 图片。");
  const mime = match[1].toLowerCase().replace("image/jpg", "image/jpeg");
  const ext = mime === "image/jpeg" ? ".jpg" : `.${mime.slice("image/".length)}`;
  const normalizedBase64 = match[2].replace(/\s+/g, "");
  const hash = crypto.createHash("sha1").update(normalizedBase64).digest("hex");
  const dir = path.resolve(".cache", "wechat-html-images");
  const filePath = path.join(dir, `${hash}${ext}`);
  if (!fsSync.existsSync(filePath)) {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, Buffer.from(normalizedBase64, "base64"));
  }
  return filePath;
}

function fileURLToPath(src) {
  return nodeFileURLToPath(src);
}

async function readTokenCache(appid) {
  const cachePath = tokenCachePath();
  if (!fsSync.existsSync(cachePath)) return "";
  try {
    const cache = JSON.parse(await fs.readFile(cachePath, "utf8"));
    if (cache.appid === appid && cache.access_token && Number(cache.expires_at) > Date.now() + 300000) {
      return cache.access_token;
    }
  } catch {
    return "";
  }
  return "";
}

async function writeTokenCache(appid, accessToken, expiresIn) {
  const cachePath = tokenCachePath();
  await fs.mkdir(path.dirname(cachePath), { recursive: true });
  await fs.writeFile(cachePath, JSON.stringify({
    appid,
    access_token: accessToken,
    expires_at: Date.now() + Math.max(60, expiresIn - 300) * 1000
  }, null, 2), "utf8");
}

function tokenCachePath() {
  return path.resolve(".cache", "wechat-access-token.json");
}
