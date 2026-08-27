import { Outfit } from '../types';
import { daysBetween } from './dateUtils';

export interface TagStat {
  tag: string;
  /** Số bộ đồ có gắn thẻ này. */
  count: number;
  /** dateId của lần mặc gần nhất. */
  lastWorn: string;
  /** Số ngày kể từ lần mặc gần nhất. */
  daysAgo: number;
}

/** Lấy danh sách thẻ của một outfit theo nhóm. */
export type TagPicker = (outfit: Outfit) => string[];

export const pickTops: TagPicker = o => o.tops;
export const pickBottoms: TagPicker = o => o.bottoms;
export const pickTags: TagPicker = o => o.tags;

/**
 * Tần suất từng món: mặc bao nhiêu lần và lần gần nhất là khi nào.
 *
 * Chỉ riêng số lần thì chưa quyết định được gì — "áo sơ mi 42 lần" không nói lên
 * điều gì lúc đang chọn đồ, nhưng "42 lần, gần nhất hôm qua" thì có.
 *
 * Tính theo dateId (ngày mặc) chứ không theo thời điểm tạo bản ghi, và mỗi thẻ
 * chỉ đếm một lần cho mỗi bộ dù người dùng lỡ gắn trùng.
 */
export const tagStats = (outfits: Outfit[], pick: TagPicker, today: Date): TagStat[] => {
  const byTag = new Map<string, { count: number; lastWorn: string }>();

  for (const outfit of outfits) {
    const unique = new Set(
      pick(outfit).map(t => t.trim()).filter(Boolean)
    );
    for (const tag of unique) {
      const current = byTag.get(tag);
      if (!current) {
        byTag.set(tag, { count: 1, lastWorn: outfit.dateId });
      } else {
        current.count++;
        // dateId dạng YYYY-MM-DD nên so sánh chuỗi là so sánh thời gian.
        if (outfit.dateId > current.lastWorn) current.lastWorn = outfit.dateId;
      }
    }
  }

  return [...byTag.entries()]
    .map(([tag, { count, lastWorn }]) => ({
      tag,
      count,
      lastWorn,
      daysAgo: daysBetween(lastWorn, today),
    }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'vi'));
};
