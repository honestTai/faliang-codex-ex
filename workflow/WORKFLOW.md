# 完整工作流

本仓库只实现一条公众号生产流水线：Codex 写稿和核验，WeMD 本地审稿，微信官方接口创建草稿箱草稿。

本仓库不存放准备发布的文章稿件。发布用的草稿、WeMD 审稿稿和最终稿放在实际写作仓库里，例如 `codex-wemd-md2wechat-workflow`。

## 主流程

1. 获取素材：笔记、截图、网页链接、访谈、代码、数据或已有草稿。
2. 创建草稿：`articles/drafts/<slug>.md`。
3. Codex 写初稿：按内容类型写完整文章。
4. 事实核验：核对标题、摘要、数据、截图和结论。
5. 准备封面：`assets/covers/<slug>.jpg`。
6. 准备文内图：使用真实截图、图表或确认可用的图片。
7. WeMD 审稿：`articles/wemd-inbox/<slug>.md`。
8. 人工确认：最终稿进入 `articles/approved/<slug>.md`。
9. 生成 HTML：`articles/approved-html/<slug>.html`。
10. 预览检查。
11. 创建公众号草稿箱草稿。
12. 进入公众号后台检查底部设置。

## 角色分工

Codex 负责：

- 整理素材
- 写初稿和改稿
- 核验事实
- 优化标题、摘要、结构和段落
- 按 `humanizer-zh` 删除空词、模板化转折、机械总结和无证据判断
- 生成 WeMD 审稿副本
- 在人工确认后调用脚本创建公众号草稿

WeMD 负责：

- 打开 Markdown
- 本地预览公众号排版
- 微调主题、图片和段落效果
- 作为人工审稿环节

脚本负责：

- 新建文章
- 内联本地图片
- 生成带样式 HTML
- 预览检查
- 上传封面和正文图片
- 调用微信官方接口创建草稿箱草稿

## 文件流转

```text
articles/drafts/        # Codex 写稿和改稿
articles/wemd-inbox/    # 给 WeMD 打开的审稿副本
articles/approved/      # 人工确认后的最终稿
assets/covers/          # 公众号封面图
articles/approved-html/ # 带内联样式的公众号 HTML
```

## 标准命令

```powershell
npm.cmd run article:new -- --title "标题" --slug slug
npm.cmd run handoff:wemd -- articles/drafts/slug.md
npm.cmd run render:wechat-html -- --article articles/approved/slug.md
npm.cmd run preview:wechat -- --article articles/approved/slug.md
npm.cmd run publish:draft -- --article articles/approved/slug.md --cover assets/covers/slug.jpg --confirmed
```

## 确认语

只有明确出现下面这类确认，才允许创建公众号草稿：

- OK，可以发草稿箱
- 确认，推公众号草稿
- 这版可以，发布到草稿箱

“看看效果”“继续改”“先预览”都不能触发发布。
