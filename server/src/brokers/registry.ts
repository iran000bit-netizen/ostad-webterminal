import type { BrokerAdapter } from './types.js';
import { DemoBroker } from './demo.js';
import { MetaApiBroker } from './metaapi.js';
import { OandaBroker } from './oanda.js';
import { AlpacaBroker } from './alpaca.js';
import { BinanceBroker } from './binance.js';
export const BROKERS = [
  {
    id: 'demo',
    name: 'Ostad Demo',
    servers: ['Ostad-Demo'],
    requires: ['login', 'password'] as const,
    status: 'ready' as const,
  },
  {
    id: 'metaapi',
    name: 'MetaApi (MT4/MT5)',
    servers: ['MetaApi'],
    requires: ['apiKey', 'accountId'] as const,
    status: 'needs_api_key' as const,
  },
  {
    id: 'oanda',
    name: 'OANDA',
    servers: ['OANDA-Practice', 'OANDA-Live'],
    requires: ['apiKey', 'accountId'] as const,
    status: 'needs_api_key' as const,
  },
  {
    id: 'alpaca',
    name: 'Alpaca',
    servers: ['Alpaca-Paper', 'Alpaca-Live'],
    requires: ['apiKey', 'apiSecret'] as const,
    status: 'needs_api_key' as const,
  },
  {
    id: 'binance',
    name: 'Binance',
    servers: ['Binance-Spot', 'Binance-Testnet'],
    requires: ['apiKey', 'apiSecret'] as const,
    status: 'needs_api_key' as const,
  },
];
export function createAdapter(id: string): BrokerAdapter {
  if (id === 'demo') return new DemoBroker();
  if (id === 'metaapi') return new MetaApiBroker();
  if (id === 'oanda') return new OandaBroker();
  if (id === 'alpaca') return new AlpacaBroker();
  if (id === 'binance') return new BinanceBroker();
  throw new Error('Unknown broker');
}
export { BrokerNotConfiguredError } from './base.js';
