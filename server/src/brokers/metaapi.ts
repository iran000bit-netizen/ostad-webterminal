import { StubBrokerAdapter, accountFrom } from './base.js';
import type { AccountInfo, BrokerCredentials } from './types.js';
export class MetaApiBroker extends StubBrokerAdapter {
  readonly id = 'metaapi'; readonly name = 'MetaApi (MT4/MT5)';
  constructor() { super(['apiKey', 'accountId']); }
  async connect(creds: BrokerCredentials): Promise<AccountInfo> {
    this.requireCredentials(creds);
    const response = await fetch(`https://mt-client-api-v1.london.agiliumtrade.ai/users/current/accounts/${creds.accountId}/account-information`, { headers: { 'auth-token': creds.apiKey! } });
    if (!response.ok) throw new Error(`MetaApi authentication failed (${response.status})`);
    return accountFrom(creds, creds.server || 'MetaApi', await response.json() as Record<string, unknown>);
  }
}
