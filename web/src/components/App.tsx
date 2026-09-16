import { useEffect, useState } from 'react';
import {
  api,
  getBrokers,
  type Account,
  type Broker,
  type Order,
  type Position,
  type Quote,
} from '../api';
import { useTerminal } from '../store';
import { Chart } from './Chart';
import { Header } from './Header';
import { LoginDialog } from './LoginDialog';
import { MarketWatch } from './MarketWatch';
import { MenuBar } from './MenuBar';
import { Navigator } from './Navigator';
import { OrderDialog } from './OrderDialog';
import { TerminalPanel } from './TerminalPanel';
import { Toolbar } from './Toolbar';

type WsMessage = { type: 'quote' | 'account' | 'positions'; data: unknown };

export function App() {
  const { token, set, log } = useTerminal((state) => state);
  const [connect, setConnect] = useState(!token);
  const [connectError, setConnectError] = useState('');
  const [wallet, setWallet] = useState('');
  const [newOrder, setNewOrder] = useState<Quote>();
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [timeframe, setTimeframe] = useState('H1');
  const [chartType, setChartType] = useState<'candles' | 'bars' | 'line'>('candles');
  const account = useTerminal((state) => state.account);

  useEffect(() => {
    getBrokers()
      .then(setBrokers)
      .catch(() => undefined);
    api<{ enabled: boolean; token?: string; account?: Account; error?: string; brokerId?: string }>(
      '/api/autoconnect',
    )
      .then((result) => {
        if (result.enabled && result.token && result.account) {
          localStorage.setItem('ostad-token', result.token);
          set({ token: result.token, account: result.account });
          log(
            `Auto-connected to ${result.brokerId || result.account.server} ${result.account.login}`,
            'Auth',
          );
          setConnect(false);
        } else if (result.error) {
          setConnectError(result.error);
          setConnect(true);
        }
      })
      .catch(() => {
        if (!token) setConnect(true);
      });
    if (token) {
      Promise.all([
        api<Account>('/api/account'),
        api<Quote[]>('/api/quotes'),
        api<Position[]>('/api/positions'),
        api<Order[]>('/api/orders'),
      ])
        .then(([loadedAccount, quotes, positions, orders]) =>
          set({ account: loadedAccount, quotes, positions, orders }),
        )
        .catch(() => setConnect(true));
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    let socket: WebSocket | undefined;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;
    const connectSocket = () => {
      if (disposed) return;
      socket = new WebSocket(
        `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws?token=${token}`,
      );
      socket.onmessage = (event) => {
        const message = JSON.parse(event.data as string) as WsMessage;
        if (message.type === 'quote') {
          const quote = message.data as Quote;
          const current = useTerminal.getState().quotes;
          set({
            quotes: current.some((item) => item.symbol === quote.symbol)
              ? current.map((item) => (item.symbol === quote.symbol ? quote : item))
              : [...current, quote],
          });
        } else if (message.type === 'account') {
          set({ account: message.data as Account });
        } else {
          set({ positions: message.data as Position[] });
        }
      };
      socket.onclose = () => {
        if (!disposed) retry = setTimeout(connectSocket, 3000);
      };
    };
    connectSocket();
    return () => {
      disposed = true;
      if (retry) clearTimeout(retry);
      socket?.close();
    };
  }, [token]);

  return (
    <div className="terminal-app">
      <Header />
      <MenuBar />
      <Toolbar
        timeframe={timeframe}
        chartType={chartType}
        onTimeframe={(value) => {
          setTimeframe(value);
          set({ tf: value });
        }}
        onChartType={(value) => setChartType(value as typeof chartType)}
        onConnect={() => setConnect(true)}
      />
      <main>
        <aside>
          <MarketWatch onOrder={setNewOrder} />
          <Navigator brokers={brokers} account={account} wallet={wallet} />
        </aside>
        <div className="workspace">
          <Chart chartType={chartType} />
          <TerminalPanel />
        </div>
      </main>
      {connect && (
        <LoginDialog
          initialError={connectError}
          onClose={() => setConnect(false)}
          onWallet={(result) => setWallet(result.address)}
        />
      )}
      {newOrder && <OrderDialog quote={newOrder} onClose={() => setNewOrder(undefined)} />}
    </div>
  );
}
