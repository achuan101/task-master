// miniprogram/pages/mine/mine.js
import { Storage } from '../../utils/storage.js';

Page({
  data: {
    user: {},
    appInfo: {
      appId: 'wx86a80e399a954601',
      rawId: 'gh_8ec1aa7ed0c9',
      version: 'v1.0.0 (Beta)'
    }
  },

  onLoad() {
    this.loadUser();
  },

  onShow() {
    this.loadUser();
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
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

  switchMajor() {
    wx.showModal({
      title: '专业切换',
      content: '计算机专业与管理专业的培养方案正由学院教务同步中，即将开放，敬请期待！',
      showCancel: false,
      confirmText: '我知道了'
    });
  }
});
