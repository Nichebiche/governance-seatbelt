export const GOVERNOR_ABI = [
  {
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    name: 'execute',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    name: 'state',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
