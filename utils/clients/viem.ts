import { http, createPublicClient } from 'viem';
import { mainnet } from 'viem/chains';

if (!process.env.RPC_URL) {
  throw new Error('RPC_URL is not set');
}

export const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(process.env.RPC_URL),
});
