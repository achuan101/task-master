// miniprogram/custom-tab-bar/index.js
Component({
  data: {
    selected: 0,
    isDark: false,
    activeColor: '#0EA5E9',
    inactiveColor: '#64748B',
    tabList: [
      {
        pagePath: '/pages/index/index',
        text: '首页',
        icon: 'home',
        iconActive: 'home-filled'
      },
      {
        pagePath: '/pages/exam/exam',
        text: '考试',
        icon: 'education',
        iconActive: 'education-filled'
      },
      {
        pagePath: '/pages/thesis/thesis',
        text: '论文',
        icon: 'edit-1',
        iconActive: 'edit-1-filled'
      },
      {
        pagePath: '/pages/mine/mine',
        text: '我的',
        icon: 'user',
        iconActive: 'user-filled'
      }
    ]
  },

  lifetimes: {
    attached() {
      this.applyTheme();
    }
  },

  pageLifetimes: {
    show() {
      this.applyTheme();
    }
  },

  methods: {
    switchTab(e) {
      const path = e.currentTarget.dataset.path;
      wx.switchTab({
        url: path
      });
    },

    applyTheme() {
      const theme = wx.getSystemInfoSync().theme || 'light';
      const isDark = theme === 'dark';
      this.setData({
        isDark,
        activeColor: isDark ? '#38BDF8' : '#0EA5E9',
        inactiveColor: isDark ? '#94A3B8' : '#64748B'
      });
    }
  }
});
