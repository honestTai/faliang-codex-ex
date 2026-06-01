# faliang-codex-ex

一个用 Codex 写公众号文章、用 WeMD 本地审稿排版、再通过微信官方接口创建草稿箱草稿的轻量工作流。

它的目标很克制：把日常公众号写作固定成一条可检查、可预览、可确认的本地流程。Codex 负责写稿和核验，WeMD 保留为本地审稿和排版预览环节。

保留 WeMD 的原因很简单：公众号文章最后还是要看版式、看图片、看手机阅读节奏。Codex 负责写稿和检查，WeMD 负责本地预览和微调，脚本只在你确认后把最终稿送进公众号草稿箱。

```text
素材 -> Codex 初稿 -> 事实核验 -> 封面和配图 -> WeMD 审稿 -> HTML -> 公众号草稿箱
```

## 适合做什么

- 从真实素材整理公众号初稿。
- 用 WeMD 本地检查排版效果。
- 把图片内联到 WeMD 审稿稿，减少图片丢失。
- 生成带内联样式的公众号 HTML。
- 通过微信官方 API 创建草稿箱草稿。

这个仓库不提供选题素材，也不内置特定账号的内容模板。文章结构需要按内容类型选择：教程、工具介绍、案例复盘、观点文、活动说明、产品介绍都可以走同一条发布流水线，但不能套同一种写法。

这个仓库只保留流程、脚本和提示词，不存放准备发布的文章稿件。要发布的草稿、WeMD 审稿稿和最终稿，放到 `codex-wemd-md2wechat-workflow` 这类实际写作仓库里。

## 环境准备

需要：

- Node.js 20 或更高版本。
- Codex。
- WeMD 本地客户端。
- 一个可以使用公众号草稿接口的微信公众号。

克隆后安装依赖：

```powershell
npm install
```

复制配置文件：

```powershell
Copy-Item .env.example .env
```

填写：

```text
WECHAT_APPID=
WECHAT_SECRET=
PUBLIC_ACCOUNT_AUTHOR=
PUBLIC_ACCOUNT_SOURCE_URL=
```

`.env` 不要提交。微信接口还可能要求公众号权限、IP 白名单和已认证账号状态。

## 目录结构

```text
articles/
  drafts/          # Codex 写作和修改的草稿
  wemd-inbox/      # 交给 WeMD 审稿的副本，图片会转成 data URI
  approved/        # 人工确认后的最终 Markdown
  approved-html/   # 生成或保存的公众号 HTML
assets/
  covers/          # 公众号封面图
prompts/           # Codex、WeMD、发布阶段提示词
scripts/           # 新建文章、交接 WeMD、渲染 HTML、预览、创建草稿
workflow/          # 固定发布流水线和检查规则
sources/WeMD/      # WeMD 上游元数据和许可证
```

## 使用步骤

### 1. 准备素材

一个选题一个目录。素材可以是笔记、采访记录、网页链接、产品说明、截图、数据表或你自己写的原始内容。

不要让 Codex 凭空写事实。没有素材的地方，宁愿保留待补充。

### 2. 创建草稿

```powershell
npm.cmd run article:new -- --title "文章标题" --slug article-slug
```

草稿会生成到：

```text
articles/drafts/article-slug.md
```

### 3. 让 Codex 写初稿

把素材交给 Codex，让它按 `prompts/codex-writing.md` 和 `workflow/CONTENT_PIPELINE.md` 写稿。

建议每次都明确三件事：

- 这篇文章是什么类型。
- 素材来自哪里。
- 哪些内容必须核验，哪些内容不能编。

### 4. 核验和补图

检查标题、摘要、人物、时间、数据、产品能力、外部链接和截图含义。

成稿前按 `humanizer-zh` 过一遍：删掉空词、模板化转折、机械总结和没有证据的判断。没有素材支撑的地方，不写成确定事实。

封面放到：

```text
assets/covers/article-slug.jpg
```

正文图片可以先用相对路径引用。交给 WeMD 前，脚本会把本地图片转成 Markdown data URI。

### 5. 交给 WeMD 审稿

```powershell
npm.cmd run handoff:wemd -- articles/drafts/article-slug.md
```

然后用 WeMD 打开：

```text
articles/wemd-inbox/article-slug.md
```

你在 WeMD 里检查排版、图片、段落和移动端阅读效果。

### 6. 人工确认最终稿

确认后，把最终 Markdown 放到：

```text
articles/approved/article-slug.md
```

只有 `articles/approved/` 下的稿件才允许进入公众号草稿箱流程。

### 7. 生成公众号 HTML

```powershell
npm.cmd run render:wechat-html -- --article articles/approved/article-slug.md
```

输出：

```text
articles/approved-html/article-slug.html
```

脚本会生成带内联样式的 HTML，避免把裸 `<p>`、`<h2>`、`figure` 直接推到公众号。

### 8. 预览检查

```powershell
npm.cmd run preview:wechat -- --article articles/approved/article-slug.md
```

这一步检查元数据、HTML 路径、摘要长度和图片数量。

### 9. 创建公众号草稿箱草稿

确认无误后再运行：

```powershell
npm.cmd run publish:draft -- --article articles/approved/article-slug.md --cover assets/covers/article-slug.jpg --confirmed
```

默认只创建草稿箱草稿，不群发。

草稿创建后，还要进入公众号后台检查底部设置：原创声明、赞赏、留言、合集、原文链接、创作来源、平台推荐和快捷转载。

## 常用命令

```powershell
npm.cmd run check
npm.cmd run article:new -- --title "文章标题" --slug article-slug
npm.cmd run handoff:wemd -- articles/drafts/article-slug.md
npm.cmd run render:wechat-html -- --article articles/approved/article-slug.md
npm.cmd run preview:wechat -- --article articles/approved/article-slug.md
npm.cmd run publish:draft -- --article articles/approved/article-slug.md --cover assets/covers/article-slug.jpg --confirmed
```

## 安全边界

- 未经人工确认，不从草稿目录创建公众号草稿。
- `publish:draft` 只允许处理 `articles/approved/`。
- 封面只允许来自 `assets/covers/`。
- `.env`、token、接口响应日志、缓存和本地工具目录不提交。
- 不接入第三方 Markdown 转公众号服务；正文 HTML 由本地脚本或 WeMD 产物进入官方接口。

## 上游项目

- WeMD: <https://github.com/tenngoxars/WeMD>

本仓库只保留 WeMD 的最小元数据和许可证，完整源码请从上游获取。
