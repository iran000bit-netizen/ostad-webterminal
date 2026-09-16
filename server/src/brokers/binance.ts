import { createHmac } from 'node:crypto';
import { StubBrokerAdapter, accountFrom } from './base.js';
import type { AccountInfo, BrokerCredentials } from './types.js';
export class BinanceBroker extends StubBrokerAdapter {
  readonly id = 'binance';
  readonly name = 'Binance';
  constructor() {
    super(['apiKey', 'apiSecret']);
  }
  async connect(creds: BrokerCredentials): Promise<AccountInfo> {
    this.requireCredentials(creds);
    const base =
      creds.server === 'Binance-Testnet'
        ? 'https://testnet.binance.vision'
        : 'https://api.binance.com';
    const query = `recvWindow=5000&timestamp=${Date.now()}`;
    const signature = createHmac('sha256', creds.apiSecret!).update(query).digest('hex');
    const response = await fetch(`${base}/api/v3/account?${query}&signature=${signature}`, {
      headers: { 'X-MBX-APIKEY': creds.apiKey! },
    });
    if (!response.ok) throw new Error(`Binance authentication failed (${response.status})`);
    const body = (await response.json()) as { accountType?: string; balances?: unknown[] };
    return accountFrom(creds, creds.server || 'Binance-Spot', { name: body.accountType ?? 'Spot' });
  }
}
