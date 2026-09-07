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

// 年度周期固定备考日历
const ANNUAL_EVENTS = [
  { eventType: "national_exam_signup", eventName: "国考报名", recurringMonth: 3, recurringDay: 8, reminderDaysBefore: 7, tag: "国考报名", description: "每年3月初全国统考报名" },
  { eventType: "school_pool_spring", eventName: "学校题库考试 (春季)", recurringMonth: 4, recurringDay: 18, reminderDaysBefore: 14, tag: "题库考", description: "春季题库抽考" },
  { eventType: "national_exam", eventName: "全国统一考试", recurringMonth: 5, recurringDay: 23, reminderDaysBefore: 7, tag: "5月国考", description: "外国语+计算机学科综合考试" },
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

    // 2. 批量写入 events
    for (const ev of ANNUAL_EVENTS) {
      await db.collection('events').doc(ev.eventType).set({
        data: {
          ...ev,
          applicableMajors: ['big_data', 'computer_science', 'management'],
          createdAt: db.serverDate()
        }
      });
    }

    return { success: true, message: '大数据专业14门课程与年度备考事件已成功写入云数据库！' };
  } catch (err) {
    return { success: false, error: err.message };
  }
};
