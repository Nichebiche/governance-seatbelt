import type { Address } from 'viem';
import { useSuspenseQuery } from '@tanstack/react-query';
import type { Report } from '@/components/ReportCard';

export interface Proposal {
  targets: Address[];
  values: bigint[];
  calldatas: `0x${string}`[];
  signatures: string[];
  description: string;
}

export interface SimulationResults {
  success: boolean;
  gasUsed: number;
  blockNumber: number;
  timestamp: string;
  transactions: Array<{
    hash: string;
    from: string;
    to: string;
    value: string;
    data: string;
    logs: Array<{
      address: string;
      topics: string[];
      data: string;
    }>;
  }>;
}

export interface SimulationResponse {
  proposalData: Proposal;
  report: Report;
  simulationResults: SimulationResults;
}

export function useNewResponseFile() {
  return useSuspenseQuery<SimulationResponse>({
    queryKey: ['simulation-response'],
    queryFn: async () => {
      const response = await fetch('/api/simulation-results');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch simulation data');
      }

      const data = await response.json();

      // Convert string values to BigInt for the proposal data
      return {
        ...data,
        proposalData: {
          ...data.proposalData,
          values: data.proposalData.values.map((value: string) => BigInt(value)),
        },
      };
    },
  });
}
