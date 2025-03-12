import { DEFAULT_GOVERNOR_ADDRESS, GOVERNOR_ABI } from '@/config';
import { useMutation } from '@tanstack/react-query';
import { usePublicClient, useWalletClient, useSimulateContract } from 'wagmi';
import { useNewResponseFile } from './use-new-response-file';
import { toast } from 'sonner';
import { useMemo } from 'react';
import { isTestnet, testnetWalletClient } from '@/config/wagmi';

export function useWriteProposeNew() {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const walletClientToUse = useMemo(
    () => (isTestnet ? testnetWalletClient : walletClient),
    [walletClient],
  );
  const { data: proposal } = useNewResponseFile();

  return useMutation({
    mutationFn: async () => {
      if (!publicClient) {
        throw new Error('No public client found');
      }
      if (!walletClientToUse) {
        throw new Error('No wallet connected');
      }

      const { request } = await publicClient.simulateContract({
        abi: GOVERNOR_ABI,
        functionName: 'propose',
        args: [
          proposal.targets,
          proposal.values,
          proposal.signatures,
          proposal.calldatas,
          proposal.description,
        ],
        address: DEFAULT_GOVERNOR_ADDRESS,
        account: walletClientToUse?.account,
      });

      console.log('Proposing with account:', walletClientToUse.account.address);
      console.log('Proposal data:', {
        targets: proposal.targets,
        values: proposal.values,
        signatures: proposal.signatures,
        calldatas: proposal.calldatas,
        description: proposal.description,
      });

      // Submit the proposal
      const hash = await walletClientToUse.writeContract(request);

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
      console.error('Proposal error:', error);
      toast.error('❌ Error', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    },
  });
}
