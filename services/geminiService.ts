
import { GoogleGenAI, Type } from "@google/genai";
import { AiTags, WardrobeItem } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  // Check for undefined, null, or empty string (common with build tool replacements)
  if (!apiKey || apiKey.trim() === "") return null;
  return new GoogleGenAI({ apiKey });
};

// Hàm xử lý đầu vào ảnh: Ưu tiên Base64 có sẵn từ Firestore
const getRawBase64 = async (input: string): Promise<string> => {
  if (!input) return "";
  
  // 1. Nếu là Base64 chuẩn (data:image...) -> Dữ liệu từ Firestore sẽ rơi vào đây
  if (input.startsWith('data:')) {
    return input.split(',')[1];
  }

  // 2. Nếu là URL (Dữ liệu cũ hoặc link ngoài)
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
         console.warn("Không thể tải ảnh từ URL (có thể do CORS):", input);
         return ""; 
     }
  }

  // 3. Raw base64 string
  return input;
};

export const isolateClothingItem = async (imageInput: string, category: string): Promise<string> => {
  const ai = getAiClient();
  if (!ai) throw new Error("Chưa cấu hình API Key.");

  try {
    const rawB64 = await getRawBase64(imageInput);
    if (!rawB64) throw new Error("Dữ liệu ảnh không hợp lệ.");

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: rawB64 } },
          { text: `Isolate the ${category} in this image. Remove background. Return only the object on white background.` },
        ],
      },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) return `data:image/jpeg;base64,${part.inlineData.data}`;
      }
    }
    return imageInput;
  } catch (error) {
    console.error("Isolation failed:", error);
    return imageInput;
  }
};

export const generateMixImage = async (
    modelInput: string, 
    topInput: string, 
    bottomInput: string
): Promise<string> => {
    // Sử dụng helper getAiClient để kiểm tra key trước khi khởi tạo
    const ai = getAiClient();
    if (!ai) throw new Error("Chưa cấu hình API Key. Vui lòng kiểm tra file .env");

    try {
        const [modelB64, topB64, bottomB64] = await Promise.all([
            getRawBase64(modelInput),
            getRawBase64(topInput),
            getRawBase64(bottomInput)
        ]);

        if (!modelB64 || !topB64 || !bottomB64) {
             throw new Error("Không thể tải dữ liệu ảnh. Vui lòng đảm bảo bạn đang sử dụng ảnh mới (đã lưu vào Firestore).");
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { text: 'Model Image:' },
                    { inlineData: { mimeType: 'image/jpeg', data: modelB64 } },
                    { text: 'Clothing Top:' },
                    { inlineData: { mimeType: 'image/jpeg', data: topB64 } },
                    { text: 'Clothing Bottom:' },
                    { inlineData: { mimeType: 'image/jpeg', data: bottomB64 } },
                    { text: 'Virtual Try-On Task: Realisticly dress the person in the Model Image with the Clothing Top and Clothing Bottom. Maintain the original pose, lighting, and background. Ensure high realism.' },
                ],
            },
            config: { imageConfig: { aspectRatio: "3:4" } }
        });

        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) return `data:image/jpeg;base64,${part.inlineData.data}`;
            }
        }
        throw new Error("AI không trả về kết quả hình ảnh.");
    } catch (error: any) {
        console.error("Mix Image error details:", error);
        if (error.message) throw error;
        throw new Error("Lỗi không xác định khi phối đồ.");
    }
};

export const analyzeWardrobeItem = async (imageInput: string): Promise<Partial<WardrobeItem>> => {
  const ai = getAiClient();
  if (!ai) throw new Error("Chưa cấu hình API Key.");
  
  const rawB64 = await getRawBase64(imageInput);
  if (!rawB64) throw new Error("Lỗi dữ liệu ảnh phân tích.");

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: rawB64 } },
        { text: "Classify fashion item. Return JSON: category ('top', 'bottom', 'skirt', 'dress'), tags (array), color, material." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING, enum: ['top', 'bottom', 'skirt', 'dress'] },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          color: { type: Type.STRING },
          material: { type: Type.STRING }
        },
        required: ["category"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

export const generateTagsFromImage = async (imageInput: string): Promise<AiTags> => {
  const ai = getAiClient();
  if (!ai) return { tops: [], bottoms: [], general: [] };
  
  const rawB64 = await getRawBase64(imageInput);
  if (!rawB64) return { tops: [], bottoms: [], general: [] };

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: rawB64 } },
        { text: "Extract fashion tags. JSON: tops, bottoms, general." }
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
        }
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

export const suggestComboFromWardrobe = async (wardrobe: WardrobeItem[], request: string) => {
    const ai = getAiClient();
    if (!ai) return { topId: '', bottomId: '', reason: 'No API Key' };
    const prompt = `Wardrobe: ${JSON.stringify(wardrobe.map(i => ({id: i.id, cat: i.category, tags: i.tags})))}. User context: ${request}. Pick 1 top and 1 bottom ID. JSON {topId, bottomId, reason}.`;
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    topId: { type: Type.STRING },
                    bottomId: { type: Type.STRING },
                    reason: { type: Type.STRING }
                }
            }
        }
    });
    return JSON.parse(response.text || "{}");
};

export const generateOutfitSuggestion = async (tags: string[]): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "";
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Suggestion for: ${tags.join(', ')}`,
    });
    return response.text || "";
};
