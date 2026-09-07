// 云函数：timerNotice (每日定时预警推送)
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  try {
    // 1. 获取所有配置的备考事件
    const eventsRes = await db.collection('events').get();
    const events = eventsRes.data;

    // 2. 扫描今日是否命中任一事件的提前预警天数
    const hitEvents = [];
    for (const ev of events) {
      // 计算目标日期与当前日期差
      const eventDate = new Date(now.getFullYear(), ev.recurringMonth - 1, ev.recurringDay);
      const diffTime = eventDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === ev.reminderDaysBefore) {
        hitEvents.push({ ...ev, daysLeft: diffDays });
      }
    }

    console.log(`今日待提醒事件数量: ${hitEvents.length}`);

    // 若有命中事件，可在后续接入微信服务号/订阅消息模版进行定向推送
    return {
      success: true,
      scannedDate: `${currentMonth}-${currentDay}`,
      hitEvents
    };
  } catch (err) {
    console.error('定时任务执行失败:', err);
    return { success: false, error: err.message };
  }
};
