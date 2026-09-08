// 本地存储与云端同步适配层
// 本地存储按 openid 隔离；专业切换通过云函数原子完成；拉取时按「专业+课程+国考」整包对齐

import {
  DEFAULT_USER,
  MAJOR_REGISTRY,
  DEFAULT_THESIS_FLOW,
  ANNUAL_EVENTS
} from './mockData.js';
import { addMonths, formatDate } from './timeCalculator.js';

const keyOf = (openid, name) => `masterplan_${name}_${openid}`;

let _openid = null;

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

/** 规范化课号：优先 courseCode，否则去掉 openid_ 前缀 */
function extractCourseCode(course) {
  if (!course) return '';
  if (course.courseCode) return String(course.courseCode);
  const raw = String(course.id || course._id || '');
  if (!raw) return '';
  if (_openid && raw.startsWith(`${_openid}_`)) {
    return raw.slice(_openid.length + 1);
  }
  // 兼容历史 major_courseCode 文档 id
  const knownMajors = Object.keys(MAJOR_REGISTRY);
  for (const m of knownMajors) {
    if (raw.startsWith(`${m}_`)) return raw.slice(m.length + 1);
  }
  return raw;
}

function extractExamId(exam) {
  if (!exam) return '';
  if (exam.id) return String(exam.id);
  const raw = String(exam._id || '');
  if (!raw) return '';
  if (_openid && raw.startsWith(`${_openid}_`)) {
    return raw.slice(_openid.length + 1);
  }
  return raw;
}

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

/** 课程课号集合是否与专业模板一致 */
function coursesMatchMajor(courses, majorKey) {
  const registry = MAJOR_REGISTRY[majorKey];
  if (!registry) return false;
  const expected = new Set(registry.courses.map((c) => c.courseCode || c.id));
  const actual = new Set((courses || []).map(extractCourseCode).filter(Boolean));
  if (expected.size !== actual.size) return false;
  for (const code of expected) {
    if (!actual.has(code)) return false;
  }
  return !(courses || []).some((c) => c.major && c.major !== majorKey);
}

/** 去重并规范化课程列表 */
function normalizeCourses(list, majorKey) {
  const map = new Map();
  for (const c of list || []) {
    const code = extractCourseCode(c);
    if (!code) continue;
    const normalized = {
      ...c,
      id: code,
      courseCode: code,
      major: c.major || majorKey
    };
    delete normalized._id;
    delete normalized._openid;
    delete normalized.createdAt;
    delete normalized.updatedAt;

    const prev = map.get(code);
    if (!prev) {
      map.set(code, normalized);
      continue;
    }
    const score = (x, raw) =>
      (x.major === majorKey ? 4 : 0) +
      (x.status === 'passed' ? 2 : 0) +
      (String((raw && raw._id) || '').indexOf('_') >= 0 ? 1 : 0);
    if (score(normalized, c) >= score(prev, null)) {
      map.set(code, normalized);
    }
  }
  return Array.from(map.values());
}

function normalizeExams(list, majorKey) {
  const map = new Map();
  for (const e of list || []) {
    const id = extractExamId(e);
    if (!id) continue;
    const normalized = {
      ...e,
      id,
      major: e.major || majorKey
    };
    delete normalized._id;
    delete normalized._openid;
    delete normalized.createdAt;
    delete normalized.updatedAt;

    const prev = map.get(id);
    if (!prev) {
      map.set(id, normalized);
      continue;
    }
    const score = (x) =>
      (x.major === majorKey ? 2 : 0) + (x.status === 'passed' ? 1 : 0);
    if (score(normalized) >= score(prev)) {
      map.set(id, normalized);
    }
  }
  return Array.from(map.values());
}

export const Storage = {
  async init(openid, initUserData = null) {
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

    await this.syncFromCloud();
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
   * 从云端全量拉取；专业/课程/国考按版本号与课号集合整包对齐，禁止名称与课程拆开覆盖
   */
  async syncFromCloud() {
    if (!_openid) return;

    try {
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

      const localUser = wx.getStorageSync(keyOf(_openid, 'user')) || null;
      const localCourses = wx.getStorageSync(keyOf(_openid, 'courses')) || [];
      const localExams = wx.getStorageSync(keyOf(_openid, 'national_exams')) || [];
      const localThesis = wx.getStorageSync(keyOf(_openid, 'thesis_flow')) || null;

      const localRev = (localUser && localUser.majorRevision) || 0;
      const cloudRev = (userData && userData.majorRevision) || 0;

      // 本地专业版本更新：整包保留本地，避免云端半切换数据盖回
      if (localUser && localUser.major && localRev > cloudRev) {
        this._applyMajorPackage(
          localUser,
          localCourses.length ? localCourses : cloneMajorPackage(localUser.major).courses,
          localExams.length ? localExams : cloneMajorPackage(localUser.major).nationalExams,
          localThesis || JSON.parse(JSON.stringify(DEFAULT_THESIS_FLOW))
        );
        wx.setStorageSync(keyOf(_openid, 'events'), ANNUAL_EVENTS);
        wx.setStorageSync(keyOf(_openid, 'initialized'), true);
        return;
      }

      if (!userData) {
        this._initLocalDefaults();
        return;
      }

      const majorKey = userData.major || DEFAULT_USER.major;
      let courses = normalizeCourses(coursesData, majorKey);
      let exams = normalizeExams(examsData, majorKey);

      let thesisFlow = JSON.parse(JSON.stringify(DEFAULT_THESIS_FLOW));
      if (thesisData && ((Array.isArray(thesisData) && thesisData.length > 0) || (!Array.isArray(thesisData) && Object.keys(thesisData).length > 0))) {
        thesisFlow = Array.isArray(thesisData) ? thesisData[0] : thesisData;
      }

      // 云端课程与专业不一致：用模板重置本地，并触发云端修复
      if (!coursesMatchMajor(courses, majorKey)) {
        console.warn('[syncFromCloud] 检测到专业与课程不一致，按专业模板修复');
        const pkg = cloneMajorPackage(majorKey);
        courses = pkg.courses;
        exams = pkg.nationalExams;
        const repairedUser = {
          ...userData,
          major: majorKey,
          majorName: pkg.major.majorName,
          school: pkg.major.school || userData.school,
          totalCreditsTarget: pkg.major.totalCreditsTarget,
          majorRevision: Math.max(cloudRev, localRev) + 1,
          thesisDeadline: null,
          thesisTriggeredAt: null
        };
        thesisFlow = JSON.parse(JSON.stringify(DEFAULT_THESIS_FLOW));
        this._applyMajorPackage(repairedUser, courses, exams, thesisFlow);
        // 异步调用云函数整包修复，不阻塞启动
        wx.cloud.callFunction({ name: 'switchMajor', data: { major: majorKey } }).catch((err) => {
          console.warn('[syncFromCloud] 云端修复 switchMajor 失败:', err);
        });
      } else {
        const user = {
          ...userData,
          majorRevision: cloudRev
        };
        if (!exams.length) {
          exams = cloneMajorPackage(majorKey).nationalExams;
        }
        this._applyMajorPackage(user, courses, exams, thesisFlow);
      }

      wx.setStorageSync(keyOf(_openid, 'events'), ANNUAL_EVENTS);
      wx.setStorageSync(keyOf(_openid, 'initialized'), true);
    } catch (err) {
      console.warn('[syncFromCloud] 云端同步失败，使用本地默认数据:', err);
      this._initLocalDefaults();
    }
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

  updateUser(userData) {
    if (!_openid) return { ...DEFAULT_USER };
    const current = this.getUser();
    const updated = { ...current, ...userData };
    wx.setStorageSync(keyOf(_openid, 'user'), updated);
    _syncToCloud('users', 'update', userData, _openid);
    return updated;
  },

  updateCourse(courseId, patch) {
    if (!_openid) return null;
    const courses = this.getCourses();
    const index = courses.findIndex((c) => c.id === courseId || c.courseCode === courseId);
    if (index !== -1) {
      courses[index] = { ...courses[index], ...patch };
      wx.setStorageSync(keyOf(_openid, 'courses'), courses);
      // docId 与 switchMajor 云函数保持一致：openid_courseCode
      _syncToCloud('courses', 'upsert', courses[index], `${_openid}_${courseId}`);
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
      _syncToCloud('national_exams', 'upsert', exams[index], `${_openid}_${examId}`);
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
    _syncToCloud('thesis_flow', 'upsert', updated, `thesis_${_openid}`);
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
   * 切换专业：先乐观更新本地整包，再调用云函数原子切换；成功后以云端返回为准
   * @returns {Promise<boolean>}
   */
  async switchMajor(majorKey) {
    if (!_openid) return false;
    if (!MAJOR_REGISTRY[majorKey]) return false;

    const pkg = cloneMajorPackage(majorKey);
    const current = this.getUser();
    const nextRev = (current.majorRevision || 0) + 1;

    // 1. 乐观更新本地整包（保证 UI 立即一致；revision 高于云端，防止半同步盖回）
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

    // 2. 云端原子切换
    try {
      const res = await wx.cloud.callFunction({
        name: 'switchMajor',
        data: { major: majorKey }
      });
      if (res.result && res.result.success && res.result.data) {
        const data = res.result.data;
        const cloudUser = {
          ...localUser,
          ...(data.user || {}),
          major: majorKey,
          majorName: pkg.major.majorName,
          school: pkg.major.school,
          totalCreditsTarget: pkg.major.totalCreditsTarget,
          majorRevision: data.majorRevision || nextRev,
          thesisDeadline: null,
          thesisTriggeredAt: null
        };
        const courses = normalizeCourses(data.courses || pkg.courses, majorKey);
        const exams = normalizeExams(data.nationalExams || pkg.nationalExams, majorKey);
        const thesis = data.thesisFlow || localThesis;
        this._applyMajorPackage(cloudUser, courses, exams, thesis);
        return true;
      }
      console.warn('[switchMajor] 云函数返回失败，已保留本地整包:', res.result);
      return true; // 本地已一致
    } catch (err) {
      console.warn('[switchMajor] 云函数调用失败，已保留本地整包:', err);
      return true; // 离线也保证本地名称与课程一致
    }
  },

  resetAll() {
    if (!_openid) return;
    this._initLocalDefaults();
  }
};
