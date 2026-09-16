// app.js
import { Storage } from './utils/storage.js';

App({
  onLaunch: function () {
    // 1. 初始化用户（本地模式，无云开发依赖）
    this._initLocalUser();

    // 2. 检查并展示更新
    this.checkUpdate();
  },

  /**
   * 本地用户初始化：使用固定 openid，数据全部存于本地缓存
   */
  _initLocalUser() {
    const openid = 'local_default';
    this.globalData.openid = openid;
    this.globalData.cloudEnvReady = false;
    Storage.init(openid, null);
    if (this.globalData.onUserReady) {
      this.globalData.onUserReady();
    }
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
          updateManager.onUpdateFailed(function () {
            wx.showModal({
              title: '更新失败',
              content: '新版本下载失败，请检查网络后重试。',
              showCancel: false
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
    openid: null,
    cloudEnvReady: false,
    onUserReady: null
  }
});
