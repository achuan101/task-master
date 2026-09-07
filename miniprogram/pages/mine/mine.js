// miniprogram/pages/mine/mine.js
const { Storage } = require('../../utils/storage.js');

Page({
  data: {
    user: {},
    appInfo: {
      appId: 'wx86a80e399a954601',
      rawId: 'gh_8ec1aa7ed0c9',
      version: 'v1.0.0 (Beta)'
    },
    majors: [
      { id: 'big_data', name: '大数据专业', desc: '14门课程 · 35学分 · 已上线', active: true },
      { id: 'computer_science', name: '计算机专业', desc: '培养方案配置中 · 即将开放', active: false },
      { id: 'management', name: '管理专业', desc: '培养方案配置中 · 即将开放', active: false }
    ]
  },

  onLoad() {
    this.loadUser();
  },

  onShow() {
    this.loadUser();
  },

  loadUser() {
    const user = Storage.getUser();
    this.setData({ user });
  },

  onEnrollDateChange(e) {
    const enrollDate = e.detail.value;
    const user = Storage.updateUser({ enrollDate });
    this.setData({ user });
    wx.showToast({ title: '入学时间已更新', icon: 'success' });
  },

  onDeadlineDateChange(e) {
    const deadlineDate = e.detail.value;
    const user = Storage.updateUser({ deadlineDate });
    this.setData({ user });
    wx.showToast({ title: '截止时间已更新', icon: 'success' });
  },

  onSelectMajor(e) {
    const major = e.currentTarget.dataset.major;
    if (major.id !== 'big_data') {
      wx.showModal({
        title: '专业开放提示',
        content: `【${major.name}】的课程培养方案与考试字典正由学院教务同步中，当前可优先使用【大数据专业】体验全套打卡闭环！`,
        showCancel: false,
        confirmText: '期待上线'
      });
    }
  },

  resetData() {
    wx.showModal({
      title: '重置进度数据？',
      content: '该操作将把所有考试、课程打卡及论文推进状态重置为初始状态。确定继续吗？',
      confirmColor: '#FB7185',
      success: (res) => {
        if (res.confirm) {
          Storage.resetAll();
          this.loadUser();
          wx.showToast({ title: '已恢复初始状态', icon: 'success' });
        }
      }
    });
  },

  copyAppId() {
    wx.setClipboardData({
      data: this.data.appInfo.appId,
      success: () => {
        wx.showToast({ title: 'AppID已复制', icon: 'none' });
      }
    });
  },

  copyReport() {
    const user = Storage.getUser();
    const courses = Storage.getCourses();
    const exams = Storage.getNationalExams();
    const thesis = Storage.getThesisFlow();

    const passedCourses = courses.filter(c => c.status === 'passed').length;
    const passedExams = exams.filter(e => e.status === 'passed').length;

    const report = `【MasterPlan 申硕进度汇报】
学院专业：信息学院 · ${user.majorName}
培养周期：${user.enrollDate} 至 ${user.deadlineDate}
课程考试：已通关 ${passedCourses}/14 门
国家统考：已通过 ${passedExams}/2 门
学术小论文：${thesis.paperPublished ? '已见刊发表' : '准备中'}
大论文答辩：${user.thesisTriggeredAt ? `已启动倒计时(截止${user.thesisDeadline})` : '待全部考试通过后激活'}
—— 记录生成自 MasterPlan 申硕进度跟踪小程序`;

    wx.setClipboardData({
      data: report,
      success: () => {
        wx.showToast({ title: '进度报告已复制！', icon: 'success' });
      }
    });
  }
});
