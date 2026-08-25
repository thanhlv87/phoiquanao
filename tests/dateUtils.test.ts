import { describe, it, expect, vi, afterEach } from 'vitest';
import { getTodayDateString, parseDateString, formatDate } from '../utils/dateUtils';

afterEach(() => vi.useRealTimers());

describe('getTodayDateString', () => {
  it('đệm 0 cho tháng và ngày một chữ số', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 5, 12, 0, 0));
    expect(getTodayDateString()).toBe('2026-01-05');
  });

  it('dùng giờ địa phương, không phải UTC', () => {
    vi.useFakeTimers();
    // 23:30 giờ địa phương -> ngày UTC có thể đã sang hôm sau tuỳ múi giờ,
    // nhưng nhật ký phải bám theo ngày người dùng đang sống.
    const local = new Date(2026, 5, 30, 23, 30, 0);
    vi.setSystemTime(local);
    expect(getTodayDateString()).toBe('2026-06-30');
  });
});

describe('parseDateString', () => {
  it('trả về đúng ngày ở giờ địa phương', () => {
    const d = parseDateString('2026-03-09');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2);
    expect(d.getDate()).toBe(9);
  });

  it('khứ hồi được với getTodayDateString', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 1, 8, 0, 0));
    const today = getTodayDateString();
    const parsed = parseDateString(today);
    expect(
      `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`
    ).toBe(today);
  });
});

describe('formatDate', () => {
  it('cho ra chuỗi tiếng Việt có chứa ngày', () => {
    expect(formatDate(new Date(2026, 7, 25))).toContain('25');
  });
});

describe('previousDateIds', () => {
  it('trả về đúng số ngày, gần nhất đứng đầu, không gồm hôm nay', async () => {
    const { previousDateIds } = await import('../utils/dateUtils');
    const ids = previousDateIds(new Date(2026, 7, 25), 7);
    expect(ids).toEqual([
      '2026-08-24', '2026-08-23', '2026-08-22', '2026-08-21',
      '2026-08-20', '2026-08-19', '2026-08-18',
    ]);
    expect(ids).not.toContain('2026-08-25');
  });

  it('lùi qua ranh giới tháng', async () => {
    const { previousDateIds } = await import('../utils/dateUtils');
    expect(previousDateIds(new Date(2026, 2, 2), 3)).toEqual(['2026-03-01', '2026-02-28', '2026-02-27']);
  });

  it('lùi qua ranh giới năm', async () => {
    const { previousDateIds } = await import('../utils/dateUtils');
    expect(previousDateIds(new Date(2026, 0, 2), 3)).toEqual(['2026-01-01', '2025-12-31', '2025-12-30']);
  });

  it('xử lý đúng năm nhuận', async () => {
    const { previousDateIds } = await import('../utils/dateUtils');
    // 2028 là năm nhuận -> phải có 29/02
    expect(previousDateIds(new Date(2028, 2, 1), 2)).toEqual(['2028-02-29', '2028-02-28']);
    // 2026 không nhuận -> nhảy thẳng qua 28/02
    expect(previousDateIds(new Date(2026, 2, 1), 2)).toEqual(['2026-02-28', '2026-02-27']);
  });

  it('không bị giờ trong ngày làm lệch', async () => {
    const { previousDateIds } = await import('../utils/dateUtils');
    const sang = previousDateIds(new Date(2026, 7, 25, 0, 30), 2);
    const toi = previousDateIds(new Date(2026, 7, 25, 23, 45), 2);
    expect(sang).toEqual(toi);
  });

  it('count = 0 trả về mảng rỗng', async () => {
    const { previousDateIds } = await import('../utils/dateUtils');
    expect(previousDateIds(new Date(2026, 7, 25), 0)).toEqual([]);
  });
});

describe('relativeDayLabel', () => {
  it('gọi 1 ngày trước là "Hôm qua"', async () => {
    const { relativeDayLabel } = await import('../utils/dateUtils');
    expect(relativeDayLabel(1)).toBe('Hôm qua');
    expect(relativeDayLabel(2)).toBe('2 ngày trước');
    expect(relativeDayLabel(7)).toBe('7 ngày trước');
  });
});
