import type { Address } from 'viem';
import { useSuspenseQuery } from '@tanstack/react-query';

export interface Proposal {
  targets: Address[];
  values: bigint[];
  calldatas: `0x${string}`[];
  signatures: `0x${string}`[];
  description: `0x${string}`[];
}

export function useNewResponseFile() {
  // TODO get the response file from root and parse it to get the proposal data
  return useSuspenseQuery({
    queryKey: ['new-response-file'],
    queryFn: async () => {
      const response = await fetch('/api/new-response-file');

      if (!response.ok) {
        throw new Error('Failed to fetch new response file');
      }

      return response.json();
    },
  });
}
