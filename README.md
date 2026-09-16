# Ostad WebTerminal (وب‌ترمینال استاد)

An MT4 WebTerminal-style trading workstation with a classic Windows-inspired interface, live market watch, candlestick charts, order dialogs, account terminal, and pluggable broker adapters.

## Setup

Requirements: Node 24 (Node 22 is used in CI) and npm 10.

```bash
npm install
npm run dev
```

Open http://localhost:5173. The API server listens on http://localhost:8080.
Use the **Demo** button in the connection dialog; demo credentials are accepted
without an account and Binance prices are used when reachable. Set
`OSTAD_OFFLINE=1` to force simulated prices.

Useful commands:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Auto-connect via API

Copy `.env.example` to `.env` and set `OSTAD_BROKER` plus the credentials for
the selected adapter. On startup the server connects once and the web client
enters the terminal automatically. Leave `OSTAD_BROKER` empty to show the
normal connection dialog. Never commit `.env`; it is ignored by git.

## Features

- MT4-style market watch, navigator, chart toolbar, terminal tabs and journal
- Live Binance crypto quotes and candles, plus simulated forex/XAUUSD symbols
- Demo market, limit and stop orders with floating P/L, margin, SL/TP and fills
- WebSocket quote, account and position updates
- Broker registry for MetaApi (MT4/MT5), OANDA, Alpaca and Binance
- Responsive login and new-order dialogs with API credential fields

## Brokers

| Broker     | Status            | Credentials          |
| ---------- | ----------------- | -------------------- |
| Ostad Demo | Ready             | Any login/password   |
| MetaApi    | Adapter available | API key + account ID |
| OANDA      | Adapter available | API key + account ID |
| Alpaca     | Adapter available | API key + API secret |
| Binance    | Adapter available | API key + API secret |

See [docs/brokers.md](docs/brokers.md) for details. MT4 servers can only be
connected via MetaApi.

## Screenshot

![Ostad WebTerminal screenshot](docs/screenshot-placeholder.png)
