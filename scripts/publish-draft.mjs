#!/usr/bin/env node
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import {
  addDraft,
  getAccessToken,
  isInsideDirectory,
  loadWechatConfig,
  parseArgs,
  prepareHtmlImages,
  readArticle,
  requireWechatConfig,
  uploadPermanentImage,
  uploadPermanentVideo,
  validateArticleMetadata
} from "./wechat-official-lib.mjs";

const args = parseArgs(process.argv.slice(2));
const article = args.article || args._[0];
const cover = args.cover;
const htmlInput = args.html;
const video = args.video;

if (!article || !cover) {
  console.error("用法：npm.cmd run publish:draft -- --article articles/approved/article.md --cover assets/covers/article.jpg --confirmed");
  process.exit(1);
}

if (args.confirmed !== true) {
  console.error("创建公众号草稿箱前需要显式确认：请在用户确认 OK 后追加 --confirmed。");
  process.exit(1);
}

const approvedRoot = path.resolve("articles", "approved");
const articlePath = path.resolve(article);
if (!isInsideDirectory(articlePath, approvedRoot)) {
  console.error(`发布脚本只允许处理 articles/approved/ 下的最终稿：${article}`);
  process.exit(1);
}
if (!fsSync.existsSync(articlePath)) {
  console.error(`文章不存在：${article}`);
  process.exit(1);
}

const coverRoot = path.resolve("assets", "covers");
const coverPath = path.resolve(cover);
if (!isInsideDirectory(coverPath, coverRoot)) {
  console.error(`封面只允许使用 assets/covers/ 下的图片：${cover}`);
  process.exit(1);
}
if (!fsSync.existsSync(coverPath)) {
  console.error(`封面不存在：${cover}`);
  process.exit(1);
}

let videoPath = "";
if (video) {
  const videoRoot = path.resolve("videos");
  videoPath = path.resolve(video);
  if (!isInsideDirectory(videoPath, videoRoot)) {
    console.error(`视频只允许使用 videos/ 下的文件：${video}`);
    process.exit(1);
  }
  if (!fsSync.existsSync(videoPath)) {
    console.error(`视频不存在：${video}`);
    process.exit(1);
  }
}

const slug = path.basename(articlePath, ".md");
const htmlPath = path.resolve(htmlInput || path.join("articles", "approved-html", `${slug}.html`));
const htmlRoot = path.resolve("articles", "approved-html");
if (!isInsideDirectory(htmlPath, htmlRoot)) {
  console.error(`WeMD HTML 只允许放在 articles/approved-html/ 下：${htmlPath}`);
  process.exit(1);
}
if (!fsSync.existsSync(htmlPath)) {
  console.error(`缺少 WeMD 导出的 HTML：${path.relative(process.cwd(), htmlPath)}
请在 WeMD 打开最终稿，点击“复制 HTML”，再保存为 articles/approved-html/${slug}.html。`);
  process.exit(1);
}

try {
  const config = await loadWechatConfig();
  requireWechatConfig(config);

  const { metadata } = await readArticle(articlePath);
  validateArticleMetadata(metadata, articlePath);

  console.log("1/5 获取微信 access_token");
  const accessToken = await getAccessToken(config);

  console.log("2/5 上传封面图");
  const coverResult = await uploadPermanentImage(accessToken, coverPath);

  console.log("3/5 处理 WeMD HTML 正文图片");
  const rawHtml = await fs.readFile(htmlPath, "utf8");
  const frontmatterLeak = rawHtml.match(/(?:^|<[^>]+>)\s*(title|author|digest|date):/i);
  if (frontmatterLeak) {
    throw new Error(`WeMD HTML 疑似包含 frontmatter 残留：${path.relative(process.cwd(), htmlPath)}
请重新生成 HTML，确保正文不包含 title:/author:/digest:/date:。`);
  }
  const prepared = await prepareHtmlImages(rawHtml, path.dirname(htmlPath), accessToken);
  const openComment = Number(args.openComment ?? metadata.need_open_comment ?? metadata.open_comment ?? config.openComment ?? 1);
  const fansComment = Number(args.fansComment ?? metadata.only_fans_can_comment ?? metadata.fans_comment ?? config.fansComment ?? 0);
  const showCoverPic = Number(args.showCoverPic ?? metadata.show_cover_pic ?? config.showCoverPic ?? 0);
  const articleType = String(args.articleType || metadata.article_type || metadata.articleType || config.articleType || "news").trim();
  const contentSourceUrl = metadata.content_source_url || metadata.contentSourceUrl || config.sourceUrl || "";

  let videoResult = null;
  if (videoPath) {
    console.log("4/6 上传真实视频素材");
    videoResult = await uploadPermanentVideo(
      accessToken,
      videoPath,
      args.videoTitle || metadata.video_title || metadata.title,
      args.videoIntro || metadata.video_intro || metadata.digest || ""
    );
  }

  console.log(videoPath ? "5/6 创建公众号草稿箱草稿" : "4/5 创建公众号草稿箱草稿");
  const draft = await addDraft(accessToken, {
    article_type: articleType,
    title: metadata.title,
    author: metadata.author || config.author || "",
    digest: metadata.digest || "",
    content: prepared.html,
    content_source_url: contentSourceUrl,
    thumb_media_id: coverResult.media_id,
    show_cover_pic: showCoverPic,
    need_open_comment: openComment,
    only_fans_can_comment: fansComment
  });

  console.log(videoPath ? "6/6 完成" : "5/5 完成");
  console.log(JSON.stringify({
    success: true,
    article: path.relative(process.cwd(), articlePath),
    html: path.relative(process.cwd(), htmlPath),
    cover: path.relative(process.cwd(), coverPath),
    uploaded_body_images: prepared.uploadedImages,
    uploaded_video: videoResult ? {
      file: path.relative(process.cwd(), videoPath),
      media_id: videoResult.media_id,
      url: videoResult.url || videoResult.down_url || ""
    } : null,
    api_settings: {
      article_type: articleType,
      show_cover_pic: showCoverPic,
      need_open_comment: openComment,
      only_fans_can_comment: fansComment,
      content_source_url: contentSourceUrl ? "set" : "empty"
    },
    editor_settings_to_check: [
      "原创声明",
      "赞赏",
      "合集",
      "创作来源",
      "平台推荐",
      "快捷转载"
    ],
    cover_media_id: coverResult.media_id,
    draft_media_id: draft.media_id
  }, null, 2));
} catch (error) {
  console.error(error.message || error);
  process.exit(1);
}
