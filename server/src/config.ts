export const DEFAULT_ALLOWED_WALLETS = '0x77787076fCfC8E722F8FaE50814a77DDd98b65be';
export const DEFAULT_DEPOSIT_ADDRESS = '0x55dbf0c3070aec3272d997696755a5ce011c7955';

export function allowedWallets() {
  return (process.env.OSTAD_ALLOWED_WALLETS ?? DEFAULT_ALLOWED_WALLETS)
    .split(',')
    .map((address) => address.trim().toLowerCase())
    .filter(Boolean);
}

export function depositAddress() {
  return process.env.OSTAD_DEPOSIT_ADDRESS?.trim() || DEFAULT_DEPOSIT_ADDRESS;
}
