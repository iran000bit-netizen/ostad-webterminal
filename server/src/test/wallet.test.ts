import { beforeEach, describe, expect, it } from 'vitest';
import { privateKeyToAccount } from 'viem/accounts';
import { verifyWallet, walletMessage } from '../wallet.js';

const account = privateKeyToAccount('0x0123456789012345678901234567890123456789012345678901234567890123');
describe('wallet authentication', () => {
  beforeEach(() => { delete process.env.OSTAD_BROKER; });
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
    await expect(verifyWallet(account.address, signature)).rejects.toThrow('Invalid wallet signature');
  });
});
