// app.js
const { Storage } = require('./utils/storage.js');

App({
  onLaunch: function () {
    // 1. 云开发可选：本地/模拟器无云环境时跳过，不阻断 Storage mock
    try {
      if (wx.cloud) {
        // 未配置具体 env 时不要强行 DYNAMIC_CURRENT_ENV，避免部分 DevTools 异常
        // 需要云能力时在此处填入云环境 ID，例如 env: 'masterplan-xxxxx'
        console.log('MasterPlan 以本地 Storage/mock 模式启动（云开发未启用）');
      } else {
        console.log('当前基础库无云能力，使用本地 Storage/mock');
      }
    } catch (err) {
      console.warn('云开发初始化跳过（本地模式运行）:', err);
    }

    // 2. 初始化本地离线数据保障（失败也不阻断页面壳渲染）
    try {
      Storage.initDefaultData();
    } catch (err) {
      console.error('本地 mock 初始化失败:', err);
    }

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
