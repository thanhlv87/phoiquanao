
export interface Outfit {
  id: string;
  date: string;
  dateId: string;
  imageUrls: string[];
  /** Song song với imageUrls. Outfit cũ không có trường này -> dùng tạm ảnh đầy đủ. */
  thumbUrls?: string[];
  tops: string[];
  bottoms: string[];
  tags: string[];
}
