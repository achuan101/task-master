// app.js
import { Storage } from './utils/storage.js';

App({
  onLaunch: function () {
    // 1. 初始化云开发环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      try {
        wx.cloud.init({
          env: wx.cloud.DYNAMIC_CURRENT_ENV, // 自动使用当前云环境，或填写具体云环境ID
          traceUser: true,
        });
        console.log('MasterPlan 云开发初始化成功');
      } catch (err) {
        console.warn('云开发初始化跳过（本地模式运行）:', err);
      }
    }

    // 2. 初始化本地离线数据保障
    Storage.initDefaultData();

    // 3. 检查并展示更新
    this.checkUpdate();
  },

  checkUpdate: function () {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager();
      updateManager.onCheckForUpdate(function (res) {
        if (res.hasUpdate) {
          updateManager.onUpdateReady(function () {
            wx.showModal({
              title: '更新提示',
              content: '新版本已经准备好，是否重启小程序？',
              success: function (res) {
                if (res.confirm) {
                  updateManager.applyUpdate();
                }
              }
            });
          });
        }
      });
    }
  },

  globalData: {
    appTitle: "MasterPlan",
    version: "1.0.0",
    userInfo: null,
    cloudEnvReady: false
  }
});
