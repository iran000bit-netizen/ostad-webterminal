import type {
  AccountInfo,
  BrokerAdapter,
  BrokerCredentials,
  Candle,
  ClosedPosition,
  Order,
  OrderRequest,
  Position,
  Quote,
  Timeframe,
} from './types.js';

export class BrokerNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BrokerNotConfiguredError';
  }
}
export abstract class StubBrokerAdapter implements BrokerAdapter {
  abstract readonly id: string;
  abstract readonly name: string;
  constructor(private readonly required: (keyof BrokerCredentials)[]) {}
  protected requireCredentials(creds: BrokerCredentials) {
    const missing = this.required.filter((key) => !creds[key]);
    if (missing.length)
      throw new BrokerNotConfiguredError(
        `${this.name} adapter requires API credentials; set ${missing.join(' and ')} — see docs/brokers.md`,
      );
  }
  protected notImplemented(): never {
    throw new Error(`${this.name} trading methods are not implemented yet`);
  }
  abstract connect(creds: BrokerCredentials): Promise<AccountInfo>;
  async disconnect() {}
  onQuote(_cb: (q: Quote) => void) {
    return () => {};
  }
  async symbols(): Promise<string[]> {
    return this.notImplemented();
  }
  async quotes(): Promise<Quote[]> {
    return this.notImplemented();
  }
  async candles(_symbol: string, _tf: Timeframe, _limit: number): Promise<Candle[]> {
    return this.notImplemented();
  }
  async account(): Promise<AccountInfo> {
    return this.notImplemented();
  }
  async positions(): Promise<Position[]> {
    return this.notImplemented();
  }
  async orders(): Promise<Order[]> {
    return this.notImplemented();
  }
  async history(): Promise<ClosedPosition[]> {
    return this.notImplemented();
  }
  async placeOrder(_req: OrderRequest): Promise<Position | Order> {
    return this.notImplemented();
  }
  async closePosition(_id: string, _volume?: number) {
    this.notImplemented();
  }
  async modifyPosition(_id: string, _sl?: number, _tp?: number) {
    this.notImplemented();
  }
  async cancelOrder(_id: string) {
    this.notImplemented();
  }
}
export const accountFrom = (
  creds: BrokerCredentials,
  server: string,
  data: Record<string, unknown> = {},
): AccountInfo => ({
  login: creds.accountId ?? creds.login,
  name: String(data.name ?? creds.login),
  server,
  currency: String(data.currency ?? 'USD'),
  balance: Number(data.balance ?? 0),
  equity: Number(data.equity ?? data.balance ?? 0),
  margin: Number(data.margin ?? 0),
  freeMargin: Number(data.freeMargin ?? data.free_margin ?? data.balance ?? 0),
  leverage: Number(data.leverage ?? 100),
});
