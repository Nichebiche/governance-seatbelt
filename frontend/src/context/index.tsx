'use client';

import { wagmiAdapter, projectId } from '@/config';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createAppKit } from '@reown/appkit/react';
import React, { type ReactNode } from 'react';
import { cookieToInitialState, WagmiProvider } from 'wagmi';
import { prodMainnet } from '@/config/wagmi';

const queryClient = new QueryClient();

if (!projectId) {
  throw new Error('Project ID is not defined');
}

// Set up metadata
const metadata = {
  name: 'governance-seatbelt',
  description: 'Governance Seatbelt',
  url: 'https://governance-seatbelt.com', // origin must match your domain & subdomain
  icons: [],
};

// Create the modal
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [prodMainnet],
  defaultNetwork: prodMainnet,
  metadata,
  featuredWalletIds: [],
  features: {
    email: false, // default to true
    socials: false,
    collapseWallets: true,
  },
  allWallets: 'SHOW', // default to SHOW
});

function ContextProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig, cookies);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
export default ContextProvider;
