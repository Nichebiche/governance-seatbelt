import { erc20Abi, erc20Abi_bytes32, getAddress } from 'viem';
import { publicClient } from '../clients/client';

const SAI = '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359';

export async function fetchTokenMetadata(address: string) {
  const tokenAddress = getAddress(address);
  const abi = tokenAddress === SAI ? erc20Abi_bytes32 : erc20Abi;
  const contract = { abi, address: tokenAddress } as const;

  const [name, symbol, decimals] = await publicClient.multicall({
    contracts: [
      { ...contract, functionName: 'name' },
      { ...contract, functionName: 'symbol' },
      { ...contract, functionName: 'decimals' },
    ],
  });

  return {
    name: name.result,
    symbol: symbol.result,
    decimals: decimals.result,
  };
}
