import { cookieStorage, createStorage, mock } from '@wagmi/core';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { activeChain } from './chains';
import { foundry } from 'wagmi/chains';

export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

if (!projectId) {
  throw new Error('Project ID is not defined');
}

export const networks = [activeChain];
const isTestnet = activeChain.id === foundry.id;

const testnetProposer = process.env.NEXT_PUBLIC_PROPOSER_ADDRESS as `0x${string}` | undefined;

if (isTestnet && !testnetProposer) {
  throw new Error('Proposer address is not defined');
}

const testnetConnector = mock({
  accounts: [testnetProposer as `0x${string}`],
  features: {
    defaultConnected: true,
    reconnect: true,
  },
});

export const wagmiAdapter = new WagmiAdapter({
  connectors: isTestnet ? [testnetConnector] : [],
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks,
});

export const config = wagmiAdapter.wagmiConfig;
