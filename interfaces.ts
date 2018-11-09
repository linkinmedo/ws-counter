// Typescript Interface
export interface Message {
  user: string;
  country: string;
  add: boolean;
}

export interface Click {
  amount: number;
  new: number;
  clicksToday: number;
  time: Date;
}

export interface TodayClick {
  amount: number;
  time: Date;
}

export interface Country {
  name: string;
  flag: string;
  clicks: number;
}

export interface User {
  name: string;
  clicks: number;
  blocked: boolean;
}

export interface Data {
  clicks: number;
  oldClicks: number;
  todayClicks: number;
  countries: Array<{
    name: string;
    flag: string;
    clicks: number;
  }>;
}

export interface Client extends WebSocket {
  fouls?: number;
  country?: string;
  connected?: boolean;
  clicks?: number;
  name?: string;
}
