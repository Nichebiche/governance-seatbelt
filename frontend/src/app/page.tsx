import ConnectButton from '@/app/components/connect-button';
import { type Proposal, useNewResponseFile } from '@/app/components/use-new-response-file';
import { useWriteProposeNew } from './components/use-write-propose-new';
import { useAccount } from 'wagmi';

export default function Home() {
  const { isConnected } = useAccount();
  const { data: proposal } = useNewResponseFile();
  const { mutate: proposeNew } = useWriteProposeNew();

  return (
    <div className="flex items-center justify-center min-h-screen">
      <ProposalCard proposal={proposal} />
      <ConnectButton />
      {isConnected && (
        <button type="button" onClick={() => proposeNew()}>
          Propose
        </button>
      )}
    </div>
  );
}

function ProposalCard({ proposal }: { proposal: Proposal }) {
  return (
    <div>
      <h1>{proposal.description}</h1>
      <p>{proposal.targets.join(', ')}</p>
      <p>{proposal.values.join(', ')}</p>
      <p>{proposal.signatures.join(', ')}</p>
      <p>{proposal.calldatas.join(', ')}</p>
    </div>
  );
}
