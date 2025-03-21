import type { Address } from 'viem';
import { parseAbi } from 'viem';
import { publicClient } from '../clients/client';

export const timelockAbi = parseAbi([
  'function executeTransaction(address target, uint256 value, string signature, bytes data, uint256 eta) payable returns (bytes)',
  'function acceptAdmin()',
  'function pendingAdmin() view returns (address)',
  'function queueTransaction(address target, uint256 value, string signature, bytes data, uint256 eta) returns (bytes32)',
  'function setPendingAdmin(address pendingAdmin_)',
  'function cancelTransaction(address target, uint256 value, string signature, bytes data, uint256 eta)',
  'function delay() view returns (uint256)',
  'function MAXIMUM_DELAY() view returns (uint256)',
  'function MINIMUM_DELAY() view returns (uint256)',
  'function GRACE_PERIOD() view returns (uint256)',
  'function setDelay(uint256 delay_)',
  'function queuedTransactions(bytes32) view returns (bool)',
  'function admin() view returns (address)',
  'constructor(address admin_, uint256 delay_)',
  'event NewAdmin(address indexed newAdmin)',
  'event NewPendingAdmin(address indexed newPendingAdmin)',
  'event NewDelay(uint256 indexed newDelay)',
  'event CancelTransaction(bytes32 indexed txHash, address indexed target, uint256 value, string signature, bytes data, uint256 eta)',
  'event ExecuteTransaction(bytes32 indexed txHash, address indexed target, uint256 value, string signature, bytes data, uint256 eta)',
  'event QueueTransaction(bytes32 indexed txHash, address indexed target, uint256 value, string signature, bytes data, uint256 eta)',
]);

export function timelock(address: Address) {
  const contract = { address, abi: timelockAbi } as const;

  return {
    read: {
      admin: async () => await publicClient.readContract({ ...contract, functionName: 'admin' }),
      pendingAdmin: () => publicClient.readContract({ ...contract, functionName: 'pendingAdmin' }),
      delay: () => publicClient.readContract({ ...contract, functionName: 'delay' }),
      maximumDelay: () => publicClient.readContract({ ...contract, functionName: 'MAXIMUM_DELAY' }),
      minimumDelay: () => publicClient.readContract({ ...contract, functionName: 'MINIMUM_DELAY' }),
      gracePeriod: () => publicClient.readContract({ ...contract, functionName: 'GRACE_PERIOD' }),
      queuedTransactions: (txHash: `0x${string}`) =>
        publicClient.readContract({
          ...contract,
          functionName: 'queuedTransactions',
          args: [txHash],
        }),
    },
  };
}
