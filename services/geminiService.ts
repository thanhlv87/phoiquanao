import { GoogleGenAI, Type } from "@google/genai";
import { AiTags } from '../types';

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const generateTagsFromImage = async (base64Image: string): Promise<AiTags> => {
  if (!process.env.API_KEY) {
    // Return mock data if API key is not available
    return {
      tops: ["Áo phông", "Áo họa tiết"],
      bottoms: ["Quần jeans", "Vải bò"],
      general: ["Thường ngày", "Đường phố", "Thoải mái"]
    };
  }

  const base64Data = base64Image.split(',')[1];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Data,
            },
          },
          { text: "Phân tích trang phục trong hình ảnh này. Xác định các loại áo, quần và các thẻ mô tả phong cách chung." },
        ],
      },
      config: {
        systemInstruction: "Bạn là một chuyên gia thời trang. Nhiệm vụ của bạn là phân tích hình ảnh trang phục và trả về các thẻ mô tả bằng tiếng Việt, theo định dạng JSON được yêu cầu. Chỉ sử dụng tiếng Việt.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tops: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Danh sách các loại áo được xác định, ví dụ: 'Áo phông', 'Áo hoodie'."
            },
            bottoms: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Danh sách các loại quần được xác định, ví dụ: 'Quần jeans', 'Quần short'."
            },
            general: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Danh sách các thẻ phong cách chung, ví dụ: 'Thường ngày', 'Trang trọng', 'Thể thao'."
            },
          },
        },
      },
    });

    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText);
    
    // Basic validation
    if (parsedJson && Array.isArray(parsedJson.tops) && Array.isArray(parsedJson.bottoms) && Array.isArray(parsedJson.general)) {
       return parsedJson as AiTags;
    } else {
      throw new Error("Invalid JSON structure from Gemini");
    }

  } catch (error) {
    console.error("Error calling Gemini API for image tagging:", error);
    // Fallback to mock data on error
    return {
      tops: ["Gợi ý AI thất bại"],
      bottoms: ["Không thể phân tích"],
      general: ["Lỗi"]
    };
  }
};

export const generateOutfitSuggestion = async (tags: string[]): Promise<string> => {
    if (!process.env.API_KEY) {
        return "Hãy thử một phong cách cổ điển: áo phông trắng, quần jeans xanh và đôi giày sneaker yêu thích của bạn. Đơn giản, thoải mái và luôn hợp thời trang!";
    }

    const prompt = `Dựa trên hồ sơ phong cách cá nhân của người dùng, hãy gợi ý một bộ trang phục hoàn chỉnh để họ mặc hôm nay. Các thẻ phong cách thường xuyên nhất của người dùng là: ${tags.join(', ')}. Giữ gợi ý ngắn gọn (2-3 câu), thân thiện và truyền cảm hứng. Không sử dụng markdown.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error calling Gemini API for outfit suggestion:", error);
        return "Hiện tại không thể tạo gợi ý. Tại sao không thử bộ trang phục thường ngày yêu thích của bạn?";
    }
};