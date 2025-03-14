import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { SimulationData, SimulationResult } from '../../types';
import { PROPOSAL_STATES } from '../contracts/governor-bravo';

// Define the cache directory
const CACHE_DIR = join(process.cwd(), 'cache', 'proposals');

// Define the cache entry type
interface ProposalCacheEntry {
  timestamp: number;
  proposalState: string | null;
  simulationData: SimulationData;
}

/**
 * Ensures the cache directory exists
 */
function ensureCacheDirectory(): void {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
    console.log(`Created cache directory: ${CACHE_DIR}`);
  }
}

/**
 * Generates a cache key for a proposal
 * @param daoName The name of the DAO
 * @param governorAddress The address of the governor contract
 * @param proposalId The ID of the proposal
 * @returns The cache key
 */
function getCacheKey(daoName: string, governorAddress: string, proposalId: string): string {
  return `${daoName}-${governorAddress.toLowerCase()}-${proposalId}`;
}

/**
 * Gets the path to the cache file for a proposal
 * @param daoName The name of the DAO
 * @param governorAddress The address of the governor contract
 * @param proposalId The ID of the proposal
 * @returns The path to the cache file
 */
function getCacheFilePath(daoName: string, governorAddress: string, proposalId: string): string {
  const cacheKey = getCacheKey(daoName, governorAddress, proposalId);
  return join(CACHE_DIR, `${cacheKey}.json`);
}

/**
 * Checks if a proposal simulation is cached
 * @param daoName The name of the DAO
 * @param governorAddress The address of the governor contract
 * @param proposalId The ID of the proposal
 * @returns True if the proposal is cached, false otherwise
 */
export function isProposalCached(
  daoName: string,
  governorAddress: string,
  proposalId: string,
): boolean {
  const cacheFilePath = getCacheFilePath(daoName, governorAddress, proposalId);
  return existsSync(cacheFilePath);
}

/**
 * Gets a cached proposal simulation
 * @param daoName The name of the DAO
 * @param governorAddress The address of the governor contract
 * @param proposalId The ID of the proposal
 * @returns The cached simulation data or null if not found
 */
export function getCachedProposal(
  daoName: string,
  governorAddress: string,
  proposalId: string,
): ProposalCacheEntry | null {
  try {
    const cacheFilePath = getCacheFilePath(daoName, governorAddress, proposalId);
    if (!existsSync(cacheFilePath)) {
      return null;
    }

    const cacheData = readFileSync(cacheFilePath, 'utf-8');
    return JSON.parse(cacheData) as ProposalCacheEntry;
  } catch (error) {
    console.error(`Error reading cache for proposal ${proposalId}:`, error);
    return null;
  }
}

/**
 * Caches a proposal simulation
 * @param daoName The name of the DAO
 * @param governorAddress The address of the governor contract
 * @param proposalId The ID of the proposal
 * @param proposalState The current state of the proposal
 * @param simulationData The simulation data to cache
 */
export function cacheProposal(
  daoName: string,
  governorAddress: string,
  proposalId: string,
  proposalState: string | null,
  simulationData: SimulationData,
): void {
  try {
    ensureCacheDirectory();

    const cacheFilePath = getCacheFilePath(daoName, governorAddress, proposalId);
    const cacheEntry: ProposalCacheEntry = {
      timestamp: Date.now(),
      proposalState: proposalState || 'Unknown',
      simulationData,
    };

    // Convert BigNumber objects to strings for JSON serialization
    const serializedEntry = JSON.stringify(cacheEntry, (_, value) => {
      if (typeof value === 'object' && value !== null && typeof value.toHexString === 'function') {
        return value.toString();
      }
      return value;
    });

    writeFileSync(cacheFilePath, serializedEntry);
    console.log(`Cached simulation for proposal ${proposalId}`);
  } catch (error) {
    console.error(`Error caching proposal ${proposalId}:`, error);
  }
}

/**
 * Determines if a proposal needs to be simulated based on its current state and cache status
 * @param daoName The name of the DAO
 * @param governorAddress The address of the governor contract
 * @param proposalId The ID of the proposal
 * @param currentState The current state of the proposal
 * @returns True if the proposal needs simulation, false otherwise
 */
export function needsSimulation(
  daoName: string,
  governorAddress: string,
  proposalId: string,
  currentState: string | null,
): boolean {
  // If state is null, we need to simulate
  if (currentState === null) {
    return true;
  }

  // Always simulate if not cached
  if (!isProposalCached(daoName, governorAddress, proposalId)) {
    return true;
  }

  // Get the cached entry
  const cachedEntry = getCachedProposal(daoName, governorAddress, proposalId);
  if (!cachedEntry) {
    return true;
  }

  // If the proposal state has changed, we need to simulate again
  if (cachedEntry.proposalState !== currentState) {
    return true;
  }

  // If the proposal is in a terminal state (Executed, Defeated, Expired, Canceled),
  // we don't need to simulate again
  const terminalStates = [
    PROPOSAL_STATES['7'], // Executed
    PROPOSAL_STATES['3'], // Defeated
    PROPOSAL_STATES['6'], // Expired
    PROPOSAL_STATES['2'], // Canceled
  ];

  if (terminalStates.includes(currentState)) {
    return false;
  }

  // For active proposals, we might want to re-simulate periodically
  // For now, we'll re-simulate if the cache is older than 1 hour
  const ONE_HOUR = 60 * 60 * 1000;
  return Date.now() - cachedEntry.timestamp > ONE_HOUR;
}
