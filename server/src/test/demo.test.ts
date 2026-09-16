import { describe, expect, it } from 'vitest';
import { DemoBroker } from '../brokers/demo.js';
describe('DemoBroker', () => {
  it('supports order lifecycle and account math', async () => {
    const b = new DemoBroker();
    await b.connect({ login: 'x', password: 'x', server: 'Ostad-Demo' });
    const p = await b.placeOrder({
      symbol: 'BTCUSDT',
      side: 'buy',
      volume: 0.1,
      type: 'market',
      sl: 1,
    });
    expect('profit' in p).toBe(true);
    expect((await b.positions()).length).toBe(1);
    if (!('profit' in p)) throw new Error('Expected market order to create a position');
    await b.modifyPosition(p.id, undefined, 999999);
    expect((await b.account()).margin).toBeGreaterThan(0);
    await b.closePosition(p.id);
    expect((await b.positions()).length).toBe(0);
    await b.disconnect();
  });
  it('fills pending orders', async () => {
    const b = new DemoBroker();
    await b.connect({ login: 'x', password: 'x', server: 'Ostad-Demo' });
    const q = (await b.quotes())[0];
    await b.placeOrder({
      symbol: q.symbol,
      side: 'buy',
      volume: 1,
      type: 'limit',
      price: q.ask + 100000,
    });
    expect((await b.orders()).length).toBe(1);
    await b.disconnect();
  });
});
