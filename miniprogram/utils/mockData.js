// MasterPlan 大数据专业培养方案与基准数据

export const DEFAULT_USER = {
  nickName: "信息学院研究生",
  major: "big_data",
  majorName: "大数据专业",
  enrollDate: "2026-09-01",
  deadlineDate: "2030-09-01",
  thesisDeadline: null,
  thesisTriggeredAt: null,
  totalCreditsTarget: 35,
  majorRevision: 0,
  onboardingComplete: false
};

export const BIG_DATA_COURSES = [
  {
    id: "101700706",
    courseCode: "101700706",
    courseName: "软件工程与方法",
    category: "major_core",
    categoryName: "专业课",
    credit: 3,
    examType: "pool", // pool (题库考) / non_pool (非题库考)
    status: "pending", // pending / learning / passed
    passDate: null,
    score: null
  },
  {
    id: "101700713",
    courseCode: "101700713",
    courseName: "云计算与大数据",
    category: "subject_base",
    categoryName: "学科基础课",
    credit: 3,
    examType: "pool",
    status: "pending",
    passDate: null,
    score: null
  },
  {
    id: "101700013",
    courseCode: "101700013",
    courseName: "网络与通信",
    category: "major_core",
    categoryName: "专业课",
    credit: 4,
    examType: "non_pool",
    status: "pending",
    passDate: null,
    score: null
  },
  {
    id: "100100301",
    courseCode: "100100301",
    courseName: "新时代中国特色社会主义理论与实践",
    category: "politics",
    categoryName: "政治理论课",
    credit: 2,
    examType: "pool",
    status: "pending",
    passDate: null,
    score: null
  },
  {
    id: "101700711",
    courseCode: "101700711",
    courseName: "运筹学与优化理论",
    category: "method",
    categoryName: "方法课",
    credit: 3,
    examType: "non_pool",
    status: "pending",
    passDate: null,
    score: null
  },
  {
    id: "113700016",
    courseCode: "113700016",
    courseName: "自然辩证法概论",
    category: "politics",
    categoryName: "政治理论课",
    credit: 1,
    examType: "non_pool",
    status: "pending",
    passDate: null,
    score: null
  },
  {
    id: "101700714",
    courseCode: "101700714",
    courseName: "机器感知",
    category: "major_core",
    categoryName: "专业课",
    credit: 3,
    examType: "non_pool",
    status: "pending",
    passDate: null,
    score: null
  },
  {
    id: "101700707",
    courseCode: "101700707",
    courseName: "海量数据挖掘",
    category: "major_core",
    categoryName: "专业课",
    credit: 3,
    examType: "non_pool",
    status: "pending",
    passDate: null,
    score: null
  },
  {
    id: "101700017",
    courseCode: "101700017",
    courseName: "高级操作系统",
    category: "subject_base",
    categoryName: "学科基础课",
    credit: 3,
    examType: "pool",
    status: "pending",
    passDate: null,
    score: null
  },
  {
    id: "101200001",
    courseCode: "101200001",
    courseName: "语言基础",
    category: "language",
    categoryName: "第一外语课",
    credit: 3,
    examType: "non_pool",
    status: "pending",
    passDate: null,
    score: null
  },
  {
    id: "101700716",
    courseCode: "101700716",
    courseName: "高级并行计算",
    category: "elective",
    categoryName: "选修课",
    credit: 2,
    examType: "non_pool",
    status: "pending",
    passDate: null,
    score: null
  },
  {
    id: "101700021",
    courseCode: "101700021",
    courseName: "组合数学",
    category: "elective",
    categoryName: "选修课",
    credit: 2,
    examType: "non_pool",
    status: "pending",
    passDate: null,
    score: null
  },
  {
    id: "101700022",
    courseCode: "101700022",
    courseName: "离散数学",
    category: "elective",
    categoryName: "选修课",
    credit: 2,
    examType: "non_pool",
    status: "pending",
    passDate: null,
    score: null
  },
  {
    id: "100900009",
    courseCode: "100900009",
    courseName: "学术规范和论文写作",
    category: "method",
    categoryName: "方法课",
    credit: 1,
    examType: "non_pool",
    status: "pending",
    passDate: null,
    score: null
  }
];

export const MANAGEMENT_SCIENCE_COURSES = [
  { id: "101700702", courseCode: "101700702", courseName: "CIO与IT治理", category: "major_core", categoryName: "专业课", credit: 3, examType: "pool", status: "pending", passDate: null, score: null },
  { id: "101700028", courseCode: "101700028", courseName: "IT项目管理", category: "major_core", categoryName: "专业课", credit: 2, examType: "pool", status: "pending", passDate: null, score: null },
  { id: "101700035", courseCode: "101700035", courseName: "高级信息系统", category: "subject_base", categoryName: "学科基础课", credit: 3, examType: "pool", status: "pending", passDate: null, score: null },
  { id: "100100301", courseCode: "100100301", courseName: "新时代中国特色社会主义理论与实践", category: "politics", categoryName: "政治理论课", credit: 2, examType: "pool", status: "pending", passDate: null, score: null },
  { id: "101700703", courseCode: "101700703", courseName: "大数据推荐与决策", category: "major_core", categoryName: "专业课", credit: 3, examType: "non_pool", status: "pending", passDate: null, score: null },
  { id: "102100049", courseCode: "102100049", courseName: "社会网络分析", category: "major_core", categoryName: "专业课", credit: 3, examType: "non_pool", status: "pending", passDate: null, score: null },
  { id: "101700006", courseCode: "101700006", courseName: "博弈论与信息经济学", category: "major_core", categoryName: "专业课", credit: 3, examType: "non_pool", status: "pending", passDate: null, score: null },
  { id: "113700016", courseCode: "113700016", courseName: "自然辩证法概论", category: "politics", categoryName: "政治理论课", credit: 1, examType: "non_pool", status: "pending", passDate: null, score: null },
  { id: "101700008", courseCode: "101700008", courseName: "电子政务", category: "elective", categoryName: "选修课", credit: 2, examType: "non_pool", status: "pending", passDate: null, score: null },
  { id: "101700010", courseCode: "101700010", courseName: "高级管理学", category: "subject_base", categoryName: "学科基础课", credit: 3, examType: "non_pool", status: "pending", passDate: null, score: null },
  { id: "101800902", courseCode: "101800902", courseName: "企业战略管理", category: "major_core", categoryName: "专业课", credit: 3, examType: "non_pool", status: "pending", passDate: null, score: null },
  { id: "101700704", courseCode: "101700704", courseName: "知识与创新管理", category: "major_core", categoryName: "专业课", credit: 3, examType: "non_pool", status: "pending", passDate: null, score: null },
  { id: "100900009", courseCode: "100900009", courseName: "学术规范和论文写作", category: "method", categoryName: "方法课", credit: 1, examType: "non_pool", status: "pending", passDate: null, score: null },
  { id: "101200001", courseCode: "101200001", courseName: "语言基础", category: "language", categoryName: "第一外语课", credit: 3, examType: "non_pool", status: "pending", passDate: null, score: null },
  { id: "101700004", courseCode: "101700004", courseName: "现代统计方法", category: "method", categoryName: "方法课", credit: 3, examType: "non_pool", status: "pending", passDate: null, score: null },
  { id: "101700005", courseCode: "101700005", courseName: "管理研究方法论", category: "method", categoryName: "方法课", credit: 3, examType: "non_pool", status: "pending", passDate: null, score: null }
];

export const DEFAULT_NATIONAL_EXAMS = [
  {
    id: "national_comp",
    subject: "comprehensive",
    subjectName: "计算机科学与技术学科综合水平",
    status: "pending", // pending / passed
    passDate: null,
    score: null,
    maxAttempts: 4,
    remainingAttempts: 4,
    attempts: []
  },
  {
    id: "national_foreign",
    subject: "foreign_lang",
    subjectName: "外国语水平考试 (英语)",
    status: "pending",
    passDate: null,
    score: null,
    maxAttempts: 4,
    remainingAttempts: 4,
    attempts: []
  }
];

export const COMPUTER_SCIENCE_COURSES = [
  { id: "101700013", courseCode: "101700013", courseName: "网络与通信", category: "major_core", categoryName: "专业课", credit: 4, examType: "pool", status: "pending", passDate: null, score: null },
  { id: "101700710", courseCode: "101700710", courseName: "数据库管理系统原理与实现", category: "subject_base", categoryName: "学科基础课", credit: 4, examType: "pool", status: "pending", passDate: null, score: null },
  { id: "101700706", courseCode: "101700706", courseName: "软件工程与方法", category: "major_core", categoryName: "专业课", credit: 3, examType: "pool", status: "pending", passDate: null, score: null },
  { id: "100100301", courseCode: "100100301", courseName: "新时代中国特色社会主义理论与实践", category: "politics", categoryName: "政治理论课", credit: 2, examType: "pool", status: "pending", passDate: null, score: null },
  { id: "101700021", courseCode: "101700021", courseName: "组合数学", category: "elective", categoryName: "选修课", credit: 2, examType: "non_pool", status: "pending", passDate: null, score: null },
  { id: "113700016", courseCode: "113700016", courseName: "自然辩证法概论", category: "politics", categoryName: "政治理论课", credit: 1, examType: "non_pool", status: "pending", passDate: null, score: null },
  { id: "101200001", courseCode: "101200001", courseName: "语言基础", category: "language", categoryName: "第一外语课", credit: 3, examType: "non_pool", status: "pending", passDate: null, score: null },
  { id: "101700709", courseCode: "101700709", courseName: "文本挖掘方法", category: "elective", categoryName: "选修课", credit: 2, examType: "non_pool", status: "pending", passDate: null, score: null },
  { id: "101700022", courseCode: "101700022", courseName: "离散数学", category: "elective", categoryName: "选修课", credit: 2, examType: "non_pool", status: "pending", passDate: null, score: null },
  { id: "101700707", courseCode: "101700707", courseName: "海量数据挖掘", category: "major_core", categoryName: "专业课", credit: 3, examType: "non_pool", status: "pending", passDate: null, score: null },
  { id: "101700714", courseCode: "101700714", courseName: "机器感知", category: "major_core", categoryName: "专业课", credit: 3, examType: "non_pool", status: "pending", passDate: null, score: null },
  { id: "100900009", courseCode: "100900009", courseName: "学术规范和论文写作", category: "method", categoryName: "方法课", credit: 1, examType: "non_pool", status: "pending", passDate: null, score: null },
  { id: "101700711", courseCode: "101700711", courseName: "运筹学与优化理论", category: "method", categoryName: "方法课", credit: 3, examType: "non_pool", status: "pending", passDate: null, score: null },
  { id: "101700017", courseCode: "101700017", courseName: "高级操作系统", category: "subject_base", categoryName: "学科基础课", credit: 3, examType: "non_pool", status: "pending", passDate: null, score: null }
];

export const MANAGEMENT_NATIONAL_EXAMS = [
  {
    id: "national_comp",
    subject: "comprehensive",
    subjectName: "管理科学与工程学科综合水平",
    status: "pending",
    passDate: null,
    score: null,
    maxAttempts: 4,
    remainingAttempts: 4,
    attempts: []
  },
  {
    id: "national_foreign",
    subject: "foreign_lang",
    subjectName: "外国语水平考试 (英语)",
    status: "pending",
    passDate: null,
    score: null,
    maxAttempts: 4,
    remainingAttempts: 4,
    attempts: []
  }
];

export const COMPUTER_SCIENCE_NATIONAL_EXAMS = [
  {
    id: "national_comp",
    subject: "comprehensive",
    subjectName: "计算机科学与技术学科综合水平",
    status: "pending",
    passDate: null,
    score: null,
    maxAttempts: 4,
    remainingAttempts: 4,
    attempts: []
  },
  {
    id: "national_foreign",
    subject: "foreign_lang",
    subjectName: "外国语水平考试 (英语)",
    status: "pending",
    passDate: null,
    score: null,
    maxAttempts: 4,
    remainingAttempts: 4,
    attempts: []
  }
];

export const DEFAULT_THESIS_FLOW = {
  paperPublished: false,
  paperStatus: "not_started", // not_started / writing / submitted / accepted / published
  paperTitle: "",
  paperJournal: "",
  currentStageIndex: 0, // 0: 导师分配, 1: 开题答辩, 2: 预答辩, 3: 正式答辩, 4: 学位授予
  stages: [
    {
      key: "mentor_assign",
      name: "导师分配与选题",
      desc: "分配指导老师，确定3万字学位论文方向",
      status: "pending", // pending / in_progress / completed
      date: null
    },
    {
      key: "proposal_defense",
      name: "论文开题答辩",
      desc: "线下参加开题评审，答辩委员会论证通过",
      status: "pending",
      date: null
    },
    {
      key: "pre_defense",
      name: "论文预答辩",
      desc: "大论文初稿盲审与学院预答辩",
      status: "pending",
      date: null
    },
    {
      key: "final_defense",
      name: "学位论文正式答辩",
      desc: "每年5月或11月举行，需小论文已见刊",
      status: "pending",
      date: null
    },
    {
      key: "degree_award",
      name: "校学位评定委员会审议",
      desc: "通过后授予同等学力硕士学位证书",
      status: "pending",
      date: null
    }
  ]
};

// 专业注册表：每个专业一个独立配置块，新增专业只需在此添加一个 key
export const MAJOR_REGISTRY = {
  big_data: {
    majorName: '大数据专业',
    school: '中国人民大学·信息学院',
    icon: '💻',
    totalCreditsTarget: 35,
    courses: BIG_DATA_COURSES,
    nationalExams: DEFAULT_NATIONAL_EXAMS,
    examCategories: [
      { key: 'all', name: '全部科目' },
      { key: 'major_core', name: '专业课' },
      { key: 'subject_base', name: '学科基础课' },
      { key: 'politics', name: '政治理论课' },
      { key: 'method', name: '方法课' },
      { key: 'elective', name: '选修课' },
      { key: 'language', name: '第一外语' }
    ]
  },
  management_science: {
    majorName: '管理科学与工程专业',
    school: '中国人民大学·信息学院',
    icon: '📚',
    totalCreditsTarget: 41,
    courses: MANAGEMENT_SCIENCE_COURSES,
    nationalExams: MANAGEMENT_NATIONAL_EXAMS,
    examCategories: [
      { key: 'all', name: '全部科目' },
      { key: 'major_core', name: '专业课' },
      { key: 'subject_base', name: '学科基础课' },
      { key: 'politics', name: '政治理论课' },
      { key: 'method', name: '方法课' },
      { key: 'elective', name: '选修课' },
      { key: 'language', name: '第一外语' }
    ]
  },
  computer_science: {
    majorName: '计算机科学与技术专业',
    school: '中国人民大学·信息学院',
    icon: '💻',
    totalCreditsTarget: 36,
    courses: COMPUTER_SCIENCE_COURSES,
    nationalExams: COMPUTER_SCIENCE_NATIONAL_EXAMS,
    examCategories: [
      { key: 'all', name: '全部科目' },
      { key: 'major_core', name: '专业课' },
      { key: 'subject_base', name: '学科基础课' },
      { key: 'politics', name: '政治理论课' },
      { key: 'method', name: '方法课' },
      { key: 'elective', name: '选修课' },
      { key: 'language', name: '第一外语' }
    ]
  }
  // 未来新增专业示例：
  // law: {
  //   majorName: '法学专业',
  //   school: '中国人民大学·法学院',
  //   totalCreditsTarget: 30,
  //   courses: LAW_COURSES,
  //   nationalExams: LAW_NATIONAL_EXAMS,
  //   examCategories: [...]
  // }
};

export const ANNUAL_EVENTS = [
  {
    id: "ev_1",
    title: "国家同等学力统考报名",
    month: 3,
    day: 8,
    type: "national",
    tag: "国考报名",
    desc: "每年3月初在中国教育考试网进行外语及学科综合水平报名"
  },
  {
    id: "ev_2",
    title: "学校题库考试 (春季批次)",
    month: 4,
    day: 18,
    type: "pool",
    tag: "题库考",
    desc: "学校统一组织题库抽题闭卷考，重点攻克已学专业基础课"
  },
  {
    id: "ev_3",
    title: "全国同等学力统一考试",
    month: 5,
    day: 23,
    type: "national",
    tag: "5月国考",
    desc: "外国语水平考试 + 学科综合水平考试"
  },
  {
    id: "ev_4",
    title: "上半年硕士学位论文答辩",
    month: 5,
    day: 28,
    type: "thesis",
    tag: "春季答辩",
    desc: "当年春季正式答辩窗口，需提前完成盲审与小论文录用"
  },
  {
    id: "ev_5",
    title: "学校题库考试 (秋季批次)",
    month: 10,
    day: 24,
    type: "pool",
    tag: "题库考",
    desc: "秋季题库考试批次，查漏补缺通关题库科目"
  },
  {
    id: "ev_6",
    title: "下半年硕士学位论文答辩",
    month: 11,
    day: 25,
    type: "thesis",
    tag: "秋季答辩",
    desc: "当年秋季正式答辩窗口"
  }
];
