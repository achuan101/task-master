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
          env: wx.cloud.DYNAMIC_CURRENT_ENV,
          traceUser: true,
        });
        console.log('MasterPlan 云开发初始化成功');
      } catch (err) {
        console.warn('云开发初始化跳过（本地模式运行）:', err);
      }
    }

    // 2. 初始化用户（获取 openid + 云端数据同步）
    this.initUser();

    // 3. 检查并展示更新
    this.checkUpdate();
  },

  /**
   * 用户初始化：调用 initUser 云函数，获取 openid 并同步数据
   */
  async initUser() {
    try {
      const res = await wx.cloud.callFunction({ name: 'initUser' });
      if (res.result && res.result.success) {
        const openid = res.result.data._id;
        const isNew = res.result.isNew;
        this.globalData.openid = openid;
        this.globalData.cloudEnvReady = true;

        // 初始化 Storage：新用户用云端返回的初始数据，老用户从云端拉取
        await Storage.init(openid, isNew ? res.result.data : null);

        // 通知等待中的页面：初始化完成
        if (this.globalData.onUserReady) {
          this.globalData.onUserReady();
        }
        console.log('用户初始化完成, openid:', openid, '新用户:', isNew);
      } else {
        console.warn('initUser 返回异常:', res.result);
        this._fallbackLocalInit();
      }
    } catch (err) {
      console.warn('initUser 调用失败，使用本地模式:', err);
      this._fallbackLocalInit();
    }
  },

  /**
   * 降级方案：云函数不可用时，使用本地模式（无用户隔离）
   */
  _fallbackLocalInit() {
    const fallbackOpenid = 'local_default';
    this.globalData.openid = fallbackOpenid;
    this.globalData.cloudEnvReady = false;
    Storage.init(fallbackOpenid, null);
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
