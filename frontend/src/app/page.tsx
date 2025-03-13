'use client';

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
    <div className="w-full space-y-6">
      <ProposalCard
        proposal={proposal}
        onPropose={handlePropose}
        isPending={isPending}
        isPendingConfirmation={isPendingConfirmation}
        isConnected={isConnected}
      />
    </div>
  );
}

function ProposalCard({
  proposal,
  onPropose,
  isPending,
  isPendingConfirmation,
  isConnected,
}: {
  proposal: Proposal;
  onPropose: () => void;
  isPending: boolean;
  isPendingConfirmation: boolean;
  isConnected: boolean;
}) {
  // Helper function to display empty values consistently
  const displayValue = (value: string | string[]) => {
    if (Array.isArray(value)) {
      return value.length === 0 || (value.length === 1 && value[0] === '')
        ? '(empty)'
        : value.join(', ');
    }
    return value === '' ? '(empty)' : value;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{proposal.description}</CardTitle>
        <CardDescription>Transaction Parameters</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div>
          <h3 className="font-medium text-sm mb-2">Target Contracts</h3>
          <p className="font-mono text-sm break-all bg-muted p-3 rounded-md min-h-[40px] flex items-center">
            {displayValue(proposal.targets)}
          </p>
        </div>

        <div>
          <h3 className="font-medium text-sm mb-2">ETH Values</h3>
          <p className="font-mono text-sm bg-muted p-3 rounded-md min-h-[40px] flex items-center">
            {displayValue(proposal.values.map((v) => v.toString()))}
          </p>
        </div>

        <div>
          <h3 className="font-medium text-sm mb-2">Function Signatures</h3>
          <p className="font-mono text-sm bg-muted p-3 rounded-md min-h-[40px] flex items-center">
            {displayValue(proposal.signatures)}
          </p>
        </div>

        <div>
          <h3 className="font-medium text-sm mb-2">Encoded Function Data</h3>
          <p className="font-mono text-sm break-all bg-muted p-3 rounded-md min-h-[40px] flex items-center">
            {displayValue(proposal.calldatas)}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center border-t pt-4">
        <div className="flex items-center text-sm text-muted-foreground">
          <CheckCircleIcon className="h-4 w-4 mr-2 text-green-500" />
          Ready to propose
        </div>
        {isConnected && (
          <Button
            onClick={onPropose}
            disabled={isPending || isPendingConfirmation}
            size="lg"
            className="cursor-pointer"
          >
            {isPendingConfirmation ? 'Confirming...' : isPending ? 'Creating...' : 'Propose'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
