import type { BrokerAdapter, BrokerCredentials, Candle, Order, OrderRequest, Position, Quote, Side, Timeframe } from './types.js';

const cryptoSymbols = ['BTCUSDT','ETHUSDT','BNBUSDT','XRPUSDT','SOLUSDT','ADAUSDT','DOGEUSDT','LTCUSDT'];
const forexBases: Record<string, number> = { EURUSD:1.085, GBPUSD:1.27, USDJPY:150.2, XAUUSD:2325 };
const tfMs: Record<Timeframe, number> = { M1:60000,M5:300000,M15:900000,M30:1800000,H1:3600000,H4:14400000,D1:86400000,W1:604800000,MN:2592000000 };
const binanceTf: Record<Timeframe,string> = { M1:'1m',M5:'5m',M15:'15m',M30:'30m',H1:'1h',H4:'4h',D1:'1d',W1:'1w',MN:'1M' };
const id = () => Math.random().toString(36).slice(2, 10);

export class DemoBroker implements BrokerAdapter {
  readonly id = 'demo'; readonly name = 'Ostad Demo';
  private creds!: BrokerCredentials; private connected = false; private timer?: ReturnType<typeof setInterval>;
  private quoteMap = new Map<string, Quote>(); private positionsMap = new Map<string, Position>(); private ordersMap = new Map<string, Order>();
  private listeners = new Set<(q: Quote)=>void>(); private balance = 10000;
  constructor() {
    [...cryptoSymbols, ...Object.keys(forexBases)].forEach((symbol) => {
      const p = forexBases[symbol] ?? ({BTCUSDT:65000,ETHUSDT:3400,BNBUSDT:600,XRPUSDT:.52,SOLUSDT:145,ADAUSDT:.45,DOGEUSDT:.13,LTCUSDT:70}[symbol] ?? 1);
      const spread = symbol.endsWith('USD') && symbol !== 'XAUUSD' ? 0.00015 : p * (symbol === 'XAUUSD' ? .00015 : .0002);
      this.quoteMap.set(symbol, { symbol, bid: p, ask: p + spread, time: Date.now(), digits: symbol === 'USDJPY' ? 3 : symbol.includes('USD') && !cryptoSymbols.includes(symbol) ? 5 : 2 });
    });
  }
  async connect(creds: BrokerCredentials) { this.creds = creds; this.connected = true; this.startTicks(); try { if (!process.env.OSTAD_OFFLINE) await this.loadBinanceQuotes(); } catch { console.warn('Binance unavailable; using simulated random walk'); } return this.account(); }
  async disconnect() { this.connected = false; if (this.timer) clearInterval(this.timer); }
  async symbols() { return [...this.quoteMap.keys()]; }
  async quotes() { return [...this.quoteMap.values()]; }
  async candles(symbol:string, tf:Timeframe, limit:number) {
    const q = this.quoteMap.get(symbol); if (!q) throw new Error('Unknown symbol');
    if (cryptoSymbols.includes(symbol) && !process.env.OSTAD_OFFLINE) try {
      const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${binanceTf[tf]}&limit=${Math.min(limit,1000)}`);
      if (response.ok) return (await response.json() as any[]).map(k=>({time:k[0],open:+k[1],high:+k[2],low:+k[3],close:+k[4],volume:+k[5]}));
    } catch { console.warn('Binance candles unavailable; synthesizing candles'); }
    const out:Candle[]=[]; let close=q.bid-limit*0.0002;
    for(let i=limit;i>0;i--){const time=Date.now()-i*tfMs[tf], open=close, delta=(Math.random()-.5)*close*.006; close=Math.max(.0001,close+delta); out.push({time,open,high:Math.max(open,close)*(1+Math.random()*.001),low:Math.min(open,close)*(1-Math.random()*.001),close,volume:Math.round(Math.random()*1000)});}
    return out;
  }
  async account() { const margin=[...this.positionsMap.values()].reduce((s,p)=>s+this.marginFor(p.symbol,p.volume,p.openPrice),0), equity=this.balance+[...this.positionsMap.values()].reduce((s,p)=>s+p.profit,0); const login=this.creds?.login??''; return {login,name:login.startsWith('0x')?`${login.slice(0,6)}…${login.slice(-4)}`:login||'Demo Trader',server:'Ostad-Demo',currency:'USD',balance:this.balance,equity,margin,freeMargin:equity-margin,leverage:100}; }
  async positions(){return [...this.positionsMap.values()]} async orders(){return [...this.ordersMap.values()]}
  async placeOrder(req:OrderRequest) {
    if(req.volume<=0) throw new Error('Volume must be positive');
    if(req.type!=='market'){if(!req.price)throw new Error('Pending order price is required');const order:Order={id:id(),symbol:req.symbol,side:req.side,type:req.type,volume:req.volume,price:req.price,sl:req.sl,tp:req.tp,time:Date.now()};this.ordersMap.set(order.id,order);return order;}
    return this.open(req.symbol,req.side,req.volume,req.sl,req.tp);
  }
  async closePosition(positionId:string, volume?:number){const p=this.positionsMap.get(positionId);if(!p)throw new Error('Position not found');const v=Math.min(volume??p.volume,p.volume);this.balance+=p.profit*(v/p.volume);if(v>=p.volume)this.positionsMap.delete(positionId);else {p.volume-=v;p.profit=this.positionProfit(p);}}
  async modifyPosition(positionId:string,sl?:number,tp?:number){const p=this.positionsMap.get(positionId);if(!p)throw new Error('Position not found');p.sl=sl;p.tp=tp;}
  async cancelOrder(orderId:string){if(!this.ordersMap.delete(orderId))throw new Error('Order not found')}
  onQuote(cb:(q:Quote)=>void){this.listeners.add(cb);return()=>this.listeners.delete(cb)}
  private open(symbol:string,side:Side,volume:number,sl?:number,tp?:number){const q=this.quoteMap.get(symbol);if(!q)throw new Error('Unknown symbol');const p:Position={id:id(),symbol,side,volume,openPrice:side==='buy'?q.ask:q.bid,openTime:Date.now(),sl,tp,profit:0,swap:0,commission:0};this.positionsMap.set(p.id,p);return p}
  private startTicks(){if(this.timer)return;this.timer=setInterval(()=>this.tick(),1000)}
  private tick(){this.quoteMap.forEach(q=>{const scale=q.symbol.includes('USD')&&!cryptoSymbols.includes(q.symbol)?q.bid*.0002:q.bid*.001;const next=Math.max(.00001,q.bid+(Math.random()-.49)*scale);q.bid=next;q.ask=next+(q.symbol==='USDJPY'?0.02:next*.0002);q.time=Date.now();this.listeners.forEach(cb=>cb({...q}));});this.positionsMap.forEach(p=>{p.profit=this.positionProfit(p);const q=this.quoteMap.get(p.symbol)!;if((p.sl!==undefined&&((p.side==='buy'&&q.bid<=p.sl)||(p.side==='sell'&&q.ask>=p.sl)))||(p.tp!==undefined&&((p.side==='buy'&&q.bid>=p.tp)||(p.side==='sell'&&q.ask<=p.tp))))this.closePosition(p.id).catch(()=>{});});this.ordersMap.forEach(o=>{const q=this.quoteMap.get(o.symbol);if(q&&((o.type==='limit'&&((o.side==='buy'&&q.ask<=o.price)||(o.side==='sell'&&q.bid>=o.price)))||(o.type==='stop'&&((o.side==='buy'&&q.ask>=o.price)||(o.side==='sell'&&q.bid<=o.price))))){this.ordersMap.delete(o.id);this.open(o.symbol,o.side,o.volume,o.sl,o.tp)}})}
  private positionProfit(p:Position){const q=this.quoteMap.get(p.symbol);if(!q)return 0;const diff=(p.side==='buy'?q.bid-p.openPrice:p.openPrice-q.ask);return diff*p.volume*(p.symbol==='XAUUSD'?100:p.symbol.includes('USD')&&!cryptoSymbols.includes(p.symbol)?100000:1)}
  private marginFor(symbol:string,volume:number,price:number){return volume*price*(symbol==='XAUUSD'?100:symbol.includes('USD')&&!cryptoSymbols.includes(symbol)?100000:1)/100}
  private async loadBinanceQuotes(){const r=await fetch('https://api.binance.com/api/v3/ticker/bookTicker');if(!r.ok)throw new Error('Binance HTTP '+r.status);const data=await r.json() as any[];for(const x of data){if(!cryptoSymbols.includes(x.symbol))continue;const q=this.quoteMap.get(x.symbol);if(q){q.bid=+x.bidPrice;q.ask=+x.askPrice;q.time=Date.now()}}}
}
