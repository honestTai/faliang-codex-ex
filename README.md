<div align="center">

**English** · [简体中文](README.zh-CN.md)

[HRouter](https://hrouter.net/home) · [All public projects](https://github.com/honestTai) · [Star & Fork trends](#project-activity)

</div>

[![Repository summary](https://raw.githubusercontent.com/honestTai/honestTai/main/assets/badges/faliang-codex-ex.svg)](#project-activity)

# WeChat Writing Workflow

**Connect the steps from source material to a reviewed WeChat draft.**

Draft with Codex, fact-check the content, review and format in WeMD, then create a draft through the official WeChat API **after human confirmation**. For WeChat Official Account authors who want to keep editorial and layout review in the workflow.

```text
Sources → Codex draft → Fact-check → Cover and images → WeMD review → HTML → WeChat draft box
```

## What this repository contains

- Reusable workflows, scripts, and prompts for writing and review.
- Local WeMD handoff with embedded images to reduce missing-image problems.
- WeChat-ready HTML with inline styles.
- Draft-box creation through the official WeChat API; **not a mass-publishing workflow**.

This repository does not supply article topics, account-specific content templates, or articles waiting to be published. Keep real drafts and final articles in your own writing repository. Tutorials, tool introductions, retrospectives, opinion pieces, announcements, and product articles can share a pipeline, but should not share one rigid writing template.

## Setup

You need Node.js 20+, Codex, the local WeMD client, and a WeChat Official Account with access to the draft API.

```powershell
npm install
Copy-Item .env.example .env
```

Configure locally:

```text
WECHAT_APPID=
WECHAT_SECRET=
PUBLIC_ACCOUNT_AUTHOR=
PUBLIC_ACCOUNT_SOURCE_URL=
```

Never commit `.env`. API access can also depend on account permissions, verification status, and an IP allowlist.

## Workspace structure

```text
articles/
  drafts/          # Drafts written and revised with Codex
  wemd-inbox/      # Review copies with local images converted to data URIs
  approved/        # Human-approved final Markdown
  approved-html/   # Generated or saved WeChat HTML
assets/
  covers/          # Cover images
prompts/           # Writing, review, and draft-publication prompts
scripts/           # Article creation, handoff, rendering, preview, draft creation
workflow/          # Pipeline and validation rules
sources/WeMD/      # Upstream metadata and license
```

## From sources to draft box

### 1. Gather real sources

Use one source directory per topic: notes, interviews, links, screenshots, product information, or data. Mark gaps instead of inventing facts.

### 2. Create and write a draft

```powershell
npm.cmd run article:new -- --title "Article title" --slug article-slug
```

The file is created at `articles/drafts/article-slug.md`. Give Codex the sources and follow `prompts/codex-writing.md` and `workflow/CONTENT_PIPELINE.md`. State the article type, source provenance, and facts that must be checked.

### 3. Fact-check and add images

Verify the title, summary, names, dates, data, capability claims, links, and screenshot meaning. The workflow recommends a `humanizer-zh` pass for Chinese prose: remove filler and unsupported conclusions, without weakening factual accuracy.

Place the cover at `assets/covers/article-slug.jpg`. Body images may use relative paths; handoff converts local images to data URIs.

### 4. Review in WeMD

```powershell
npm.cmd run handoff:wemd -- articles/drafts/article-slug.md
```

Open `articles/wemd-inbox/article-slug.md` in WeMD. Check layout, images, paragraphs, and mobile readability.

### 5. Approve, render, and preview

After human approval, put the final Markdown in `articles/approved/article-slug.md`.

```powershell
npm.cmd run render:wechat-html -- --article articles/approved/article-slug.md
npm.cmd run preview:wechat -- --article articles/approved/article-slug.md
```

HTML is written to `articles/approved-html/article-slug.html` with inline styles. Preview checks metadata, HTML paths, summary length, and image counts.

### 6. Create the draft after confirmation

```powershell
npm.cmd run publish:draft -- --article articles/approved/article-slug.md --cover assets/covers/article-slug.jpg --confirmed
```

This creates a draft, not a broadcast. Review the resulting draft in the Official Account backend, including originality, tips, comments, collections, source links, content provenance, recommendations, and reposting settings.

## Checks and safety

```powershell
npm.cmd run check
```

- Draft creation is restricted to `articles/approved/` and requires human confirmation.
- Covers must come from `assets/covers/`.
- Do not commit secrets, tokens, API response logs, caches, or local tool directories.
- No third-party Markdown-to-WeChat service is used; locally rendered or WeMD-produced HTML goes to the official API.

## Upstream and author

[WeMD](https://github.com/tenngoxars/WeMD) provides the review editor. This repository retains minimal upstream metadata and license information; obtain the complete source upstream.

Maintained by [honestTai](https://github.com/honestTai). The workflow uses the model in your Codex environment. [HRouter](https://hrouter.net/home) is a separate model-routing service operated by the same author.

---

<a id="project-activity"></a>

## Project activity

Star / Fork totals and retained-event history, scheduled to refresh daily.

[![Star and Fork history for faliang-codex-ex](https://raw.githubusercontent.com/honestTai/honestTai/main/assets/metrics/faliang-codex-ex.svg)](https://github.com/honestTai/honestTai/blob/main/data/README.md)

[Observed daily totals](https://raw.githubusercontent.com/honestTai/honestTai/main/assets/metrics/faliang-codex-ex-daily.svg) · [Methodology](https://github.com/honestTai/honestTai/blob/main/data/METHODOLOGY.md) · [All public projects](https://github.com/honestTai)

<sub>Historical curves reconstruct currently retained stars and visible forks, not historical net totals. Separate daily observations start on 2026-10-06; no fabricated backfill.</sub>
