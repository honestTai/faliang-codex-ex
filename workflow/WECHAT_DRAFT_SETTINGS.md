# 公众号草稿底部设置

公众号草稿创建分两层：

- 官方接口能写入的字段：脚本自动带上。
- 后台编辑器才有的字段：草稿创建后手动检查，或按需用浏览器自动化补上。

## 脚本自动写入

`npm.cmd run publish:draft` 默认写入：

- `article_type: news`
- `need_open_comment: 1`
- `only_fans_can_comment: 0`
- `show_cover_pic: 0`
- `content_source_url`: 从 frontmatter 或环境变量读取

可通过 frontmatter 或命令参数覆盖：

```yaml
---
article_type: news
show_cover_pic: 0
need_open_comment: 1
only_fans_can_comment: 0
content_source_url: ""
---
```

命令参数：

```powershell
npm.cmd run publish:draft -- --article articles/approved/slug.md --cover assets/covers/slug.jpg --confirmed --openComment 1 --fansComment 0 --showCoverPic 0 --articleType news
```

## 后台必须检查

这些字段在公众号后台编辑器里显示，但当前草稿接口不能稳定覆盖：

- 原创声明
- 赞赏
- 留言
- 合集
- 原文链接
- 创作来源
- 平台推荐
- 快捷转载

草稿创建后进入公众号后台，打开刚创建的草稿，检查底部设置并保存。

## 建议做法

- 作者、合集、留言策略和原创策略放在你的账号 SOP 里，不写死在仓库。
- 需要 `content_source_url` 时，优先写在文章 frontmatter。
- 不确定账号权限时，先跑 `preview:wechat`，再人工确认是否调用发布脚本。
