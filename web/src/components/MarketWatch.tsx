import type { Quote } from '../api';
import { useTerminal } from '../store';

type MarketWatchProps = { onOrder: (quote: Quote) => void };

export function MarketWatch({ onOrder }: MarketWatchProps) {
  const quotes = useTerminal((state) => state.quotes);
  const set = useTerminal((state) => state.set);

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
          className="quote-row"
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
