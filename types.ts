
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

export interface Collection {
  id: string;
  name: string;
  description: string;
}
