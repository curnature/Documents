# Documents

> Curvature 的个人博客与技术笔记仓库，使用 [VitePress](https://vitepress.dev/) 构建，支持 Markdown、数学公式与自动部署。

部署目标站点：[https://www.curvature.blog](https://www.curvature.blog)

## 项目简介

本仓库用于整理和发布物理、数学、日常阅读摘录以及 VPS 运维相关笔记。网站内容以 Markdown 编写，由 VitePress 生成静态页面，并通过 GitHub Actions 自动构建、同步到 VPS。

主要特性：

- VitePress 静态站点，适合文档与博客内容
- 通过 `markdown-it-mathjax3` 支持行内和独立公式
- 自定义 `info`、`tip`、`warning`、`danger` 提示框样式
- 推送 `main` 分支后自动构建并部署到 VPS

## 技术栈

| 技术 | 用途 |
| --- | --- |
| [VitePress](https://vitepress.dev/) | 静态站点生成与主题 |
| Vue / Vite | VitePress 底层运行时与构建工具 |
| `markdown-it-mathjax3` | Markdown 中的 LaTeX 数学公式渲染 |
| GitHub Actions | 自动构建与 VPS 部署 |
| nginx | 线上静态站点服务 |

## 目录结构

```text
.
├─ .github/
│  └─ workflows/
│     ├─ deploy.yml        # 构建并部署到 VPS 的 GitHub Actions 工作流
│     └─ deploy.yml_bkup   # 原 GitHub Pages 部署工作流备份
├─ VitePress/
│  ├─ docs/
│  │  ├─ .vitepress/
│  │  │  ├─ config.mts     # 站点标题、导航、侧边栏与 Markdown 配置
│  │  │  └─ theme/         # 自定义主题入口与样式
│  │  ├─ index.md          # 首页
│  │  ├─ guide/            # 使用与格式示例
│  │  ├─ math/             # 数学笔记
│  │  ├─ physics/          # 物理笔记
│  │  ├─ reading/          # 阅读摘录
│  │  └─ vps_build/        # VPS 搭建系列教程
│  ├─ package.json
│  └─ package-lock.json
└─ README.md
```

> `node_modules/`、`.vitepress/cache/`、`.vitepress/dist/` 等为依赖或构建生成内容，不属于文档源文件。

## 本地开发

### 环境要求

- Node.js 20 或更高版本（与 GitHub Actions 使用的版本一致）
- npm

### 启动开发服务器

```bash
cd VitePress
npm ci
npm run docs:dev
```

启动后访问终端提示的本地地址，通常为 <http://localhost:5173>。

### 构建与预览

```bash
cd VitePress
npm run docs:build
npm run docs:preview
```

构建产物位于：

```text
VitePress/docs/.vitepress/dist/
```

## 内容组织

| 路径 | 访问路由 | 内容 |
| --- | --- | --- |
| `docs/index.md` | `/` | 博客首页 |
| `docs/guide/getting_started.md` | `/guide/getting_started` | Markdown、公式和提示框示例 |
| `docs/math/` | `/math/` | 数学笔记，目前包含 Arnold ODE 第一章 |
| `docs/physics/` | `/physics/` | 物理笔记 |
| `docs/reading/` | `/reading/` | 阅读摘录 |
| `docs/vps_build/` | `/vps_build/` | 从零搭建 VPS 的系列教程 |

### 新增文章

1. 在对应分类目录下新建 `.md` 文件，例如 `docs/math/new_note.md`。
2. 文件会对应路由 `/math/new_note`。
3. 如需显示在顶部导航或侧边栏中，请同步修改 `docs/.vitepress/config.mts` 的 `nav` 或 `sidebar` 配置。
4. 可使用可选 Frontmatter 补充页面元信息：

```md
---
title: 文章标题
description: 文章简介
outline: deep
---

# 文章标题

正文内容……
```

## Markdown 与数学公式

行内公式：

```md
质能方程为 $E = mc^2$。
```

独立公式：

```md
$$
G_{\mu\nu} = 8\pi G T_{\mu\nu}
$$
```

常用提示框：

```md
::: info 定义
这里写定义。
:::

::: tip 示例
这里写示例。
:::

::: warning 定理
这里写定理或注意事项。
:::

::: danger 重要提醒
这里写高风险操作或警告。
:::
```

## VPS 教程内容

`vps_build/` 记录了完整的小型 VPS 服务搭建流程，主要包括：

1. 创建普通用户并加固 SSH
2. 安装和配置 nginx
3. 使用 `acme.sh` 申请证书
4. 启用 HTTPS、TLS 1.3 与 HTTP/2
5. 安装并配置 Xray
6. 配置 VLESS + REALITY + VISION
7. 启用 BBR
8. 配置 Xray 路由与 DNS
9. 使用 fallbacks 共享 443 端口
10. 制作简易配置快照
11. 使用 GitHub Actions 自动部署 VitePress
12. 使用纯 Xray 扩展多节点

## 构建与自动部署

线上部署由 `.github/workflows/deploy.yml` 负责。每次向 `main` 分支推送代码，或在 GitHub Actions 页面手动触发工作流时，会执行：

1. 检出代码
2. 安装 Node.js 20
3. 在 `VitePress/` 中执行 `npm ci`
4. 执行 `npm run docs:build`
5. 将 `VitePress/docs/.vitepress/dist/` 的内容通过 `rsync` 同步到 VPS 的 `/var/www/html/`

仓库需配置以下 GitHub Actions Secrets：

| Secret | 说明 |
| --- | --- |
| `DEPLOY_KEY` | 用于 SSH 部署的私钥 |
| `SERVER_IP` | VPS 的 IP 地址或主机名 |
| `SERVER_USER` | SSH 登录用户 |
| `SERVER_PORT` | SSH 端口 |

如需改回 GitHub Pages 部署，可参考已备份的 `.github/workflows/deploy.yml_bkup`。

## 维护建议

- 提交前在本地执行一次 `npm run docs:build`，确认页面和链接可以正常构建。
- 新增页面后检查 `config.mts` 中的导航和侧边栏是否需要更新。
- 若站点部署在子路径而非根域名，需要同步调整 VitePress 的 `base` 配置。
- 不要将私钥、服务器密码等敏感信息写入 Markdown 或提交到仓库。
