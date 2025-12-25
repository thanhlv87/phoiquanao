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

export const generateYearInReviewSummary = async (outfits: any[], year: number, stats: any): Promise<string> => {
  if (!process.env.API_KEY) {
    return `Năm ${year}, bạn đã có ${stats.totalOutfits} outfit được ghi lại! Phong cách của bạn thật đa dạng và thú vị. Những món đồ yêu thích như ${stats.favoriteItems[0]?.item || 'các trang phục'} đã đồng hành cùng bạn qua nhiều khoảnh khắc. Hãy tiếp tục khám phá và thể hiện bản thân qua thời trang trong năm mới nhé!`;
  }

  // Prepare data for AI
  const topItems = stats.favoriteItems.slice(0, 5).map((i: any) => i.item).join(', ');
  const mostWorn = stats.mostWornOutfit ?
    `${stats.mostWornOutfit.tops.join(', ')} + ${stats.mostWornOutfit.bottoms.join(', ')} (${stats.mostWornOutfit.count} lần)`
    : 'N/A';

  const allTags = outfits.flatMap(o => [...o.tops, ...o.bottoms, ...o.tags]);
  const tagCounts: Record<string, number> = {};
  allTags.forEach(tag => {
    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
  });
  const topTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([tag]) => tag)
    .join(', ');

  const prompt = `Bạn là một chuyên gia thời trang và phong cách sống. Hãy tạo một bản tổng kết cuối năm ${year} thú vị và ý nghĩa cho người dùng dựa trên dữ liệu trang phục của họ.

THÔNG TIN:
- Tổng số outfit: ${stats.totalOutfits}
- Số ngày ghi chép: ${stats.totalDaysRecorded}
- Tháng năng suất nhất: ${stats.mostProductiveMonth}
- Outfit được mặc nhiều nhất: ${mostWorn}
- Top 5 món đồ yêu thích: ${topItems}
- Các thẻ phong cách phổ biến: ${topTags}
- Số outfit độc đáo: ${stats.uniqueOutfits}
- Chuỗi ghi chép dài nhất: ${stats.recordingStreak} ngày

YÊU CẦU:
1. Viết 3-4 đoạn văn ngắn (khoảng 200-250 từ tổng)
2. Phân tích phong cách cá nhân của người dùng
3. Nhận xét về sự thay đổi/phát triển trong năm (nếu có dữ liệu đủ)
4. Khen ngợi những điểm tích cực
5. Đưa ra 2-3 gợi ý thú vị cho năm sau
6. Giọng văn thân thiện, truyền cảm hứng, tích cực
7. KHÔNG sử dụng markdown, emoji
8. Viết bằng tiếng Việt

Hãy tạo một bản tổng kết ấm áp, cá nhân hóa và đầy cảm hứng!`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error calling Gemini API for year in review:", error);
    return `Năm ${year} thật tuyệt vời với ${stats.totalOutfits} outfit được ghi lại! Phong cách của bạn đa dạng và độc đáo. Những món đồ yêu thích như ${topItems} đã đồng hành cùng bạn qua nhiều khoảnh khắc đáng nhớ. Năm mới, hãy tiếp tục thể hiện cá tính của mình qua thời trang nhé!`;
  }
};

export const generateCoordinatedImage = async (modelBase64: string, topBase64: string, bottomBase64: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY not set");
  }

  const modelData = modelBase64.split(',')[1];
  const topData = topBase64.split(',')[1];
  const bottomData = bottomBase64.split(',')[1];

  try {
    // Step 1: Use Gemini to analyze the images and create a detailed prompt
    const analysisResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: modelData } },
          { inlineData: { mimeType: 'image/jpeg', data: topData } },
          { inlineData: { mimeType: 'image/jpeg', data: bottomData } },
          { text: "Phân tích 3 hình ảnh: người mẫu, áo và quần. Tạo một prompt chi tiết bằng tiếng Anh để tạo ảnh người mẫu mặc bộ trang phục này. Bao gồm: tư thế, góc chụp, màu sắc, phong cách, chi tiết quần áo. Chỉ trả về prompt, không giải thích thêm." },
        ],
      },
    });

    const prompt = analysisResponse.text.trim();
    console.log("Generated prompt:", prompt);

    // Step 2: Use Imagen 3 to generate the coordinated image
    const imageResponse = await ai.models.generateImages({
      model: "imagen-3.0-generate-001",
      prompt: prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: "3:4",
      }
    });

    // Get the generated image
    if (imageResponse.images && imageResponse.images.length > 0) {
      const generatedImage = imageResponse.images[0];
      // The image should be in base64 format
      if (generatedImage.image) {
        return `data:image/png;base64,${generatedImage.image}`;
      }
    }

    throw new Error("No image generated from Imagen 3");
  } catch (error) {
    console.error("Error calling Gemini for coordination:", error);
    throw error;
  }
};