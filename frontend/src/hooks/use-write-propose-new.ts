import { DEFAULT_GOVERNOR_ADDRESS, GOVERNOR_ABI } from '@/config';
import { useMutation } from '@tanstack/react-query';
import { usePublicClient, useWriteContract } from 'wagmi';
import { useNewResponseFile } from './use-new-response-file';
import { type Hash, decodeEventLog, type Log } from 'viem';
import { parseWeb3Error } from '@/lib/errors';
import { toast } from 'sonner';

export function useWriteProposeNew() {
  const publicClient = usePublicClient();
  const { data: proposal } = useNewResponseFile();
  const { writeContractAsync: propose } = useWriteContract();

  return useMutation({
    mutationFn: async () => {
      if (!publicClient) {
        throw new Error('Please connect your wallet');
      }

      if (!proposal) {
        throw new Error('No proposal data available');
      }

      // Log the proposal data for debugging
      console.log('Submitting proposal:', {
        targets: proposal.targets,
        values: proposal.values.map((v) => v.toString()),
        signatures: proposal.signatures,
        calldatas: proposal.calldatas,
        description: proposal.description,
      });

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

      console.log('Proposal submitted:', hash);

      // Wait for transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log('Transaction mined:', receipt);

      // Find the ProposalCreated event to get the proposal ID
      return { hash, receipt };
    },
    onSuccess: () => {
      toast.success('Proposal created successfully!');
    },
    onError: (error) => {
      toast.error(parseWeb3Error(error as Error));
    },
  });
}
