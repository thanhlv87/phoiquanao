
export interface Outfit {
  id: string;
  date: string;
  dateId: string;
  imageUrls: string[];
  tops: string[];
  bottoms: string[];
  tags: string[];
  collectionIds?: string[];
}

export interface WardrobeItem {
  id: string;
  category: 'top' | 'bottom' | 'skirt' | 'dress' | 'shoe' | 'accessory';
  imageUrl: string;
  tags: string[];
  color?: string;
  material?: string;
  createdAt: string;
}

export interface AiTags {
  tops: string[];
  bottoms: string[];
  general: string[];
}

export interface Collection {
  id: string;
  name: string;
  description: string;
}

export interface MixResult {
  id: string;
  createdAt: string;
  modelImageUrl: string;
  topImageUrl: string;
  bottomImageUrl: string;
  resultImageUrl: string;
}
