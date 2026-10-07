# petit-orbit

「星布谷地」游戏 Wiki 项目，旨在整理游戏相关资料，并通过网站提供便于浏览和查阅的内容。

## 目录结构

```text
.
├── apps/
│   └── website/             # Wiki 网站应用（页面、路由与样式）
├── resources/
│   ├── anime-studio/             # 本地 AnimeStudio 工具
│   ├── petit-planet-game/        # 本地星布谷地客户端副本
│   ├── petit-planet-index/       # Asset Map、CAB Map 索引文件
│   └── petit-planet-extraction/ # 临时解包导出、菜谱数据、分析报告和日志
├── .vscode/                  # VS Code 工作区配置
├── package.json              # 仓库级脚本和工具配置
├── pnpm-workspace.yaml       # pnpm workspace 与依赖版本配置
├── tsconfig.json             # TypeScript 根配置
└── vite.config.ts            # Vite+ 仓库级配置
```

网站页面和路由主要位于 `apps/website/src/`。

## 本地资源处理

- `resources/anime-studio/`：AnimeStudio 本地工具，用于浏览、预览和导出 Unity 游戏资源；上游项目：[Escartem/AnimeStudio](https://github.com/Escartem/AnimeStudio)。
- `resources/petit-planet-game/`：本机星布谷地客户端副本，作为资源读取来源。
- `resources/petit-planet-index/`：保存本地客户端生成的 Asset Map 与 CAB Map 索引文件。
- `resources/petit-planet-extraction/`：保存从游戏资源导出的文件、菜谱数据表、分析报告、日志和分析工具。

`resources/` 下所有本地内容均由根目录 `.gitignore` 忽略；AnimeStudio、游戏和索引目录保留 `.gitkeep` 占位文件。`petit-planet-extraction/` 用于存放临时导出和分析文件，整目录忽略，不保留 `.gitkeep`。

## 本地开发

在仓库根目录安装依赖并启动网站：

```bash
vp install
vp run dev
```
