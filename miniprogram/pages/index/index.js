// miniprogram/pages/index/index.js
import { Storage } from '../../utils/storage.js';
import { calculateLifeline, getUpcomingEvents, calculateThesisCountdown } from '../../utils/timeCalculator.js';

Page({
  data: {
    user: {},
    lifeline: {},
    stats: {
      passedCourses: 0,
      totalCourses: 14,
      earnedCredits: 0,
      totalCredits: 35,
      courseProgress: 0,
      passedExams: 0,
      totalExams: 2,
      paperStatusText: '未开始',
      paperPassed: false,
      thesisStageText: '未开始',
      thesisCountdown: null
    },
    upcomingEvents: [],
    loading: false
  },

  onLoad() {
    this.refreshDashboard();
  },

  onShow() {
    // 每次切换回首页时刷新，确保其他页面打卡后的数据立即反映在大盘上
    this.refreshDashboard();
  },

  onPullDownRefresh() {
    this.refreshDashboard();
    wx.stopPullDownRefresh();
  },

  refreshDashboard() {
    const user = Storage.getUser();
    const courses = Storage.getCourses();
    const exams = Storage.getNationalExams();
    const thesis = Storage.getThesisFlow();
    const events = Storage.getEvents();

    // 1. 生命线计算
    const lifeline = calculateLifeline(user.enrollDate, user.deadlineDate);

    // 2. 课程学分统计
    const passedCoursesList = courses.filter(c => c.status === 'passed');
    const passedCourses = passedCoursesList.length;
    const earnedCredits = passedCoursesList.reduce((sum, c) => sum + (c.credit || 0), 0);
    const courseProgress = Math.round((earnedCredits / (user.totalCreditsTarget || 35)) * 100);

    // 3. 国考统计
    const passedExams = exams.filter(e => e.status === 'passed').length;

    // 4. 小论文状态
    const paperStatusMap = {
      not_started: '未开始',
      writing: '撰写中',
      submitted: '投稿中',
      accepted: '已录用',
      published: '已见刊'
    };
    const paperStatusText = paperStatusMap[thesis.paperStatus] || '未开始';

    // 5. 大论文倒计时与当前阶段
    let thesisCountdown = null;
    if (user.thesisTriggeredAt) {
      thesisCountdown = calculateThesisCountdown(user.thesisTriggeredAt);
    }
    const stages = (thesis && Array.isArray(thesis.stages)) ? thesis.stages : [];
    const currentStage = stages[thesis.currentStageIndex] || stages[0];

    // 6. 近期重要日程
    const upcomingEvents = getUpcomingEvents(events);

    this.setData({
      user,
      lifeline,
      stats: {
        passedCourses,
        totalCourses: courses.length,
        earnedCredits,
        totalCredits: user.totalCreditsTarget || 35,
        courseProgress,
        passedExams,
        totalExams: exams.length,
        paperStatusText,
        paperPassed: thesis.paperPublished || thesis.paperStatus === 'published',
        thesisStageText: currentStage ? currentStage.name : '未开始',
        thesisCountdown
      },
      upcomingEvents
    });
  },

  navigateToExam() {
    wx.switchTab({ url: '/pages/exam/exam' });
  },

  navigateToThesis() {
    wx.switchTab({ url: '/pages/thesis/thesis' });
  },

  navigateToSettings() {
    wx.switchTab({ url: '/pages/mine/mine' });
  }
});
