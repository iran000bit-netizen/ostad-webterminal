import { useState } from 'react';
import type { Quote } from '../api';
import { api, order, type Order } from '../api';
import { useTerminal } from '../store';

type OrderDialogProps = { quote?: Quote; onClose: () => void };

export function OrderDialog({ quote, onClose }: OrderDialogProps) {
  const [symbol, setSymbol] = useState(quote?.symbol || 'BTCUSDT');
  const [volume, setVolume] = useState<number | ''>(0.1);
  const [type, setType] = useState<'market' | 'limit' | 'stop'>('market');
  const [price, setPrice] = useState('');
  const [sl, setSl] = useState('');
  const [tp, setTp] = useState('');
  const [error, setError] = useState('');
  const log = useTerminal((state) => state.log);
  const liveQuote = useTerminal((state) => state.quotes.find((item) => item.symbol === symbol));
  const currentQuote = liveQuote ?? quote;

  async function submit(side: 'buy' | 'sell') {
    try {
      if (typeof volume !== 'number' || !Number.isFinite(volume) || volume <= 0) {
        throw new Error('Volume must be positive');
      }
      await order({
        symbol,
        side,
        volume,
        type,
        price: price ? +price : undefined,
        sl: sl ? +sl : undefined,
        tp: tp ? +tp : undefined,
      });
      const orders = await api<Order[]>('/api/orders');
      useTerminal.getState().set({ orders });
      log(`${side.toUpperCase()} ${volume} ${symbol} ${type} order placed`, 'Trade');
      onClose();
    } catch (reason) {
      setError((reason as Error).message);
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="dialog">
        <div className="titlebar">
          New Order <button onClick={onClose}>×</button>
        </div>
        <div className="dialog-content order-form">
          <label>
            Symbol
            <input value={symbol} onChange={(event) => setSymbol(event.target.value)} />
          </label>
          <label>
            Volume (lots)
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={volume}
              onChange={(event) =>
                setVolume(event.target.value === '' ? '' : Number(event.target.value))
              }
            />
          </label>
          <div className="form-row">
            <label>
              SL
              <input value={sl} onChange={(event) => setSl(event.target.value)} />
            </label>
            <label>
              TP
              <input value={tp} onChange={(event) => setTp(event.target.value)} />
            </label>
          </div>
          <label>
            Type
            <select value={type} onChange={(event) => setType(event.target.value as typeof type)}>
              <option value="market">Market</option>
              <option value="limit">Limit</option>
              <option value="stop">Stop</option>
            </select>
          </label>
          {type !== 'market' && (
            <label>
              Price
              <input
                type="number"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
              />
            </label>
          )}
          {error && <div className="error">{error}</div>}
          <div className="trade-buttons">
            <button className="sell" onClick={() => submit('sell')}>
              Sell by Market
              <br />
              <b>{currentQuote ? currentQuote.bid.toFixed(currentQuote.digits) : '—'}</b>
            </button>
            <button className="buy" onClick={() => submit('buy')}>
              Buy by Market
              <br />
              <b>{currentQuote ? currentQuote.ask.toFixed(currentQuote.digits) : '—'}</b>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
