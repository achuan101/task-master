// 云函数：checkThesisEligibility (全部考试通关判定与 1.5 年倒计时触发)
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

function addMonths(dateStr, monthsToAdd = 18) {
  const date = new Date(dateStr);
  const currentDay = date.getDate();
  date.setMonth(date.getMonth() + monthsToAdd);
  if (date.getDate() !== currentDay) {
    date.setDate(0);
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    // 1. 查询该用户的所有课程
    const coursesRes = await db.collection('courses').where({ _openid: openid }).get();
    const courses = coursesRes.data;

    // 2. 查询该用户的所有国考
    const examsRes = await db.collection('national_exams').where({ _openid: openid }).get();
    const exams = examsRes.data;

    if (courses.length === 0) {
      return { success: false, message: '未找到课程数据' };
    }

    const allCoursesPassed = courses.every(c => c.status === 'passed');
    const allExamsPassed = exams.every(e => e.status === 'passed');

    if (allCoursesPassed && allExamsPassed) {
      const allDates = [
        ...courses.map(c => c.passDate).filter(Boolean),
        ...exams.map(e => e.passDate).filter(Boolean)
      ];
      
      const maxPassDate = allDates.length > 0 ? allDates.sort().reverse()[0] : new Date().toISOString().split('T')[0];
      const thesisDeadline = addMonths(maxPassDate, 18);

      // 更新 users 集合
      await db.collection('users').doc(openid).update({
        data: {
          thesisTriggeredAt: maxPassDate,
          thesisDeadline: thesisDeadline,
          updatedAt: db.serverDate()
        }
      });

      return {
        success: true,
        triggered: true,
        maxPassDate,
        thesisDeadline,
        message: `恭喜通关！大论文 1.5 年倒计时已启动，截止日期为：${thesisDeadline}`
      };
    }

    return {
      success: true,
      triggered: false,
      message: '尚有未通过科目，暂未触发大论文倒计时'
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
};
