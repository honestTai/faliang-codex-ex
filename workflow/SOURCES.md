# 上游元数据记录

本仓库是公众号工作流仓库，不保留完整上游源码快照。

`sources/` 只保留脚本和许可证检查需要的最小元数据：

- `sources/WeMD/package.json`
- `sources/WeMD/LICENSE`

## WeMD

- Repository: <https://github.com/tenngoxars/WeMD>
- Local metadata path: `sources/WeMD`
- Role: 本地预览、主题微调和公众号排版审稿。

## 融合策略

本仓库不把 WeMD 和发布脚本强行改成一个应用。

稳定的边界是文件交接：

```text
Codex Markdown -> WeMD inbox -> approved Markdown -> styled HTML -> official WeChat draft API
```
