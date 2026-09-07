// miniprogram/pages/thesis/thesis.js
const { Storage } = require('../../utils/storage.js');
const { calculateThesisCountdown, formatDate } = require('../../utils/timeCalculator.js');

Page({
  data: {
    user: {},
    thesisCountdown: null,
    thesisFlow: {},
    paperStatuses: [
      { key: 'not_started', name: '未开始' },
      { key: 'writing', name: '撰写中' },
      { key: 'submitted', name: '已投稿' },
      { key: 'accepted', name: '已录用' },
      { key: 'published', name: '已见刊 (点亮)' }
    ],
    showEditPaperModal: false,
    paperTitleInput: '',
    paperJournalInput: ''
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  onPullDownRefresh() {
    this.loadData();
    wx.stopPullDownRefresh();
  },

  loadData() {
    const user = Storage.getUser();
    const thesisFlow = Storage.getThesisFlow();
    let thesisCountdown = null;

    if (user.thesisTriggeredAt) {
      thesisCountdown = calculateThesisCountdown(user.thesisTriggeredAt);
    }

    this.setData({
      user,
      thesisFlow,
      thesisCountdown,
      paperTitleInput: thesisFlow.paperTitle || '',
      paperJournalInput: thesisFlow.paperJournal || ''
    });
  },

  // 变更小论文状态
  selectPaperStatus(e) {
    const status = e.currentTarget.dataset.status;
    const isPublished = status === 'published';

    const updated = Storage.updateThesisFlow({
      paperStatus: status,
      paperPublished: isPublished
    });

    this.setData({ thesisFlow: updated });
    wx.showToast({
      title: isPublished ? '✨ 小论文前置解锁！' : '状态已更新',
      icon: isPublished ? 'success' : 'none'
    });
  },

  // 打开编辑论文信息对话框
  openEditPaperModal() {
    this.setData({
      showEditPaperModal: true,
      paperTitleInput: this.data.thesisFlow.paperTitle || '',
      paperJournalInput: this.data.thesisFlow.paperJournal || ''
    });
  },

  closeEditPaperModal() {
    this.setData({ showEditPaperModal: false });
  },

  onTitleInput(e) {
    this.setData({ paperTitleInput: e.detail.value });
  },

  onJournalInput(e) {
    this.setData({ paperJournalInput: e.detail.value });
  },

  savePaperInfo() {
    const updated = Storage.updateThesisFlow({
      paperTitle: this.data.paperTitleInput,
      paperJournal: this.data.paperJournalInput
    });
    this.setData({
      thesisFlow: updated,
      showEditPaperModal: false
    });
    wx.showToast({ title: '保存成功', icon: 'success' });
  },

  // 推进大论文答辩阶段
  toggleStage(e) {
    const index = Number(e.currentTarget.dataset.index);
    const stages = (this.data.thesisFlow.stages || []).slice();
    const targetStage = stages[index];

    // 如果未见刊，且点击正式答辩阶段，给予醒目提示
    if (index === 3 && !this.data.thesisFlow.paperPublished) {
      wx.showModal({
        title: '⚠️ 前置卡点提醒',
        content: '依据信息学院学位管理规定，正式答辩前必须公开发表一篇3000字以上小论文。请先完成小论文见刊打卡！',
        confirmText: '我知道了',
        showCancel: false
      });
      return;
    }

    const isCurrentDone = targetStage.status === 'completed';
    targetStage.status = isCurrentDone ? 'pending' : 'completed';
    targetStage.date = isCurrentDone ? null : formatDate(new Date());

    const updated = Storage.updateThesisFlow({
      stages: stages,
      currentStageIndex: isCurrentDone ? Math.max(0, index - 1) : index
    });

    this.setData({ thesisFlow: updated });
    wx.showToast({
      title: isCurrentDone ? '已重置' : '节点达成！',
      icon: 'success'
    });
  }
});
