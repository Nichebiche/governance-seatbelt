/**
 * @notice Sample simulation configuration file for a proposal that does not exist on-chain.
 * This proposal configures ENS records so the Uniswap DAO Grants Voltz an additional use grant.
 * Be aware this is identical to an already executed proposal: https://app.uniswap.org/#/vote/2/11?chain=mainnet
 */
import type { SimulationConfigNew } from '../types';
import { Interface } from '@ethersproject/abi';
import { labelhash, namehash } from 'viem';
import ENSPublicResolverABI from '../utils/ABIs/ENSPublicResolverABI.json' assert { type: 'json' };

// Get interfaces to facilitate encoding the calls we want to execute.
const ensRegistryAbi = [
  'function setSubnodeRecord(bytes32 node, bytes32 label, address owner, address resolver, uint64 ttl) external',
];

const ensRegistryInterface = new Interface(ensRegistryAbi);
const ensPublicResolverInterface = new Interface(ENSPublicResolverABI);

const ensRegistry = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
const ensPublicResolver = '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41';
const timelock = '0x1a9C8182C09F50C8318d769245beA52c32BE35BC';
const nameHash = namehash('uniswap.eth');
const labelHash = labelhash('v2deployments');
const subnameHash = namehash('v2deployments.uniswap.eth');

console.log({
  nameHash,
  labelHash,
  subnameHash,
});

// Define the parameters for each action.
const call1 = {
  target: ensRegistry, // ENS Registry contract.
  calldata: ensRegistryInterface.encodeFunctionData('setSubnodeRecord', [
    nameHash, // Node.
    labelHash, // Label.
    timelock, // Owner.
    ensPublicResolver, // Resolver.
    0, // TTL.
  ]),
  value: 0,
  signature: '',
};

const call2 = {
  target: ensPublicResolver, // ENS Public Resolver.
  calldata: ensPublicResolverInterface.encodeFunctionData('setText', [
    // Node.
    subnameHash,
    // Key.
    'ARBITRUM',
    // Value.
    '0x4Dbd4fc535Ac27206064B68FfCf827b0A60BAB3f',
  ]),
  value: 0,
  signature: '',
};

const call3 = {
  target: ensPublicResolver, // ENS Public Resolver.
  calldata: ensPublicResolverInterface.encodeFunctionData('setText', [
    // Node.
    subnameHash,
    // Key.
    'OPTIMISM',
    // Value.
    '0x25ace71c97B33Cc4729CF772ae268934F7ab5fA1',
  ]),
  value: 0,
  signature: '',
};
const call4 = {
  target: ensPublicResolver, // ENS Public Resolver.
  calldata: ensPublicResolverInterface.encodeFunctionData('setText', [
    // Node.
    subnameHash,
    // Key.
    'CELO',
    // Value.
    '0xf7e46b233abd1edaad8dbbbda12129b97b071025',
  ]),
  value: 0,
  signature: '',
};
const call5 = {
  target: ensPublicResolver, // ENS Public Resolver.
  calldata: ensPublicResolverInterface.encodeFunctionData('setText', [
    // Node.
    subnameHash,
    // Key.
    'POLYGON',
    // Value.
    '0xfe5e5D361b2ad62c541bAb87C45a0B9B018389a2',
  ]),
  value: 0,
  signature: '',
};
const call6 = {
  target: ensPublicResolver, // ENS Public Resolver.
  calldata: ensPublicResolverInterface.encodeFunctionData('setText', [
    // Node.
    subnameHash,
    // Key.
    'BNB',
    // Value.
    '0xf5F4496219F31CDCBa6130B5402873624585615a',
  ]),
  value: 0,
  signature: '',
};
const call7 = {
  target: ensPublicResolver, // ENS Public Resolver.
  calldata: ensPublicResolverInterface.encodeFunctionData('setText', [
    // Node.
    subnameHash,
    // Key.
    'GNOSIS',
    // Value.
    '0xf5F4496219F31CDCBa6130B5402873624585615a',
  ]),
  value: 0,
  signature: '',
};
const call8 = {
  target: ensPublicResolver, // ENS Public Resolver.
  calldata: ensPublicResolverInterface.encodeFunctionData('setText', [
    // Node.
    subnameHash,
    // Key.
    'AVALANCHE',
    // Value.
    '0xeb0BCF27D1Fb4b25e708fBB815c421Aeb51eA9fc',
  ]),
  value: 0,
  signature: '',
};
const call9 = {
  target: ensPublicResolver, // ENS Public Resolver.
  calldata: ensPublicResolverInterface.encodeFunctionData('setText', [
    // Node.
    subnameHash,
    // Key.
    'ZKSYNC',
    // Value.
    '0x32400084C286CF3E17e7B677ea9583e60a000324',
  ]),
  value: 0,
  signature: '',
};
const call10 = {
  target: ensPublicResolver, // ENS Public Resolver.
  calldata: ensPublicResolverInterface.encodeFunctionData('setText', [
    // Node.
    subnameHash,
    // Key.
    'BOBA',
    // Value.
    '0x6D4528d192dB72E282265D6092F4B872f9Dff69e',
  ]),
  value: 0,
  signature: '',
};

const calls = [call1, call2, call3, call4, call5, call6, call7, call8, call9, call10];

export const config: SimulationConfigNew = {
  type: 'new',
  daoName: 'Uniswap',
  governorAddress: '0x408ED6354d4973f66138C91495F2f2FCbd8724C3',
  governorType: 'bravo',
  targets: calls.map((item) => item.target), // Array of targets to call.
  values: calls.map((item) => item.value), // Array of values with each call.
  signatures: calls.map((item) => item.signature), // Array of function signatures. Leave empty if generating calldata with ethers like we do here.
  calldatas: calls.map((item) => item.calldata), // Array of encoded calldatas.
  description: 'Deploy and Populate new subdomain',
};
