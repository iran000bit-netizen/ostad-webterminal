import { create } from 'zustand';
import type { Account, ClosedPosition, Order, Position, Quote } from './api';

export type JournalEntry = { time: string; source: string; message: string };
type State = {
  token: string;
  account?: Account;
  quotes: Quote[];
  positions: Position[];
  orders: Order[];
  history: ClosedPosition[];
  symbol: string;
  tf: string;
  logs: JournalEntry[];
  set: (x: Partial<State>) => void;
  log: (message: string, source?: string) => void;
};

export const useTerminal = create<State>((set) => ({
  token: localStorage.getItem('ostad-token') || '',
  quotes: [],
  positions: [],
  orders: [],
  history: [],
  symbol: 'BTCUSDT',
  tf: 'H1',
  logs: [
    {
      time: new Date().toLocaleTimeString(),
      source: 'Terminal',
      message: 'Ostad WebTerminal started',
    },
  ],
  set: (x) => set(x),
  log: (message, source = 'Terminal') =>
    set((state) => ({
      logs: [...state.logs, { time: new Date().toLocaleTimeString(), source, message }].slice(-100),
    })),
}));
