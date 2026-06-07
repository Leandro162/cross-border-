# 跨境导航站

跨境导航站是一个面向跨境电商从业者的静态资源导航项目，集中展示建站、支付、广告联盟、数据分析和 AI 等工具。

## 项目结构

```text
.
├── .github/workflows/deploy-oss.yml
├── files/
│   ├── index.html
│   ├── app.js
│   ├── style.css
│   ├── deals.json
│   ├── privacy.html
│   └── terms.html
└── README.md
```

## 核心功能

- 按资源分类筛选
- 搜索名称、描述、分类及标签
- 按浏览量排序
- 桌面端与移动端响应式布局
- 从 JSON 文件动态渲染导航卡片
- 自动部署到阿里云 OSS

## 本地预览

```bash
python3 -m http.server 8765 --directory files
```

打开 `http://127.0.0.1:8765/`。

## 维护导航数据

资源数据位于 `files/deals.json`。每条记录包含：

`id`、`name`、`logo`、`category`、`tag`、`description`、`url`、`views`

## 部署

推送到 `main` 分支后，GitHub Actions 会将 `files/` 同步到阿里云 OSS Bucket。

## 许可证

当前仓库尚未指定开源许可证。
