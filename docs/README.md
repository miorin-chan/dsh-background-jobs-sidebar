# 开发与验证

[英文说明](../README.md) · [中文说明](../README.zh.md)

Host 从 `ctx.jobs` 读取启动时的任务，并订阅后续注册、停止和结算事件。
浏览器通过 DSH 的 Connection 接收仍在运行或正在停止的任务快照，连接在左侧边栏收起时关闭。
任务归属使用 DSH 的会话目录解析。`sidebar.footer.action` 在账号控件上方渲染任务区。
任务区占一整行，标题参照工作区文件树，任务列表可以收起。

```sh
npm ci
npm test
npm run check
npm pack --dry-run --json
```

在工作区根目录运行脚手架校验：

```sh
node tools/new-dsh-plugin/cli.mts --check plugins/dsh-background-jobs-sidebar
```

实机检查使用一次性 profile。
先在两个会话启动限时后台任务，再从左侧边栏确认两项同时存在，点击一项返回所属会话，等待结算后核对计数。
有任务时点击标题，检查高度、透明度和箭头的过渡。用键盘重新展开，确认折叠期间焦点会跳过任务条目。
开启系统的「减少动态效果」后，检查列表和箭头是否立即切换。
停用插件后，确认侧栏区块消失且原生的「新会话」仍可用。
