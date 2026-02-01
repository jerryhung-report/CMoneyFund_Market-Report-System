
export interface Recipient {
  email: string;
  name: string;
}

export interface NewsItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  FETCHING_NEWS = 'FETCHING_NEWS',
  GENERATING_REPORT = 'GENERATING_REPORT',
  REVIEWING = 'REVIEWING',
  SENT_TO_PRIMARY = 'SENT_TO_PRIMARY',
  APPROVED = 'APPROVED',
  COMPLETED = 'COMPLETED'
}

export interface MarketReport {
  htmlContent: string;
  dateStr: string;
}
