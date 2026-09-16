interface EvmProvider {
  request(args: { method: string; params?: readonly unknown[] }): Promise<unknown>;
}
interface Window { ethereum?: EvmProvider }
