import { Outfit } from '../types';

export interface OutfitStats {
  totalOutfits: number;
  mostUsedTops: { tag: string; count: number }[];
  mostUsedBottoms: { tag: string; count: number }[];
  mostUsedTags: { tag: string; count: number }[];
  outfitsPerWeekday: Record<string, number>;
  recentlyWorn: { tag: string; lastWorn: string }[];
  favoriteColors: string[];
  styleDistribution: { style: string; percentage: number }[];
}

export interface SmartSuggestion {
  type: 'repeat' | 'forgotten' | 'seasonal' | 'variety';
  message: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
}

const WEEKDAY_NAMES = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

// Count frequency of items in array
const countFrequency = (items: string[]): Record<string, number> => {
  return items.reduce((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
};

// Sort by frequency
const sortByFrequency = (freq: Record<string, number>, limit = 10) => {
  return Object.entries(freq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }));
};

// Calculate outfit statistics
export const calculateOutfitStats = (outfits: Outfit[]): OutfitStats => {
  if (outfits.length === 0) {
    return {
      totalOutfits: 0,
      mostUsedTops: [],
      mostUsedBottoms: [],
      mostUsedTags: [],
      outfitsPerWeekday: {},
      recentlyWorn: [],
      favoriteColors: [],
      styleDistribution: [],
    };
  }

  const allTops: string[] = [];
  const allBottoms: string[] = [];
  const allTags: string[] = [];
  const weekdayCount: Record<string, number> = {};
  const tagLastWorn: Record<string, string> = {};

  outfits.forEach(outfit => {
    allTops.push(...outfit.tops);
    allBottoms.push(...outfit.bottoms);
    allTags.push(...outfit.tags);

    // Count weekday
    const date = new Date(outfit.date);
    const weekday = WEEKDAY_NAMES[date.getDay()];
    weekdayCount[weekday] = (weekdayCount[weekday] || 0) + 1;

    // Track last worn
    [...outfit.tops, ...outfit.bottoms, ...outfit.tags].forEach(tag => {
      if (!tagLastWorn[tag] || outfit.date > tagLastWorn[tag]) {
        tagLastWorn[tag] = outfit.dateId;
      }
    });
  });

  const topsFreq = countFrequency(allTops);
  const bottomsFreq = countFrequency(allBottoms);
  const tagsFreq = countFrequency(allTags);

  const recentlyWorn = Object.entries(tagLastWorn)
    .sort(([, a], [, b]) => b.localeCompare(a))
    .slice(0, 10)
    .map(([tag, lastWorn]) => ({ tag, lastWorn }));

  // Extract colors (simple heuristic)
  const colorKeywords = ['đỏ', 'xanh', 'vàng', 'đen', 'trắng', 'xám', 'nâu', 'hồng', 'tím', 'cam', 'be'];
  const colors = allTags.filter(tag =>
    colorKeywords.some(color => tag.toLowerCase().includes(color))
  );
  const colorFreq = countFrequency(colors);
  const favoriteColors = Object.keys(colorFreq).slice(0, 5);

  // Style distribution
  const styleKeywords = ['công sở', 'thường ngày', 'thể thao', 'trang trọng', 'dạo phố', 'đi chơi'];
  const styleCounts: Record<string, number> = {};
  allTags.forEach(tag => {
    styleKeywords.forEach(style => {
      if (tag.toLowerCase().includes(style.toLowerCase())) {
        styleCounts[style] = (styleCounts[style] || 0) + 1;
      }
    });
  });

  const totalStyleTags = Object.values(styleCounts).reduce((a, b) => a + b, 0) || 1;
  const styleDistribution = Object.entries(styleCounts).map(([style, count]) => ({
    style,
    percentage: Math.round((count / totalStyleTags) * 100),
  }));

  return {
    totalOutfits: outfits.length,
    mostUsedTops: sortByFrequency(topsFreq, 5),
    mostUsedBottoms: sortByFrequency(bottomsFreq, 5),
    mostUsedTags: sortByFrequency(tagsFreq, 10),
    outfitsPerWeekday: weekdayCount,
    recentlyWorn,
    favoriteColors,
    styleDistribution,
  };
};

// Generate smart suggestions
export const generateSmartSuggestions = (outfits: Outfit[]): SmartSuggestion[] => {
  const suggestions: SmartSuggestion[] = [];

  if (outfits.length < 3) {
    return [{
      type: 'variety',
      message: 'Hãy ghi lại thêm trang phục để nhận được gợi ý thông minh!',
      priority: 'low',
      actionable: false,
    }];
  }

  const stats = calculateOutfitStats(outfits);
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Check for repeated items
  const recentOutfits = outfits.filter(o => new Date(o.date) > thirtyDaysAgo);
  if (recentOutfits.length >= 10) {
    const allItems = recentOutfits.flatMap(o => [...o.tops, ...o.bottoms]);
    const freq = countFrequency(allItems);
    const mostUsed = Object.entries(freq).sort(([, a], [, b]) => b - a)[0];

    if (mostUsed && mostUsed[1] > recentOutfits.length * 0.5) {
      suggestions.push({
        type: 'repeat',
        message: `Bạn đang mặc "${mostUsed[0]}" rất thường xuyên! Thử thay đổi phong cách nhé?`,
        priority: 'medium',
        actionable: true,
      });
    }
  }

  // Check for forgotten items
  const oldItems = stats.recentlyWorn.filter(item => {
    const lastWorn = new Date(item.lastWorn);
    const daysSince = (now.getTime() - lastWorn.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince > 45;
  });

  if (oldItems.length > 0) {
    suggestions.push({
      type: 'forgotten',
      message: `Đã lâu rồi bạn chưa mặc "${oldItems[0].tag}"! Thử kết hợp lại nhé?`,
      priority: 'low',
      actionable: true,
    });
  }

  // Seasonal suggestion
  const month = now.getMonth();
  if (month >= 5 && month <= 8) {
    const summerTags = stats.mostUsedTags.filter(t =>
      ['mát mẻ', 'thoáng', 'short', 'váy'].some(keyword => t.tag.toLowerCase().includes(keyword))
    );
    if (summerTags.length === 0 && outfits.length >= 10) {
      suggestions.push({
        type: 'seasonal',
        message: 'Mùa hè đến rồi! Hãy thử các trang phục mát mẻ, thoáng hơn nhé?',
        priority: 'high',
        actionable: true,
      });
    }
  }

  // Variety check
  const uniqueTops = new Set(outfits.flatMap(o => o.tops)).size;
  const uniqueBottoms = new Set(outfits.flatMap(o => o.bottoms)).size;

  if (outfits.length >= 20 && uniqueTops < 5) {
    suggestions.push({
      type: 'variety',
      message: 'Bạn chỉ đang xoay vòng một vài loại áo. Thử mua thêm để phong phú tủ đồ?',
      priority: 'medium',
      actionable: true,
    });
  }

  if (outfits.length >= 20 && uniqueBottoms < 5) {
    suggestions.push({
      type: 'variety',
      message: 'Thử thêm vài loại quần/váy mới để có nhiều sự lựa chọn hơn!',
      priority: 'medium',
      actionable: true,
    });
  }

  return suggestions;
};

// Get outfit recommendations based on history
export const getOutfitRecommendations = (outfits: Outfit[], currentDate: Date): string[] => {
  const recommendations: string[] = [];
  const weekday = WEEKDAY_NAMES[currentDate.getDay()];

  // Find outfits worn on same weekday
  const sameWeekdayOutfits = outfits.filter(o => {
    const date = new Date(o.date);
    return WEEKDAY_NAMES[date.getDay()] === weekday;
  });

  if (sameWeekdayOutfits.length > 0) {
    const allTops = sameWeekdayOutfits.flatMap(o => o.tops);
    const allBottoms = sameWeekdayOutfits.flatMap(o => o.bottoms);

    const topFreq = countFrequency(allTops);
    const bottomFreq = countFrequency(allBottoms);

    const topRec = sortByFrequency(topFreq, 3);
    const bottomRec = sortByFrequency(bottomFreq, 3);

    if (topRec.length > 0) {
      recommendations.push(`Ngày ${weekday}, bạn thường mặc: ${topRec.map(t => t.tag).join(', ')}`);
    }

    if (bottomRec.length > 0) {
      recommendations.push(`Kết hợp với: ${bottomRec.map(b => b.tag).join(', ')}`);
    }
  }

  return recommendations;
};
