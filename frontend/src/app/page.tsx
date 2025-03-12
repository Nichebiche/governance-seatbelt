'use client';

import ConnectButton from '@/components/connect-button';
import { type Proposal, useNewResponseFile } from '@/hooks/use-new-response-file';
import { useWriteProposeNew } from '@/hooks/use-write-propose-new';
import { useAccount } from 'wagmi';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { InfoIcon, AlertTriangleIcon, CheckCircleIcon } from 'lucide-react';
import { ErrorBoundary } from 'react-error-boundary';

// Fallback component for when the query fails
function ErrorFallback({ error }: { error: Error }) {
  return (
    <Alert variant="destructive" className="w-full">
      <AlertTriangleIcon className="h-4 w-4" />
      <AlertTitle>Error Loading Proposal Data</AlertTitle>
      <AlertDescription>
        {error.message}
        <p className="mt-2">
          Make sure you have run a simulation and the simulation-results.json file exists in the
          public directory.
        </p>
      </AlertDescription>
    </Alert>
  );
}

// Main component with proper error handling
export default function Home() {
  const { isConnected } = useAccount();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 gap-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Governance Seatbelt</h1>

      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <ProposalSection isConnected={isConnected} />
      </ErrorBoundary>

      <Toaster position="bottom-right" />
    </div>
  );
}

// Separate component for the proposal section
function ProposalSection({ isConnected }: { isConnected: boolean }) {
  const { data: proposal, error } = useNewResponseFile();
  const { mutate: proposeNew, isPending, isPendingConfirmation } = useWriteProposeNew();

  const handlePropose = () => {
    if (!proposal) {
      toast.error('No proposal data available');
      return;
    }

    proposeNew();
  };

  // Show error if there is one
  if (error) {
    return (
      <Alert variant="destructive" className="w-full">
        <AlertTriangleIcon className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error.message}
          <p className="mt-2">
            Make sure you have run a simulation and the simulation-results.json file exists in the
            public directory.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  // Show loading or no data message if there's no proposal
  if (!proposal) {
    return (
      <Alert className="w-full">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>No Proposal Data Found</AlertTitle>
        <AlertDescription>
          <p>Run a simulation first to generate proposal data.</p>
          <code className="block mt-2 p-2 bg-gray-100 rounded text-sm">
            bun run sim [simulation-name]
          </code>
        </AlertDescription>
      </Alert>
    );
  }

  // Show proposal and propose button if we have data
  return (
    <>
      <ProposalCard proposal={proposal} />

      <div className="flex gap-4 items-center">
        <ConnectButton />
        {isConnected && (
          <Button
            onClick={handlePropose}
            disabled={isPending || isPendingConfirmation}
            className="cursor-pointer"
          >
            {isPendingConfirmation
              ? 'Confirming...'
              : isPending
                ? 'Creating Proposal...'
                : 'Propose'}
          </Button>
        )}
      </div>
    </>
  );
}

function ProposalCard({ proposal }: { proposal: Proposal }) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{proposal.description}</CardTitle>
        <CardDescription>Proposal details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-sm">Targets:</h3>
          <p className="font-mono text-sm break-all bg-gray-50 p-2 rounded">
            {proposal.targets.join(', ')}
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-sm">Values:</h3>
          <p className="font-mono text-sm bg-gray-50 p-2 rounded">
            {proposal.values.map((v) => v.toString()).join(', ')}
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-sm">Signatures:</h3>
          <p className="font-mono text-sm bg-gray-50 p-2 rounded">
            {proposal.signatures.join(', ')}
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-sm">Calldatas:</h3>
          <p className="font-mono text-sm break-all bg-gray-50 p-2 rounded">
            {proposal.calldatas.join(', ')}
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex items-center text-sm text-gray-500">
          <CheckCircleIcon className="h-4 w-4 mr-2 text-green-500" />
          Ready to propose
        </div>
      </CardFooter>
    </Card>
  );
}
