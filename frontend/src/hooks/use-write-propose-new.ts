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
      try {
        if (!publicClient) {
          throw new Error('Public client not found. Please connect your wallet.');
        }

        if (!proposal) {
          throw new Error(
            'Proposal data not found. Please make sure simulation results are available.',
          );
        }

        console.log('Submitting proposal with data:', {
          targets: proposal.targets,
          values: proposal.values.map((v: bigint) => v.toString()),
          signatures: proposal.signatures,
          calldatas: proposal.calldatas,
          description: proposal.description,
        });

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

        console.log('Proposal transaction submitted with hash:', hash);

        // wait for the tx to be mined
        console.log('Waiting for transaction to be mined...');
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log('Transaction mined:', receipt);

        return receipt;
      } catch (error) {
        console.error('Error in propose mutation:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Proposal successfully created:', data);
    },
    onError: (error) => {
      console.error('Error creating proposal:', error);
    },
  });
}
