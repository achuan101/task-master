// miniprogram/pages/mine/mine.js
import { Storage } from '../../utils/storage.js';
import { MAJOR_REGISTRY } from '../../utils/mockData.js';

Page({
  data: {
    user: {},
    majorInfo: {}, // 当前专业的课程数、学分数等
    appInfo: {
      appId: 'wx86a80e399a954601',
      rawId: 'gh_8ec1aa7ed0c9',
      version: 'v1.0.0 (Beta)'
    }
  },

  onLoad() {
    this._waitForUserReady(() => this.loadUser());
  },

  onShow() {
    this._waitForUserReady(() => this.loadUser());
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
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

  loadUser() {
    const user = Storage.getUser();
    const major = Storage.getCurrentMajor();
    const courses = Storage.getCourses();
    this.setData({
      user,
      majorInfo: {
        courseCount: courses.length,
        totalCredits: major.totalCreditsTarget,
        school: major.school || user.school
      }
    });
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

  switchMajor() {
    const currentMajor = this.data.user.major;
    // 获取可选专业列表（排除当前专业）
    const availableKeys = Object.keys(MAJOR_REGISTRY).filter(k => k !== currentMajor);

    if (availableKeys.length === 0) {
      wx.showModal({
        title: '暂无其他专业',
        content: '目前仅支持大数据专业，其他专业即将上线！',
        showCancel: false,
        confirmText: '我知道了'
      });
      return;
    }

    const names = availableKeys.map(k => MAJOR_REGISTRY[k].majorName);
    wx.showActionSheet({
      itemList: names,
      success: (res) => {
        const selectedKey = availableKeys[res.tapIndex];
        const selectedMajor = MAJOR_REGISTRY[selectedKey];
        wx.showModal({
          title: '确认切换',
          content: `切换到「${selectedMajor.majorName}」后，当前考试进度将被清除，是否继续？`,
          confirmText: '确认切换',
          success: (modalRes) => {
            if (modalRes.confirm) {
              Storage.switchMajor(selectedKey);
              this.loadUser();
              wx.showToast({ title: '已切换专业', icon: 'success' });
            }
          }
        });
      }
    });
  }
});
