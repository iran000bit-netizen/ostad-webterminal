import { StubBrokerAdapter, accountFrom } from './base.js';
import type { AccountInfo, BrokerCredentials } from './types.js';
export class AlpacaBroker extends StubBrokerAdapter {
  readonly id = 'alpaca'; readonly name = 'Alpaca';
  constructor() { super(['apiKey', 'apiSecret']); }
  async connect(creds: BrokerCredentials): Promise<AccountInfo> {
    this.requireCredentials(creds);
    const host = creds.server === 'Alpaca-Live' ? 'api.alpaca.markets' : 'paper-api.alpaca.markets';
    const response = await fetch(`https://${host}/v2/account`, { headers: { 'APCA-API-KEY-ID': creds.apiKey!, 'APCA-API-SECRET-KEY': creds.apiSecret! } });
    if (!response.ok) throw new Error(`Alpaca authentication failed (${response.status})`);
    const body = await response.json() as Record<string, unknown>;
    return accountFrom(creds, creds.server || 'Alpaca-Paper', { ...body, balance: body.cash, equity: body.equity, freeMargin: body.buying_power });
  }
}
