// miniprogram/pages/index/index.js
const { Storage } = require('../../utils/storage.js');
const { calculateLifeline, getUpcomingEvents, calculateThesisCountdown } = require('../../utils/timeCalculator.js');

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
    loading: false,
    pageError: ''
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
    try {
      const user = Storage.getUser() || {};
      const courses = Storage.getCourses() || [];
      const exams = Storage.getNationalExams() || [];
      const thesis = Storage.getThesisFlow() || {};
      const events = Storage.getEvents() || [];

      const lifeline = calculateLifeline(user.enrollDate, user.deadlineDate);

      const passedCoursesList = courses.filter(c => c.status === 'passed');
      const passedCourses = passedCoursesList.length;
      const earnedCredits = passedCoursesList.reduce((sum, c) => sum + (c.credit || 0), 0);
      const targetCredits = user.totalCreditsTarget || 35;
      const courseProgress = targetCredits
        ? Math.round((earnedCredits / targetCredits) * 100)
        : 0;

      const passedExams = exams.filter(e => e.status === 'passed').length;

      const paperStatusMap = {
        not_started: '未开始',
        writing: '撰写中',
        submitted: '投稿中',
        accepted: '已录用',
        published: '已见刊'
      };
      const paperStatusText = paperStatusMap[thesis.paperStatus] || '未开始';

      let thesisCountdown = null;
      if (user.thesisTriggeredAt) {
        thesisCountdown = calculateThesisCountdown(user.thesisTriggeredAt);
      }
      const stages = (thesis && Array.isArray(thesis.stages)) ? thesis.stages : [];
      const currentStage = stages[thesis.currentStageIndex] || stages[0];

      const upcomingEvents = getUpcomingEvents(events);

      this.setData({
        pageError: '',
        user,
        lifeline,
        stats: {
          passedCourses,
          totalCourses: courses.length,
          earnedCredits,
          totalCredits: targetCredits,
          courseProgress,
          passedExams,
          totalExams: exams.length,
          paperStatusText,
          paperPassed: !!(thesis.paperPublished || thesis.paperStatus === 'published'),
          thesisStageText: currentStage ? currentStage.name : '未开始',
          thesisCountdown
        },
        upcomingEvents
      });
    } catch (err) {
      console.error('refreshDashboard failed', err);
      this.setData({
        pageError: '大盘数据加载失败，已尝试使用本地 mock。请下拉刷新或在设置页重置数据。'
      });
    }
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
