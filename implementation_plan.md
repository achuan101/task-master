# 集成“管理科学与工程专业”方案设计

本方案旨在按照当前小程序基于 `MAJOR_REGISTRY` 的多专业架构，将“管理科学与工程专业”无缝集成进系统中，使其具备与“大数据专业”同等的课程管理、国考进度追踪以及备考日历功能。

## 📝 课程数据提取与梳理（基于上传图片）

根据您上传的图片，共提取到 **16 门课程**，累计 **41 学分**：

| 编号 | 课程名称 | 学分 | 考试类型 | 推测模块 (Category) | 
| --- | --- | --- | --- | --- |
| 101700702 | CIO与IT治理 | 3 | 题库 | 专业课 (`major_core`) |
| 101700028 | IT项目管理 | 2 | 题库 | 专业课 (`major_core`) |
| 101700035 | 高级信息系统 | 3 | 题库 | 学科基础课 (`subject_base`) |
| 100100301 | 新时代中国特色社会主义理论与实践 | 2 | 题库 | 政治理论课 (`politics`) |
| 101700703 | 大数据推荐与决策 | 3 | 非题库 | 专业课 (`major_core`) |
| 102100049 | 社会网络分析 | 3 | 非题库 | 专业课 (`major_core`) |
| 101700006 | 博弈论与信息经济学 | 3 | 非题库 | 专业课 (`major_core`) |
| 113700016 | 自然辩证法概论 | 1 | 非题库 | 政治理论课 (`politics`) |
| 101700008 | 电子政务 | 2 | 非题库 | 选修课 (`elective`) |
| 101700010 | 高级管理学 | 3 | 非题库 | 学科基础课 (`subject_base`) |
| 101800902 | 企业战略管理 | 3 | 非题库 | 专业课 (`major_core`) |
| 101700704 | 知识与创新管理 | 3 | 非题库 | 专业课 (`major_core`) |
| 100900009 | 学术规范和论文写作 | 1 | 非题库 | 方法课 (`method`) |
| 101200001 | 语言基础 | 3 | 非题库 | 第一外语课 (`language`) |
| 101700004 | 现代统计方法 | 3 | 非题库 | 方法课 (`method`) |
| 101700005 | 管理研究方法论 | 3 | 非题库 | 方法课 (`method`) |

*(注：系统中的课程需要归属到特定的“模块”分类中，如“专业课”、“政治理论课”、“第一外语”等，也就是右侧最后一列。以上模块是参考大数据的体系推测填写的。由于这些分类仅用于前端展示归类，即便推测不完全准确，也不影响课程总学分和打卡进度。)*

---

## 📝 User Review Required

> [!IMPORTANT]
> 实施前，请确认本方案的技术细节以及梳理出的课程列表。如无问题，请点击 Proceed 或回复同意，我将开始自动为您执行代码修改（暂时不会实施，仅作方案展示）。

## 🛠 Proposed Changes

### 1. 前端数据与注册表更新

#### [MODIFY] `miniprogram/utils/mockData.js`
- **新增** `MANAGEMENT_SCIENCE_COURSES` 数组，将上述 16 门课程录入系统。
- **新增** `MANAGEMENT_NATIONAL_EXAMS`（根据最新确认结果设定）：
  - `foreign_lang`: 外国语水平考试 (英语)
  - `comprehensive`: 管理科学与工程学科综合水平
- **注册专业**：在 `MAJOR_REGISTRY` 中新增 `management_science` 对象，配置：
  - `majorName`: '管理科学与工程专业'
  - `school`: '中国人民大学·信息学院'
  - `totalCreditsTarget`: 41
  - 绑定对应的 `courses` 和 `nationalExams`

---

### 2. 云端环境初始化适配

#### [MODIFY] `cloudfunctions/initDatabase/index.js`
- **新增模板数据**：加入 `MANAGEMENT_SCIENCE_TEMPLATES` 数组，包含上述 16 门课。
- **批量写入**：修改数据初始化循环，将管科的课程模板一并写入 `major_templates` 云数据库集合，并带有 `major: 'management_science'` 标识。
- **年度备考事件**：将 `applicableMajors` 中的 `'management'` 修正为 `'management_science'`。

#### [MODIFY] `cloudfunctions/initUser/index.js`
- **用户属性适配**：修改 `majorName` 赋值逻辑：`major === 'management_science' ? '管理科学与工程专业' : ...`
- **动态学分设置**：初始化新用户时，`totalCreditsTarget` 从静态 `35` 改为根据专业动态获取（大数据则35，管理科学与工程则41）。
- **国考初始化**：根据 `major` 动态读取并初始化不同的国考科目数组（区分“计算机科学与技术学科综合水平”与“管理科学与工程学科综合水平”）。

---

### 3. UI 交互体验优化

#### [MODIFY] `miniprogram/pages/mine/mine.js`
- **解除锁定**：删除“目前仅支持大数据专业...”的提示阻断。系统已具备 `switchMajor` 动态读取 `MAJOR_REGISTRY` 的能力，配置完成后即可自动支持用户在“我的”页面通过 ActionSheet 切换到「管理科学与工程专业」。

## ✅ Verification Plan

### Manual Verification (实施后)
1. **重置数据库**：调用更新后的 `initDatabase` 云函数，确认 `major_templates` 已包含全部新课程。
2. **切换专业测试**：在开发者工具中，打开「我的」界面，点击切换专业，选择「管理科学与工程专业」。
3. **数据渲染测试**：验证首页及课程表能够正确渲染出管理科学与工程专业的 16 门课、41 学分目标，且题库考/非题库考标签准确无误。国考区域显示“管理科学与工程学科综合水平”。
