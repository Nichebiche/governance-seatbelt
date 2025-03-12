import { DEFAULT_GOVERNOR_ADDRESS, GOVERNOR_ABI } from '@/config';
import { usePublicClient, useWriteContract } from 'wagmi';
import { useNewResponseFile } from './use-new-response-file';
import { toast } from 'sonner';
import { parseWeb3Error } from '@/lib/errors';
import { useMutation } from '@tanstack/react-query';

const HIGH_GAS_LIMIT = BigInt(10000000); // 10M gas limit for complex governance operations

/**
 * Hook for creating a new proposal
 */
export function useWriteProposeNew() {
  const publicClient = usePublicClient();
  const { data: proposal } = useNewResponseFile();
  const { writeContractAsync, isPending: isPendingConfirmation } = useWriteContract();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!publicClient) throw new Error('Public client not found');
      if (!proposal) throw new Error('Proposal not found');

      // Clear any existing toasts
      toast.dismiss();

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
      console.log(`Proposal created with hash: ${hash}`);

      // Update toast to show waiting for transaction
      toast.loading('Waiting for transaction to be confirmed...', {
        id: toastId,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      // Check if transaction was successful
      if (receipt.status === 'reverted') {
        throw new Error('Transaction reverted', { cause: receipt });
      }

      // Show success toast
      toast.success('✅ Proposal Created!', {
        description: `Transaction confirmed in block ${receipt.blockNumber}`,
      });

      return { hash, receipt };
    },
    onSuccess: (data) => {
      toast.success('✅ Proposal Created!', {
        description: `Transaction confirmed in block ${data.receipt.blockNumber}`,
      });
    },
    onError: (error) => {
      toast.error('❌ Error', {
        description: parseWeb3Error(error as Error),
      });
    },
  });

  return {
    ...mutation,
    isPendingConfirmation,
  };
}
