import { useQuery } from '@tanstack/react-query';

export interface Proposal {
  id: string;
  targets: `0x${string}`[];
  values: bigint[];
  signatures: string[];
  calldatas: `0x${string}`[];
  description: string;
}

export function useNewResponseFile() {
  return useQuery<Proposal>({
    queryKey: ['new-response-file'],
    queryFn: async () => {
      // Fetch the simulation results from our API route
      const response = await fetch('/api/simulation-results');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.message ||
          `Failed to fetch simulation results: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        return {
          ...data[0],
          // Convert string values back to their proper types
          values: data[0].values.map((value: string) => BigInt(value)),
        };
      }

      return {
        ...data,
        values: data.values.map((value: string) => BigInt(value)),
      };
    },
  });
}
