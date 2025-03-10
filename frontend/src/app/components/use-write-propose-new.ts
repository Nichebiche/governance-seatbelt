import { DEFAULT_GOVERNOR_ADDRESS, GOVERNOR_ABI } from '@/config';
import { useMutation } from '@tanstack/react-query';
import { usePublicClient, useWriteContract } from 'wagmi';
import { useNewResponseFile } from './use-new-response-file';

export function useWriteProposeNew() {
  const publicClient = usePublicClient();
  const { data: proposal } = useNewResponseFile();
  const { writeContractAsync: propose } = useWriteContract();

  return useMutation({
    mutationFn: async () => {
      if (!publicClient) {
        throw new Error('Public client not found');
      }

      if (!proposal) {
        throw new Error('Proposal not found');
      }

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

      // show toast?

      // wait for the tx to be mined
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      return receipt;
    },
    onSuccess: () => {
      // show toast?
    },
  });
}
