import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BigNumber } from 'ethers';
import { getAddress } from 'viem';
import type { SimulationData } from '../../types';
import type { ProposalCacheEntry } from './types';

// Cache directory path - use a non-gitignored location
const CACHE_DIR = join(process.cwd(), 'cache');
const PROPOSAL_CACHE_DIR = join(CACHE_DIR, 'proposals');

// Ensure cache directory exists
if (!existsSync(PROPOSAL_CACHE_DIR)) {
  mkdirSync(PROPOSAL_CACHE_DIR, { recursive: true });
}

/**
 * Gets the cache key for a proposal
 */
function getCacheKey(daoName: string, governorAddress: string, proposalId: string): string {
  return `${daoName}-${governorAddress}-${proposalId}`;
}

/**
 * Gets the cache file path for a proposal
 */
function getCacheFilePath(daoName: string, governorAddress: string, proposalId: string): string {
  const cacheKey = getCacheKey(daoName, governorAddress, proposalId);
  return join(PROPOSAL_CACHE_DIR, `${cacheKey}.json`);
}

/**
 * Checks if a proposal is cached
 */
export function isProposalCached(
  daoName: string,
  governorAddress: string,
  proposalId: string,
): boolean {
  const cachePath = getCacheFilePath(daoName, governorAddress, proposalId);
  return existsSync(cachePath);
}

/**
 * Gets cached simulation data for a proposal
 */
export function getCachedProposal(
  daoName: string,
  governorAddress: string,
  proposalId: string,
): ProposalCacheEntry | null {
  const cachePath = getCacheFilePath(daoName, governorAddress, proposalId);
  try {
    if (existsSync(cachePath)) {
      const data = readFileSync(cachePath, 'utf8');
      const parsed = JSON.parse(data);

      // Convert string values back to BigNumber objects
      if (parsed.simulationData?.proposal) {
        const proposal = parsed.simulationData.proposal;
        if (proposal.startBlock) proposal.startBlock = BigNumber.from(proposal.startBlock);
        if (proposal.endBlock) proposal.endBlock = BigNumber.from(proposal.endBlock);
        if (proposal.id) proposal.id = BigNumber.from(proposal.id);
        if (proposal.proposalId) proposal.proposalId = BigNumber.from(proposal.proposalId);
        if (proposal.values)
          proposal.values = proposal.values.map((v: string) => BigNumber.from(v));
        if (proposal.targets) proposal.targets = proposal.targets.map((t: string) => getAddress(t));
        if (proposal.signatures) proposal.signatures = proposal.signatures.map((s: string) => s);
        if (proposal.calldatas) proposal.calldatas = proposal.calldatas.map((c: string) => c);
      }

      return parsed;
    }
  } catch (error) {
    console.warn(`Error reading cache for proposal ${proposalId}:`, error);
  }
  return null;
}

/**
 * Caches simulation data for a proposal
 */
export function cacheProposal(
  daoName: string,
  governorAddress: string,
  proposalId: string,
  proposalState: string | null,
  simulationData: SimulationData,
): void {
  const cachePath = getCacheFilePath(daoName, governorAddress, proposalId);
  try {
    // Ensure the cache directory exists
    if (!existsSync(PROPOSAL_CACHE_DIR)) {
      mkdirSync(PROPOSAL_CACHE_DIR, { recursive: true });
    }

    // Create a deep copy of the simulation data to avoid modifying the original
    const cachedData = JSON.parse(JSON.stringify(simulationData));

    // Convert BigNumber values to strings for storage
    if (cachedData.proposal) {
      const proposal = cachedData.proposal;
      if (proposal.startBlock) proposal.startBlock = proposal.startBlock.toString();
      if (proposal.endBlock) proposal.endBlock = proposal.endBlock.toString();
      if (proposal.id) proposal.id = proposal.id.toString();
      if (proposal.proposalId) proposal.proposalId = proposal.proposalId.toString();
      if (proposal.values) proposal.values = proposal.values.map((v: BigNumber) => v.toString());
      if (proposal.targets) proposal.targets = proposal.targets.map((t: string) => getAddress(t));
      if (proposal.signatures) proposal.signatures = proposal.signatures.map((s: string) => s);
      if (proposal.calldatas) proposal.calldatas = proposal.calldatas.map((c: string) => c);
    }

    // Create cache entry
    const cacheEntry: ProposalCacheEntry = {
      timestamp: Date.now(),
      proposalState: proposalState || 'Unknown',
      simulationData: cachedData,
    };

    // Write to cache file
    writeFileSync(cachePath, JSON.stringify(cacheEntry, null, 2));
  } catch (error) {
    console.warn(`Error caching proposal ${proposalId}:`, error);
  }
}

/**
 * Checks if a proposal needs to be simulated based on its cache status
 */
export function needsSimulation(
  daoName: string,
  governorAddress: string,
  proposalId: string,
  currentState: string,
): boolean {
  // If we don't have a current state, we should simulate
  if (!currentState) {
    return true;
  }

  const cachedEntry = getCachedProposal(daoName, governorAddress, proposalId);
  if (!cachedEntry) {
    return true;
  }

  // List of terminal states where we don't need to re-simulate
  const terminalStates = ['Executed', 'Defeated', 'Expired', 'Canceled'];

  // If the proposal is in a terminal state and we have cached data, we don't need to re-simulate
  if (terminalStates.includes(currentState)) {
    return false;
  }

  // For active proposals, re-simulate if:
  // 1. The state has changed
  // 2. The cache is older than 3 hours (matching our workflow schedule)
  const threeHours = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
  const isStale = Date.now() - cachedEntry.timestamp > threeHours;
  const stateChanged = cachedEntry.proposalState !== currentState;

  return isStale || stateChanged;
}
