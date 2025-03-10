import type { Address } from 'viem';
import { useSuspenseQuery } from '@tanstack/react-query';

export interface Proposal {
  targets: Address[];
  values: bigint[];
  calldatas: `0x${string}`[];
  signatures: string[];
  description: string;
}

export function useNewResponseFile() {
  return useSuspenseQuery<Proposal>({
    queryKey: ['new-response-file'],
    queryFn: async () => {
      // Fetch the simulation results from our API route
      const response = await fetch('/api/simulation-results');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.message ||
          `Failed to fetch simulation results: ${response.status} ${response.statusText}`;
        console.error(errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Return the first simulation result if there are multiple
      if (Array.isArray(data) && data.length > 0) {
        console.log('Successfully loaded simulation data:', data[0]);
        return {
          ...data[0],
          // Convert string values back to their proper types
          values: data[0].values.map((value: string) => BigInt(value)),
        };
      }

      console.error('No simulation data found in the response');
      throw new Error('No simulation data found');
    },
    // Add retry logic
    retry: 1,
    retryDelay: 1000,
  });
}
