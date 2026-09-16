import { useState } from 'react';

type DepositDialogProps = { address: string; onClose: () => void };

export function DepositDialog({ address, onClose }: DepositDialogProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(address);
    setCopied(true);
  }

  return (
    <div className="modal-backdrop">
      <div className="dialog deposit-dialog">
        <div className="titlebar">
          Deposit to Ostad Wallet <button onClick={onClose}>×</button>
        </div>
        <div className="dialog-content">
          <p>Send supported assets to this address:</p>
          <code className="deposit-address">{address}</code>
          <button onClick={copy}>{copied ? 'Copied' : 'Copy address'}</button>
        </div>
      </div>
    </div>
  );
}
