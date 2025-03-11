import { DEFAULT_GOVERNOR_ADDRESS, GOVERNOR_ABI } from '@/config';
import { useMutation } from '@tanstack/react-query';
import { usePublicClient, useWriteContract } from 'wagmi';
import { useNewResponseFile } from './use-new-response-file';
import { toast } from 'sonner';
import { useEffect } from 'react';

export function useWriteProposeNew() {
  const publicClient = usePublicClient();
  const { data: proposal } = useNewResponseFile();
  const { writeContractAsync: propose, isPending } = useWriteContract();

  useEffect(() => {
    if (isPending) {
      toast.loading('Confirming proposal...');
    }
  }, [isPending]);

  return useMutation({
    mutationFn: async () => {
      if (!publicClient) {
        throw new Error('Please connect your wallet');
      }

      if (!proposal) {
        throw new Error('No proposal data available');
      }

      // Submit the proposal
      const hash = await propose({
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
      });

      console.log('📝 Proposal submitted:', hash);
      toast.loading('Waiting for transaction confirmation...');

      // Wait for transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log('✅ Transaction confirmed:', {
        blockNumber: receipt.blockNumber,
        status: receipt.status === 'success' ? '✅ Success' : '❌ Failed',
        hash: receipt.transactionHash,
      });

      if (receipt.status !== 'success') {
        throw new Error('Proposal transaction failed');
      }

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
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    },
  });
}
