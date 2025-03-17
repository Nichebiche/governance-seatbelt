import type { SimulationData } from '../../types';

export interface ProposalCacheEntry {
  timestamp: number;
  proposalState: string | null;
  simulationData: SimulationData;
}

export type NeedsSimulationParams = {
  daoName: string;
  governorAddress: string;
  proposalId: string;
  currentState: string | null;
};
