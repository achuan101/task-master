// 本地存储适配层
// 去除云开发依赖后，数据全部存于本地缓存（按 openid 隔离）；专业切换本地整包完成

import {
  DEFAULT_USER,
  MAJOR_REGISTRY,
  DEFAULT_THESIS_FLOW,
  ANNUAL_EVENTS
} from './mockData.js';
import { addMonths, formatDate } from './timeCalculator.js';

const keyOf = (openid, name) => `masterplan_${name}_${openid}`;

let _openid = null;

/** 克隆专业课程/国考并打上 major 标签 */
function cloneMajorPackage(majorKey) {
  const major = MAJOR_REGISTRY[majorKey];
  if (!major) return null;
  const courses = JSON.parse(JSON.stringify(major.courses)).map((c) => ({
    ...c,
    major: majorKey
  }));
  const nationalExams = JSON.parse(JSON.stringify(major.nationalExams)).map((e) => ({
    ...e,
    major: majorKey
  }));
  return { major, courses, nationalExams };
}

export const Storage = {
  init(openid, initUserData = null) {
    _openid = openid;

    if (initUserData) {
      const majorKey = initUserData.major || 'big_data';
      const pkg = cloneMajorPackage(majorKey);
      const user = {
        ...DEFAULT_USER,
        ...initUserData,
        majorRevision: initUserData.majorRevision || 0
      };
      wx.setStorageSync(keyOf(openid, 'user'), user);
      wx.setStorageSync(keyOf(openid, 'courses'), pkg.courses);
      wx.setStorageSync(keyOf(openid, 'national_exams'), pkg.nationalExams);
      wx.setStorageSync(keyOf(openid, 'thesis_flow'), JSON.parse(JSON.stringify(DEFAULT_THESIS_FLOW)));
      wx.setStorageSync(keyOf(openid, 'events'), ANNUAL_EVENTS);
      wx.setStorageSync(keyOf(openid, 'initialized'), true);
      return;
    }

    this.syncFromLocal();
  },

  getOpenid() {
    return _openid;
  },

  /** 将整包专业数据写入本地 */
  _applyMajorPackage(user, courses, exams, thesisFlow) {
    wx.setStorageSync(keyOf(_openid, 'user'), user);
    wx.setStorageSync(keyOf(_openid, 'courses'), courses);
    wx.setStorageSync(keyOf(_openid, 'national_exams'), exams);
    if (thesisFlow) {
      wx.setStorageSync(keyOf(_openid, 'thesis_flow'), thesisFlow);
    }
  },

  /**
   * 本地初始化：已初始化则直接使用本地数据，否则写入默认数据
   */
  syncFromLocal() {
    if (!_openid) return;
    const initialized = wx.getStorageSync(keyOf(_openid, 'initialized'));
    if (initialized) {
      return;
    }
    this._initLocalDefaults();
  },

  _initLocalDefaults() {
    if (!_openid) return;
    const user = { ...DEFAULT_USER, majorRevision: 0 };
    const pkg = cloneMajorPackage(user.major);
    wx.setStorageSync(keyOf(_openid, 'user'), user);
    wx.setStorageSync(keyOf(_openid, 'courses'), pkg.courses);
    wx.setStorageSync(keyOf(_openid, 'national_exams'), pkg.nationalExams);
    wx.setStorageSync(keyOf(_openid, 'thesis_flow'), JSON.parse(JSON.stringify(DEFAULT_THESIS_FLOW)));
    wx.setStorageSync(keyOf(_openid, 'events'), ANNUAL_EVENTS);
    wx.setStorageSync(keyOf(_openid, 'initialized'), true);
  },

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
      return cloneMajorPackage(this.getUser().major || 'big_data').courses;
    }
    return wx.getStorageSync(keyOf(_openid, 'courses')) || [];
  },

  getNationalExams() {
    if (!_openid) {
      return cloneMajorPackage(this.getUser().major || 'big_data').nationalExams;
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

  /** 本地定时预警：返回今日命中的年度事件 */
  getTodayReminders() {
    const events = this.getEvents();
    const today = new Date();
    const mm = today.getMonth() + 1;
    const dd = today.getDate();
    return events.filter((e) => e.month === mm && e.day === dd);
  },

  updateUser(userData) {
    if (!_openid) return { ...DEFAULT_USER };
    const current = this.getUser();
    const updated = { ...current, ...userData };
    wx.setStorageSync(keyOf(_openid, 'user'), updated);
    return updated;
  },

  updateCourse(courseId, patch) {
    if (!_openid) return null;
    const courses = this.getCourses();
    const index = courses.findIndex((c) => c.id === courseId || c.courseCode === courseId);
    if (index !== -1) {
      courses[index] = { ...courses[index], ...patch };
      wx.setStorageSync(keyOf(_openid, 'courses'), courses);
      this.checkAutoThesisCountdown();
      return courses[index];
    }
    return null;
  },

  updateNationalExam(examId, patch) {
    if (!_openid) return null;
    const exams = this.getNationalExams();
    const index = exams.findIndex((e) => e.id === examId);
    if (index !== -1) {
      exams[index] = { ...exams[index], ...patch };
      wx.setStorageSync(keyOf(_openid, 'national_exams'), exams);
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
    return updated;
  },

  checkAutoThesisCountdown() {
    const courses = this.getCourses();
    const exams = this.getNationalExams();
    const user = this.getUser();

    const allCoursesPassed = courses.length > 0 && courses.every((c) => c.status === 'passed');
    const allExamsPassed = exams.length > 0 && exams.every((e) => e.status === 'passed');

    if (allCoursesPassed && allExamsPassed) {
      const allDates = [
        ...courses.map((c) => c.passDate).filter(Boolean),
        ...exams.map((e) => e.passDate).filter(Boolean)
      ];
      const maxPassDate = allDates.length > 0 ? allDates.sort().reverse()[0] : formatDate(new Date());
      const thesisDeadline = addMonths(maxPassDate, 18);
      this.updateUser({
        thesisTriggeredAt: maxPassDate,
        thesisDeadline: thesisDeadline
      });
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

  /**
   * 切换专业：本地整包更新课程/国考/论文流程
   * @returns {Promise<boolean>}
   */
  async switchMajor(majorKey) {
    if (!_openid) return false;
    if (!MAJOR_REGISTRY[majorKey]) return false;

    const pkg = cloneMajorPackage(majorKey);
    const current = this.getUser();
    const nextRev = (current.majorRevision || 0) + 1;

    const localUser = {
      ...current,
      major: majorKey,
      majorName: pkg.major.majorName,
      school: pkg.major.school,
      totalCreditsTarget: pkg.major.totalCreditsTarget,
      majorRevision: nextRev,
      thesisDeadline: null,
      thesisTriggeredAt: null
    };
    const localThesis = JSON.parse(JSON.stringify(DEFAULT_THESIS_FLOW));
    this._applyMajorPackage(localUser, pkg.courses, pkg.nationalExams, localThesis);

    return true;
  },

  resetAll() {
    if (!_openid) return;
    this._initLocalDefaults();
  }
};
