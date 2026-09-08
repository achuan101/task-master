# 集成“计算机科学与技术专业”方案设计

本方案旨在按照目前已经支持多专业（大数据、管理科学与工程）的 `MAJOR_REGISTRY` 架构，将“计算机科学与技术专业”（简称计算机专业）无缝集成进系统中。

## 📝 课程数据提取与梳理（基于上传图片）

根据您上传的图片 `计算机.jpg`，共提取到 **14 门课程**，累计 **36 学分**：

| 编号 | 课程名称 | 学分 | 考试类型 | 推测模块 (Category) |
| --- | --- | --- | --- | --- |
| 101700013 | 网络与通信 | 4 | 题库 | 专业课 (`major_core`) |
| 101700710 | 数据库管理系统原理与实现 | 4 | 题库 | 学科基础课 (`subject_base`) |
| 101700706 | 软件工程与方法 | 3 | 题库 | 专业课 (`major_core`) |
| 100100301 | 新时代中国特色社会主义理论与实践 | 2 | 题库 | 政治理论课 (`politics`) |
| 101700021 | 组合数学 | 2 | 非题库 | 选修课 (`elective`) |
| 113700016 | 自然辩证法概论 | 1 | 非题库 | 政治理论课 (`politics`) |
| 101200001 | 语言基础 | 3 | 非题库 | 第一外语课 (`language`) |
| 101700709 | 文本挖掘方法 | 2 | 非题库 | 选修课 (`elective`) |
| 101700022 | 离散数学 | 2 | 非题库 | 选修课 (`elective`) |
| 101700707 | 海量数据挖掘 | 3 | 非题库 | 专业课 (`major_core`) |
| 101700714 | 机器感知 | 3 | 非题库 | 专业课 (`major_core`) |
| 100900009 | 学术规范和论文写作 | 1 | 非题库 | 方法课 (`method`) |
| 101700711 | 运筹学与优化理论 | 3 | 非题库 | 方法课 (`method`) |
| 101700017 | 高级操作系统 | 3 | 非题库 | 学科基础课 (`subject_base`) |

*(注：系统中的课程需要归属到特定的“模块”分类中，部分新增课程如“数据库管理系统原理与实现”、“文本挖掘方法”将参考同院系结构推测分类。实际分类仅用于前端展示归类，不影响学分计算与打卡。)*

---

## 📝 User Review Required

> [!IMPORTANT]
> 实施前，请确认本方案的技术细节以及梳理出的计算机专业课程列表。如无问题，请指示实施，我将为您执行代码修改。

## 🛠 Proposed Changes

### 1. 前端数据与注册表更新

#### [MODIFY] `miniprogram/utils/mockData.js`
- **新增** `COMPUTER_SCIENCE_COURSES` 数组，将上述 14 门课程录入系统。
- **配置国考**：复用 `DEFAULT_NATIONAL_EXAMS`（即“计算机科学与技术学科综合水平”和“外国语”），或单独新建 `COMPUTER_SCIENCE_NATIONAL_EXAMS` 以保持结构一致性。
- **注册专业**：在 `MAJOR_REGISTRY` 中新增 `computer_science` 对象，配置：
  - `majorName`: '计算机科学与技术专业'
  - `school`: '中国人民大学·信息学院'
  - `icon`: '💻' (或其它适合的图标)
  - `totalCreditsTarget`: 36
  - 绑定对应的 `courses` 和 `nationalExams`

---

### 2. 云端环境初始化适配

#### [MODIFY] `cloudfunctions/initDatabase/index.js`
- **新增模板数据**：加入 `COMPUTER_SCIENCE_TEMPLATES` 数组，包含上述 14 门课。
- **批量写入**：修改数据初始化流程，将计算机专业的课程模板一并写入 `major_templates` 云数据库集合，附加 `major: 'computer_science'` 标识。
- **年度备考事件**：目前 `ANNUAL_EVENTS` 的 `applicableMajors` 已包含 `'computer_science'`，无需修改此部分。

#### [MODIFY] `cloudfunctions/initUser/index.js`
- **用户属性适配**：在 `majorName` 判断逻辑中，增加 `major === 'computer_science' ? '计算机科学与技术专业'`。
- **动态学分与课程数**：`totalCreditsTarget` 针对 `computer_science` 设为 `36`，`totalCoursesTarget` 设为 `14`。
- **国考初始化**：确保 `nationalExams` 的读取逻辑能够正确分配“计算机科学与技术学科综合水平”给计算机专业。

---

## ✅ Verification Plan

### Manual Verification (实施后)
1. **重置数据库**：调用更新后的 `initDatabase` 云函数，确认 `major_templates` 已包含 `computer_science` 的课程。
2. **切换专业测试**：在开发者工具中，打开「我的」界面，点击切换专业，选择「计算机科学与技术专业」。
3. **数据渲染测试**：验证首页及课程表能够正确渲染出该专业的 14 门课、36 学分目标，且题库考/非题库考标签准确无误。国考区域显示“计算机科学与技术学科综合水平”。
