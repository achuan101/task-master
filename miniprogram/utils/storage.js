// 本地存储与状态同步适配层 (支持无网/无云环境丝滑运行，并在云就绪后无缝同步)

import {
  DEFAULT_USER,
  BIG_DATA_COURSES,
  DEFAULT_NATIONAL_EXAMS,
  DEFAULT_THESIS_FLOW,
  ANNUAL_EVENTS
} from './mockData.js';
import { addMonths, formatDate } from './timeCalculator.js';

const STORAGE_KEYS = {
  USER: 'masterplan_user',
  COURSES: 'masterplan_courses',
  NATIONAL_EXAMS: 'masterplan_national_exams',
  THESIS_FLOW: 'masterplan_thesis_flow',
  EVENTS: 'masterplan_events',
  INITIALIZED: 'masterplan_initialized'
};

export const Storage = {
  // 初始化系统默认数据
  initDefaultData(force = false) {
    const isInit = wx.getStorageSync(STORAGE_KEYS.INITIALIZED);
    if (!isInit || force) {
      wx.setStorageSync(STORAGE_KEYS.USER, DEFAULT_USER);
      wx.setStorageSync(STORAGE_KEYS.COURSES, BIG_DATA_COURSES);
      wx.setStorageSync(STORAGE_KEYS.NATIONAL_EXAMS, DEFAULT_NATIONAL_EXAMS);
      wx.setStorageSync(STORAGE_KEYS.THESIS_FLOW, DEFAULT_THESIS_FLOW);
      wx.setStorageSync(STORAGE_KEYS.EVENTS, ANNUAL_EVENTS);
      wx.setStorageSync(STORAGE_KEYS.INITIALIZED, true);
    }
  },

  getUser() {
    this.initDefaultData();
    return wx.getStorageSync(STORAGE_KEYS.USER) || DEFAULT_USER;
  },

  updateUser(userData) {
    const current = this.getUser();
    const updated = { ...current, ...userData };
    wx.setStorageSync(STORAGE_KEYS.USER, updated);
    return updated;
  },

  getCourses() {
    this.initDefaultData();
    return wx.getStorageSync(STORAGE_KEYS.COURSES) || BIG_DATA_COURSES;
  },

  updateCourse(courseId, patch) {
    const courses = this.getCourses();
    const index = courses.findIndex(c => c.id === courseId);
    if (index !== -1) {
      courses[index] = { ...courses[index], ...patch };
      wx.setStorageSync(STORAGE_KEYS.COURSES, courses);
      this.checkAutoThesisCountdown(); // 检查是否激活大论文 1.5 年倒计时
      return courses[index];
    }
    return null;
  },

  getNationalExams() {
    this.initDefaultData();
    return wx.getStorageSync(STORAGE_KEYS.NATIONAL_EXAMS) || DEFAULT_NATIONAL_EXAMS;
  },

  updateNationalExam(examId, patch) {
    const exams = this.getNationalExams();
    const index = exams.findIndex(e => e.id === examId);
    if (index !== -1) {
      exams[index] = { ...exams[index], ...patch };
      wx.setStorageSync(STORAGE_KEYS.NATIONAL_EXAMS, exams);
      this.checkAutoThesisCountdown();
      return exams[index];
    }
    return null;
  },

  getThesisFlow() {
    this.initDefaultData();
    return wx.getStorageSync(STORAGE_KEYS.THESIS_FLOW) || DEFAULT_THESIS_FLOW;
  },

  updateThesisFlow(patch) {
    const flow = this.getThesisFlow();
    const updated = { ...flow, ...patch };
    wx.setStorageSync(STORAGE_KEYS.THESIS_FLOW, updated);
    return updated;
  },

  getEvents() {
    this.initDefaultData();
    return wx.getStorageSync(STORAGE_KEYS.EVENTS) || ANNUAL_EVENTS;
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
      // 提取全部 passDate 的最大值
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

  // 重置回默认数据
  resetAll() {
    this.initDefaultData(true);
  }
};
