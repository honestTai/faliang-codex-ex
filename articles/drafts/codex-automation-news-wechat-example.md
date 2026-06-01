---
title: 用 Codex 自动化整理新闻，再生成公众号草稿
author:
digest: 一个可复用的例子：定时收集新闻素材，核验来源，再让 Codex 写成可交给 WeMD 审稿的公众号文章。
date: 2026-06-01
---

[截图位：Codex 自动化配置页，展示定时任务名称、执行时间和目标仓库]

我想用一个例子说明 `faliang-codex-ex` 怎么和 Codex 自动化配合。

场景很普通：每天固定时间收集一批新闻素材，筛掉不可靠来源，整理成一篇公众号初稿。稿子不自动发布，只进入 WeMD 审稿。

这件事适合自动化，但不适合全自动发出去。

新闻会过期，标题容易夸大，来源也需要核验。让 Codex 做脏活可以，人要保留最后一关。

## 自动化做哪一段

OpenAI 在 Codex app 里提供了 Automations，可以让 Codex 按计划在后台工作。OpenAI 的介绍里提到，Automations 会把指令、可选 skills 和计划时间组合起来，执行结果进入 review queue，方便人继续检查。

这刚好适合公众号工作流。

我不会让自动化直接推送公众号草稿。它只做三件事：

1. 收集指定主题的新闻线索。
2. 生成带来源链接的素材摘要。
3. 写入 `articles/drafts/`，再生成 WeMD 审稿稿。

后面的确认、配图、封面和草稿箱，仍然人工处理。

## 仓库先准备好

先把工作流仓库放在本地：

```powershell
git clone https://github.com/<your-name>/faliang-codex-ex.git
cd faliang-codex-ex
npm install
```

配置公众号接口：

```powershell
Copy-Item .env.example .env
```

如果只是生成 WeMD 审稿稿，暂时不填 `WECHAT_APPID` 和 `WECHAT_SECRET` 也可以。只有创建公众号草稿箱时才需要。

## 给自动化一条清楚的指令

[截图位：自动化 prompt 编辑区域]

自动化的指令不要写成“帮我每天写一篇爆款”。这种话太虚，结果也难控。

可以写得具体一点：

```text
每天上午 9 点，围绕“AI 工具和开发者效率”收集 5 条新闻线索。

要求：
1. 只使用可打开的来源链接。
2. 每条新闻记录标题、来源、发布时间、链接和一句话摘要。
3. 不写无法确认的数据和结论。
4. 生成 articles/drafts/daily-ai-news-YYYY-MM-DD.md。
5. 文章结构按 workflow/CONTENT_PIPELINE.md 的“资料整理/案例复盘”处理。
6. 文中给出截图位，不自动下载远程图片。
7. 完成后运行 npm.cmd run handoff:wemd -- articles/drafts/daily-ai-news-YYYY-MM-DD.md。
8. 不运行 publish:draft。
```

重点是最后一句：不运行 `publish:draft`。

自动化只负责把素材和初稿准备好，不碰公众号草稿箱。

## 新闻素材怎么落地

建议让 Codex 在草稿里保留一个“素材核验”段落，方便第二天人工检查。

格式可以像这样：

```markdown
## 素材核验

- 新闻标题：
- 来源：
- 发布时间：
- 原文链接：
- 可确认信息：
- 需要人工复核：
```

[截图位：Codex 生成的新闻素材摘要，包含来源链接和待复核点]

这一步看起来啰嗦，但很有用。你不用在一堆聊天记录里找来源，打开 Markdown 就能看到。

## 初稿怎么写

自动化生成的初稿不追求花哨。

我更希望它像一份可编辑的早报：

开头用两三句话说明今天的主线。

正文分成几个小节，每条新闻都带来源和保守判断。

结尾不喊口号，只写“今天值得继续看的点”。

比如：

```markdown
---
title: 今日 AI 工具动态：三个值得看的变化
author:
digest: 整理今日 AI 工具和开发者效率相关动态，保留来源链接和待复核点，方便后续改稿。
date: 2026-06-01
---

[截图位：今日新闻来源列表]

今天的几条动态都和开发者工作流有关。

## 第一条动态

这里写已核验的信息，不写猜测。

## 值得继续看的点

这里写可以后续跟进的方向。
```

这样写不抢人类编辑的位置。它先把桌面收拾干净。

## 交给 WeMD 看稿

自动化最后运行：

```powershell
npm.cmd run handoff:wemd -- articles/drafts/daily-ai-news-2026-06-01.md
```

生成：

```text
articles/wemd-inbox/daily-ai-news-2026-06-01.md
```

[截图位：WeMD 中打开新闻稿后的手机预览效果]

接下来人工检查三件事：

- 新闻来源是否可靠。
- 标题和摘要是否夸大。
- 截图位是否需要换成真实截图。

检查完，再把最终稿放到 `articles/approved/`。

## 什么时候进公众号草稿箱

只有你确认过最终稿，才进入草稿箱流程。

```powershell
npm.cmd run render:wechat-html -- --article articles/approved/daily-ai-news-2026-06-01.md
npm.cmd run preview:wechat -- --article articles/approved/daily-ai-news-2026-06-01.md
npm.cmd run publish:draft -- --article articles/approved/daily-ai-news-2026-06-01.md --cover assets/covers/daily-ai-news-2026-06-01.jpg --confirmed
```

[截图位：公众号草稿箱预览页]

这一步不应该放进自动化。至少我不会这么做。

新闻稿最怕的是来源错、标题过、截图不对。自动化可以加速，但不能替你承担判断。

## 这个例子能复用到哪里

你可以把“新闻”换成别的定期内容：

- 每周产品更新整理
- GitHub 项目动态
- 行业报告摘要
- 社群问题精选
- 客户反馈复盘

核心不变：自动化负责收集和整理，人负责确认和发布。

这就是我喜欢这套流程的地方。它没有试图把人拿掉，只是把那些重复、容易漏、又很烦的步骤规整起来。

## 参考

- OpenAI Codex app 介绍：<https://openai.com/index/introducing-the-codex-app/>
- ChatGPT Tasks 说明：<https://help.openai.com/en/articles/10291617-tasks-inchatgpt>
