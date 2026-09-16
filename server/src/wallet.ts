import { verifyMessage } from 'viem';
import type { BrokerAdapter, BrokerCredentials } from './brokers/types.js';
import { createAdapter } from './brokers/registry.js';
import { createSession } from './sessions.js';

const challenges = new Map<string, string>();
const config = (): BrokerCredentials & { brokerId?: string } => ({
  brokerId: process.env.OSTAD_BROKER,
  login: process.env.OSTAD_LOGIN ?? '',
  password: process.env.OSTAD_PASSWORD ?? '',
  server: process.env.OSTAD_SERVER ?? '',
  apiKey: process.env.OSTAD_API_KEY,
  apiSecret: process.env.OSTAD_API_SECRET,
  accountId: process.env.OSTAD_ACCOUNT_ID,
});
export const walletMessage = (address: string) => {
  const nonce = crypto.randomUUID();
  const message = `Ostad WebTerminal login\nAddress: ${address}\nNonce: ${nonce}\nIssued: ${new Date().toISOString()}`;
  challenges.set(address.toLowerCase(), message);
  return message;
};
export async function verifyWallet(address: string, signature: string) {
  const message = challenges.get(address.toLowerCase());
  if (!message) throw new Error('Wallet challenge expired or not found');
  const valid = await verifyMessage({ address: address as `0x${string}`, message, signature: signature as `0x${string}` });
  challenges.delete(address.toLowerCase());
  if (!valid) throw new Error('Invalid wallet signature');
  const settings = config();
  const brokerId = settings.brokerId ?? 'demo';
  const adapter: BrokerAdapter = createAdapter(brokerId);
  const account = await adapter.connect({ ...settings, login: address, password: settings.password || 'wallet' });
  return { token: createSession(adapter), account, address };
}
