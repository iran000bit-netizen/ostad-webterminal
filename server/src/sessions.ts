import type { BrokerAdapter } from './brokers/types.js';
const sessions = new Map<string, BrokerAdapter>();
let auto: {
  enabled: boolean;
  token?: string;
  account?: Awaited<ReturnType<BrokerAdapter['account']>>;
  brokerId?: string;
  error?: string;
} = { enabled: false };
export const createSession = (adapter: BrokerAdapter) => {
  const token = crypto.randomUUID();
  sessions.set(token, adapter);
  return token;
};
export const getSession = (token?: string) => (token ? sessions.get(token) : undefined);
export const removeSession = (token: string) => {
  const adapter = sessions.get(token);
  if (adapter) adapter.disconnect().catch(() => {});
  sessions.delete(token);
};
export async function initializeAutoConnect() {
  const brokerId = process.env.OSTAD_BROKER;
  if (!brokerId) {
    auto = { enabled: false };
    return auto;
  }
  try {
    const { createAdapter } = await import('./brokers/registry.js');
    const adapter = createAdapter(brokerId);
    const account = await adapter.connect({
      login: process.env.OSTAD_LOGIN ?? '',
      password: process.env.OSTAD_PASSWORD ?? '',
      server: process.env.OSTAD_SERVER ?? '',
      apiKey: process.env.OSTAD_API_KEY,
      apiSecret: process.env.OSTAD_API_SECRET,
      accountId: process.env.OSTAD_ACCOUNT_ID,
    });
    auto = { enabled: true, token: createSession(adapter), account, brokerId };
    return auto;
  } catch (e) {
    auto = { enabled: false, error: e instanceof Error ? e.message : 'Auto-connect failed' };
    return auto;
  }
}
export const autoConnection = () => auto;
