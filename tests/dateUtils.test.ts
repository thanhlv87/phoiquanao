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
