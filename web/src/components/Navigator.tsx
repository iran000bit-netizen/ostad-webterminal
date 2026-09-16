import * as React from 'react';
import type { Account, Broker } from '../api';
import { useTerminal } from '../store';

type NavigatorProps = {
  brokers: Broker[];
  account?: Account;
  wallet?: string;
};

function WalletStatus({ address }: { address: string }) {
  const [chain, setChain] = React.useState('');
  const [balance, setBalance] = React.useState('');

  React.useEffect(() => {
    if (!window.ethereum) return;
    Promise.all([
      window.ethereum.request({ method: 'eth_chainId' }),
      window.ethereum.request({ method: 'eth_getBalance', params: [address, 'latest'] }),
    ])
      .then(([chainId, raw]) => {
        if (typeof chainId === 'string') setChain(chainId);
        if (typeof raw === 'string') {
          setBalance(`${(Number.parseInt(raw, 16) / 1e18).toFixed(4)} native`);
        }
      })
      .catch(() => undefined);
  }, [address]);

  return (
    <>
      <p className="indent wallet-line">
        Wallet: {address.slice(0, 6)}…{address.slice(-4)}
      </p>
      <p className="indent wallet-line">
        Chain {chain} · {balance}
      </p>
      <p className="indent wallet-line">Disconnect</p>
    </>
  );
}

export function Navigator({ brokers, account, wallet }: NavigatorProps) {
  const currentAccount = useTerminal((state) => state.account);
  return (
    <section className="panel navigator">
      <div className="panel-head">Navigator</div>
      <p>▾ Accounts</p>
      <p className="indent">◉ {account?.login || currentAccount?.login || 'Not connected'}</p>
      {wallet && <WalletStatus address={wallet} />}
      <p>▾ Brokers</p>
      {brokers.map((broker) => (
        <p className="indent" key={broker.id}>
          {broker.name}
        </p>
      ))}
    </section>
  );
}
