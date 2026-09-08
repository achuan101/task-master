// 本地存储与云端同步适配层
// 本地存储按 openid 隔离，写入时异步同步到云端数据库

import {
  DEFAULT_USER,
  MAJOR_REGISTRY,
  DEFAULT_THESIS_FLOW,
  ANNUAL_EVENTS
} from './mockData.js';
import { addMonths, formatDate } from './timeCalculator.js';

// 存储 key 模板（按 openid 隔离）
const keyOf = (openid, name) => `masterplan_${name}_${openid}`;

let _openid = null;

// 云端同步重试（最多 3 次）
async function _syncToCloud(collection, operation, data, docId, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await wx.cloud.callFunction({
        name: 'syncUserData',
        data: { collection, operation, data, docId }
      });
      if (res.result && res.result.success) return res.result;
      console.warn(`[syncToCloud] ${collection}.${operation} 返回失败:`, res.result);
      return res.result;
    } catch (err) {
      console.warn(`[syncToCloud] ${collection}.${operation} 第${i + 1}次重试失败:`, err);
      if (i === retries - 1) {
        console.error(`[syncToCloud] ${collection}.${operation} 同步失败，数据仅保存在本地`);
        return null;
      }
    }
  }
}

export const Storage = {
  // ========== 初始化 ==========

  /**
   * 用户初始化：设置 openid，从云端拉取数据到本地缓存
   * @param {string} openid - 微信用户 openid
   * @param {object} initUserData - initUser 云函数返回的用户数据（新用户时使用）
   */
  async init(openid, initUserData = null) {
    _openid = openid;

    // 如果是新用户（initUser 返回了初始数据），直接写入本地缓存
    if (initUserData) {
      const major = MAJOR_REGISTRY[initUserData.major] || MAJOR_REGISTRY['big_data'];
      wx.setStorageSync(keyOf(openid, 'user'), initUserData);
      wx.setStorageSync(keyOf(openid, 'courses'), JSON.parse(JSON.stringify(major.courses)));
      wx.setStorageSync(keyOf(openid, 'national_exams'), JSON.parse(JSON.stringify(major.nationalExams)));
      wx.setStorageSync(keyOf(openid, 'thesis_flow'), JSON.parse(JSON.stringify(DEFAULT_THESIS_FLOW)));
      wx.setStorageSync(keyOf(openid, 'events'), ANNUAL_EVENTS);
      wx.setStorageSync(keyOf(openid, 'initialized'), true);
      return;
    }

    // 老用户：从云端拉取最新数据
    await this.syncFromCloud();
  },

  /**
   * 获取当前 openid
   */
  getOpenid() {
    return _openid;
  },

  /**
   * 从云端全量拉取用户数据到本地缓存
   */
  async syncFromCloud() {
    if (!_openid) return;

    try {
      // 并行拉取所有集合
      const [userRes, coursesRes, examsRes, thesisRes] = await Promise.all([
        wx.cloud.callFunction({ name: 'syncUserData', data: { collection: 'users', operation: 'read' } }),
        wx.cloud.callFunction({ name: 'syncUserData', data: { collection: 'courses', operation: 'read' } }),
        wx.cloud.callFunction({ name: 'syncUserData', data: { collection: 'national_exams', operation: 'read' } }),
        wx.cloud.callFunction({ name: 'syncUserData', data: { collection: 'thesis_flow', operation: 'read' } })
      ]);

      const userData = userRes.result && userRes.result.data;
      const coursesData = coursesRes.result && coursesRes.result.data;
      const examsData = examsRes.result && examsRes.result.data;
      const thesisData = thesisRes.result && thesisRes.result.data;

      const userMajor = (userData && userData.major) || DEFAULT_USER.major;
      const major = MAJOR_REGISTRY[userMajor] || MAJOR_REGISTRY['big_data'];

      // 用户信息：云端有则用云端，否则用默认
      if (userData) {
        wx.setStorageSync(keyOf(_openid, 'user'), userData);
      } else {
        wx.setStorageSync(keyOf(_openid, 'user'), { ...DEFAULT_USER });
      }

      // 课程数据：云端有则用云端，否则用默认模板
      if (coursesData && coursesData.length > 0) {
        // 确保每条课程都有 id 字段（云端可能只有 _id）
        const normalizedCourses = coursesData.map(c => ({
          ...c,
          id: c.id || c._id
        }));
        wx.setStorageSync(keyOf(_openid, 'courses'), normalizedCourses);
      } else {
        wx.setStorageSync(keyOf(_openid, 'courses'), JSON.parse(JSON.stringify(major.courses)));
      }

      // 国考数据：云端有则用云端，否则用默认模板
      if (examsData && examsData.length > 0) {
        // 确保每条国考都有 id 字段
        const normalizedExams = examsData.map(e => ({
          ...e,
          id: e.id || e._id
        }));
        wx.setStorageSync(keyOf(_openid, 'national_exams'), normalizedExams);
      } else {
        wx.setStorageSync(keyOf(_openid, 'national_exams'), JSON.parse(JSON.stringify(major.nationalExams)));
      }

      // 论文流程：云端有则用云端，否则用默认
      if (thesisData && ((Array.isArray(thesisData) && thesisData.length > 0) || (!Array.isArray(thesisData) && Object.keys(thesisData).length > 0))) {
        const flow = Array.isArray(thesisData) ? thesisData[0] : thesisData;
        wx.setStorageSync(keyOf(_openid, 'thesis_flow'), flow);
      } else {
        wx.setStorageSync(keyOf(_openid, 'thesis_flow'), JSON.parse(JSON.stringify(DEFAULT_THESIS_FLOW)));
      }

      wx.setStorageSync(keyOf(_openid, 'events'), ANNUAL_EVENTS);
      wx.setStorageSync(keyOf(_openid, 'initialized'), true);
    } catch (err) {
      console.warn('[syncFromCloud] 云端同步失败，使用本地默认数据:', err);
      // 云函数不可用或网络异常，用默认模板兜底
      this._initLocalDefaults();
    }
  },

  /**
   * 本地无数据时用默认模板初始化（离线兜底）
   */
  _initLocalDefaults() {
    if (!_openid) return;
    const user = { ...DEFAULT_USER };
    const major = MAJOR_REGISTRY[user.major] || MAJOR_REGISTRY['big_data'];
    wx.setStorageSync(keyOf(_openid, 'user'), user);
    wx.setStorageSync(keyOf(_openid, 'courses'), JSON.parse(JSON.stringify(major.courses)));
    wx.setStorageSync(keyOf(_openid, 'national_exams'), JSON.parse(JSON.stringify(major.nationalExams)));
    wx.setStorageSync(keyOf(_openid, 'thesis_flow'), JSON.parse(JSON.stringify(DEFAULT_THESIS_FLOW)));
    wx.setStorageSync(keyOf(_openid, 'events'), ANNUAL_EVENTS);
    wx.setStorageSync(keyOf(_openid, 'initialized'), true);
  },

  // ========== 读操作（同步，从本地缓存读取） ==========

  getUser() {
    if (!_openid) return { ...DEFAULT_USER };
    return wx.getStorageSync(keyOf(_openid, 'user')) || { ...DEFAULT_USER };
  },

  getCurrentMajor() {
    const user = this.getUser();
    return MAJOR_REGISTRY[user.major] || MAJOR_REGISTRY['big_data'];
  },

  getCourses() {
    if (!_openid) {
      const major = this.getCurrentMajor();
      return JSON.parse(JSON.stringify(major.courses));
    }
    return wx.getStorageSync(keyOf(_openid, 'courses')) || [];
  },

  getNationalExams() {
    if (!_openid) {
      const major = this.getCurrentMajor();
      return JSON.parse(JSON.stringify(major.nationalExams));
    }
    return wx.getStorageSync(keyOf(_openid, 'national_exams')) || [];
  },

  getThesisFlow() {
    if (!_openid) return { ...DEFAULT_THESIS_FLOW };
    return wx.getStorageSync(keyOf(_openid, 'thesis_flow')) || { ...DEFAULT_THESIS_FLOW };
  },

  getEvents() {
    if (!_openid) return [...ANNUAL_EVENTS];
    return wx.getStorageSync(keyOf(_openid, 'events')) || [...ANNUAL_EVENTS];
  },

  // ========== 写操作（先更新本地，再异步同步云端） ==========

  updateUser(userData) {
    if (!_openid) return { ...DEFAULT_USER };
    const current = this.getUser();
    const updated = { ...current, ...userData };
    wx.setStorageSync(keyOf(_openid, 'user'), updated);
    // 异步同步到云端
    _syncToCloud('users', 'update', userData, _openid);
    return updated;
  },

  updateCourse(courseId, patch) {
    if (!_openid) return null;
    const courses = this.getCourses();
    const index = courses.findIndex(c => c.id === courseId);
    if (index !== -1) {
      courses[index] = { ...courses[index], ...patch };
      wx.setStorageSync(keyOf(_openid, 'courses'), courses);
      // 异步同步到云端（用 courseCode 作为 docId）
      _syncToCloud('courses', 'upsert', courses[index], courseId);
      this.checkAutoThesisCountdown();
      return courses[index];
    }
    return null;
  },

  updateNationalExam(examId, patch) {
    if (!_openid) return null;
    const exams = this.getNationalExams();
    const index = exams.findIndex(e => e.id === examId);
    if (index !== -1) {
      exams[index] = { ...exams[index], ...patch };
      wx.setStorageSync(keyOf(_openid, 'national_exams'), exams);
      // 异步同步到云端
      _syncToCloud('national_exams', 'upsert', exams[index], examId);
      this.checkAutoThesisCountdown();
      return exams[index];
    }
    return null;
  },

  updateThesisFlow(patch) {
    if (!_openid) return { ...DEFAULT_THESIS_FLOW };
    const flow = this.getThesisFlow();
    const updated = { ...flow, ...patch };
    wx.setStorageSync(keyOf(_openid, 'thesis_flow'), updated);
    // 异步同步到云端（thesis_flow 使用固定 docId）
    _syncToCloud('thesis_flow', 'upsert', updated, `thesis_${_openid}`);
    return updated;
  },

  /**
   * 自动校验：若全部 14 门课程 + 2 门国考全部通过，以最后一门 passDate 为起点启动 1.5 年大论文倒计时
   */
  checkAutoThesisCountdown() {
    const courses = this.getCourses();
    const exams = this.getNationalExams();
    const user = this.getUser();

    const allCoursesPassed = courses.every(c => c.status === 'passed');
    const allExamsPassed = exams.every(e => e.status === 'passed');

    if (allCoursesPassed && allExamsPassed) {
      const allDates = [
        ...courses.map(c => c.passDate).filter(Boolean),
        ...exams.map(e => e.passDate).filter(Boolean)
      ];
      const maxPassDate = allDates.length > 0 ? allDates.sort().reverse()[0] : formatDate(new Date());
      const thesisDeadline = addMonths(maxPassDate, 18);
      this.updateUser({
        thesisTriggeredAt: maxPassDate,
        thesisDeadline: thesisDeadline
      });
      // 同时调用云端校验
      _syncToCloud('users', 'update', {
        thesisTriggeredAt: maxPassDate,
        thesisDeadline: thesisDeadline
      }, _openid);
      return { triggered: true, maxPassDate, thesisDeadline };
    } else {
      if (user.thesisTriggeredAt) {
        this.updateUser({
          thesisTriggeredAt: null,
          thesisDeadline: null
        });
      }
    }
    return { triggered: false };
  },

  // 切换专业并重新初始化数据
  switchMajor(majorKey) {
    if (!_openid) return false;
    if (!MAJOR_REGISTRY[majorKey]) return false;
    const major = MAJOR_REGISTRY[majorKey];
    // 更新用户专业信息（保留学籍日期）
    this.updateUser({
      major: majorKey,
      majorName: major.majorName,
      school: major.school,
      totalCreditsTarget: major.totalCreditsTarget,
      thesisDeadline: null,
      thesisTriggeredAt: null
    });
    // 用新专业课程覆盖存储
    const newCourses = JSON.parse(JSON.stringify(major.courses));
    const newExams = JSON.parse(JSON.stringify(major.nationalExams));
    wx.setStorageSync(keyOf(_openid, 'courses'), newCourses);
    wx.setStorageSync(keyOf(_openid, 'national_exams'), newExams);
    wx.setStorageSync(keyOf(_openid, 'thesis_flow'), JSON.parse(JSON.stringify(DEFAULT_THESIS_FLOW)));
    // 云端同步：逐条写入新课程
    for (const course of newCourses) {
      _syncToCloud('courses', 'upsert', course, course.id);
    }
    for (const exam of newExams) {
      _syncToCloud('national_exams', 'upsert', exam, exam.id);
    }
    _syncToCloud('thesis_flow', 'upsert', DEFAULT_THESIS_FLOW, `thesis_${_openid}`);
    return true;
  },

  // 重置回默认数据
  resetAll() {
    if (!_openid) return;
    this._initLocalDefaults();
  }
};
