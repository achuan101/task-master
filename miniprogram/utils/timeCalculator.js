// 时间与倒计时计算核心工具库

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 计算两个日期相差的天数
 */
export function diffDays(startDate, endDate) {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const diff = end - start;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * 计算 4 年申硕大盘生命线进度
 * @param {string} enrollDate 入学/起算日期 (例如 '2026-09-01')
 * @param {string} deadlineDate 4年到期日 (例如 '2030-09-01')
 */
export function calculateLifeline(enrollDate = '2026-09-01', deadlineDate = '2030-09-01') {
  const now = new Date();
  const start = new Date(enrollDate);
  const end = new Date(deadlineDate);

  const totalDuration = end.getTime() - start.getTime();
  const elapsed = Math.max(0, now.getTime() - start.getTime());
  const remainingTime = end.getTime() - now.getTime();

  const totalDays = Math.ceil(totalDuration / (1000 * 60 * 60 * 24));
  const remainingDays = Math.max(0, Math.ceil(remainingTime / (1000 * 60 * 60 * 24)));
  const elapsedDays = totalDays - remainingDays;

  const percentage = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));

  // 计算健康度指示器
  let status = "healthy"; // healthy (绿) / warning (橙) / danger (红)
  let statusText = "时间充裕";
  if (remainingDays < 365) {
    status = "danger";
    statusText = "终局冲刺 (<1年)";
  } else if (remainingDays < 730) {
    status = "warning";
    statusText = "关键窗口期 (<2年)";
  }

  return {
    totalDays,
    elapsedDays,
    remainingDays,
    percentage,
    status,
    statusText,
    deadlineFormatted: formatDate(end)
  };
}

/**
 * 在某个日期上增加精确的自然月份 (如 18 个月)
 */
export function addMonths(dateStr, monthsToAdd = 18) {
  const date = new Date(dateStr);
  const currentDay = date.getDate();
  date.setMonth(date.getMonth() + monthsToAdd);

  // 边界保护：若跨月日期超出当月天数（如2月30），setMonth 会自动进位，调整回当月最后一天
  if (date.getDate() !== currentDay) {
    date.setDate(0);
  }
  return formatDate(date);
}

/**
 * 计算大论文 1.5 年倒计时
 * @param {string} triggerDate 触发日期 (最后一门考试通过日期)
 */
export function calculateThesisCountdown(triggerDate) {
  if (!triggerDate) return null;
  const deadline = addMonths(triggerDate, 18);
  const now = new Date();
  const remainingDays = diffDays(now, deadline);

  return {
    triggerDate,
    deadline,
    remainingDays: Math.max(0, remainingDays),
    isExpired: remainingDays < 0
  };
}

/**
 * 计算下一个即将到来的固定年度事件与剩余天数
 */
export function getUpcomingEvents(events = []) {
  const now = new Date();
  const currentYear = now.getFullYear();

  const list = events.map(item => {
    let eventDate = new Date(currentYear, item.month - 1, item.day);
    // 如果今年的日期已经过去，推算明年的对应日期
    if (eventDate.getTime() < now.getTime() - (1000 * 60 * 60 * 24)) {
      eventDate = new Date(currentYear + 1, item.month - 1, item.day);
    }
    const daysLeft = diffDays(now, eventDate);
    return {
      ...item,
      targetDate: formatDate(eventDate),
      daysLeft
    };
  });

  // 按天数升序排序
  return list.sort((a, b) => a.daysLeft - b.daysLeft);
}
