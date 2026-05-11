# 族谱功能接入调研与落地方案

更新日期：2026-05-11

## 1. 当前项目现状

KinTrace Admin 当前是一个 `Vue 3 + TypeScript + Vite + Naive UI` 的后台项目，前端通过 REST API 拉取聚合快照。

现有模型里已经有：

- `families`：家族空间
- `members`：成员账号/协作成员
- `tombs`：墓点/纪念点
- `tasks`：年度祭扫任务
- `routes`：路线模板

但还没有族谱功能必需的结构化关系：

- 父子/母子关系
- 配偶关系
- 世代排序
- 支系/房系
- 已故先人与当前成员的映射
- 关系冲突校验

这意味着“族谱”更像是一个新的业务域，不适合只在现有 `members` 表上补两三个字段硬做。

## 2. 开源方案调研

### 2.1 完整家谱系统

#### Gramps Web

- 官网：https://www.grampsweb.org/
- 前端仓库：https://github.com/gramps-project/gramps-web
- 特点：完整在线家谱系统，支持协作编辑、家谱图、地图、搜索、隐私控制，以及与 Gramps Desktop 双向同步。
- 许可：`AGPL-3.0`

结论：

- 功能很强，适合“直接用它做家谱产品”
- 不适合直接嵌入当前后台
- 原因是它有自己完整的数据模型、前后端体系和部署方式，接入后更像“并行运行另一套系统”

#### webtrees

- 仓库：https://github.com/fisharebest/webtrees
- 特点：成熟的在线协作家谱系统，基于 GEDCOM，支持网站在线查看和编辑家谱。
- 许可：`GPL`
- 技术栈：PHP 体系

结论：

- 也是成熟产品
- 但与当前前端项目的技术栈差异太大
- 更适合作为独立站点部署，而不是作为当前管理后台的一个功能模块

### 2.2 可嵌入的谱系图/可视化组件

#### Topola

- 仓库：https://github.com/PeWu/topola
- 特点：TypeScript/JavaScript 家谱可视化库，支持 ancestor、descendant、hourglass、relatives 等图形，还支持 GEDCOM 输入。
- 许可：`Apache-2.0`

结论：

- 很适合做“只接图形展示层”
- 与当前 Vue 项目技术栈兼容度高
- 适合在我们自己定义的数据模型之上做谱图展示

#### Family Chart

- 仓库：https://github.com/donatso/family-chart
- 特点：D3 驱动，支持 Vue/React/Angular，交互性较强，适合做可缩放、可配置的家谱图。
- 许可：`MIT`

结论：

- 适合做管理后台里的交互式家谱视图
- 更偏“前端图形组件”，不是完整业务系统
- 如果我们决定自己掌控数据结构，这是很现实的接入方案

#### pedigreejs

- 文档：https://ccge-boadicea.github.io/pedigreejs/
- 特点：可以编辑复杂亲属关系，支持双胞胎、收养、近亲关系等。

结论：

- 关系表达能力强
- 但产品形态和视觉语言更偏医学 pedigree，不太像中文宗亲/族谱产品
- 可以借鉴其关系建模思路，不建议直接作为前台主视觉

## 3. 推荐方案

推荐优先级：

1. 不接入整套家谱系统
2. 采用“自有数据模型 + 可视化组件”的方式建设族谱功能
3. 第一阶段优先做后台族谱维护与族谱树展示

原因：

- 你们当前项目已经有 `家族 / 成员 / 墓点 / 任务` 这套业务，族谱应该服务现有业务，而不是把现有业务迁就第三方家谱系统
- 整套系统接入会带来登录、权限、数据同步、部署、许可协议、样式统一等额外成本
- 族谱里会有大量“并不是系统用户的人物”，所以它和 `members` 不能简单等同

## 4. 建议的数据模型

### 4.1 不建议直接复用 `members` 作为族谱人物表

原因：

- `members` 是当前协作系统里的用户/成员
- 族谱人物中会有大量先人、配偶、旁支人物，并不会登录系统
- 一个 `member` 只代表“当前活跃用户身份”，而不是完整谱系人物

所以建议新增独立实体。

### 4.2 推荐新增表

#### `genealogy_people`

字段建议：

- `id`
- `familyId`
- `memberId`：可空，用于映射当前系统成员
- `name`
- `courtesyName`：字/号，可选
- `gender`
- `generationLabel`：如“一世”“二世”
- `branchName`：房系/支系
- `fatherId`：可空
- `motherId`：可空
- `isDeceased`
- `birthDate`
- `deathDate`
- `bio`
- `avatar`
- `tombId`：可空，关联墓点
- `sortOrder`
- `createdAt`
- `updatedAt`

#### `genealogy_spouses`

字段建议：

- `id`
- `familyId`
- `personId`
- `spouseId`
- `marriageDate`
- `status`
- `sortOrder`

说明：

- 配偶关系单独建表比塞多个 `spouseId` 更稳
- 后续支持多段婚姻、继配、离异、排序会轻松很多

#### 可选：`genealogy_branches`

如果后续支系管理会很多，可以单独建：

- `id`
- `familyId`
- `name`
- `parentBranchId`
- `description`

第一版如果想轻一点，也可以先只保留 `branchName` 文本字段。

### 4.3 如果想要更强扩展性

也可以改成“人物表 + 关系表”的图模型：

- `genealogy_people`
- `genealogy_relations`

其中 `genealogy_relations.type` 可包含：

- `father`
- `mother`
- `spouse`
- `adoptive_parent`
- `step_parent`

这会更灵活，但第一版实现复杂度更高。  
如果目标是尽快上线，我建议先用：

- `fatherId`
- `motherId`
- `genealogy_spouses`

## 5. 与现有业务的关系

族谱功能不应该孤立存在，建议直接接入当前业务链路：

- 族谱人物 `memberId` 可映射到当前成员
- 族谱人物 `tombId` 可关联墓点
- 家族首页可以展示“祖先人物数 / 支系数 / 已关联墓点数”
- 成员详情页可以增加“关联族谱人物”
- 墓点详情页可以展示“对应族谱人物”

这样“族谱”就不是单纯一张图，而是把现有祭扫、墓点、宗亲协作串起来。

## 6. 前端落地建议

建议新增 3 个页面：

### 6.1 族谱总览页

路由示例：

- `/genealogy`

页面内容：

- 当前家族的族谱树
- 祖先/后代切换
- 支系筛选
- 搜索人物
- 点击节点查看人物详情

### 6.2 人物编辑页

路由示例：

- `/genealogy/people/new`
- `/genealogy/people/:id/edit`

页面内容：

- 基础信息
- 父母选择
- 配偶维护
- 墓点关联
- 成员账号关联

### 6.3 关系校验页或弹窗

在保存前做校验：

- 禁止自己成为自己的父母
- 禁止形成祖先环
- 同一人物父亲/母亲重复冲突
- 代际排序异常提醒

## 7. 图形库接入建议

### 方案 A：接 Topola

适合场景：

- 先做展示型族谱
- 希望快速得到成熟的 ancestor/descendant 图
- 后续不排斥 GEDCOM 导入导出

优点：

- 谱图表达更“家谱化”
- 技术栈匹配
- 许可友好

注意点：

- 需要把我们自己的 API 数据转换成它的输入格式
- 编辑交互可能还需要我们自己补

### 方案 B：接 Family Chart

适合场景：

- 更重视后台里的交互编辑体验
- 希望定制节点卡片，展示成员、墓点、标签等业务字段

优点：

- Vue 友好
- 自定义空间大
- 很适合做管理台风格的交互

注意点：

- 需要我们自己定义更多业务规则
- 更像“图形底座”，不是开箱即用的家谱产品

### 我的建议

如果你希望：

- 先快点做出“能看”的族谱：优先 `Topola`
- 更重视后续后台编辑和业务融合：优先 `Family Chart`

结合当前项目，我更偏向：

- 后台管理端先接 `Family Chart`
- 如果后续要做对外展示型族谱，再评估 `Topola`

## 8. API 设计建议

建议新增接口：

- `GET /api/v1/genealogy/tree?familyId=xxx`
- `GET /api/v1/genealogy/people/:id`
- `POST /api/v1/genealogy/people`
- `PATCH /api/v1/genealogy/people/:id`
- `DELETE /api/v1/genealogy/people/:id`
- `POST /api/v1/genealogy/people/:id/spouses`
- `DELETE /api/v1/genealogy/spouses/:id`
- `POST /api/v1/genealogy/validate`

`tree` 接口建议直接返回前端绘图所需结构，避免浏览器端自己拼整棵树。

## 9. 最小可行版本（MVP）

第一版建议只做这些：

1. 新增族谱人物管理
2. 支持设置父亲、母亲、配偶
3. 支持关联当前成员和墓点
4. 提供一张可搜索、可缩放的族谱图
5. 提供基本关系校验

先不做：

- GEDCOM 导入导出
- 多婚复杂关系全覆盖
- 关系版本历史
- 宗谱文档排版导出
- AI 自动补全关系

## 10. 结论

结论很明确：

- 有成熟开源家谱系统，但不适合直接“接进当前后台”
- 更适合接入的是“家谱可视化组件”，不是“完整家谱平台”
- 对当前项目最稳的做法是新增独立族谱业务模型，再接一个可视化树组件

建议路线：

1. 后端先补 `genealogy_people` 与配偶关系
2. 前端新增 `族谱总览 + 人物编辑`
3. 先接入 `Family Chart` 或 `Topola` 做第一版树图
4. 跑通 `成员 - 族谱人物 - 墓点` 三者关联

如果继续推进，实现顺序建议优先做：

- 数据模型
- API
- 后台编辑页
- 族谱树展示
- 关系校验
