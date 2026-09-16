import { useEffect, useState } from 'react';
import type { Account, Broker } from '../api';
import { getBrokers, login, walletNonce, walletVerify } from '../api';
import { useTerminal } from '../store';

type LoginDialogProps = {
  onClose: () => void;
  onWallet: (result: { token: string; account: Account; address: string }) => void;
  initialError?: string;
};

export function LoginDialog({ onClose, onWallet, initialError }: LoginDialogProps) {
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [broker, setBroker] = useState('demo');
  const [loginName, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [server, setServer] = useState('Ostad-Demo');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [accountId, setAccountId] = useState('');
  const [save, setSave] = useState(true);
  const [error, setError] = useState(initialError || '');
  const set = useTerminal((state) => state.set);
  const log = useTerminal((state) => state.log);

  useEffect(() => {
    getBrokers()
      .then(setBrokers)
      .catch((reason: Error) => setError(reason.message));
  }, []);

  const selected = brokers.find((item) => item.id === broker);
  useEffect(() => {
    if (selected) setServer(selected.servers[0] || '');
  }, [broker, selected]);

  async function submit() {
    try {
      const result = await login({
        brokerId: broker,
        login: loginName,
        password,
        server,
        apiKey,
        apiSecret,
        accountId,
      });
      set({ token: result.token, account: result.account });
      if (save) localStorage.setItem('ostad-token', result.token);
      log(`Logged in to ${server}`, 'Auth');
      onClose();
    } catch (reason) {
      setError((reason as Error).message);
    }
  }

  async function demo() {
    setBroker('demo');
    setLogin('demo');
    setPassword('demo');
    setServer('Ostad-Demo');
    try {
      const result = await login({
        brokerId: 'demo',
        login: 'demo',
        password: 'demo',
        server: 'Ostad-Demo',
      });
      set({ token: result.token, account: result.account });
      localStorage.setItem('ostad-token', result.token);
      log('Logged in to Ostad-Demo', 'Auth');
      onClose();
    } catch (reason) {
      setError((reason as Error).message);
    }
  }

  async function connectWallet() {
    try {
      if (!window.ethereum) {
        setError('No EVM wallet detected — install MetaMask');
        return;
      }
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!Array.isArray(accounts) || typeof accounts[0] !== 'string') {
        throw new Error('No wallet account selected');
      }
      const address = accounts[0];
      const challenge = await walletNonce(address);
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [challenge.message, address],
      });
      if (typeof signature !== 'string') throw new Error('Wallet signature was not returned');
      const result = await walletVerify(address, signature);
      set({ token: result.token, account: result.account });
      localStorage.setItem('ostad-token', result.token);
      log(`Wallet connected ${address}`, 'Wallet');
      onWallet(result);
      onClose();
    } catch (reason) {
      setError((reason as Error).message);
    }
  }

  const needs = (field: string) => selected?.requires.includes(field) ?? false;
  return (
    <div className="modal-backdrop">
      <div className="dialog login-dialog">
        <div className="titlebar">
          Connect to an Account <button onClick={onClose}>×</button>
        </div>
        <div className="dialog-content">
          <p>Authorization allows to get access to the trade account</p>
          <label>
            Broker
            <select value={broker} onChange={(event) => setBroker(event.target.value)}>
              {brokers.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Login
            <input
              className={!loginName ? 'empty' : ''}
              value={loginName}
              onChange={(event) => setLogin(event.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {needs('apiKey') && (
            <label>
              API Key
              <input value={apiKey} onChange={(event) => setApiKey(event.target.value)} />
            </label>
          )}
          {needs('apiSecret') && (
            <label>
              API Secret
              <input
                type="password"
                value={apiSecret}
                onChange={(event) => setApiSecret(event.target.value)}
              />
            </label>
          )}
          {needs('accountId') && (
            <label>
              Account ID
              <input value={accountId} onChange={(event) => setAccountId(event.target.value)} />
            </label>
          )}
          <label>
            Server
            <select value={server} onChange={(event) => setServer(event.target.value)}>
              {selected?.servers.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={save}
              onChange={(event) => setSave(event.target.checked)}
            />
            Save password
          </label>
          {error && <div className="error">{error}</div>}
          <div className="dialog-actions">
            <button onClick={demo}>Demo</button>
            <button disabled={!loginName || !password} className="primary" onClick={submit}>
              OK
            </button>
            <button onClick={onClose}>Cancel</button>
          </div>
          <button className="wallet-button" onClick={connectWallet}>
            Connect Wallet
          </button>
        </div>
      </div>
    </div>
  );
}
