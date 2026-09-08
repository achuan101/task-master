// 云函数：switchMajor（原子切换专业）
// 在服务端一次性完成：更新用户专业 → 清空旧课程/国考 → 写入新专业模板
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const MAJOR_META = {
  big_data: {
    majorName: '大数据专业',
    school: '中国人民大学·信息学院',
    totalCreditsTarget: 35,
    totalCoursesTarget: 14,
    nationalExams: [
      { id: 'national_comp', subject: 'comprehensive', subjectName: '计算机科学与技术学科综合水平', status: 'pending', passDate: null, score: null, maxAttempts: 4, remainingAttempts: 4, attempts: [] },
      { id: 'national_foreign', subject: 'foreign_lang', subjectName: '外国语水平考试 (英语)', status: 'pending', passDate: null, score: null, maxAttempts: 4, remainingAttempts: 4, attempts: [] }
    ]
  },
  management_science: {
    majorName: '管理科学与工程专业',
    school: '中国人民大学·信息学院',
    totalCreditsTarget: 41,
    totalCoursesTarget: 16,
    nationalExams: [
      { id: 'national_comp', subject: 'comprehensive', subjectName: '管理科学与工程学科综合水平', status: 'pending', passDate: null, score: null, maxAttempts: 4, remainingAttempts: 4, attempts: [] },
      { id: 'national_foreign', subject: 'foreign_lang', subjectName: '外国语水平考试 (英语)', status: 'pending', passDate: null, score: null, maxAttempts: 4, remainingAttempts: 4, attempts: [] }
    ]
  }
};

const DEFAULT_THESIS_STAGES = [
  { key: 'mentor_assign', name: '导师分配与选题', desc: '分配指导老师，确定3万字学位论文方向', status: 'pending', date: null },
  { key: 'proposal_defense', name: '论文开题答辩', desc: '线下参加开题评审，答辩委员会论证通过', status: 'pending', date: null },
  { key: 'pre_defense', name: '论文预答辩', desc: '大论文初稿盲审与学院预答辩', status: 'pending', date: null },
  { key: 'final_defense', name: '学位论文正式答辩', desc: '每年5月或11月举行，需小论文已见刊', status: 'pending', date: null },
  { key: 'degree_award', name: '校学位评定委员会审议', desc: '通过后授予同等学力硕士学位证书', status: 'pending', date: null }
];

/** 按 _openid 清空集合中该用户全部文档 */
async function removeAllByOpenid(collection, openid) {
  const MAX = 100;
  while (true) {
    const res = await db.collection(collection).where({ _openid: openid }).limit(MAX).get();
    if (!res.data.length) break;
    await Promise.all(res.data.map((doc) => db.collection(collection).doc(doc._id).remove()));
    if (res.data.length < MAX) break;
  }
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const majorKey = event.major;

  if (!MAJOR_META[majorKey]) {
    return { success: false, error: '未知专业' };
  }

  const meta = MAJOR_META[majorKey];

  try {
    const userRes = await db.collection('users').doc(openid).get().catch(() => null);
    if (!userRes || !userRes.data) {
      return { success: false, error: '用户不存在' };
    }

    const prevUser = userRes.data;
    const nextRev = (prevUser.majorRevision || 0) + 1;

    // 1. 清空该用户全部课程、国考、论文流程（按 openid，与文档 _id 格式无关）
    await removeAllByOpenid('courses', openid);
    await removeAllByOpenid('national_exams', openid);
    await removeAllByOpenid('thesis_flow', openid);

    // 2. 从专业模板写入新课程（docId 带 openid，避免跨用户/跨专业课号冲突）
    const templates = await db.collection('major_templates').where({ major: majorKey }).limit(100).get();
    if (!templates.data.length) {
      return { success: false, error: '专业课程模板为空，请先运行 initDatabase' };
    }

    const courses = [];
    for (const item of templates.data) {
      const courseCode = item.courseCode;
      const courseDoc = {
        _openid: openid,
        id: courseCode,
        courseCode,
        courseName: item.courseName,
        category: item.category,
        categoryName: item.categoryName,
        credit: item.credit,
        examType: item.examType,
        major: majorKey,
        status: 'pending',
        passDate: null,
        score: null,
        createdAt: db.serverDate(),
        updatedAt: db.serverDate()
      };
      await db.collection('courses').doc(`${openid}_${courseCode}`).set({ data: courseDoc });
      courses.push({
        id: courseCode,
        courseCode,
        courseName: item.courseName,
        category: item.category,
        categoryName: item.categoryName,
        credit: item.credit,
        examType: item.examType,
        major: majorKey,
        status: 'pending',
        passDate: null,
        score: null
      });
    }

    // 3. 写入新国考
    const nationalExams = [];
    for (const exam of meta.nationalExams) {
      const examDoc = {
        _openid: openid,
        major: majorKey,
        ...exam,
        createdAt: db.serverDate(),
        updatedAt: db.serverDate()
      };
      await db.collection('national_exams').doc(`${openid}_${exam.id}`).set({ data: examDoc });
      nationalExams.push({ ...exam, major: majorKey });
    }

    // 4. 重置论文流程
    const thesisFlow = {
      _openid: openid,
      paperPublished: false,
      paperStatus: 'not_started',
      paperTitle: '',
      paperJournal: '',
      currentStageIndex: 0,
      stages: DEFAULT_THESIS_STAGES,
      createdAt: db.serverDate(),
      updatedAt: db.serverDate()
    };
    await db.collection('thesis_flow').doc(`thesis_${openid}`).set({ data: thesisFlow });

    // 5. 更新用户专业（含版本号，供客户端整包对齐）
    const userPatch = {
      major: majorKey,
      majorName: meta.majorName,
      school: meta.school,
      totalCreditsTarget: meta.totalCreditsTarget,
      totalCoursesTarget: meta.totalCoursesTarget || courses.length,
      majorRevision: nextRev,
      thesisDeadline: null,
      thesisTriggeredAt: null,
      updatedAt: db.serverDate()
    };
    await db.collection('users').doc(openid).update({ data: userPatch });

    const user = {
      ...prevUser,
      ...userPatch
    };
    delete user.updatedAt;
    delete user.createdAt;

    return {
      success: true,
      data: {
        user,
        courses,
        nationalExams,
        thesisFlow: {
          paperPublished: false,
          paperStatus: 'not_started',
          paperTitle: '',
          paperJournal: '',
          currentStageIndex: 0,
          stages: DEFAULT_THESIS_STAGES
        },
        majorRevision: nextRev
      }
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
};
