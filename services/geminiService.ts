
import { GoogleGenAI } from "@google/genai";
import { NewsItem } from '../types';

export const generateMarketReport = async (newsItems: NewsItem[], dateStr: string): Promise<{ title: string, htmlContent: string }> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("系統未偵測到有效的 API Key，請確認環境設定。");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const newsContext = newsItems.map((item, idx) => `
    [新聞 ${idx + 1}] ${item.title}
    摘要: ${item.description.substring(0, 100)}
    ---
  `).join('\n');

  const prompt = `
你是一個專業的基金經理人，請製作一份「基金市場報告」。讀者為基金投資客戶。

**核心指令：**
1. 根據新聞資料，**挑選 4-5 個最重要的市場議題**進行分析。
2. **務必確保 HTML 標籤完整閉合**，若篇幅不夠，請優先結束文章，不要斷在 HTML 結構中。
3. 全文長度控制在 **500-600 個中文字** 左右。
4. **全文不提及特定加密貨幣名稱（如：比特幣、以太幣），請以「數位資產」替代。**
5. **最後的投資建議區塊，務必列舉 3-5 檔相關的具體基金名稱，並列示投資理由。**
6. 請輸出 JSON 格式，包含 "title" (18字以內的創意標題) 與 "htmlContent" (報告的 HTML 內容)。

**HTML 格式要求 (無內框卡片式設計)：**

<div style="max-width: 600px; margin: 0 auto; font-family: 'Microsoft JhengHei', Arial, sans-serif; color: #333; line-height: 1.8; background-color: #fcfcfc;">
  <!-- 標題區 -->
  <div style="background-color: #990000; padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0;">
    <div style="color: #fff; font-size: 24px; font-weight: bold; margin-top: 10px;">[請帶入你生成的創意標題]</div>
    <div style="color: rgba(255,255,255,0.8); font-size: 13px; margin-top: 15px;">${dateStr}</div>
  </div>

  <!-- 引言 -->
  <div style="padding: 30px 30px 10px 30px;">
      [在此撰寫約 100 字的市場總覽，重點數據使用 <strong style="color: #990000;">紅色高亮</strong>。不需要招呼語。]
  </div>

  <!-- 內容卡片 (無內框，使用陰影與白底) -->
  <div style="background-color: #ffffff; border-radius: 12px; padding: 25px 30px; margin: 15px 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
    <div style="font-size: 20px; color: #990000; font-weight: bold; margin-bottom: 12px; border-left: 4px solid #990000; padding-left: 12px;">議題標題</div>
    <div style="color: #444;">內文分析...重點數據使用 <strong style="color: #990000;">紅色高亮</strong>。</div>
  </div>

  <!-- 精選基金 -->
  <div style="background-color: #ffffff; border-radius: 12px; padding: 25px 30px; margin: 15px 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
    <div style="font-size: 20px; color: #990000; font-weight: bold; margin-bottom: 12px; border-left: 4px solid #990000; padding-left: 12px;">精選基金投資</div>
    <div style="color: #444;">請根據分析提供投資策略，並<strong style="color: #990000;">務必列舉 3-5 檔相關的具體基金名稱，並列示投資理由</strong>作為參考。</div>
  </div>
</div>

【新聞資料】：
${newsContext}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        temperature: 0.4,
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("AI 回傳了空內容。");
    }

    try {
      const parsed = JSON.parse(text);
      return {
        title: parsed.title || '基金市場報告',
        htmlContent: parsed.htmlContent || text
      };
    } catch (e) {
      // Fallback if JSON parsing fails
      return {
        title: '基金市場報告',
        htmlContent: text.replace(/^```html\s*/i, '').replace(/```\s*$/, '').trim()
      };
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes("API key not valid")) {
      throw new Error("無效的 API Key。請確認環境變數 API_KEY 已正確配置。");
    }
    throw error;
  }
};
