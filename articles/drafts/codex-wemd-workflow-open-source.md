---
title: 用 Codex 写公众号，我把流程开源了
author:
digest: 一套从素材、初稿、WeMD审稿到公众号草稿箱的本地工作流，适合想把写稿流程固定下来的人。
date: 2026-06-01
---

[截图位：GitHub 仓库首页，展示 faliang-codex-ex 的 README 和目录结构]

我最近把自己写公众号时用的一套流程整理成了开源仓库：

`faliang-codex-ex`

它不是什么一键爆文工具。更准确地说，它是一条比较克制的流水线：先准备真实素材，再让 Codex 写初稿，人工核验后交给 WeMD 本地看版式，最后才把确认过的内容送到公众号草稿箱。

我做它的原因也很简单：公众号文章最麻烦的地方不是“生成一段文字”，而是每次都要重复处理素材、图片、标题、摘要、排版、HTML、封面和草稿箱。流程不固定，写一篇就乱一次。

## 这套工作流解决什么

它主要解决四件小事。

第一，写稿前先有素材。

素材可以是笔记、截图、网页链接、访谈记录、代码片段、表格或已经写好的草稿。Codex 只能基于这些东西写，不让它凭空编事实。

第二，文章先停在草稿区。

Codex 写出来的内容只进入 `articles/drafts/`。这一步可以反复改，哪怕写坏了也没关系，因为它还没有靠近公众号后台。

第三，用 WeMD 做本地审稿。

我保留 WeMD，是因为公众号排版不能只看 Markdown。标题、段落、图片、代码块，最后都要在接近公众号的视图里看一眼。

第四，只把确认稿推到草稿箱。

发布脚本只处理 `articles/approved/` 里的最终稿，并且命令里必须带 `--confirmed`。这不是形式主义，是为了防止草稿还没审完就被误推。

## 目录怎么放

[截图位：本地目录结构，展开 articles、assets、prompts、scripts、workflow]

仓库核心目录不多：

`articles/drafts/` 放 Codex 写作和修改的草稿。

`articles/wemd-inbox/` 放交给 WeMD 审稿的副本。handoff 脚本会把本地图片转成 data URI，减少图片丢失。

`articles/approved/` 放人工确认后的最终 Markdown。

`articles/approved-html/` 放带内联样式的公众号 HTML。

`assets/covers/` 放封面图。

`prompts/` 放写稿、审稿和发布阶段的提示词。

`scripts/` 放新建文章、交给 WeMD、渲染 HTML、预览检查和创建草稿箱的脚本。

`workflow/` 放固定流程和检查规则。

这个结构的好处是，每个阶段有自己的位置。你不用靠记忆判断“这版到底能不能发”，看目录就知道。

## 安装和配置

先克隆仓库：

```powershell
git clone https://github.com/<your-name>/faliang-codex-ex.git
cd faliang-codex-ex
npm install
```

然后复制配置文件：

```powershell
Copy-Item .env.example .env
```

`.env` 里填公众号接口配置：

```text
WECHAT_APPID=
WECHAT_SECRET=
PUBLIC_ACCOUNT_AUTHOR=
PUBLIC_ACCOUNT_SOURCE_URL=
```

这套流程只需要公众号的 AppID 和 AppSecret。能不能推草稿，还取决于公众号权限、IP 白名单和账号认证状态。

## 写一篇文章的完整步骤

第一步，准备素材。

一个选题一个素材目录。你可以把链接、截图、产品说明、访谈记录、原始笔记都放进去。

第二步，新建文章。

```powershell
npm.cmd run article:new -- --title "文章标题" --slug article-slug
```

它会生成：

```text
articles/drafts/article-slug.md
```

第三步，让 Codex 写初稿。

把素材给 Codex，让它按 `prompts/codex-writing.md` 和 `workflow/CONTENT_PIPELINE.md` 写。这里有个小原则：信息够就直接写完整稿，信息不够就标“待补充”，不要编。

[截图位：Codex 根据素材生成文章草稿的界面]

第四步，核验。

标题有没有夸大，摘要有没有乱写，截图说明是不是对得上图片，时间、数字、链接有没有来源。这一步要人工看。

第五步，交给 WeMD。

```powershell
npm.cmd run handoff:wemd -- articles/drafts/article-slug.md
```

然后打开：

```text
articles/wemd-inbox/article-slug.md
```

[截图位：WeMD 打开 wemd-inbox 稿件后的预览效果]

第六步，确认最终稿。

在 WeMD 里看完、改完，把最终 Markdown 放到：

```text
articles/approved/article-slug.md
```

第七步，生成公众号 HTML。

```powershell
npm.cmd run render:wechat-html -- --article articles/approved/article-slug.md
```

第八步，预览检查。

```powershell
npm.cmd run preview:wechat -- --article articles/approved/article-slug.md
```

第九步，创建公众号草稿箱草稿。

```powershell
npm.cmd run publish:draft -- --article articles/approved/article-slug.md --cover assets/covers/article-slug.jpg --confirmed
```

注意，这一步只进草稿箱，不直接群发。

## 我为什么不做成全自动发布

因为公众号文章有几个地方很难完全交给脚本。

封面要看第一眼效果。

文内图要看是否清楚。

标题和摘要要看是否像人写的。

底部设置也要进公众号后台检查，比如原创声明、赞赏、留言、合集、原文链接、创作来源、平台推荐和快捷转载。

[截图位：公众号后台草稿编辑页底部设置区域]

所以这套流程的设计不是“自动替你发”，而是“把重复动作固定住”。真正要不要发，还是人来决定。

## 适合怎么改

你可以改提示词，让它适合自己的账号语气。

你可以换 WeMD 主题，让排版更像自己的公众号。

你也可以把 `workflow/CONTENT_PIPELINE.md` 里的内容类型扩展成自己的栏目，比如教程、产品介绍、案例复盘、观点文章。

但我建议保留一个底线：素材先行，确认后再进草稿箱。

这个底线看起来慢，其实省时间。少返工，也少出事故。

## 开源地址

[截图位：GitHub Release 或仓库地址区域]

仓库名：

`faliang-codex-ex`

如果你也在用 Codex 写公众号，可以直接拿去改。它不是一个漂亮的大系统，只是一条能落地的生产线。
