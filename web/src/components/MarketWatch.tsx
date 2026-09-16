import { useEffect, useRef, useState } from 'react';
import type { Quote } from '../api';
import { useTerminal } from '../store';

type MarketWatchProps = { onOrder: (quote: Quote) => void };

export function MarketWatch({ onOrder }: MarketWatchProps) {
  const quotes = useTerminal((state) => state.quotes);
  const set = useTerminal((state) => state.set);
  const previous = useRef(new Map<string, number>());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const [flashes, setFlashes] = useState<Record<string, 'up' | 'down' | undefined>>({});

  useEffect(() => {
    quotes.forEach((quote) => {
      const before = previous.current.get(quote.symbol);
      if (before !== undefined && before !== quote.bid) {
        const direction = quote.bid > before ? 'up' : 'down';
        setFlashes((current) => ({ ...current, [quote.symbol]: direction }));
        const existing = timers.current.get(quote.symbol);
        if (existing) clearTimeout(existing);
        timers.current.set(
          quote.symbol,
          setTimeout(() => {
            setFlashes((current) => ({ ...current, [quote.symbol]: undefined }));
          }, 400),
        );
      }
      previous.current.set(quote.symbol, quote.bid);
    });
  }, [quotes]);

  return (
    <section className="panel market">
      <div className="panel-head">Market Watch</div>
      <div className="table-head">
        <span>Symbol</span>
        <span>Bid</span>
        <span>Ask</span>
      </div>
      {quotes.map((quote) => (
        <div
          className={`quote-row ${flashes[quote.symbol] ? `flash-${flashes[quote.symbol]}` : ''}`}
          key={quote.symbol}
          onClick={() => set({ symbol: quote.symbol })}
          onDoubleClick={() => onOrder(quote)}
        >
          <span>{quote.symbol}</span>
          <span>{quote.bid.toFixed(quote.digits)}</span>
          <span>{quote.ask.toFixed(quote.digits)}</span>
        </div>
      ))}
    </section>
  );
}
