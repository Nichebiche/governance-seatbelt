import { type Chain, mainnet } from '@reown/appkit/networks';
import { cookieStorage, createStorage } from '@wagmi/core';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

const mainnetRpcUrl = process.env.NEXT_PUBLIC_MAINNET_RPC_URL;
if (!mainnetRpcUrl) {
  throw new Error('Mainnet RPC URL is not defined');
}

// Production mainnet configuration
export const prodMainnet: Chain = {
  ...mainnet,
  rpcUrls: {
    default: {
      http: [mainnetRpcUrl],
    },
  },
};

export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

if (!projectId) {
  throw new Error('Project ID is not defined');
}

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks: [prodMainnet],
});

export const config = wagmiAdapter.wagmiConfig;
