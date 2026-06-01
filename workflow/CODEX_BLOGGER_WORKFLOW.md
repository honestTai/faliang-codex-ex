# Codex 版公众号主流程

目标是复刻这篇文章里的公众号写作流程：

<https://mp.weixin.qq.com/s/xsgPv6jRWwVn6Ea1TEC_4Q>

这里把 Claude Code 换成 Codex，并保留 WeMD 作为本地审稿和排版预览环节。

不要把这个仓库扩展成一堆互不相干的内容工厂。默认只走下面这条线：

```text
素材 -> Codex 初稿 -> 事实核验 -> 封面和配图 -> WeMD 审稿 -> HTML -> 公众号草稿箱
```

## 8 步主流程

### Step 1: 准备素材

先把真实素材放进当前选题的工作目录。素材可以是笔记、字幕、访谈、网页链接、截图、表格、代码片段、产品说明或你已经写好的草稿。

没有素材的内容不要写成事实。

### Step 2: 创建草稿

一个选题一个 slug，文章 Markdown 放在：

```text
articles/drafts/<slug>.md
```

配图、截图和临时材料可以放在同名素材目录里。

### Step 3: Codex 写初稿

Codex 根据素材和内容类型生成完整初稿。

初稿只写入 `articles/drafts/`，不能直接进入公众号草稿箱。

### Step 4: 事实核验

核对初稿和素材是否一致：

- 标题和摘要是否夸大
- 人名、时间、数据和链接是否准确
- 截图说明是否和图片内容对应
- 是否出现没有证据的结论

核验不过就回到 Step 3 修改。

### Step 5: 准备封面

封面图放到：

```text
assets/covers/<slug>.jpg
```

封面可以手动准备，也可以接入你自己的制图工具。默认不要因为缺封面就远程生图。

### Step 6: 准备文内图片

文内图片优先使用真实截图、图表、流程图或你确认可用的图片。

草稿阶段可以使用相对路径；交给 WeMD 前必须运行 handoff 脚本，把本地图片转成 Markdown data URI。

### Step 7: WeMD 审稿

Codex 先完成三件事：

- 整理 Markdown 结构、标题、摘要和分段。
- 删除空泛赞美、模板化转折和明显 AI 腔。
- 确认图片路径可以被 handoff 脚本内联。

然后运行：

```powershell
npm.cmd run handoff:wemd -- articles/drafts/<slug>.md
```

用 WeMD 打开：

```text
articles/wemd-inbox/<slug>.md
```

你在 WeMD 里看稿、改段落和检查排版。

### Step 8: 草稿箱

只有人工明确确认后，才从 `articles/approved/` 进入公众号草稿箱。

先生成带内联样式的 HTML：

```powershell
npm.cmd run render:wechat-html -- --article articles/approved/<slug>.md
```

再预检查：

```powershell
npm.cmd run preview:wechat -- --article articles/approved/<slug>.md
```

最后创建草稿箱草稿：

```powershell
npm.cmd run publish:draft -- --article articles/approved/<slug>.md --cover assets/covers/<slug>.jpg --confirmed
```

默认只创建草稿箱草稿，不群发。

草稿创建后，按 `workflow/WECHAT_DRAFT_SETTINGS.md` 检查底部设置。

## 边界

- 不从 `articles/drafts/` 或 `articles/wemd-inbox/` 创建公众号草稿。
- 不跳过 WeMD 审稿确认。
- 不把裸 HTML 推到公众号。
- 不提交 `.env`、token、缓存、日志或本地工具目录。
- 不依赖第三方 Markdown 转公众号服务；发布链路使用 WeMD/本地 HTML 加微信官方接口。
