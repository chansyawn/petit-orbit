# petit-orbit

「星布谷地」游戏 Wiki 项目，旨在整理游戏相关资料，并通过网站提供便于浏览和查阅的内容。

## 目录结构

```text
.
├── apps/
│   └── website/             # Wiki 网站应用（页面、路由与样式）
├── external/
│   ├── animestudio/          # 本地 AnimeStudio 工具（文件由 Git 忽略）
│   └── petit-planet-game/    # 本地星布谷地客户端副本（文件由 Git 忽略）
├── .vscode/                  # VS Code 工作区配置
├── package.json              # 仓库级脚本和工具配置
├── pnpm-workspace.yaml       # pnpm workspace 与依赖版本配置
├── tsconfig.json             # TypeScript 根配置
└── vite.config.ts            # Vite+ 仓库级配置
```

网站页面和路由主要位于 `apps/website/src/`。

## 本地资源处理

- `external/petit-planet-game/`：本机星布谷地客户端副本，作为资源读取来源。
- `external/animestudio/`：AnimeStudio 本地工具，用于浏览、预览和导出 Unity 游戏资源；上游项目：[Escartem/AnimeStudio](https://github.com/Escartem/AnimeStudio)。

这两个目录中的大型文件由根目录 `.gitignore` 忽略；`.gitkeep` 占位文件会保留目录结构。

## 本地开发

在仓库根目录安装依赖并启动网站：

```bash
vp install
vp run dev
```
