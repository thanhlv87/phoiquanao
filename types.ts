
export interface Outfit {
  id: string; // Firestore unique ID
  date: string; // ISO string for the exact time
  dateId: string; // YYYY-MM-DD format for grouping by day
  imageUrls: string[];
  tops: string[];
  bottoms: string[];
  tags: string[];
  collectionIds?: string[]; // IDs of collections this outfit belongs to
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

export interface ModelCoordinate {
  id: string;
  userId: string;
  modelImageUrl: string;
  topImageUrl: string;
  bottomImageUrl: string;
  resultImageUrl: string;
  createdAt: string;
}
