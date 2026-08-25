import { describe, it, expect } from 'vitest';
import { thumbAt } from '../utils/imageUrls';
import { Outfit } from '../types';

const outfit = (over: Partial<Outfit>): Outfit => ({
  id: 'o1', date: '2026-01-01T00:00:00.000Z', dateId: '2026-01-01',
  imageUrls: [], tops: [], bottoms: [], tags: [], ...over,
});

describe('thumbAt', () => {
  it('dùng thumb khi có', () => {
    const o = outfit({ imageUrls: ['full-0', 'full-1'], thumbUrls: ['thumb-0', 'thumb-1'] });
    expect(thumbAt(o, 0)).toBe('thumb-0');
    expect(thumbAt(o, 1)).toBe('thumb-1');
  });

  it('rơi về ảnh đầy đủ với outfit đời cũ không có thumbUrls', () => {
    const o = outfit({ imageUrls: ['full-0'] });
    expect(thumbAt(o, 0)).toBe('full-0');
  });

  it('rơi về ảnh đầy đủ khi thumbUrls ngắn hơn imageUrls', () => {
    const o = outfit({ imageUrls: ['full-0', 'full-1'], thumbUrls: ['thumb-0'] });
    expect(thumbAt(o, 1)).toBe('full-1');
  });

  it('mặc định lấy ảnh đầu tiên', () => {
    expect(thumbAt(outfit({ imageUrls: ['a'], thumbUrls: ['t'] }))).toBe('t');
  });
});
