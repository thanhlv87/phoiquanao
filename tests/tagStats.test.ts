import { describe, it, expect } from 'vitest';
import { tagStats, pickTops, pickBottoms, pickTags } from '../utils/tagStats';
import { daysBetween, relativeDayLabel } from '../utils/dateUtils';
import { Outfit } from '../types';

const outfit = (dateId: string, over: Partial<Outfit> = {}): Outfit => ({
  id: dateId + Math.random(),
  date: `${dateId}T08:00:00.000Z`,
  dateId,
  imageUrls: ['x'],
  tops: [],
  bottoms: [],
  tags: [],
  ...over,
});

const TODAY = new Date(2026, 7, 25); // 25/08/2026

describe('tagStats', () => {
  it('đếm số lần và tìm lần mặc gần nhất', () => {
    const stats = tagStats([
      outfit('2026-08-20', { tops: ['Áo sơ mi'] }),
      outfit('2026-08-24', { tops: ['Áo sơ mi'] }),
      outfit('2026-08-10', { tops: ['Áo sơ mi'] }),
    ], pickTops, TODAY);

    expect(stats).toHaveLength(1);
    expect(stats[0]).toMatchObject({ tag: 'Áo sơ mi', count: 3, lastWorn: '2026-08-24', daysAgo: 1 });
  });

  it('lần gần nhất không phụ thuộc thứ tự đầu vào', () => {
    const xuoi = tagStats([
      outfit('2026-08-01', { tops: ['A'] }),
      outfit('2026-08-24', { tops: ['A'] }),
    ], pickTops, TODAY);
    const nguoc = tagStats([
      outfit('2026-08-24', { tops: ['A'] }),
      outfit('2026-08-01', { tops: ['A'] }),
    ], pickTops, TODAY);
    expect(xuoi[0].lastWorn).toBe('2026-08-24');
    expect(nguoc[0].lastWorn).toBe('2026-08-24');
  });

  it('thẻ gắn trùng trong cùng một bộ chỉ đếm một lần', () => {
    const stats = tagStats([
      outfit('2026-08-24', { tops: ['Áo len', 'Áo len', ' Áo len '] }),
    ], pickTops, TODAY);
    expect(stats[0].count).toBe(1);
  });

  it('bỏ qua thẻ rỗng và khoảng trắng', () => {
    const stats = tagStats([
      outfit('2026-08-24', { tops: ['', '   ', 'Áo phông'] }),
    ], pickTops, TODAY);
    expect(stats.map(s => s.tag)).toEqual(['Áo phông']);
  });

  it('sắp xếp theo số lần giảm dần, hoà thì theo bảng chữ cái', () => {
    const stats = tagStats([
      outfit('2026-08-24', { tags: ['Zebra', 'Alpha', 'Nhiều'] }),
      outfit('2026-08-23', { tags: ['Nhiều'] }),
    ], pickTags, TODAY);
    expect(stats.map(s => s.tag)).toEqual(['Nhiều', 'Alpha', 'Zebra']);
  });

  it('tách riêng từng nhóm thẻ', () => {
    const list = [outfit('2026-08-24', { tops: ['Áo'], bottoms: ['Quần'], tags: ['Công sở'] })];
    expect(tagStats(list, pickTops, TODAY).map(s => s.tag)).toEqual(['Áo']);
    expect(tagStats(list, pickBottoms, TODAY).map(s => s.tag)).toEqual(['Quần']);
    expect(tagStats(list, pickTags, TODAY).map(s => s.tag)).toEqual(['Công sở']);
  });

  it('trả về mảng rỗng khi không có dữ liệu', () => {
    expect(tagStats([], pickTops, TODAY)).toEqual([]);
    expect(tagStats([outfit('2026-08-24')], pickTops, TODAY)).toEqual([]);
  });

  it('mặc hôm nay thì daysAgo bằng 0', () => {
    const stats = tagStats([outfit('2026-08-25', { tops: ['A'] })], pickTops, TODAY);
    expect(stats[0].daysAgo).toBe(0);
    expect(relativeDayLabel(stats[0].daysAgo)).toBe('Hôm nay');
  });
});

describe('daysBetween', () => {
  it('đếm đúng khoảng cách ngày', () => {
    expect(daysBetween('2026-08-25', TODAY)).toBe(0);
    expect(daysBetween('2026-08-24', TODAY)).toBe(1);
    expect(daysBetween('2026-08-18', TODAY)).toBe(7);
  });

  it('đúng qua ranh giới tháng và năm', () => {
    expect(daysBetween('2026-07-26', TODAY)).toBe(30);
    expect(daysBetween('2025-08-25', TODAY)).toBe(365);
  });

  it('đúng qua tháng 2 năm nhuận', () => {
    // 2028 nhuận: 28/02 -> 01/03 là 2 ngày
    expect(daysBetween('2028-02-28', new Date(2028, 2, 1))).toBe(2);
    // 2026 không nhuận: 28/02 -> 01/03 là 1 ngày
    expect(daysBetween('2026-02-28', new Date(2026, 2, 1))).toBe(1);
  });

  it('không bị giờ trong ngày làm lệch', () => {
    expect(daysBetween('2026-08-24', new Date(2026, 7, 25, 0, 5))).toBe(1);
    expect(daysBetween('2026-08-24', new Date(2026, 7, 25, 23, 55))).toBe(1);
  });
});
