import { Outfit } from '../types';

/**
 * Ảnh nhỏ ở vị trí `index`.
 *
 * Outfit tạo trước khi có thumbnail không có trường thumbUrls, khi đó rơi về ảnh
 * đầy đủ để không vỡ giao diện.
 */
export const thumbAt = (outfit: Outfit, index = 0): string =>
  outfit.thumbUrls?.[index] || outfit.imageUrls[index];
