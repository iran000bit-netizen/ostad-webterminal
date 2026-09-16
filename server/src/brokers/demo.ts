import WebSocket from 'ws';
import type {
  BrokerAdapter,
  BrokerCredentials,
  Candle,
  ClosedPosition,
  Order,
  OrderRequest,
  Position,
  Quote,
  Side,
  Timeframe,
} from './types.js';

type SymbolKind = 'crypto' | 'forex' | 'metal';
type SymbolSpec = { digits: number; contractSize: number; basePrice: number; kind: SymbolKind };
type BinanceTicker = { symbol: string; bidPrice: string; askPrice: string };
type BinanceBookTickerMessage = { data?: { s?: string; b?: string; a?: string } };
type BinanceKline = [number, string, string, string, string, string, ...unknown[]];

export const SYMBOLS: Record<string, SymbolSpec> = {
  BTCUSDT: { digits: 2, contractSize: 1, basePrice: 65_000, kind: 'crypto' },
  ETHUSDT: { digits: 2, contractSize: 1, basePrice: 3_400, kind: 'crypto' },
  BNBUSDT: { digits: 2, contractSize: 1, basePrice: 600, kind: 'crypto' },
  XRPUSDT: { digits: 4, contractSize: 1, basePrice: 0.52, kind: 'crypto' },
  SOLUSDT: { digits: 2, contractSize: 1, basePrice: 145, kind: 'crypto' },
  ADAUSDT: { digits: 4, contractSize: 1, basePrice: 0.45, kind: 'crypto' },
  DOGEUSDT: { digits: 5, contractSize: 1, basePrice: 0.13, kind: 'crypto' },
  LTCUSDT: { digits: 2, contractSize: 1, basePrice: 70, kind: 'crypto' },
  EURUSD: { digits: 5, contractSize: 100_000, basePrice: 1.085, kind: 'forex' },
  GBPUSD: { digits: 5, contractSize: 100_000, basePrice: 1.27, kind: 'forex' },
  USDJPY: { digits: 3, contractSize: 100_000, basePrice: 150.2, kind: 'forex' },
  XAUUSD: { digits: 2, contractSize: 100, basePrice: 2_325, kind: 'metal' },
};

const timeframeMs: Record<Timeframe, number> = {
  M1: 60_000,
  M5: 300_000,
  M15: 900_000,
  M30: 1_800_000,
  H1: 3_600_000,
  H4: 14_400_000,
  D1: 86_400_000,
  W1: 604_800_000,
  MN: 2_592_000_000,
};
const binanceTimeframe: Record<Timeframe, string> = {
  M1: '1m',
  M5: '5m',
  M15: '15m',
  M30: '30m',
  H1: '1h',
  H4: '4h',
  D1: '1d',
  W1: '1w',
  MN: '1M',
};
const id = () => Math.random().toString(36).slice(2, 10);

export class DemoBroker implements BrokerAdapter {
  readonly id = 'demo';
  readonly name = 'Ostad Demo';
  private creds!: BrokerCredentials;
  private connected = false;
  private timer?: ReturnType<typeof setInterval>;
  private stream?: WebSocket;
  private streamReconnect?: ReturnType<typeof setTimeout>;
  private streamLive = false;
  private readonly quoteMap = new Map<string, Quote>();
  private readonly positionsMap = new Map<string, Position>();
  private readonly ordersMap = new Map<string, Order>();
  private readonly historyList: ClosedPosition[] = [];
  private readonly listeners = new Set<(q: Quote) => void>();
  private balance = 10_000;

  constructor() {
    Object.entries(SYMBOLS).forEach(([symbol, spec]) => {
      const spread = spec.kind === 'forex' ? 0.00015 : spec.basePrice * 0.0002;
      this.quoteMap.set(symbol, {
        symbol,
        bid: spec.basePrice,
        ask: spec.basePrice + spread,
        time: Date.now(),
        digits: spec.digits,
      });
    });
  }

  async connect(creds: BrokerCredentials) {
    this.creds = creds;
    this.connected = true;
    this.startTicks();
    if (!process.env.OSTAD_OFFLINE) {
      try {
        await this.loadBinanceQuotes();
      } catch {
        console.warn('Binance unavailable; using simulated random walk');
      }
      this.connectBinanceStream();
    }
    return this.account();
  }

  async disconnect() {
    this.connected = false;
    if (this.timer) clearInterval(this.timer);
    if (this.streamReconnect) clearTimeout(this.streamReconnect);
    this.stream?.close();
    this.stream = undefined;
    this.streamLive = false;
  }

  async symbols() {
    return Object.keys(SYMBOLS);
  }

  async quotes() {
    return [...this.quoteMap.values()];
  }

  async candles(symbol: string, tf: Timeframe, limit: number) {
    const quote = this.quoteMap.get(symbol);
    const spec = SYMBOLS[symbol];
    if (!quote || !spec) throw new Error('Unknown symbol');
    if (spec.kind === 'crypto' && !process.env.OSTAD_OFFLINE) {
      try {
        const response = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${binanceTimeframe[tf]}&limit=${Math.min(limit, 1000)}`,
        );
        if (response.ok) {
          const candles = (await response.json()) as BinanceKline[];
          return candles.map((candle) => ({
            time: Math.floor(candle[0] / timeframeMs[tf]) * timeframeMs[tf],
            open: +candle[1],
            high: +candle[2],
            low: +candle[3],
            close: +candle[4],
            volume: +candle[5],
          }));
        }
      } catch {
        console.warn('Binance candles unavailable; synthesizing candles');
      }
    }
    const output: Candle[] = [];
    let close = quote.bid - limit * 0.0002;
    for (let index = limit; index > 0; index -= 1) {
      const time =
        Math.floor((Date.now() - index * timeframeMs[tf]) / timeframeMs[tf]) * timeframeMs[tf];
      const open = close;
      const delta = (Math.random() - 0.5) * close * 0.006;
      close = Math.max(0.0001, close + delta);
      output.push({
        time,
        open,
        high: Math.max(open, close) * (1 + Math.random() * 0.001),
        low: Math.min(open, close) * (1 - Math.random() * 0.001),
        close,
        volume: Math.round(Math.random() * 1000),
      });
    }
    return output;
  }

  async account() {
    const margin = [...this.positionsMap.values()].reduce(
      (sum, position) => sum + this.marginFor(position.symbol, position.volume, position.openPrice),
      0,
    );
    const equity =
      this.balance +
      [...this.positionsMap.values()].reduce((sum, position) => sum + position.profit, 0);
    const login = this.creds?.login ?? '';
    return {
      login,
      name: login.startsWith('0x')
        ? `${login.slice(0, 6)}…${login.slice(-4)}`
        : login || 'Demo Trader',
      server: 'Ostad-Demo',
      currency: 'USD',
      balance: this.balance,
      equity,
      margin,
      freeMargin: equity - margin,
      leverage: 100,
    };
  }

  async positions() {
    return [...this.positionsMap.values()];
  }

  async orders() {
    return [...this.ordersMap.values()];
  }

  async history() {
    return [...this.historyList];
  }

  async placeOrder(request: OrderRequest) {
    if (
      typeof request.volume !== 'number' ||
      !Number.isFinite(request.volume) ||
      request.volume <= 0
    ) {
      throw new Error('Volume must be positive');
    }
    if (request.type !== 'market') {
      if (!request.price) throw new Error('Pending order price is required');
      const pending: Order = {
        id: id(),
        symbol: request.symbol,
        side: request.side,
        type: request.type,
        volume: request.volume,
        price: request.price,
        sl: request.sl,
        tp: request.tp,
        time: Date.now(),
      };
      this.ordersMap.set(pending.id, pending);
      return pending;
    }
    return this.open(request.symbol, request.side, request.volume, request.sl, request.tp);
  }

  async closePosition(positionId: string, volume?: number) {
    const position = this.positionsMap.get(positionId);
    if (!position) throw new Error('Position not found');
    const closedVolume = Math.min(volume ?? position.volume, position.volume);
    const fraction = closedVolume / position.volume;
    const realizedProfit = position.profit * fraction;
    const quote = this.quoteMap.get(position.symbol);
    const closePrice = quote
      ? position.side === 'buy'
        ? quote.bid
        : quote.ask
      : position.openPrice;
    this.balance += realizedProfit;
    this.historyList.unshift({
      id: position.id,
      symbol: position.symbol,
      side: position.side,
      volume: closedVolume,
      openPrice: position.openPrice,
      closePrice,
      openTime: position.openTime,
      closeTime: Date.now(),
      profit: realizedProfit,
    });
    if (closedVolume >= position.volume) this.positionsMap.delete(positionId);
    else {
      position.volume -= closedVolume;
      position.profit = this.positionProfit(position);
    }
  }

  async modifyPosition(positionId: string, sl?: number, tp?: number) {
    const position = this.positionsMap.get(positionId);
    if (!position) throw new Error('Position not found');
    position.sl = sl;
    position.tp = tp;
  }

  async cancelOrder(orderId: string) {
    if (!this.ordersMap.delete(orderId)) throw new Error('Order not found');
  }

  onQuote(callback: (q: Quote) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private open(symbol: string, side: Side, volume: number, sl?: number, tp?: number) {
    const quote = this.quoteMap.get(symbol);
    if (!quote) throw new Error('Unknown symbol');
    const position: Position = {
      id: id(),
      symbol,
      side,
      volume,
      openPrice: side === 'buy' ? quote.ask : quote.bid,
      openTime: Date.now(),
      sl,
      tp,
      profit: 0,
      swap: 0,
      commission: 0,
    };
    this.positionsMap.set(position.id, position);
    return position;
  }

  private startTicks() {
    if (!this.timer) this.timer = setInterval(() => this.tick(), 1000);
  }

  private tick() {
    this.quoteMap.forEach((quote) => {
      const spec = SYMBOLS[quote.symbol];
      if (!spec || (spec.kind === 'crypto' && this.streamLive)) return;
      const scale = spec.kind === 'forex' ? quote.bid * 0.0002 : quote.bid * 0.001;
      const next = Math.max(0.00001, quote.bid + (Math.random() - 0.49) * scale);
      quote.bid = next;
      quote.ask =
        next +
        (spec.kind === 'forex' ? (quote.symbol === 'USDJPY' ? 0.02 : 0.00015) : next * 0.0002);
      quote.time = Date.now();
      this.emitQuote(quote);
    });
    this.updateTradingState();
  }

  private emitQuote(quote: Quote) {
    this.listeners.forEach((callback) => callback({ ...quote }));
  }

  private updateTradingState() {
    this.positionsMap.forEach((position) => {
      position.profit = this.positionProfit(position);
      const quote = this.quoteMap.get(position.symbol);
      if (!quote) return;
      const stopped =
        (position.sl !== undefined &&
          ((position.side === 'buy' && quote.bid <= position.sl) ||
            (position.side === 'sell' && quote.ask >= position.sl))) ||
        (position.tp !== undefined &&
          ((position.side === 'buy' && quote.bid >= position.tp) ||
            (position.side === 'sell' && quote.ask <= position.tp)));
      if (stopped) this.closePosition(position.id).catch(() => undefined);
    });
    this.ordersMap.forEach((pending) => {
      const quote = this.quoteMap.get(pending.symbol);
      if (!quote) return;
      const filled =
        (pending.type === 'limit' &&
          ((pending.side === 'buy' && quote.ask <= pending.price) ||
            (pending.side === 'sell' && quote.bid >= pending.price))) ||
        (pending.type === 'stop' &&
          ((pending.side === 'buy' && quote.ask >= pending.price) ||
            (pending.side === 'sell' && quote.bid <= pending.price)));
      if (filled) {
        this.ordersMap.delete(pending.id);
        this.open(pending.symbol, pending.side, pending.volume, pending.sl, pending.tp);
      }
    });
  }

  private positionProfit(position: Position) {
    const quote = this.quoteMap.get(position.symbol);
    const spec = SYMBOLS[position.symbol];
    if (!quote || !spec) return 0;
    const difference =
      position.side === 'buy' ? quote.bid - position.openPrice : position.openPrice - quote.ask;
    return difference * position.volume * spec.contractSize;
  }

  private marginFor(symbol: string, volume: number, price: number) {
    const spec = SYMBOLS[symbol];
    return spec ? (volume * price * spec.contractSize) / 100 : 0;
  }

  private async loadBinanceQuotes() {
    const response = await fetch('https://api.binance.com/api/v3/ticker/bookTicker');
    if (!response.ok) throw new Error(`Binance HTTP ${response.status}`);
    const data = (await response.json()) as BinanceTicker[];
    data.forEach((ticker) => {
      const quote = this.quoteMap.get(ticker.symbol);
      if (quote) {
        quote.bid = +ticker.bidPrice;
        quote.ask = +ticker.askPrice;
        quote.time = Date.now();
      }
    });
  }

  private connectBinanceStream() {
    const streams = Object.keys(SYMBOLS)
      .filter((symbol) => SYMBOLS[symbol].kind === 'crypto')
      .map((symbol) => `${symbol.toLowerCase()}@bookTicker`)
      .join('/');
    try {
      this.stream = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
    } catch {
      this.streamLive = false;
      if (this.connected && !process.env.OSTAD_OFFLINE) {
        this.streamReconnect = setTimeout(() => this.connectBinanceStream(), 3000);
      }
      return;
    }
    this.stream.on('open', () => {
      this.streamLive = true;
    });
    this.stream.on('message', (raw) => {
      const message = JSON.parse(raw.toString()) as BinanceBookTickerMessage;
      const data = message.data;
      if (!data?.s || !data.b || !data.a) return;
      const quote = this.quoteMap.get(data.s);
      if (!quote) return;
      quote.bid = +data.b;
      quote.ask = +data.a;
      quote.time = Date.now();
      this.emitQuote(quote);
      this.updateTradingState();
    });
    this.stream.on('error', () => this.stream?.close());
    this.stream.on('close', () => {
      this.streamLive = false;
      if (this.connected && !process.env.OSTAD_OFFLINE) {
        this.streamReconnect = setTimeout(() => this.connectBinanceStream(), 3000);
      }
    });
  }
}
