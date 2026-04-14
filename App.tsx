
import React, { useState } from 'react';
import { 
  AppStatus, 
  NewsItem, 
  MarketReport 
} from './types';
import { 
  QUERY_SITES, 
  QUERY_KEYWORDS, 
  RECIPIENTS_LIST, 
  PRIMARY_REVIEWER,
  SENDER_NAME,
  FOOTER_DISCLAIMER_HTML
} from './constants';
import { generateMarketReport } from './services/geminiService';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [report, setReport] = useState<MarketReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [previewWidth, setPreviewWidth] = useState<'desktop' | 'mobile'>('desktop');
  const lastAutoRunDate = React.useRef<string | null>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  const fetchNewsData = async (): Promise<NewsItem[]> => {
    setStatus(AppStatus.FETCHING_NEWS);
    setError(null);
    addLog("正在從 Google RSS 抓取新聞...");
    
    const encodedQuery = encodeURIComponent(`${QUERY_SITES} ${QUERY_KEYWORDS}`);
    const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(`https://news.google.com/rss/search?q=${encodedQuery}&when:2d&hl=zh-TW&gl=TW&ceid=TW:zh-Hant`)}`;
    
    const response = await fetch(proxyUrl);
    const data = await response.json();

    if (data.status === 'ok') {
      const items: NewsItem[] = data.items.map((item: any) => ({
        title: item.title,
        description: item.description.replace(/<[^>]+>/g, '').trim(),
        link: item.link,
        pubDate: item.pubDate
      }));
      const slicedItems = items.slice(0, 12);
      setNews(slicedItems);
      addLog(`成功抓取 ${slicedItems.length} 則新聞。`);
      setStatus(AppStatus.IDLE);
      return slicedItems;
    } else {
      throw new Error("無法從 RSS 服務獲取數據。");
    }
  };

  const fetchNews = async () => {
    try {
      await fetchNewsData();
    } catch (err: any) {
      setError(err.message);
      setStatus(AppStatus.IDLE);
      addLog(`錯誤: ${err.message}`);
    }
  };

  const handleGenerateReport = async (newsData: NewsItem[] = news) => {
    if (newsData.length === 0) return;
    setStatus(AppStatus.GENERATING_REPORT);
    setError(null);
    addLog("啟動 AI 市場分析報告生成...");
    
    try {
      const today = new Date();
      const dateStr = today.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
      const { title, htmlContent } = await generateMarketReport(newsData, dateStr);
      
      setReport({ htmlContent, dateStr, title });
      addLog("報告生成成功，進入待審核狀態。");
      setStatus(AppStatus.REVIEWING);
    } catch (err: any) {
      console.error("Report Generation Failed:", err);
      setError(err.message || "發生未知錯誤，請重試。");
      setStatus(AppStatus.IDLE);
      addLog(`生成失敗: ${err.message}`);
    }
  };

  // 自動排程邏輯：每天早上 08:30 自動執行
  React.useEffect(() => {
    const checkSchedule = async () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const todayStr = now.toLocaleDateString('zh-TW');

      // 檢查是否為 08:30 且今天尚未自動執行過
      if (currentHour === 8 && currentMinute === 30 && lastAutoRunDate.current !== todayStr) {
        lastAutoRunDate.current = todayStr;
        addLog("⏰ 觸發自動排程：開始每日 08:30 自動生成報告流程...");
        
        try {
          const fetchedNews = await fetchNewsData();
          if (fetchedNews && fetchedNews.length > 0) {
            await handleGenerateReport(fetchedNews);
          }
        } catch (err: any) {
          addLog(`自動排程執行失敗: ${err.message}`);
        }
      }
    };

    // 每 30 秒檢查一次時間
    const intervalId = setInterval(checkSchedule, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const sendToPrimary = () => {
    addLog(`正在發送審核郵件至主要審核人: ${PRIMARY_REVIEWER.name}...`);
    setTimeout(() => {
      setStatus(AppStatus.SENT_TO_PRIMARY);
      addLog(`郵件已寄送至 ${PRIMARY_REVIEWER.email}，等待審核。`);
    }, 1500);
  };

  const approveAndSendAll = () => {
    addLog("審核通過！正在將正式報告以密件副本 (BCC) 發送給所有收件人...");
    setTimeout(() => {
      setStatus(AppStatus.COMPLETED);
      addLog("全部發送完畢，工作流程結束。");
    }, 2000);
  };

  const reset = () => {
    setStatus(AppStatus.IDLE);
    setNews([]);
    setReport(null);
    setError(null);
    setLogs([]);
  };

  const getReviewGreeting = (name: string) => {
    const isPartner = name === '投資夥伴';
    return `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Microsoft JhengHei', Arial, sans-serif; color: #333; font-size: 16px; padding: 20px 30px 0 30px;">
        親愛的${isPartner ? '' : ' '}<strong>${name}</strong> 您好：
      </div>
    `;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-red-800 text-white p-4 shadow-md sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-red-800 font-bold text-xl">CM</div>
          <div>
            <h1 className="text-lg font-bold leading-none tracking-tight">CMoneyFund 市場分析報告系統</h1>
            <p className="text-xs text-red-200">AI-Powered Fund Report Workflow</p>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={reset} className="bg-red-900/50 hover:bg-red-900 px-3 py-1 rounded text-sm transition-colors">重設流程</button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-800">
              <span className="w-2 h-6 bg-red-600 rounded-full"></span>
              執行流程 (Workflow)
            </h2>
            
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border-2 transition-all ${news.length > 0 ? 'border-green-100 bg-green-50' : 'border-slate-100 bg-slate-50'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-500 uppercase">1. 抓取資料</span>
                  {news.length > 0 && <span className="text-green-600 text-xs font-bold">✓ 已抓取</span>}
                </div>
                <button 
                  disabled={status === AppStatus.FETCHING_NEWS || news.length > 0}
                  onClick={fetchNews}
                  className={`w-full py-2 rounded-lg font-semibold transition-colors ${news.length > 0 ? 'bg-green-600 text-white opacity-50 cursor-default' : 'bg-red-700 text-white hover:bg-red-800'}`}
                >
                  {status === AppStatus.FETCHING_NEWS ? "抓取中..." : "抓取今日市場新聞"}
                </button>
              </div>

              <div className={`p-4 rounded-xl border-2 transition-all ${report ? 'border-green-100 bg-green-50' : error && status === AppStatus.IDLE ? 'border-red-100 bg-red-50' : 'border-slate-100 bg-slate-50'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-500 uppercase">2. AI 生成報告</span>
                  {report && <span className="text-green-600 text-xs font-bold">✓ 已生成</span>}
                </div>
                <button 
                  disabled={news.length === 0 || status === AppStatus.GENERATING_REPORT || !!report}
                  onClick={handleGenerateReport}
                  className="w-full py-2 bg-red-700 text-white rounded-lg font-semibold hover:bg-red-800 disabled:opacity-50 transition-colors"
                >
                  {status === AppStatus.GENERATING_REPORT ? "AI 分析中..." : report ? "報告已生成" : "生成初稿報告"}
                </button>
              </div>

              <div className={`p-4 rounded-xl border-2 transition-all ${status === AppStatus.SENT_TO_PRIMARY || status === AppStatus.COMPLETED ? 'border-green-100 bg-green-50' : 'border-slate-100 bg-slate-50'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-500 uppercase">3. 審核與分發</span>
                  {status === AppStatus.COMPLETED && <span className="text-green-600 text-xs font-bold">✓ 已完成</span>}
                </div>
                
                {status === AppStatus.REVIEWING && (
                  <button 
                    onClick={sendToPrimary}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    發送給 {PRIMARY_REVIEWER.name} 審核
                  </button>
                )}

                {status === AppStatus.SENT_TO_PRIMARY && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 bg-blue-100 border border-blue-200 rounded text-blue-800 text-xs italic">
                       <span className="animate-pulse w-2 h-2 bg-blue-600 rounded-full"></span>
                       等待 {PRIMARY_REVIEWER.name} 手動同意...
                    </div>
                    <button 
                      onClick={approveAndSendAll}
                      className="w-full py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                    >
                      手動同意以密件 (BCC) 發送給全體
                    </button>
                  </div>
                )}

                {status === AppStatus.COMPLETED && (
                  <div className="p-2 bg-green-100 border border-green-200 rounded-lg text-center">
                    <p className="text-green-800 text-sm font-bold">報告已全數寄出！</p>
                  </div>
                )}
                
                {(status === AppStatus.IDLE || status === AppStatus.FETCHING_NEWS) && !report && (
                   <p className="text-xs text-slate-400 text-center mt-2 italic">請先完成前兩步驟</p>
                )}
              </div>
            </div>
          </section>

          <section className="bg-slate-900 text-slate-300 p-4 rounded-2xl shadow-inner h-[250px] overflow-y-auto font-mono text-xs">
            <h3 className="text-slate-500 mb-2 uppercase tracking-widest font-bold">執行日誌</h3>
            <div className="space-y-1">
              {logs.map((log, i) => (
                <div key={i} className="border-l-2 border-slate-700 pl-2 py-1 leading-relaxed">
                  {log}
                </div>
              ))}
              {logs.length === 0 && <p className="text-slate-600 italic">無活動日誌...</p>}
            </div>
          </section>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-6">
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col min-h-[600px]">
            <div className="border-b border-slate-100 p-4 bg-slate-50 flex justify-between items-center">
              <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                 <svg className="w-5 h-5 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                 預覽報告 (Email View)
              </h2>
              <div className="flex gap-2">
                {report && <span className="text-xs bg-red-100 px-2 py-1 rounded text-red-700 font-bold uppercase">Draft</span>}
                <div className="flex bg-slate-200 rounded p-0.5">
                  <button 
                    onClick={() => setPreviewWidth('desktop')}
                    className={`text-xs px-2 py-1 rounded transition-colors ${previewWidth === 'desktop' ? 'bg-white shadow text-slate-800 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    桌機版 (600px)
                  </button>
                  <button 
                    onClick={() => setPreviewWidth('mobile')}
                    className={`text-xs px-2 py-1 rounded transition-colors ${previewWidth === 'mobile' ? 'bg-white shadow text-slate-800 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    手機版 (390px)
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 flex justify-center items-start">
              {report ? (
                <div className={`bg-white shadow-xl overflow-hidden rounded-xl h-fit border border-slate-200 transition-all duration-300 ${previewWidth === 'desktop' ? 'max-w-[600px] w-full' : 'max-w-[390px] w-full'}`}>
                   <div className="bg-slate-100 p-3 border-b border-slate-200 text-xs text-slate-600 flex flex-col gap-1">
                      <div><strong>寄件人:</strong> {SENDER_NAME}</div>
                      <div><strong>主旨:</strong> 📈 {report.title}</div>
                      <div>
                        <strong>{status === AppStatus.REVIEWING || status === AppStatus.SENT_TO_PRIMARY ? '收件人:' : '密件副本 (BCC):'}</strong> {status === AppStatus.REVIEWING || status === AppStatus.SENT_TO_PRIMARY ? PRIMARY_REVIEWER.name : '全體收件人'}
                      </div>
                   </div>
                   <div className="py-2 px-0 bg-[#fcfcfc]">
                     <div dangerouslySetInnerHTML={{ __html: getReviewGreeting(status === AppStatus.REVIEWING || status === AppStatus.SENT_TO_PRIMARY ? PRIMARY_REVIEWER.name : '投資夥伴') }} />
                     <div dangerouslySetInnerHTML={{ __html: report.htmlContent }} />
                     <div dangerouslySetInnerHTML={{ __html: FOOTER_DISCLAIMER_HTML }} />
                   </div>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6 max-w-md">
                   <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                   </div>
                   <h3 className="text-lg font-bold text-slate-800 mb-2">報告生成失敗</h3>
                   <p className="text-sm text-slate-500 mb-4 leading-relaxed">{error}</p>
                   <button 
                    onClick={handleGenerateReport}
                    className="px-6 py-2 bg-red-700 text-white rounded-lg font-semibold hover:bg-red-800 transition-colors"
                   >
                     重新嘗試生成
                   </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center px-6">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                     <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                     </svg>
                  </div>
                  <p className="text-lg font-medium text-slate-500">尚無報告初稿</p>
                  <p className="text-sm max-w-xs mt-1">請依照左側流程執行資料抓取與 AI 分析生成報告預覽。</p>
                </div>
              )}
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
             <h3 className="text-lg font-semibold mb-4 text-slate-700 flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                收件清單 (將以密件 BCC 寄送)
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {RECIPIENTS_LIST.map((r, i) => (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${i === 0 ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                        {r.name.substring(0, 1)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{r.name}</div>
                        <div className="text-xs text-slate-500">{r.email}</div>
                      </div>
                    </div>
                    {i === 0 ? (
                      <span className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded font-black uppercase tracking-tight">主要審核人</span>
                    ) : (
                      <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-1 rounded font-bold uppercase tracking-tight">密件收件人</span>
                    )}
                  </div>
                ))}
             </div>
          </section>
        </div>
      </main>

      {error && (
        <div className="fixed bottom-6 right-6 bg-red-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 z-[100] animate-slide-in">
          <div className="flex-1">
            <h4 className="font-bold text-sm">系統錯誤</h4>
            <p className="text-xs opacity-90">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="p-1 hover:bg-white/20 rounded">✕</button>
        </div>
      )}
    </div>
  );
};

export default App;
