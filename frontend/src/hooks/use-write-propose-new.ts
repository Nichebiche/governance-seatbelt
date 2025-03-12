import { DEFAULT_GOVERNOR_ADDRESS, GOVERNOR_ABI } from '@/config';
import { usePublicClient, useWriteContract } from 'wagmi';
import { useNewResponseFile } from './use-new-response-file';
import { toast } from 'sonner';
import { useCallback, useState } from 'react';
import { parseWeb3Error } from '@/lib/errors';
import type { TransactionReceipt } from 'viem';

const TRANSACTION_TIMEOUT = 30000; // 30 seconds timeout
const HIGH_GAS_LIMIT = BigInt(10000000); // 10M gas limit for complex governance operations

/**
 * Hook for creating a new proposal
 */
export function useWriteProposeNew() {
  const publicClient = usePublicClient();
  const { data: proposal } = useNewResponseFile();
  const { writeContractAsync, data: hash, isPending: isPendingConfirmation } = useWriteContract();
  const [isPending, setPending] = useState(false);

  const proposeNew = useCallback(async () => {
    if (!publicClient) throw new Error('Public client not found');
    if (!proposal) throw new Error('Proposal not found');

    // Clear any existing toasts
    toast.dismiss();

    try {
      // Show waiting for confirmation toast
      const toastId = toast.loading('Waiting for confirmation...');

      const hash = await writeContractAsync({
        address: DEFAULT_GOVERNOR_ADDRESS,
        abi: GOVERNOR_ABI,
        functionName: 'propose',
        args: [
          proposal.targets,
          proposal.values,
          proposal.signatures,
          proposal.calldatas,
          proposal.description,
        ],
        gas: HIGH_GAS_LIMIT, // Set high gas limit for governance operations
      });
      console.log('🦄 ~ proposeNew ~ hash:', hash);

      setPending(true);

      // Update toast to show waiting for transaction
      toast.loading('Waiting for transaction to be confirmed...', {
        id: toastId,
      });

      // Create a promise that rejects after timeout
      const timeoutPromise = new Promise<TransactionReceipt>((_, reject) => {
        setTimeout(() => reject(new Error('Transaction timed out')), TRANSACTION_TIMEOUT);
      });

      // Race between the transaction receipt and timeout
      const receipt = (await Promise.race([
        publicClient.waitForTransactionReceipt({ hash }),
        timeoutPromise,
      ])) as TransactionReceipt;

      // Check if transaction was successful
      if (receipt.status === 'reverted') {
        throw new Error('Transaction reverted');
      }

      // Show success toast
      toast.success('✅ Proposal Created!', {
        description: `Transaction confirmed in block ${receipt.blockNumber}`,
      });
      setPending(false);

      console.log(`Proposal created with hash: ${hash}`);
      return hash;
    } catch (error) {
      setPending(false);
      // Show error toast with more specific messages
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error('❌ Error', {
        description: errorMessage.includes('Transaction timed out')
          ? 'Transaction timed out. Please check Tenderly for details.'
          : parseWeb3Error(error as Error),
      });
      throw error;
    }
  }, [proposal, writeContractAsync, publicClient]);

  return {
    proposeNew,
    hash,
    isPendingConfirmation,
    isPending,
  };
}
