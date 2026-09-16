export type Side = 'buy' | 'sell';
export interface Quote { symbol: string; bid: number; ask: number; time: number; digits: number }
export interface Candle { time: number; open: number; high: number; low: number; close: number; volume: number }
export type Timeframe = 'M1'|'M5'|'M15'|'M30'|'H1'|'H4'|'D1'|'W1'|'MN';
export interface AccountInfo { login: string; name: string; server: string; currency: string; balance: number; equity: number; margin: number; freeMargin: number; leverage: number }
export interface Position { id: string; symbol: string; side: Side; volume: number; openPrice: number; openTime: number; sl?: number; tp?: number; profit: number; swap: number; commission: number }
export interface Order { id: string; symbol: string; side: Side; type: 'limit'|'stop'; volume: number; price: number; sl?: number; tp?: number; time: number }
export interface OrderRequest { symbol: string; side: Side; volume: number; type: 'market'|'limit'|'stop'; price?: number; sl?: number; tp?: number }
export interface BrokerCredentials { login: string; password: string; server: string; apiKey?: string; apiSecret?: string; accountId?: string }
export interface BrokerAdapter {
  readonly id: string; readonly name: string;
  connect(creds: BrokerCredentials): Promise<AccountInfo>; disconnect(): Promise<void>;
  symbols(): Promise<string[]>; quotes(): Promise<Quote[]>; candles(symbol:string,tf:Timeframe,limit:number):Promise<Candle[]>;
  account():Promise<AccountInfo>; positions():Promise<Position[]>; orders():Promise<Order[]>;
  placeOrder(req:OrderRequest):Promise<Position|Order>; closePosition(id:string,volume?:number):Promise<void>;
  modifyPosition(id:string,sl?:number,tp?:number):Promise<void>; cancelOrder(id:string):Promise<void>;
  onQuote(cb:(q:Quote)=>void):()=>void;
}
