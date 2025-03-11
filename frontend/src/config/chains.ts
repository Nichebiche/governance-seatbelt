import { mainnet, foundry } from '@reown/appkit/networks';
import type { Chain } from 'wagmi/chains';

const mainnetRpcUrl = process.env.NEXT_PUBLIC_MAINNET_RPC_URL;

// Production mainnet configuration
export const prodMainnet: Chain = {
  ...mainnet,
  rpcUrls: {
    default: {
      http: [mainnetRpcUrl || mainnet.rpcUrls.default.http[0]],
    },
  },
};

// Use test network in development, production network otherwise
export const activeChain = process.env.NODE_ENV === 'development' ? foundry : prodMainnet;
