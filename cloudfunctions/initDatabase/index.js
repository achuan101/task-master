// 云函数：initDatabase (一键初始化专业模板与事件日历)
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 大数据专业 14 门标准课程模板
const BIG_DATA_TEMPLATES = [
  { courseCode: "101700706", courseName: "软件工程与方法", category: "major_core", categoryName: "专业课", credit: 3, examType: "pool" },
  { courseCode: "101700713", courseName: "云计算与大数据", category: "subject_base", categoryName: "学科基础课", credit: 3, examType: "pool" },
  { courseCode: "101700013", courseName: "网络与通信", category: "major_core", categoryName: "专业课", credit: 4, examType: "non_pool" },
  { courseCode: "100100301", courseName: "新时代中国特色社会主义理论与实践", category: "politics", categoryName: "政治理论课", credit: 2, examType: "pool" },
  { courseCode: "101700711", courseName: "运筹学与优化理论", category: "method", categoryName: "方法课", credit: 3, examType: "non_pool" },
  { courseCode: "113700016", courseName: "自然辩证法概论", category: "politics", categoryName: "政治理论课", credit: 1, examType: "non_pool" },
  { courseCode: "101700714", courseName: "机器感知", category: "major_core", categoryName: "专业课", credit: 3, examType: "non_pool" },
  { courseCode: "101700707", courseName: "海量数据挖掘", category: "major_core", categoryName: "专业课", credit: 3, examType: "non_pool" },
  { courseCode: "101700017", courseName: "高级操作系统", category: "subject_base", categoryName: "学科基础课", credit: 3, examType: "pool" },
  { courseCode: "101200001", courseName: "语言基础", category: "language", categoryName: "第一外语课", credit: 3, examType: "non_pool" },
  { courseCode: "101700716", courseName: "高级并行计算", category: "elective", categoryName: "选修课", credit: 2, examType: "non_pool" },
  { courseCode: "101700021", courseName: "组合数学", category: "elective", categoryName: "选修课", credit: 2, examType: "non_pool" },
  { courseCode: "101700022", courseName: "离散数学", category: "elective", categoryName: "选修课", credit: 2, examType: "non_pool" },
  { courseCode: "100900009", courseName: "学术规范和论文写作", category: "method", categoryName: "方法课", credit: 1, examType: "non_pool" }
];

const MANAGEMENT_SCIENCE_TEMPLATES = [
  { courseCode: "101700702", courseName: "CIO与IT治理", category: "major_core", categoryName: "专业课", credit: 3, examType: "pool" },
  { courseCode: "101700028", courseName: "IT项目管理", category: "major_core", categoryName: "专业课", credit: 2, examType: "pool" },
  { courseCode: "101700035", courseName: "高级信息系统", category: "subject_base", categoryName: "学科基础课", credit: 3, examType: "pool" },
  { courseCode: "100100301", courseName: "新时代中国特色社会主义理论与实践", category: "politics", categoryName: "政治理论课", credit: 2, examType: "pool" },
  { courseCode: "101700703", courseName: "大数据推荐与决策", category: "major_core", categoryName: "专业课", credit: 3, examType: "non_pool" },
  { courseCode: "102100049", courseName: "社会网络分析", category: "major_core", categoryName: "专业课", credit: 3, examType: "non_pool" },
  { courseCode: "101700006", courseName: "博弈论与信息经济学", category: "major_core", categoryName: "专业课", credit: 3, examType: "non_pool" },
  { courseCode: "113700016", courseName: "自然辩证法概论", category: "politics", categoryName: "政治理论课", credit: 1, examType: "non_pool" },
  { courseCode: "101700008", courseName: "电子政务", category: "elective", categoryName: "选修课", credit: 2, examType: "non_pool" },
  { courseCode: "101700010", courseName: "高级管理学", category: "subject_base", categoryName: "学科基础课", credit: 3, examType: "non_pool" },
  { courseCode: "101800902", courseName: "企业战略管理", category: "major_core", categoryName: "专业课", credit: 3, examType: "non_pool" },
  { courseCode: "101700704", courseName: "知识与创新管理", category: "major_core", categoryName: "专业课", credit: 3, examType: "non_pool" },
  { courseCode: "100900009", courseName: "学术规范和论文写作", category: "method", categoryName: "方法课", credit: 1, examType: "non_pool" },
  { courseCode: "101200001", courseName: "语言基础", category: "language", categoryName: "第一外语课", credit: 3, examType: "non_pool" },
  { courseCode: "101700004", courseName: "现代统计方法", category: "method", categoryName: "方法课", credit: 3, examType: "non_pool" },
  { courseCode: "101700005", courseName: "管理研究方法论", category: "method", categoryName: "方法课", credit: 3, examType: "non_pool" }
];

const COMPUTER_SCIENCE_TEMPLATES = [
  { courseCode: "101700013", courseName: "网络与通信", category: "major_core", categoryName: "专业课", credit: 4, examType: "pool" },
  { courseCode: "101700710", courseName: "数据库管理系统原理与实现", category: "subject_base", categoryName: "学科基础课", credit: 4, examType: "pool" },
  { courseCode: "101700706", courseName: "软件工程与方法", category: "major_core", categoryName: "专业课", credit: 3, examType: "pool" },
  { courseCode: "100100301", courseName: "新时代中国特色社会主义理论与实践", category: "politics", categoryName: "政治理论课", credit: 2, examType: "pool" },
  { courseCode: "101700021", courseName: "组合数学", category: "elective", categoryName: "选修课", credit: 2, examType: "non_pool" },
  { courseCode: "113700016", courseName: "自然辩证法概论", category: "politics", categoryName: "政治理论课", credit: 1, examType: "non_pool" },
  { courseCode: "101200001", courseName: "语言基础", category: "language", categoryName: "第一外语课", credit: 3, examType: "non_pool" },
  { courseCode: "101700709", courseName: "文本挖掘方法", category: "elective", categoryName: "选修课", credit: 2, examType: "non_pool" },
  { courseCode: "101700022", courseName: "离散数学", category: "elective", categoryName: "选修课", credit: 2, examType: "non_pool" },
  { courseCode: "101700707", courseName: "海量数据挖掘", category: "major_core", categoryName: "专业课", credit: 3, examType: "non_pool" },
  { courseCode: "101700714", courseName: "机器感知", category: "major_core", categoryName: "专业课", credit: 3, examType: "non_pool" },
  { courseCode: "100900009", courseName: "学术规范和论文写作", category: "method", categoryName: "方法课", credit: 1, examType: "non_pool" },
  { courseCode: "101700711", courseName: "运筹学与优化理论", category: "method", categoryName: "方法课", credit: 3, examType: "non_pool" },
  { courseCode: "101700017", courseName: "高级操作系统", category: "subject_base", categoryName: "学科基础课", credit: 3, examType: "non_pool" }
];

// 年度周期固定备考日历
const ANNUAL_EVENTS = [
  { eventType: "national_exam_signup", eventName: "国考报名", recurringMonth: 3, recurringDay: 8, reminderDaysBefore: 7, tag: "国考报名", description: "每年3月初全国统考报名" },
  { eventType: "school_pool_spring", eventName: "学校题库考试 (春季)", recurringMonth: 4, recurringDay: 18, reminderDaysBefore: 14, tag: "题库考", description: "春季题库抽考" },
  { eventType: "national_exam", eventName: "全国统一考试", recurringMonth: 5, recurringDay: 23, reminderDaysBefore: 7, tag: "5月国考", description: "外国语+学科综合水平考试" },
  { eventType: "thesis_defense_spring", eventName: "上半年硕士论文答辩", recurringMonth: 5, recurringDay: 28, reminderDaysBefore: 30, tag: "春季答辩", description: "上半年学位答辩窗口期" },
  { eventType: "school_pool_autumn", eventName: "学校题库考试 (秋季)", recurringMonth: 10, recurringDay: 24, reminderDaysBefore: 14, tag: "题库考", description: "秋季题库抽考" },
  { eventType: "thesis_defense_autumn", eventName: "下半年硕士论文答辩", recurringMonth: 11, recurringDay: 25, reminderDaysBefore: 30, tag: "秋季答辩", description: "下半年学位答辩窗口期" }
];

exports.main = async (event, context) => {
  try {
    // 1. 批量写入 major_templates
    for (const item of BIG_DATA_TEMPLATES) {
      const docId = `big_data_${item.courseCode}`;
      await db.collection('major_templates').doc(docId).set({
        data: {
          ...item,
          major: 'big_data',
          createdAt: db.serverDate()
        }
      });
    }

    for (const item of MANAGEMENT_SCIENCE_TEMPLATES) {
      const docId = `management_science_${item.courseCode}`;
      await db.collection('major_templates').doc(docId).set({
        data: {
          ...item,
          major: 'management_science',
          createdAt: db.serverDate()
        }
      });
    }

    for (const item of COMPUTER_SCIENCE_TEMPLATES) {
      const docId = `computer_science_${item.courseCode}`;
      await db.collection('major_templates').doc(docId).set({
        data: {
          ...item,
          major: 'computer_science',
          createdAt: db.serverDate()
        }
      });
    }

    // 2. 批量写入 events
    for (const ev of ANNUAL_EVENTS) {
      await db.collection('events').doc(ev.eventType).set({
        data: {
          ...ev,
          applicableMajors: ['big_data', 'computer_science', 'management_science'],
          createdAt: db.serverDate()
        }
      });
    }

    return { success: true, message: '基础数据与专业课程（大数据/管理科学）及年度备考事件已成功写入云数据库！' };
  } catch (err) {
    return { success: false, error: err.message };
  }
};
