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
      const response = await fetch('/api/simulation-results');
      const data = await response.json();
      const result = {
        ...data[0],
        values: data[0].values.map((value: string) => BigInt(value)),
      };
      return result;
    },
  });
}
