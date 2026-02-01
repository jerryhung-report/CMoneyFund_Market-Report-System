
import { GoogleGenAI } from "@google/genai";
import { NewsItem } from '../types';

export const generateMarketReport = async (newsItems: NewsItem[], dateStr: string): Promise<string> => {
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
3. 全文長度控制在 **900-1000 個中文字** 左右。
4. **全文不提及特定加密貨幣名稱（如：比特幣、以太幣），請以「數位資產」替代。**
5. **最後的投資建議區塊，務必列舉 3-5 檔相關的具體基金名稱，並列示投資理由。**
6. 請直接輸出 HTML 代碼，不要包含任何 Markdown 格式。

**HTML 格式要求：**

<div style="max-width: 600px; margin: 20px auto; font-family: 'Microsoft JhengHei', Arial, sans-serif; color: #444; line-height: 1.7; border: 1px solid #eee; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
  <!-- 標題區 -->
  <div style="background-color: #990000; padding: 40px 20px; text-align: center;">
    <div style="color: #fff; font-size: 16px; font-weight: bold;">基金市場報告</div>
    <div style="color: #fff; font-size: 18px; font-weight: bold; margin-top: 5px;">[請生成一個 18 字以內的創意副標題]</div>
    <div style="color: rgba(255,255,255,0.9); font-size: 14px; margin-top: 10px;">${dateStr}</div>
  </div>

  <!-- 引言 -->
  <div style="padding: 30px 25px 10px 25px;">
      [在此撰寫約 100 字的市場總覽，重點數據使用 <strong style="color: #990000;">紅色高亮</strong>。不需要招呼語。]
  </div>

  <!-- 內容卡片 -->
  <div style="background-color: #f2f2f2; border-radius: 12px; padding: 20px; margin: 15px 25px; border: 1px solid #f0f0f0;">
    <div style="font-size: 18px; color: #990000; font-weight: bold; margin-bottom: 10px;">議題標題</div>
    <div>內文分析...重點數據使用 <strong style="color: #990000;">紅色高亮</strong>。</div>
  </div>

  <!-- 精選基金 -->
  <div style="background-color: #f2f2f2; border-radius: 12px; padding: 20px; margin: 15px 25px; border: 1px solid #f0f0f0;">
    <div style="font-size: 18px; color: #990000; font-weight: bold; margin-bottom: 10px;">精選基金投資</div>
    <div>請根據分析提供投資策略，並<strong style="color: #990000;">務必列舉 3-5 檔相關的具體基金名稱，並列示投資理由</strong>作為參考。</div>
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
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("AI 回傳了空內容。");
    }

    return text.replace(/^```html\s*/i, '').replace(/```\s*$/, '').trim();
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes("API key not valid")) {
      throw new Error("無效的 API Key。請確認環境變數 API_KEY 已正確配置。");
    }
    throw error;
  }
};
