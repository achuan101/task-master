# MasterPlan 微信云开发技术实施方案

基于产品设计方案，本计划书详细阐述如何使用**腾讯微信云开发（WeChat CloudBase）**技术栈来落地开发"MasterPlan（信息学院申硕进度跟踪小程序）"。首期实现**大数据专业**，架构预留**计算机专业、管理专业**的扩展能力。采用云开发可以极大降低运维成本，实现一人全栈极速开发，且天然具备微信生态的订阅消息提醒优势。

## 一、 技术栈选型

* **前端框架**：微信小程序原生语法 (WXML + WXSS + JS)。鉴于本项目重交互、轻跨端，直接使用微信小程序原生开发，最大程度契合云开发原生 API，包体积最小。
* **UI 组件库**：TDesign (腾讯官方小程序组件库)，打造严谨清爽的数据看板风格。
* **后端服务**：微信云开发 (CloudBase)
  * **计算**：云函数 (Cloud Functions) — 处理定时任务、订阅消息推送、课程模版初始化。
  * **数据库**：云数据库 (Cloud Database) — JSON 文档型数据库，非常适合存储考试卡片和状态字典。
  * **存储**：云存储 (Cloud Storage) — 用于后续可能存入的准考证、成绩单截图等。

---

## 二、 核心数据库设计 (NoSQL 集合定义)

系统将采用无服务 JSON 数据库，集合（Collection）划分如下：

### 1. `users` (用户信息与全局时间表)
以微信原生 `openid` 作为主键 `_id`，实现免密码静默登录。
```json
{
  "_id": "用户的微信 openid",
  "nickName": "用户昵称",
  "major": "big_data",           // 专业枚举：big_data / computer_science / management
  "majorName": "大数据",          // 专业显示名
  "enrollDate": "2026-09-01",    // 入学/资格生效期
  "deadlineDate": "2030-09-01",  // 4年到期日
  "thesisDeadline": null,        // 论文1.5年到期日（全部考试通过后触发更新）
  "thesisTriggeredAt": null,     // 触发论文倒计时的日期（最后一门考试通过日期）
  "createdAt": "时间戳",
  "updatedAt": "时间戳"
}
```

### 2. `major_templates` (专业课程模版 — 多专业核心)
预置各专业的标准课程列表，用户注册时按所选专业批量复制到个人 `courses` 集合。
```json
{
  "_id": "big_data_101700706",
  "major": "big_data",
  "courseCode": "101700706",
  "courseName": "软件工程与方法",
  "category": "major_core",  // 见下方分类枚举
  "credit": 3,
  "examType": "non_pool"     // pool(题库考) / non_pool(非题库考) / national(国考，不在此表)
}
```

**课程分类枚举 `category`**：

| 枚举值 | 含义 | 大数据专业示例 |
|--------|------|---------------|
| `major_core` | 专业课 | 软件工程与方法、网络与通信、机器感知、海量数据挖掘 |
| `subject_base` | 学科基础课 | 云计算与大数据、高级操作系统 |
| `politics` | 政治理论课 | 新时代中国特色社会主义理论与实践、自然辩证法概论 |
| `method` | 方法课 | 运筹学与优化理论、学术规范和论文写作 |
| `elective` | 选修课 | 高级并行计算、组合数学、离散数学 |
| `language` | 第一外语课 | 语言基础 |

> [!NOTE]
> 首期仅预置大数据专业的14门课程模版。后续添加计算机、管理专业时，只需在此集合中追加对应模版数据即可，前端和云函数无需改动。

### 3. `courses` (用户个人课程打卡)
从 `major_templates` 复制而来，归属到具体用户，记录个人进度。
```json
{
  "_id": "唯一ID",
  "_openid": "用户的微信 openid",
  "major": "big_data",
  "courseCode": "101700706",
  "courseName": "软件工程与方法",
  "category": "major_core",
  "credit": 3,
  "examType": "non_pool",
  "status": "pending",       // pending(未开始) / learning(备考中) / passed(已通过)
  "passDate": null,           // 通过时间
  "score": null               // 可选填具体成绩
}
```

### 4. `national_exams` (国家统一考试记录)
国考与普通课程逻辑不同（每年1次、共4次机会、需记录每次尝试），独立建集合。
```json
{
  "_id": "唯一ID",
  "_openid": "用户的微信 openid",
  "major": "big_data",
  "subject": "comprehensive",  // comprehensive(学科综合) / foreign_lang(外国语)
  "subjectName": "计算机科学与技术学科综合水平",
  "status": "pending",         // pending / passed
  "passDate": null,
  "attempts": [
    { "year": 2027, "score": 55, "passed": false },
    { "year": 2028, "score": 72, "passed": true }
  ],
  "maxAttempts": 4,            // 最大机会数
  "remainingAttempts": 4       // 剩余机会（每次录入成绩后自动递减）
}
```

### 5. `thesis_flow` (论文阶段追踪)
追踪从开题到正式答辩的线性流程。
```json
{
  "_id": "唯一ID",
  "_openid": "用户的微信 openid",
  "currentStage": "not_started",  // 当前阶段枚举
  "paperPublished": false,        // 小论文是否已发（前置卡点）
  "paperStatus": "not_started",   // not_started / writing / submitted / accepted / published
  "paperJournal": null,           // 发表期刊名
  "history": [
    { "stage": "mentor_assign", "date": "2028-01-01", "status": "done", "note": "" }
  ]
}
```

**论文阶段枚举**：`not_started` → `mentor_assign`(导师分配) → `proposal_defense`(开题答辩) → `writing`(撰写中) → `pre_defense`(预答辩) → `final_defense`(正式答辩) → `completed`(通过)

### 6. `events` (考试日历与事件规则)
内置每年固定发生的事件，用于计算下次触发时间和推送提醒。
```json
{
  "_id": "唯一ID",
  "eventType": "national_exam_signup",  // 事件类型
  "eventName": "国考报名",
  "description": "每年3月初，学科综合+外国语报名",
  "recurringMonth": 3,                  // 每年触发月份
  "recurringDay": 1,                    // 触发日
  "reminderDaysBefore": 7,              // 提前多少天提醒
  "applicableMajors": ["big_data", "computer_science", "management"]
}
```

预置事件清单：

| 事件 | 月份 | 提前提醒 |
|------|------|----------|
| 国考报名 | 3月初 | 提前7天 |
| 国考考试 | 5月 | 提前7天 |
| 春季题库考 | 4月 | 提前14天 |
| 秋季题库考 | 10月 | 提前14天 |
| 春季答辩窗口 | 5月 | 提前30天 |
| 秋季答辩窗口 | 11月 | 提前30天 |

---

## 三、 云端核心逻辑与触发器设计

### 1. 新用户初始化 (云函数 `initUser`)
* **触发时机**：用户首次授权登录并选择专业后。
* **逻辑**：
  1. 在 `users` 集合创建用户记录（含所选 `major`）。
  2. 从 `major_templates` 集合中查询该专业的所有课程模版。
  3. 批量插入到 `courses` 集合（归属该用户 `_openid`）。
  4. 创建2条 `national_exams` 记录（学科综合 + 外国语）。
  5. 创建1条 `thesis_flow` 记录（初始阶段 `not_started`）。

### 2. 自动激活"论文1.5年倒计时" (云函数 `checkThesisEligibility`)
* **触发时机**：当用户在界面勾选任意一门课程为"已通过"时调用。
* **逻辑**：
  1. 更新当前课程状态为 `passed`，记录 `passDate`。
  2. 聚合查询该 `_openid` 下：`courses` 集合所有记录 + `national_exams` 集合所有记录。
  3. 若全部标为 `passed`，则取 **所有 `passDate` 中的最大值**（即最后一门通过日期）。
  4. 计算 `thesisDeadline = max(passDate) + 18个月`。
  5. 更新 `users` 集合的 `thesisDeadline` 和 `thesisTriggeredAt` 字段。
  6. 触发一次性订阅消息通知用户："恭喜！所有考试已通过，论文倒计时已启动。"

### 3. 微信订阅消息推送 (定时云函数 `timerNotice`)
* **触发配置**：`cron` 类型，每天上午 9:00 运行一次。
* **逻辑**：
  1. 读取 `events` 集合中的所有事件规则。
  2. 计算当前日期是否命中任一事件的提醒窗口（`recurringMonth/Day - reminderDaysBefore`）。
  3. 命中则查询 `users` 集合中相关专业的活跃用户。
  4. 通过云调用 `openapi.subscribeMessage.send` 发送微信服务通知。
* **典型场景**：每年3月底提醒题库考报名、考前1周准考证打印提醒、论文阶段关键节点提醒。

---

## 四、 安全规则设计

```json
{
  "users": {
    ".read": "auth.openid == doc._id",
    ".write": "auth.openid == doc._id"
  },
  "courses": {
    ".read": "auth.openid == doc._openid",
    ".write": "auth.openid == doc._openid"
  },
  "national_exams": {
    ".read": "auth.openid == doc._openid",
    ".write": "auth.openid == doc._openid"
  },
  "thesis_flow": {
    ".read": "auth.openid == doc._openid",
    ".write": "auth.openid == doc._openid"
  },
  "major_templates": {
    ".read": true,
    ".write": false
  },
  "events": {
    ".read": true,
    ".write": false
  }
}
```

> [!NOTE]
> `major_templates` 和 `events` 为全局只读数据，所有用户可读、仅管理员（通过云函数）可写。个人数据集合严格按 `_openid` 隔离。

---

## 五、 实施路线图 (Phases)

### Phase 1: 基础设施搭建 ⚙️
* 在微信公众平台注册小程序并开通云开发环境。
* 创建全部6个数据库集合，配置安全规则。
* 编写云函数 `initUser`：实现用户注册 + 专业选择 + 课程模版批量初始化。
* 导入大数据专业的14门课程到 `major_templates` 集合。
* 导入预置事件到 `events` 集合。

### Phase 2: 核心功能开发 📱
* **首页 Dashboard**：渲染全局倒计时环图、学分/课程完成率统计、近期待办列表（读取 `events`）。
* **课程打卡页**：分 Tab 渲染（题库考 / 非题库考），按课程类别分组展示，实现点选状态切换。
* **国考记录页**：展示学科综合 + 外国语的通过状态、剩余机会数、历次成绩记录。
* **论文进度页**：实现垂直时间轴 (Timeline) 或步骤条 (Steps) 组件，小论文前置条件的解锁交互。

### Phase 3: 云函数与消息闭环 🔔
* 编写云函数 `checkThesisEligibility`：自动检测并激活论文倒计时。
* 编写定时云函数 `timerNotice`：实现事件驱动的自动推送提醒。
* 接入微信订阅消息机制，完成报名提醒和节点倒计时的真实推送闭环。

### Phase 4: 多专业扩展与增强 🚀
* 导入计算机专业、管理专业的课程模版到 `major_templates`。
* 实现时间轴/甘特图视图（可选）。
* 添加本地缓存（`wx.setStorageSync`）减少云数据库读取。
* 添加"导出进度报告"功能（生成图片分享）。

---

> [!IMPORTANT]
> ## User Review Required
>
> 此为技术落地实施计划。为了确保方案完全贴合使用场景，请确认以下几点：
>
> 1. **大数据专业的题库考科目**：14门课中，哪4门是"学校组织的题库考试"（闭卷，从题库抽原题）？其余为非题库考。这决定了 `major_templates` 中 `examType` 字段的初始值。
> 2. **国考学科综合科目名称**：大数据专业的全国统考"学科综合"卷，具体名称是"计算机科学与技术学科综合水平"还是其他？请以学校通知为准。
> 3. **受众规模**：这个小程序是仅供个人/小圈子同学使用，还是打算公开发布？（影响是否需要完整的用户协议和后台管理）
> 4. **数据保留策略**：是否需要云存储上传准考证/成绩单截图的功能，还是文字状态记录就够了？

> [!TIP]
> 确认上述问题后，即可进入代码层面的脚手架搭建和实施阶段！
