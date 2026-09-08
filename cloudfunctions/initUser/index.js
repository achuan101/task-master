// 云函数：initUser (用户首次登录初始化)
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const major = event.major || 'big_data';

  try {
    // 1. 检查用户是否存在
    const userRes = await db.collection('users').doc(openid).get().catch(() => null);
    if (userRes && userRes.data) {
      return { success: true, isNew: false, data: userRes.data };
    }

    // 2. 创建新用户
    const defaultUser = {
      _id: openid,
      nickName: event.nickName || '信息学院同等学力同学',
      major: major,
      majorName: major === 'big_data' ? '大数据专业' : major,
      enrollDate: event.enrollDate || '2026-09-01',
      deadlineDate: event.deadlineDate || '2030-09-01',
      thesisDeadline: null,
      thesisTriggeredAt: null,
      totalCreditsTarget: 35,
      createdAt: db.serverDate()
    };
    await db.collection('users').doc(openid).set({ data: defaultUser });

    // 3. 从 major_templates 克隆个人课程表
    // 显式声明 limit 避免默认的 20 条限制
    const templates = await db.collection('major_templates').where({ major: major }).limit(100).get();
    for (const item of templates.data) {
      await db.collection('courses').doc(item._id).set({
        data: {
          _openid: openid,
          id: item._id,
          courseCode: item.courseCode,
          courseName: item.courseName,
          category: item.category,
          categoryName: item.categoryName,
          credit: item.credit,
          examType: item.examType,
          status: 'pending',
          passDate: null,
          score: null,
          createdAt: db.serverDate()
        }
      });
    }

    // 4. 初始化国家统考（2门，各4次机会）
    const nationalExams = [
      { id: 'national_comp', subject: 'comprehensive', subjectName: '计算机科学与技术学科综合水平', status: 'pending', remainingAttempts: 4, attempts: [] },
      { id: 'national_foreign', subject: 'foreign_lang', subjectName: '外国语水平考试 (英语)', status: 'pending', remainingAttempts: 4, attempts: [] }
    ];
    for (const exam of nationalExams) {
      await db.collection('national_exams').doc(exam.id).set({
        data: {
          _openid: openid,
          major: major,
          ...exam,
          createdAt: db.serverDate()
        }
      });
    }

    // 5. 初始化论文流程
    await db.collection('thesis_flow').add({
      data: {
        _openid: openid,
        currentStageIndex: 0,
        paperPublished: false,
        paperStatus: 'not_started',
        createdAt: db.serverDate()
      }
    });

    return { success: true, isNew: true, data: defaultUser };
  } catch (err) {
    return { success: false, error: err.message };
  }
};
