import { useState } from 'react';
import type { Position } from '../api';
import { api } from '../api';
import { useTerminal } from '../store';

function PositionRow({ position }: { position: Position }) {
  const log = useTerminal((state) => state.log);
  return (
    <div className="quote-row trade-head">
      <span>{position.symbol}</span>
      <span>{position.side}</span>
      <span>{position.volume}</span>
      <span>{position.openPrice.toFixed(2)}</span>
      <span className={position.profit >= 0 ? 'profit' : 'loss'}>{position.profit.toFixed(2)}</span>
      <button
        className="close-btn"
        onClick={() =>
          api(`/api/positions/${position.id}/close`, { method: 'POST' }).then(() =>
            log(`Position ${position.id} closed`, 'Trade'),
          )
        }
      >
        Close
      </button>
    </div>
  );
}

export function TerminalPanel() {
  const { account, positions, orders, logs } = useTerminal((state) => state);
  const [tab, setTab] = useState('Trade');
  return (
    <section className="panel terminal">
      <div className="tabs">
        {['Trade', 'History', 'Journal'].map((value) => (
          <button
            className={tab === value ? 'active' : ''}
            onClick={() => setTab(value)}
            key={value}
          >
            {value}
          </button>
        ))}
      </div>
      {tab === 'Trade' && (
        <>
          {account && (
            <div className="summary">
              <span>
                Balance <b>{account.balance.toFixed(2)}</b>
              </span>
              <span>
                Equity <b>{account.equity.toFixed(2)}</b>
              </span>
              <span>
                Margin <b>{account.margin.toFixed(2)}</b>
              </span>
              <span>
                Free margin <b>{account.freeMargin.toFixed(2)}</b>
              </span>
              <span>
                Margin level{' '}
                <b>
                  {account.margin
                    ? `${((account.equity / account.margin) * 100).toFixed(1)}%`
                    : '—'}
                </b>
              </span>
            </div>
          )}
          <div className="table-head trade-head">
            <span>Symbol</span>
            <span>Type</span>
            <span>Volume</span>
            <span>Price</span>
            <span>Profit</span>
            <span />
          </div>
          {positions.map((position) => (
            <PositionRow position={position} key={position.id} />
          ))}
          {orders.map((order) => (
            <div className="quote-row trade-head" key={order.id}>
              <span>{order.symbol}</span>
              <span>
                {order.side} {order.type}
              </span>
              <span>{order.volume}</span>
              <span>{order.price}</span>
              <span>pending</span>
              <span />
            </div>
          ))}
        </>
      )}
      {tab === 'Journal' && (
        <div className="journal">
          <div className="journal-row journal-header">
            <span>Time</span>
            <span>Source</span>
            <span>Message</span>
          </div>
          {logs.map((entry, index) => (
            <div className="journal-row" key={`${entry.time}-${index}`}>
              <span>{entry.time}</span>
              <span>{entry.source}</span>
              <span>{entry.message}</span>
            </div>
          ))}
        </div>
      )}
      {tab === 'History' && <div className="empty-state">No closed positions</div>}
    </section>
  );
}
