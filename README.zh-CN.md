# ld-last-visited

这是一个适用于 [Tampermonkey](https://tampermonkey.net/) 的用户脚本，用于在 [linux.do](https://linux.do) 的“最新”页面显示你上次浏览的帖子，即使刷新页面也能快速返回上次阅读的位置。

## 功能特性

- 自动记录你最近查看的帖子（记录页面顶部第一条）。
- 页面刷新后，在页面左上角弹出一个浮动窗口，显示上次浏览的帖子标题和链接。
- 使用 Tampermonkey 的持久化存储，支持跨刷新和跨会话。
- 支持的页面地址：
  - `https://linux.do/latest*`
  - `https://linux.do/latest?order=created`

## 使用方法

1. 安装浏览器插件 [Tampermonkey](https://tampermonkey.net/)（支持 Chrome / Firefox / Edge）。
2. [点击此处安装脚本](ld-last-visited-topic)。
3. 打开 [linux.do 的“最新”页面](https://linux.do/latest?order=created)，即可看到提示窗口。

## 项目结构

```
ld-last-visited/
├── ld-last-visited.user.js   # 用户脚本主文件
├── README.md                 # 英文文档
├── README.zh-CN.md           # 中文文档（本文件）
```

## 开源协议

MIT
