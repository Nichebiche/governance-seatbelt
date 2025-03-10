import type { Address } from 'viem';
import { useSuspenseQuery } from '@tanstack/react-query';

export interface Proposal {
  targets: Address[];
  values: bigint[];
  calldatas: `0x${string}`[];
  signatures: string[];
  description: string;
}

export function useSimulationResponseFile() {
  return useSuspenseQuery<Proposal>({
    queryKey: ['simulation-response-file'],
    queryFn: async () => {
      // Fetch the simulation results from the public directory
      const response = await fetch('/simulation-results.json', {
        // Add cache control to prevent caching issues
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(
          `Error fetching simulation results: ${response.status} ${response.statusText}`,
        );
        throw new Error(
          `Failed to fetch simulation results: ${response.status} ${response.statusText}`,
        );
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
    },
    // Add retry logic
    retry: 3,
    retryDelay: 1000,
  });
}
