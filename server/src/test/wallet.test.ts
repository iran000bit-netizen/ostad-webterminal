import { beforeEach, describe, expect, it } from 'vitest';
import { privateKeyToAccount } from 'viem/accounts';
import { verifyWallet, walletMessage } from '../wallet.js';

const account = privateKeyToAccount(
  '0x0123456789012345678901234567890123456789012345678901234567890123',
);
describe('wallet authentication', () => {
  beforeEach(() => {
    delete process.env.OSTAD_BROKER;
    process.env.OSTAD_ALLOWED_WALLETS = account.address;
  });
  it('verifies a signed nonce and creates a session', async () => {
    const message = walletMessage(account.address);
    const signature = await account.signMessage({ message });
    const result = await verifyWallet(account.address, signature);
    expect(result.address).toBe(account.address);
    expect(result.token).toBeTruthy();
  });
  it('rejects a bad signature', async () => {
    const message = walletMessage(account.address);
    const signature = await account.signMessage({ message: `${message} altered` });
    await expect(verifyWallet(account.address, signature)).rejects.toThrow(
      'Invalid wallet signature',
    );
  });
  it('rejects a wallet that is not allowlisted', async () => {
    const other = privateKeyToAccount(
      '0x2222222222222222222222222222222222222222222222222222222222222222',
    );
    const message = walletMessage(other.address);
    const signature = await other.signMessage({ message });
    await expect(verifyWallet(other.address, signature)).rejects.toThrow('Wallet not authorized');
  });
});
