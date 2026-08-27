
export const toDateId = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const getTodayDateString = (): string => toDateId(new Date());

/**
 * dateId của `count` ngày ngay trước `from`, gần nhất đứng đầu.
 *
 * Dùng setDate với số âm để Date tự xử lý ranh giới tháng, năm và năm nhuận —
 * tự trừ tay vào chuỗi là chỗ dễ sai nhất.
 */
export const previousDateIds = (from: Date, count: number): string[] => {
  const ids: string[] = [];
  for (let back = 1; back <= count; back++) {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    d.setDate(d.getDate() - back);
    ids.push(toDateId(d));
  }
  return ids;
};

/** Nhãn ngắn cho ngày gần đây: "Hôm nay", "Hôm qua", "3 ngày trước". */
export const relativeDayLabel = (daysAgo: number): string =>
  daysAgo === 0 ? 'Hôm nay'
    : daysAgo === 1 ? 'Hôm qua'
      : `${daysAgo} ngày trước`;

/**
 * Số ngày từ `dateId` tới `to`, tính theo ngày lịch địa phương.
 *
 * Quy về mốc nửa đêm rồi làm tròn: ngày đổi giờ mùa hè dài 23 hoặc 25 tiếng nên
 * chia thẳng cho 86400000 sẽ lệch một ngày.
 */
export const daysBetween = (dateId: string, to: Date): number => {
  const from = parseDateString(dateId);
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.round((b - a) / 86400000);
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

export const parseDateString = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  // Month is 0-indexed in JS Date
  return new Date(year, month - 1, day);
};