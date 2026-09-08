// 云函数：syncUserData (通用用户数据同步)
// 支持对 users、courses、national_exams、thesis_flow 集合的增删改查
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

// 允许操作的集合白名单
const ALLOWED_COLLECTIONS = ['users', 'courses', 'national_exams', 'thesis_flow'];

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { collection, operation, data, docId } = event;

  // 安全校验：只允许操作白名单内的集合
  if (!ALLOWED_COLLECTIONS.includes(collection)) {
    return { success: false, error: '不允许操作的集合' };
  }

  try {
    const col = db.collection(collection);

    switch (operation) {
      // 查询当前用户的所有数据
      case 'read': {
        if (collection === 'users') {
          const res = await col.doc(openid).get().catch(() => null);
          return { success: true, data: res ? res.data : null };
        }
        const res = await col.where({ _openid: openid }).get();
        return { success: true, data: res.data };
      }

      // 新增文档（自动绑定 _openid）
      case 'add': {
        const docData = { ...data, _openid: openid, updatedAt: db.serverDate() };
        if (!docData.createdAt) docData.createdAt = db.serverDate();
        const res = await col.add({ data: docData });
        return { success: true, id: res._id };
      }

      // 更新指定文档
      case 'update': {
        if (!docId) return { success: false, error: '缺少 docId' };
        // users 集合用 openid 作为 _id
        if (collection === 'users' && docId === openid) {
          await col.doc(openid).update({ data: { ...data, updatedAt: db.serverDate() } });
        } else {
          // 其他集合需要校验 _openid 归属
          await col.where({ _id: docId, _openid: openid }).update({ data: { ...data, updatedAt: db.serverDate() } });
        }
        return { success: true };
      }

      // upsert：存在则更新，不存在则新增
      case 'upsert': {
        if (!docId) return { success: false, error: '缺少 docId' };
        const existing = await col.doc(docId).get().catch(() => null);
        if (existing && existing.data) {
          await col.doc(docId).update({ data: { ...data, updatedAt: db.serverDate() } });
          return { success: true, isNew: false };
        } else {
          const docData = { _id: docId, ...data, _openid: openid, createdAt: db.serverDate(), updatedAt: db.serverDate() };
          await col.add({ data: docData });
          return { success: true, isNew: true };
        }
      }

      // 删除文档
      case 'remove': {
        if (!docId) return { success: false, error: '缺少 docId' };
        await col.where({ _id: docId, _openid: openid }).remove();
        return { success: true };
      }

      default:
        return { success: false, error: '未知操作类型' };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
};
