// miniprogram/pages/exam/exam.js
import { Storage } from '../../utils/storage.js';
import { formatDate } from '../../utils/timeCalculator.js';

Page({
  data: {
    activeTab: 'pool', // pool(题库考) / non_pool(非题库) / national(国考)
    nationalExams: [],
    poolCourses: [],
    nonPoolCourses: [],
    categories: [
      { key: 'all', name: '全部科目' }
    ],
    selectedCategory: 'all',
    stats: {
      poolPassed: 0,
      poolTotal: 4,
      nonPoolPassed: 0,
      nonPoolTotal: 10,
      nationalPassed: 0,
      nationalTotal: 2
    }
  },

  onLoad() {
    this._waitForUserReady(() => this.loadData());
  },

  onShow() {
    this._waitForUserReady(() => this.loadData());
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
  },

  /**
   * 等待用户初始化完成后再执行回调
   */
  _waitForUserReady(callback) {
    const app = getApp();
    if (app.globalData.openid) {
      callback();
    } else {
      app.globalData.onUserReady = () => {
        callback();
      };
    }
  },

  onPullDownRefresh() {
    this.loadData();
    wx.stopPullDownRefresh();
  },

  loadData() {
    const major = Storage.getCurrentMajor();
    const exams = Storage.getNationalExams();
    const courses = Storage.getCourses();

    const poolCourses = courses.filter(c => c.examType === 'pool');
    const nonPoolCourses = courses.filter(c => c.examType === 'non_pool');

    const poolPassed = poolCourses.filter(c => c.status === 'passed').length;
    const nonPoolPassed = nonPoolCourses.filter(c => c.status === 'passed').length;
    const nationalPassed = exams.filter(e => e.status === 'passed').length;

    const patch = {
      nationalExams: exams,
      poolCourses,
      nonPoolCourses,
      stats: {
        poolPassed,
        poolTotal: poolCourses.length,
        nonPoolPassed,
        nonPoolTotal: nonPoolCourses.length,
        nationalPassed,
        nationalTotal: exams.length
      }
    };
    if (major.examCategories && major.examCategories.length > 0) {
      patch.categories = major.examCategories;
    }
    this.setData(patch);
  },

  switchTab(e) {
    const tab = e.detail.value || (e.currentTarget && e.currentTarget.dataset.tab);
    this.setData({ activeTab: tab });
  },

  filterCategory(e) {
    const cat = e.currentTarget.dataset.cat;
    this.setData({ selectedCategory: cat });
  },

  // 切换普通课程通过状态
  toggleCourseStatus(e) {
    const id = e.currentTarget.dataset.id;
    const currentStatus = e.currentTarget.dataset.status;
    const isPassing = currentStatus !== 'passed';
    const newStatus = isPassing ? 'passed' : 'pending';
    const passDate = isPassing ? formatDate(new Date()) : null;

    Storage.updateCourse(id, {
      status: newStatus,
      passDate: passDate
    });

    this.loadData();
    this.notifyStatusChange(isPassing);
  },

  // 切换国考通过状态
  toggleNationalStatus(e) {
    const id = e.currentTarget.dataset.id;
    const currentStatus = e.currentTarget.dataset.status;
    const isPassing = currentStatus !== 'passed';
    const newStatus = isPassing ? 'passed' : 'pending';
    const passDate = isPassing ? formatDate(new Date()) : null;

    const exam = this.data.nationalExams.find(item => item.id === id);
    let attempts = exam.attempts || [];
    let remaining = exam.remainingAttempts;

    if (isPassing) {
      const currentYear = new Date().getFullYear();
      attempts.push({ year: currentYear, score: 70, passed: true });
      remaining = Math.max(0, remaining - 1);
    } else {
      if (attempts.length > 0) {
        attempts.pop();
        remaining = Math.min(4, remaining + 1);
      }
    }

    Storage.updateNationalExam(id, {
      status: newStatus,
      passDate: passDate,
      attempts: attempts,
      remainingAttempts: remaining
    });

    this.loadData();
    this.notifyStatusChange(isPassing);
  },

  notifyStatusChange(isPassing) {
    if (isPassing) {
      const result = Storage.checkAutoThesisCountdown();
      if (result.triggered) {
        wx.showModal({
          title: '🎉 祝贺通关所有考试！',
          content: `恭喜您！所有课程与国考已全部通过！\n\n以最后一门通过日期(${result.maxPassDate})为起点，大论文 1.5 年倒计时已正式启动！截止日期为：${result.thesisDeadline}。`,
          showCancel: false,
          confirmText: '前往论文页',
          success: (res) => {
            if (res.confirm) {
              wx.switchTab({ url: '/pages/thesis/thesis' });
            }
          }
        });
      } else {
        wx.showToast({
          title: '打卡成功！',
          icon: 'success'
        });
      }
    } else {
      wx.showToast({
        title: '已重置为备考中',
        icon: 'none'
      });
    }
  }
});
