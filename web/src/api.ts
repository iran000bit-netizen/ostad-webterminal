export type Quote = { symbol: string; bid: number; ask: number; time: number; digits: number };
export type Position = {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  volume: number;
  openPrice: number;
  openTime: number;
  sl?: number;
  tp?: number;
  profit: number;
  swap: number;
  commission: number;
};
export type ClosedPosition = {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  volume: number;
  openPrice: number;
  closePrice: number;
  openTime: number;
  closeTime: number;
  profit: number;
};
export type Order = {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'limit' | 'stop';
  volume: number;
  price: number;
  sl?: number;
  tp?: number;
  time: number;
};
export type Account = {
  login: string;
  name: string;
  server: string;
  currency: string;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  leverage: number;
};
export type Broker = {
  id: string;
  name: string;
  servers: string[];
  requires: string[];
  status: 'ready' | 'needs_api_key';
};
export type AppConfig = { depositAddress: string; allowedWallets: string[] };
const token = () => localStorage.getItem('ostad-token') || '';
export async function api<T>(path: string, options: RequestInit = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token()}`,
      ...options.headers,
    },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Request failed');
  return body as T;
}
export const login = (body: Record<string, unknown>) =>
  api<{ token: string; account: Account }>('/api/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });
export const getBrokers = () => api<Broker[]>('/api/brokers', { headers: {} });
export const order = (body: Record<string, unknown>) =>
  api('/api/orders', { method: 'POST', body: JSON.stringify(body) });
export const logout = () => api('/api/logout', { method: 'POST' });
export const getConfig = () => api<AppConfig>('/api/config', { headers: {} });
export const getHistory = () => api<ClosedPosition[]>('/api/history');
export const walletNonce = (address: string) =>
  api<{ message: string }>('/api/wallet/nonce', {
    method: 'POST',
    body: JSON.stringify({ address }),
  });
export const walletVerify = (address: string, signature: string) =>
  api<{ token: string; account: Account; address: string }>('/api/wallet/verify', {
    method: 'POST',
    body: JSON.stringify({ address, signature }),
  });
