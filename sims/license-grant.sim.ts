import { encodeFunctionData, parseAbi } from 'viem';
/**
 * @notice Sample simulation configuration file for a proposal that does not exist on-chain.
 * This proposal configures ENS records so the Uniswap DAO Grants Voltz an additional use grant.
 * Be aware this is identical to an already executed proposal: https://app.uniswap.org/#/vote/2/11?chain=mainnet
 */
import type { SimulationConfigNew } from '../types';

const ensRegistryAbi = parseAbi([
  'function setSubnodeRecord(bytes32 node, bytes32 label, address owner, address resolver, uint64 ttl) external',
]);

const ensPublicResolverAbi = parseAbi([
  'function setText(bytes32 node, string calldata key, string calldata value) external',
]);

// Define the parameters for each action.
const call1 = {
  target: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e' as const, // ENS Registry contract.
  calldata: encodeFunctionData({
    abi: ensRegistryAbi,
    functionName: 'setSubnodeRecord',
    args: [
      '0xec9ec573cf97ad1c270be71ac1de3b382790cb346036130c7d7ff844bf8f4974', // Node.
      '0x15ff9b5bd7642701a10e5ea8fb29c957ffda4854cd028e9f6218506e6b509af2', // Label.
      '0x1a9C8182C09F50C8318d769245beA52c32BE35BC' as const, // Owner.
      '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41' as const, // Resolver.
      0n, // TTL.
    ],
  }),
  value: 0n,
  signature: '',
};

const call2 = {
  target: '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41' as const, // ENS Public Resolver.
  calldata: encodeFunctionData({
    abi: ensPublicResolverAbi,
    functionName: 'setText',
    args: [
      // Node.
      '0xa35d592ec6e5289a387cba1d5f82be794f495bd5a361a1fb314687c6aefea1f4',
      // Key.
      'Voltz Uni v3 Additional Use Grant',
      // Value.
      'Voltz Labs Technology Limited ("Voltz") is granted an additional use grant to allow the Voltz DAO to use the Uniswap V3 Core software code (which is made available to Voltz subject to license available at https://github.com/Uniswap/v3-core/blob/main/LICENSE (the "Uniswap Code")). As part of this additional use grant, the Voltz DAO receives a limited worldwide license to use the Uniswap Code for the purposes of: creating, deploying and making available aspects of an interest rate swap automated market maker (the "IRS AMM"); to modify and update the IRS AMM over time; and deploy the IRS AMM and portions thereof as smart contracts on blockchain-based applications and protocols. The Voltz DAO is permitted to use subcontractors to do this work. This license is conditional on Voltz and the Voltz DAO complying with the terms of the Business Source License 1.1, made available at https://github.com/Uniswap/v3-core/blob/main/LICENSE.',
    ],
  }),
  value: 0n,
  signature: '',
};

export const config: SimulationConfigNew = {
  type: 'new',
  daoName: 'Uniswap',
  governorAddress: '0x408ED6354d4973f66138C91495F2f2FCbd8724C3' as const,
  governorType: 'bravo',
  targets: [call1.target, call2.target],
  values: [call1.value, call2.value],
  signatures: [call1.signature as `0x${string}`, call2.signature as `0x${string}`],
  calldatas: [call1.calldata, call2.calldata],
  description: 'Provide Voltz with v3 Additional Use Grant',
};
