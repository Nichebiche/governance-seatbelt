export interface ProposalCacheEntry {
  timestamp: number;
  proposalState: string | null;
  simulationData: any;
}

export type NeedsSimulationParams = {
  daoName: string;
  governorAddress: string;
  proposalId: string;
  currentState: string | null;
};
