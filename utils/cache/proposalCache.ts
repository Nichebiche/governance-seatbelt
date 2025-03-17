import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BigNumber } from 'ethers';
import type { SimulationData } from '../../types';
import { PROPOSAL_STATES } from '../contracts/governor-bravo';
import type { NeedsSimulationParams, ProposalCacheEntry } from './types';

// Cache directory path - use GITHUB_WORKSPACE in CI, process.cwd() locally
const CACHE_DIR = process.env.GITHUB_WORKSPACE || process.cwd();
const PROPOSAL_CACHE_DIR = join(CACHE_DIR, 'cache', 'proposals');

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
      return JSON.parse(data);
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

    // Create cache entry
    const cacheEntry: ProposalCacheEntry = {
      timestamp: Date.now(),
      proposalState: proposalState || 'Unknown',
      simulationData: simulationData,
    };

    // Write to cache file
    writeFileSync(
      cachePath,
      JSON.stringify(
        cacheEntry,
        (_, value) => {
          if (value instanceof BigNumber) {
            return value.toString();
          }
          return value;
        },
        2,
      ),
    );
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
  // 2. The cache is older than 1 hour
  const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
  const isStale = Date.now() - cachedEntry.timestamp > oneHour;
  const stateChanged = cachedEntry.proposalState !== currentState;

  return isStale || stateChanged;
}
