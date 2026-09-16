# Broker adapters

The Ostad Demo account is ready immediately: any login/password works and prices are sourced from Binance when available, with simulated forex symbols.

| Broker            | Required credentials   | Servers                       |
| ----------------- | ---------------------- | ----------------------------- |
| MetaApi (MT4/MT5) | API key and account ID | MetaApi                       |
| OANDA             | API key and account ID | OANDA-Practice, OANDA-Live    |
| Alpaca            | API key and secret     | Alpaca-Paper, Alpaca-Live     |
| Binance           | API key and secret     | Binance-Spot, Binance-Testnet |

Create keys in each provider's developer dashboard, keep them in environment variables or a secure secret manager, and enter them only in the login dialog. MT4 servers can only be connected through MetaApi. Non-demo adapters are intentionally conservative stubs until provider-specific trading methods are implemented.
