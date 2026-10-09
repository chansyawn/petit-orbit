# 开放内容任务当前版本执行手册

对应客户端 **0.95.2**、配置 revision **1379138**、资源 revision **1359983**、清单目录 **5662883**。当前实现仅接受已验证版本。完整布局及证据见 [提取原理](extraction-method.md)。

## 输入与环境

使用仓库规定的 Node 环境（根目录要求 Node >=22.18）和 Vite+ 包管理，不需要 Python。PNG 使用 workspace 已有的 pngjs。先在仓库根目录执行 `vp install`，另行准备：

```text
resources/
├── anime-studio/AnimeStudio.CLI.exe
├── petit-planet-game/<version>/
│   ├── config.ini
│   └── PetitPlanet_Data/        # 完整基础及 Persistent 更新客户端
└── petit-planet-extraction/<version>/index/assets_map.xml
```

索引需覆盖基础及更新资源，可保留原 Source 路径，读取时自动重定位。本任务不依赖 items 的产物，也不读取 resources/temp 中的调查快照；只写自己的输出目录，不改客户端、items 或共用 index。

配置集中于 `scripts/config.mjs`：版本与掩码、字段存储白名单、语义标签白名单、图片字段、分类规则、验收计数、标签树资源及 SHA256。输入准备、索引读取与 TextMap 解码调用已有 items 脚本，产物写入本任务 work；两任务的输入 profile 不一致时停止，更新版本需一并核对。字节解码与图片匹配模块可接受本任务参数，items 的默认行为保留。

## 执行命令与步骤

在仓库根目录执行全部步骤：

```powershell
vp run --no-cache extraction#open-content
vp run extraction#test
```

直接调用入口可查看帮助、指定目录或单步执行：

```powershell
vp exec node apps/extraction/tasks/open-content/scripts/run.mjs --help
vp exec node apps/extraction/tasks/open-content/scripts/run.mjs --output resources/temp/open-content-check
vp exec node apps/extraction/tasks/open-content/scripts/run.mjs --step decode-records
```

参数仅包括 `--help/-h`、`--step`、`--output`。路径为绝对路径或相对仓库根目录的路径，不依赖当前工作目录。默认写入 `resources/petit-planet-extraction/<version>/open-content/`。不允许输出目录包含客户端、apps、同版本 index/items，或位于这些目录内部。

| 步骤           | 前置条件                    | 主要产物                                                                                                                           |
| -------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| prepare-inputs | 客户端、版本清单            | work/active-config-source.json、version-audit.json                                                                                 |
| read-indexes   | prepare-inputs，Asset Map   | work/textures.json、sprites.json、obb-table-index.json、textmap-zh-en.json、cs-file-index.json 及索引调查文件                      |
| decode-records | read-indexes                | work/records.json：入口、辅助记录、全字段及未解析文本                                                                              |
| classify       | decode-records，AnimeStudio | work/tags、classified.json：分类、语义字段及辅助定义                                                                               |
| export-assets  | decode-records，AnimeStudio | work/assets、asset-batches、asset-manifest.json、asset-references.json、missing-assets.json、source-audit.json、asset-summary.json |
| package        | classify、export-assets     | raw、semantic 两份可分别使用的数据和素材                                                                                           |
| validate       | package 及当前 work         | validation.json：分类、关联、原始字节及全部 PNG 检查结果                                                                           |

`--step` 不补跑前置步骤。单步失败会写入日志与 run-report.json，并返回非零退出码。每次运行先移除旧 validation.json，避免失败后误用旧验收结论。package 重跑时只清理上一份素材清单中已不再引用的 PNG，不删除其他文件。

## 使用产物

原始组 `raw/entries.json` 提供 2,327 个 ID 与各表定位；`raw/tables/<表号>.json` 的记录使用 `表号:源偏移` 作为 key，因此重复业务 ID 的原始行不会丢失。fields 按原始字段号排列，缺省字段为 `present:false`，未知字段为 opaque，不含推测 value。storageSpan 包含可能的填充，不能当作真实类型宽度。

`raw/tables/1.json` 保存用到的完整多语言 TextMap 行及原始桶；`raw/gameplay-tags.json` 保存用到的节点与父链，节点内 Children/InferredIds 可引用未展开的节点。原始配置全部表并没有整体复制到导出目录，未知引用需按源 SHA256 和偏移回到客户端调查。

语义化组 `semantic/content.json` 的 items 为主记录，`definitions.json` 为类别、子项、类型、标签、奖励和辅助卡。name/description 使用 `{zh,en}`；空说明为 null。role 为 item、collection、avatarOption；classification 给出大类 ID、子项 ID 和计算依据。listedInSubcategories 只表示是否命中 24 个配置子项，不表示内容是否开放，也不表示主题集合不可见。

每条记录的 sources、uiSources、rewardSources 结合 content.json 的 fieldMappings 可定位原始值。primaryImage 优先已匹配的小图，再取大图；images 保留全部已确认图片字段。用途未知的图片 role 为 null，具体来源见其 table/key/field。

两组都包含 assets、asset-manifest.json、asset-references.json、missing-assets.json、source-audit.json、unresolved-texts.json。PNG 文件路径相对所属组；素材清单记录源包相对路径、SHA256、对象类型、PathID、Container、尺寸及图片 SHA256。两个目录各自复制素材，没有依赖另一组的图片链接。

不自动建立 SQLite，不接入网站。日志、中间结果、客户端和正式导出均被 Git 忽略。任务文档与实现纳入 Git。

## 当前验收与边界

必验入口 2,327 条：单品 2,133、套组 143、外观 51。24 个子项合计 2,209 条，另有主题集合 67、外观 51。单品六类为家具 887、植物 202、生物 317、服饰 590、菜肴 121、杂物 16。具体子项数字见原理文档和 config.mjs。

主物品关联 2,327，显示配置关联 2,322，生物关联 317，外观卡关联 47；143 个套组引用 14 个不同奖励 ID。当前图标覆盖 2,317 条、2,247 个不同图标。全部图片、来源包数和未解析描述数量由 validation.json 记录，不能沿用 items 的 3,069 图标或 117 来源包作为本任务总量。

本次从新输出目录完整运行：原始组包含 12,218 条关联原始记录；共导出 4,432 个不同图片资源，两组共 8,864 个 PNG 均完整解码并校验 SHA256；110 个来源包大小、MD5 和 SHA256 核对通过。图片引用共 9,907 项（包含无引用的字段位置），4,819 项匹配资源，其余在缺失清单中按原因区分。

当前有 525 个描述哈希未解析到本地 TextMap，原始字段及引用定位仍保留，语义描述留空。这是可选描述缺失，不影响内容名单和必需名称校验。

本次另行对照既有物品产物：2,327 条名称、类型和说明，20,291 个已解码主表字段，2,317 条主图资源映射及 PNG SHA256 均一致；24 个子项的完整 ID 名单与调查结果一致。这是本次验收对照，旧产物和调查快照不是任务输入。

当前明确的主图缺失：无显示配置的 95014 大蒜、95015 火龙果、95016 蓝莓、95113 冰凌花、95114 矮牵牛；有引用但未索引的 52 绿茵球场、53 街头、54 施工现场、2210 岁岁团圆桌、2211 岁岁团圆椅。仍保留全部记录，其他大图等缺失见清单。

开放状态来自用户确认，而非恢复出的开放开关。未知字段不解释为积分、品质、价格、研究条件、缩放或集合成员。标签的语义命名只使用已验证白名单。配置名称保留原样，例如“采摘材料”与最新 UI 所见“采摘植物”可能不同。

## 排查与更新

- **版本或清单不匹配**：检查 config.ini、data/res revision 和完整 OBB 配置对；不要只修改期望数量。prepare-inputs 保存三处候选校验结果。
- **缺少前置文件**：按步骤表先运行依赖，确保所有步骤使用相同 --output。
- **重复关联键**：显示表 ID 35 的等价行保留两份原始定位并稳定选最后一行；不同值的重复键必须调查，不能直接覆盖。表外重复行不参与本任务。
- **描述哈希缺失**：原始值与定位保留于 unresolved-texts.json，语义描述留空；必需名称不能采用此回退。
- **配置图片未匹配**：查看 reference、Container 和基础／更新索引覆盖，记录在 missing-assets.json；不要按相似名称替换。
- **选定图片没有导出或 PNG 损坏**：查看 logs/anime-*.log 和 export-assets.log；该情况返回失败，与没有图片配置不同。修复后重跑 export-assets、package、validate。
- **同名 Sprite**：必须完整路径和名字共同匹配；同包同名对象分别导出。相同优先级的多个不同资源身份会报歧义。
- **来源校验失败**：核对源包与对应版本清单；不要跳过 MD5/大小检查。

升级客户端需要重新确认根字段、引用与标量类型（尤其 93.1 和 93.17）、TextMap 布局、全部字段白名单、资源覆盖策略、标签树身份及 SHA256、分类规则、奖励和卡关联，再更新验收样例、数量与两份文档。
