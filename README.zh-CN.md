<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/hero.zh-CN.svg">
  <img src="docs/assets/hero.zh-CN-light.svg" alt="公众号写作工作流">
</picture>

**从素材到公众号草稿，把写作流程接起来。**

[HRouter](https://hrouter.net/home) · [WeMD](https://github.com/tenngoxars/WeMD) · [GitHub](https://github.com/honestTai/faliang-codex-ex) · [All public projects](https://github.com/honestTai)

[English](README.md) · **简体中文**

</div>

## ❤️ 赞助商

| 赞助商 | 简介 |
| :--- | :--- |
| [![HRouter](docs/assets/hrouter-sponsor.svg)](https://hrouter.net/home) | **[HRouter](https://hrouter.net/home)**：面向 AI 编程与应用开发的模型接入、API Key 管理与用量统计，也由作者运营。 |

## 🚀 快速开始

需要：

- Node.js 20 或更高版本。
- Codex。
- WeMD 本地客户端。
- 一个可以使用公众号草稿接口的微信公众号。

```text
素材 -> Codex 初稿 -> 事实核验 -> 封面和配图 -> WeMD 审稿 -> HTML -> 公众号草稿箱
```

```powershell
npm install
Copy-Item .env.example .env
```

```text
WECHAT_APPID=
WECHAT_SECRET=
PUBLIC_ACCOUNT_AUTHOR=
PUBLIC_ACCOUNT_SOURCE_URL=
```

`.env` 不要提交。微信接口还可能要求公众号权限、IP 白名单和已认证账号状态。

```powershell
npm.cmd run article:new -- --title "文章标题" --slug article-slug
npm.cmd run handoff:wemd -- articles/drafts/article-slug.md
npm.cmd run render:wechat-html -- --article articles/approved/article-slug.md
npm.cmd run preview:wechat -- --article articles/approved/article-slug.md
npm.cmd run publish:draft -- --article articles/approved/article-slug.md --cover assets/covers/article-slug.jpg --confirmed
```

草稿会生成到 `articles/drafts/article-slug.md`。只有 `articles/approved/` 下的稿件才允许进入公众号草稿箱流程。默认只创建草稿箱草稿，不群发。

```powershell
npm.cmd run check
```

## ✨ 适合做什么

| 功能 | 说明 |
| :--- | :--- |
| 初稿 | 从真实素材整理公众号初稿。 |
| 排版 | 用 WeMD 本地检查排版效果。 |
| 图片 | 把图片内联到 WeMD 审稿稿，减少图片丢失。 |
| HTML | 生成带内联样式的公众号 HTML。 |
| 草稿箱 | 通过微信官方 API 创建草稿箱草稿。 |

这个仓库不提供选题素材，也不内置特定账号的内容模板。这个仓库只保留流程、脚本和提示词，不存放准备发布的文章稿件。

## 📚 文档

- [Codex 写稿提示词](prompts/codex-writing.md)
- [WeMD 审稿提示词](prompts/wemd-review.md)
- [Codex + WeMD HTML + 微信官方接口发布提示词](prompts/wechat-publish.md)
- [内容分流流水线](workflow/CONTENT_PIPELINE.md)
- [完整工作流](workflow/WORKFLOW.md)
- [公众号草稿底部设置](workflow/WECHAT_DRAFT_SETTINGS.md)
- [Codex 版公众号主流程](workflow/CODEX_BLOGGER_WORKFLOW.md)
- [上游元数据记录](workflow/SOURCES.md)

[WeMD](https://github.com/tenngoxars/WeMD) 提供审稿编辑器。本仓库只保留 WeMD 的最小元数据和许可证，完整源码请从上游获取。

## 📄 许可证

[MIT](LICENSE)。Copyright (c) 2026 faliang。

## 📈 Star 历史

<a href="https://www.star-history.com/#honestTai/faliang-codex-ex&Date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=honestTai/faliang-codex-ex&type=Date&theme=dark">
    <img src="https://api.star-history.com/svg?repos=honestTai/faliang-codex-ex&type=Date" alt="faliang-codex-ex 的 Star 历史">
  </picture>
</a>

---

<div align="center">

Made by **[honestTai](https://github.com/honestTai)** · [HRouter](https://hrouter.net/home) · [更多项目](https://github.com/honestTai)

**觉得有用，欢迎 Star；有想法，欢迎到 Issues 交流。**

</div>
