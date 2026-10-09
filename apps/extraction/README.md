# 客户端内容提取

这里保存星布谷地客户端提取任务的文档和当前有效脚本。客户端实现变化较快，各任务直接维护自己的模块与配置，历史版本由 Git 保存。

## 物品数据

阅读顺序：

1. [提取原理与独立实现指南](tasks/items/docs/extraction-method.md)：完整的数据布局、解码与关联方法，不依赖本项目脚本。需要重写或更新算法时先读这份。
2. [当前版本执行手册](tasks/items/docs/current-version.md)：对应现有脚本的环境、配置、命令、产物和排查方法。需要重跑数据时读这份。

使用仓库的 Node 环境和包管理器。在仓库根目录安装依赖后执行：

```powershell
vp install
vp run --no-cache extraction#items
vp run extraction#test
```

客户端、Asset Map 和 AnimeStudio 需另行准备，位置见执行手册。全部提取脚本使用 Node；无需 Python。默认物品产物目录为：

```text
resources/petit-planet-extraction/<version>/items/
```

客户端保存于 `resources/petit-planet-game/<version>/`；对应索引保存于 `resources/petit-planet-extraction/<version>/index/`，供各任务共用。`<version>` 为客户端版本号。物品任务只写 items 目录，不覆盖共用索引。客户端版本与配置/资源 revision 分开记录，目录不再拼接 revision。

产物、日志、索引文件与客户端不纳入 Git，也不会自动接入网站。`resources/temp/` 用于存储临时文件；维护中的实现以本目录为准。提取任务依赖 Git 忽略的本地输入，执行时关闭任务缓存。

## 开放内容双份导出

阅读 [提取原理与独立实现指南](tasks/open-content/docs/extraction-method.md) 了解范围、字节布局、关联和分类证据；阅读 [当前版本执行手册](tasks/open-content/docs/current-version.md) 查看输入、命令、产物和排查方法。

```powershell
vp run --no-cache extraction#open-content
```

任务直接读取客户端与共用索引，不依赖 items 或临时调查产物。默认输出为 `resources/petit-planet-extraction/<version>/open-content/`，raw 保存原始字段、关联记录及素材，semantic 保存已确认语义的 JSON 及素材。两份数据均完整保留根表 93 的 2,327 条入口，包括套组、主题集合和角色外观；辅助卡资料单独存放，缺失图片不影响入口数量。

当前版本完整运行导出 4,432 张不同图片，每组均携带独立图片副本；110 个来源包校验、两组共 8,864 个 PNG 完整解码及全部分类计数通过。其他来源参数及缺失情况见执行手册和输出的 validation.json。开放范围来自用户确认，不用于判定表外内容未开放。

## 扩展任务

新任务使用 `tasks/<任务名>/docs/` 和 `tasks/<任务名>/scripts/`；例如菜谱使用 `tasks/recipes/`。每个任务分别提供原理文档、执行手册、当前配置和入口，并把产物写到 `resources/petit-planet-extraction/<version>/<任务名>/`，读取同版本 index 内的共用索引。

更新客户端时，先重新确认数据布局、字段含义和版本一致性，再修改配置或重写脚本，同步更新两份文档与验证样例。只有实际出现重复需求时才提取共用模块。测试只保存小型字节样例，不提交完整游戏文件、索引或生成数据库。
