
import { GoogleGenAI, Type } from "@google/genai";
import { AiTags, WardrobeItem } from '../types';

// Sử dụng helper để luôn khởi tạo client mới với API KEY từ môi trường
const getAi = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const getRawBase64 = async (input: string): Promise<string> => {
  if (!input) return "";
  if (input.startsWith('data:')) return input.split(',')[1];
  if (input.startsWith('http')) {
     try {
        const response = await fetch(input);
        if (!response.ok) throw new Error("Fetch failed");
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(blob);
        });
     } catch (e) {
         console.warn("Không thể tải ảnh từ URL:", input);
         return ""; 
     }
  }
  return input;
};

export const generateTagsFromImage = async (imageInput: string): Promise<AiTags> => {
  const ai = getAi();
  const rawB64 = await getRawBase64(imageInput);
  if (!rawB64) throw new Error("Lỗi dữ liệu ảnh phân tích.");

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: rawB64 } },
        { text: "Phân tích trang phục trong ảnh. Trả về JSON: tops (mảng các tag cho phần áo bằng tiếng Việt), bottoms (mảng các tag cho phần quần/váy bằng tiếng Việt), general (mảng các tag phong cách chung bằng tiếng Việt). Toàn bộ tag phải là tiếng Việt." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          tops: { type: Type.ARRAY, items: { type: Type.STRING } },
          bottoms: { type: Type.ARRAY, items: { type: Type.STRING } },
          general: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["tops", "bottoms", "general"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{"tops":[],"bottoms":[],"general":[]}');
  } catch (e) {
    console.error("Failed to parse tags:", e);
    return { tops: [], bottoms: [], general: [] };
  }
};

// Phân tích thông tin chi tiết của một món đồ trong tủ đồ
export const analyzeWardrobeItem = async (imageInput: string): Promise<{ category: string, tags: string[], color: string, material: string }> => {
  const ai = getAi();
  const rawB64 = await getRawBase64(imageInput);
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: rawB64 } },
        { text: "Phân tích món đồ thời trang này. Trả về JSON: category (một trong: top, bottom, skirt, dress, shoe, accessory), tags (mảng các tag mô tả bằng tiếng Việt), color (màu sắc chính bằng tiếng Việt), material (chất liệu bằng tiếng Việt)." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          color: { type: Type.STRING },
          material: { type: Type.STRING }
        },
        required: ["category", "tags", "color", "material"]
      }
    }
  });
  return JSON.parse(response.text || '{}');
};

// Tách món đồ ra khỏi nền ảnh
export const isolateClothingItem = async (imageInput: string, category: string): Promise<string> => {
  const ai = getAi();
  const rawB64 = await getRawBase64(imageInput);
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: rawB64 } },
        { text: `Tách món đồ (${category}) ra khỏi nền. Trả về ảnh món đồ trên nền trắng tinh.` }
      ]
    }
  });
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return imageInput;
};

// Tạo ảnh phối đồ bằng cách mặc áo và quần lên người mẫu
export const generateMixImage = async (modelImage: string, topImage: string, bottomImage: string): Promise<string> => {
  const ai = getAi();
  const modelB64 = await getRawBase64(modelImage);
  const topB64 = await getRawBase64(topImage);
  const bottomB64 = await getRawBase64(bottomImage);
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: modelB64 } },
        { inlineData: { mimeType: 'image/jpeg', data: topB64 } },
        { inlineData: { mimeType: 'image/jpeg', data: bottomB64 } },
        { text: "Hãy mặc chiếc áo và chiếc quần này lên người mẫu trong ảnh. Trả về ảnh kết quả cuối cùng chất lượng cao." }
      ]
    }
  });
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Không thể tạo ảnh phối đồ.");
};

// Gợi ý bộ phối đồ từ tủ đồ hiện có theo phong cách yêu cầu
export const suggestComboFromWardrobe = async (wardrobe: WardrobeItem[], style: string): Promise<{ topId: string, bottomId: string, reason: string }> => {
  const ai = getAi();
  const wardrobeDesc = wardrobe.map(item => `ID: ${item.id}, Loại: ${item.category}, Tags: ${item.tags.join(', ')}, Màu: ${item.color}`).join('\n');
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Dưới đây là danh sách tủ đồ của tôi:\n${wardrobeDesc}\n\nHãy gợi ý 1 bộ phối đồ (1 topId và 1 bottomId) theo phong cách: ${style}. Trả về JSON: topId, bottomId, reason (lý do phối đồ bằng tiếng Việt).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          topId: { type: Type.STRING },
          bottomId: { type: Type.STRING },
          reason: { type: Type.STRING }
        },
        required: ["topId", "bottomId", "reason"]
      }
    }
  });
  return JSON.parse(response.text || '{}');
};
