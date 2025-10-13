
export interface Outfit {
  id: string; // YYYY-MM-DD format
  date: string; // ISO string
  imageUrl: string; // Base64 data URL
  tops: string[];
  bottoms: string[];
  tags: string[];
}

export interface AiTags {
  tops: string[];
  bottoms: string[];
  general: string[];
}
