
import { Recipient } from './types';

export const RECIPIENTS_LIST: Recipient[] = [
  { email: 'jerry.hung@cmoneyfund.com.tw', name: '洪國寶' },
  { email: 'nancy.chen@cmoneyfund.com.tw', name: '陳亮君' },
];

export const PRIMARY_REVIEWER = RECIPIENTS_LIST[0];

export const SENDER_NAME = "CMoneyFund";

export const QUERY_SITES = '(site:news.cnyes.com/ OR site:fund.cnyes.com/IPO/ OR site:cmoney.tw/notes/?navId=cmoney_official OR site:moneydj.com/funddj/fundMarket.djhtm?a=broncho-1 OR site:fundsin.com.tw OR site:macromicro.me OR site:stockfeel.com.tw OR site:udn.com/news/cate/2/6645 OR site:finance.technews.tw OR site:fx168news.com OR finance.ettoday.net OR tw.stock.yahoo.com OR ctee.com.tw/livenews OR site:tw.tradingview.com/news/providers/reuters/ OR site:money.udn.com/money/vipbloomberg/time?edn_newestlist_vipbloomberg OR site:zh.cn.nikkei.com/ OR today.line.me/tw/ OR site:ctee.com.tw/wealth/fund OR site:news.google.com)';

export const QUERY_KEYWORDS = '(intitle:資金流向 OR intitle:加碼 OR intitle:減碼 OR intitle:申購 OR intitle:贖回 OR intitle:募集 OR intitle:規模) AND (基金 OR ETF OR 債券 OR 股票型 OR 科技股 OR 美債 OR 高收益 OR AI OR 半導體 OR 機器人 OR 算力 OR 川普 OR 貿易戰 OR 關稅 OR 降息 OR 軟著陸 OR 地緣政治 OR 中東 OR 油價) AND (基金 OR ETF OR 投資展望 OR 經理人 OR 研報)';

export const FOOTER_DISCLAIMER_HTML = `
    <div style="max-width: 600px; margin: 30px auto; font-family: 'Microsoft JhengHei', Arial, sans-serif; border-top: 1px solid #ddd; padding-top: 20px;">
      <div style="font-size: 12px; color: #999999; line-height: 1.6; text-align: justify; padding: 0 20px;">
        <strong>【投資警語】</strong><br>
        1. 投資一定有風險，基金投資有賺有賠，申購前應詳閱基金公開說明書。<br>
        2. 基金經金管會核准或同意生效，惟不表示絕無風險。基金經理公司以往之經理績效不保證基金之最低投資收益。<br>
        3. 本文提及之經濟走勢預測不必然代表本基金之績效。<br>
        <br>
        © 口袋證券投資顧問股份有限公司
      </div>
    </div>
`;
