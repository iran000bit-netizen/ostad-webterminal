import { StubBrokerAdapter, accountFrom } from './base.js';
import type { AccountInfo, BrokerCredentials } from './types.js';
export class OandaBroker extends StubBrokerAdapter {
  readonly id = 'oanda';
  readonly name = 'OANDA';
  constructor() {
    super(['apiKey', 'accountId']);
  }
  async connect(creds: BrokerCredentials): Promise<AccountInfo> {
    this.requireCredentials(creds);
    const host =
      creds.server === 'OANDA-Live' ? 'api-fxtrade.oanda.com' : 'api-fxpractice.oanda.com';
    const response = await fetch(`https://${host}/v3/accounts/${creds.accountId}`, {
      headers: { Authorization: `Bearer ${creds.apiKey!}` },
    });
    if (!response.ok) throw new Error(`OANDA authentication failed (${response.status})`);
    const body = (await response.json()) as { account?: Record<string, unknown> };
    const account = body.account ?? {};
    return accountFrom(creds, creds.server || 'OANDA-Practice', {
      ...account,
      balance: account.balance,
      equity: account.NAV,
      margin: account.marginUsed,
      freeMargin: account.marginAvailable,
      leverage: 100,
    });
  }
}
