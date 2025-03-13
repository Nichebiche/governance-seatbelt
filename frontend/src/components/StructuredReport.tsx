import type React from 'react';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircleIcon,
  AlertTriangleIcon,
  InfoIcon,
  ExternalLinkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from 'lucide-react';
import type {
  StructuredSimulationReport,
  SimulationCheck,
  SimulationStateChange,
  SimulationEvent,
} from '@/hooks/use-simulation-results';

interface StructuredReportProps {
  report: StructuredSimulationReport;
}

export function StructuredReport({ report }: StructuredReportProps) {
  return (
    <div className="w-full border border-muted rounded-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">{report.title}</h2>
        <div className="flex items-center mt-2">
          <span className="text-muted-foreground mr-2">Status:</span>
          <Badge
            variant={
              report.status === 'success'
                ? 'outline'
                : report.status === 'warning'
                  ? 'outline'
                  : 'destructive'
            }
            className={
              report.status === 'success'
                ? 'bg-green-100 text-green-800 border-green-300'
                : report.status === 'warning'
                  ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                  : ''
            }
          >
            {report.status === 'success'
              ? 'Passed'
              : report.status === 'warning'
                ? 'Passed with warnings'
                : 'Failed'}
          </Badge>
        </div>
        <p className="text-muted-foreground mt-2">{report.summary}</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger className="cursor-pointer" value="overview">
            Overview
          </TabsTrigger>
          <TabsTrigger className="cursor-pointer" value="checks">
            Checks
          </TabsTrigger>
          <TabsTrigger className="cursor-pointer" value="state-changes">
            State Changes
          </TabsTrigger>
        </TabsList>

        <div className="h-[600px] overflow-y-auto relative">
          <TabsContent
            value="overview"
            className="mt-4 space-y-6 absolute inset-0 overflow-y-auto pb-8 px-1"
          >
            {report.proposalText && (
              <div className="border border-muted rounded-md p-6 bg-card">
                <h3 className="text-lg font-semibold mb-3">Proposal Details</h3>
                <div className="bg-muted p-4 rounded-md whitespace-pre-wrap">
                  {report.proposalText}
                </div>
              </div>
            )}

            {report.calldata && (
              <div className="border border-muted rounded-md p-6 bg-card">
                <h3 className="text-lg font-semibold mb-3">Calldata Decoded</h3>
                <div className="bg-muted p-4 rounded-md font-mono text-sm overflow-x-auto">
                  {report.calldata.decoded}
                </div>
              </div>
            )}

            <div className="border border-muted rounded-md p-6 bg-card">
              <h3 className="text-lg font-semibold mb-3">Metadata</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted p-3 rounded-md">
                  <div className="text-sm text-muted-foreground">Block Number</div>
                  <div className="font-medium">
                    <a
                      href={`https://etherscan.io/block/${report.metadata.blockNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs bg-muted-foreground/10 px-1 py-0.5 rounded hover:underline inline-flex items-center"
                    >
                      {report.metadata.blockNumber}
                      <ExternalLinkIcon className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                </div>
                <div className="bg-muted p-3 rounded-md">
                  <div className="text-sm text-muted-foreground">Timestamp</div>
                  <div className="font-medium">
                    {new Date(Number.parseInt(report.metadata.timestamp) * 1000).toLocaleString()}
                  </div>
                </div>
                <div className="bg-muted p-3 rounded-md">
                  <div className="text-sm text-muted-foreground">Proposal ID</div>
                  <div className="font-medium">{report.metadata.proposalId}</div>
                </div>
                <div className="bg-muted p-3 rounded-md">
                  <div className="text-sm text-muted-foreground">Network</div>
                  <div className="font-medium">Ethereum</div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="checks" className="mt-4 absolute inset-0 overflow-y-auto pb-8 px-1">
            <div className="space-y-4">
              {report.checks.length === 0 ? (
                <div className="flex items-center justify-center p-6 text-muted-foreground border border-muted rounded-md">
                  <InfoIcon className="h-4 w-4 mr-2" />
                  <span>No checks found in the report</span>
                </div>
              ) : (
                report.checks.map((check, index) => (
                  <ExpandableCheckItem key={`check-${check.title}-${index}`} check={check} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent
            value="state-changes"
            className="mt-4 absolute inset-0 overflow-y-auto pb-8 px-1"
          >
            <div className="space-y-4">
              {report.stateChanges.length === 0 ? (
                <div className="flex items-center justify-center p-6 text-muted-foreground border border-muted rounded-md">
                  <InfoIcon className="h-4 w-4 mr-2" />
                  <span>No state changes found in the report</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Group state changes by contract */}
                  {Object.entries(
                    report.stateChanges.reduce<Record<string, SimulationStateChange[]>>(
                      (acc, change) => {
                        // Contract always exists on change but may be generic
                        const contractName = change.contract;

                        // We'll keep the original contract name in the key for grouping
                        const key = `${contractName}|${change.contractAddress || ''}`;

                        if (!acc[key]) {
                          acc[key] = [];
                        }
                        acc[key].push(change);
                        return acc;
                      },
                      {},
                    ),
                  ).map(([contractKey, changes]) => {
                    const [contractName, contractAddress] = contractKey.split('|');
                    return (
                      <div key={contractKey} className="space-y-3">
                        {/* Contract header */}
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">
                            {contractName === 'balances'
                              ? 'Token Balances'
                              : contractName === 'storage'
                                ? 'Contract Storage'
                                : contractName === 'code'
                                  ? 'Contract Code'
                                  : contractName}
                            {contractAddress && (
                              <span className="ml-2 text-sm font-normal">
                                at{' '}
                                <a
                                  href={`https://etherscan.io/address/${contractAddress}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-mono text-xs bg-muted-foreground/10 px-1 py-0.5 rounded hover:underline inline-flex items-center"
                                >
                                  {contractAddress}
                                  <ExternalLinkIcon className="h-3 w-3 ml-1" />
                                </a>
                              </span>
                            )}
                          </h3>
                        </div>
                        {/* State changes for this contract */}
                        <div className="space-y-3 pl-2">
                          {changes.map((change, index) => (
                            <StateChangeItem
                              key={`state-${change.contract}-${change.key}-${index}`}
                              stateChange={change}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

// Helper components
function ExpandableCheckItem({ check }: { check: SimulationCheck }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = () => {
    if (check.status === 'warning') {
      return <AlertTriangleIcon className="h-5 w-5 text-yellow-500" />;
    }
    if (check.status === 'failed') {
      return <AlertTriangleIcon className="h-5 w-5 text-red-500" />;
    }
    return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
  };

  const getStatusBadge = () => {
    if (check.status === 'warning') {
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
          Warning
        </Badge>
      );
    }
    if (check.status === 'failed') {
      return <Badge variant="destructive">Failed</Badge>;
    }
    return (
      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
        Passed
      </Badge>
    );
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Check if this is a state changes check
  const isStateChangesCheck = check.title.toLowerCase().includes('state changes');

  // Parse state changes from the details if this is a state changes check
  const parseStateChanges = (details?: string) => {
    if (!details || !isStateChangesCheck) return [];

    const stateChanges: SimulationStateChange[] = [];
    const lines = details.split('\n');

    let currentContract = '';
    let currentContractAddress = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Extract contract name and address
      if (line.includes('at `0x')) {
        const match = line.match(/(.+) at `(0x[a-fA-F0-9]{40})`/);
        if (match) {
          currentContract = match[1].trim();
          currentContractAddress = match[2];
        }
      }

      // Extract state changes
      if (line.includes('key `') && line.includes('changed from')) {
        const keyMatch = line.match(/`(.+)` changed from `(.+)` to `(.+)`/);
        if (keyMatch && currentContract) {
          stateChanges.push({
            contract: currentContract,
            contractAddress: currentContractAddress,
            key: keyMatch[1],
            oldValue: keyMatch[2],
            newValue: keyMatch[3],
          });
        }
      }
    }

    return stateChanges;
  };

  // Format the details content as React components
  const FormattedDetails = useMemo(() => {
    if (!check.details) return null;

    // Pre-process the raw details to remove all instances of "**Info**:" and similar patterns
    let preprocessedDetails = check.details;

    // First, handle the specific case of "**Info**: - Uni (Uniswap)"
    preprocessedDetails = preprocessedDetails.replace(
      /\*\*Info\*\*: - ([A-Za-z0-9]+ \([A-Za-z0-9]+\))/g,
      '$1',
    );

    // Then remove all other variations of Info prefixes
    preprocessedDetails = preprocessedDetails
      .replace(/\*\*Info\*\*:/g, '')
      .replace(/\*\*Warnings\*\*:/g, '')
      .replace(/Info:/g, '')
      .replace(/Warnings:/g, '')
      .replace(/^- \*\*Info\*\*:/gm, '')
      .replace(/^-\s*\*\*Info\*\*:/gm, '')
      .replace(/^-\s*Info:/gm, '')
      .replace(/^-\s*/gm, '');

    // Remove all markdown formatting
    const cleanedDetails = preprocessedDetails.replace(/\*\*([^*]+)\*\*:/g, '$1:');

    // Split by lines to process each line
    const lines = cleanedDetails.split('\n').filter((line) => line.trim() !== '');

    return (
      <>
        {lines.map((line, index) => {
          // Final cleanup for any remaining Info prefixes
          let processedLine = line
            .replace(/^\*\*Info\*\*:\s*/, '')
            .replace(/^\*\*Info\*\*:\s*-\s*/, '')
            .replace(/^Info:\s*/, '')
            .replace(/^Info\s*-\s*/, '');

          // Remove "Info:" if it appears at the beginning of a line
          processedLine = processedLine
            .replace(/^\*\*Info\*\*:\s*/, '')
            .replace(/^\*\*Info\*\*:\s*-\s*/, '');

          // Special case for "**Info**: - Uni (Uniswap)"
          if (processedLine.match(/^\*\*Info\*\*:\s*-\s*[A-Za-z0-9]+ \([A-Za-z0-9]+\)/)) {
            processedLine = processedLine.replace(/^\*\*Info\*\*:\s*-\s*/, '');
          }

          // Direct check for the exact pattern "**Info**: - Uni (Uniswap)"
          const uniMatch = processedLine.match(/^\*\*Info\*\*: - ([A-Za-z0-9]+ \([A-Za-z0-9]+\))/);
          if (uniMatch) {
            processedLine = uniMatch[1];
          }

          // Check if this is a contract name line (like "Uni (Uniswap) at 0x...")
          if (processedLine.match(/^[A-Za-z0-9]+ \([A-Za-z0-9]+\) at `0x[a-fA-F0-9]{40}`/)) {
            const match = processedLine.match(
              /^([A-Za-z0-9]+ \([A-Za-z0-9]+\)) at `(0x[a-fA-F0-9]{40})`/,
            );
            if (match) {
              const contractName = match[1];
              const contractAddress = match[2];
              return (
                <div key={`contract-header-${contractAddress}`} className="mb-4 mt-2">
                  <h3 className="text-lg font-semibold flex items-center">
                    {contractName}
                    <span className="ml-2 text-sm font-normal">
                      at{' '}
                      <a
                        href={`https://etherscan.io/address/${contractAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs bg-muted-foreground/10 px-1 py-0.5 rounded hover:underline inline-flex items-center"
                      >
                        {contractAddress}
                        <ExternalLinkIcon className="h-3 w-3 ml-1" />
                      </a>
                    </span>
                  </h3>
                </div>
              );
            }
          }

          // Process line to replace addresses with links
          const parts: React.ReactNode[] = [];
          let lastIndex = 0;
          const addressRegex = /`(0x[a-fA-F0-9]{40})`/g;
          let match: RegExpExecArray | null;

          // Check if this is a target line
          const isTargetLine =
            processedLine.includes('Contract (verified)') ||
            processedLine.includes('EOA (verification not applicable)') ||
            processedLine.includes('Contract (looks safe)') ||
            processedLine.includes('Trusted contract');

          if (isTargetLine) {
            // Extract target address from the line - handle different formats
            const targetMatch =
              processedLine.match(/\[`(0x[a-fA-F0-9]{40})`\]/) ||
              processedLine.match(/at `(0x[a-fA-F0-9]{40})`/);
            if (targetMatch) {
              const address = targetMatch[1];
              // Get the contract status
              let status = 'Unknown';
              if (processedLine.includes('Contract (verified)')) status = 'Contract (verified)';
              else if (processedLine.includes('EOA (verification not applicable)')) status = 'EOA';
              else if (processedLine.includes('Contract (looks safe)'))
                status = 'Contract (looks safe)';
              else if (processedLine.includes('Trusted contract')) status = 'Trusted contract';

              // Format the target with proper styling
              return (
                <div key={`target-${address}`} className="mb-3">
                  <div className="flex items-center flex-wrap">
                    <span className="mr-2">{processedLine.includes('at `') ? '' : 'Target:'}</span>
                    <a
                      href={`https://etherscan.io/address/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs bg-muted p-2 rounded hover:underline inline-flex items-center"
                    >
                      {address}
                      <ExternalLinkIcon className="h-3 w-3 ml-1" />
                    </a>
                    <span className="ml-2 text-muted-foreground text-xs">{status}</span>
                  </div>
                </div>
              );
            }
          }

          // Check if this is an event line
          const isEventLine =
            processedLine.includes('`') &&
            (processedLine.includes('Transfer(') ||
              processedLine.includes('Approval(') ||
              (processedLine.includes('(') &&
                processedLine.includes(')') &&
                processedLine.includes(':')));

          // Check if this is a calldata line
          const isCalldataLine =
            processedLine.includes('transfers') && processedLine.includes('UNI to');

          if (isCalldataLine) {
            // Format calldata as code and remove any backticks
            const formattedLine = processedLine.replace(/`/g, '');

            // Extract addresses from the calldata line
            const fromAddressMatch = formattedLine.match(/(0x[a-fA-F0-9]{40}) transfers/);
            const toAddressMatch = formattedLine.match(/UNI to (0x[a-fA-F0-9]{40})/);

            if (fromAddressMatch && toAddressMatch) {
              const fromAddress = fromAddressMatch[1];
              const toAddress = toAddressMatch[1];
              const amountMatch = formattedLine.match(/transfers ([0-9.]+) UNI/);
              const amount = amountMatch ? amountMatch[1] : '';

              return (
                <div key={`calldata-${formattedLine.substring(0, 30)}`} className="mb-3">
                  <code className="block font-mono text-xs bg-muted p-3 rounded whitespace-pre-wrap overflow-x-auto">
                    <span className="flex flex-wrap gap-2 items-center">
                      <a
                        href={`https://etherscan.io/address/${fromAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs bg-muted-foreground/10 px-1 py-0.5 rounded hover:underline inline-flex items-center"
                      >
                        {fromAddress}
                        <ExternalLinkIcon className="h-3 w-3 ml-1" />
                      </a>
                      <span>transfers</span>
                      <span className="font-bold">{amount} UNI</span>
                      <span>to</span>
                      <a
                        href={`https://etherscan.io/address/${toAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs bg-muted-foreground/10 px-1 py-0.5 rounded hover:underline inline-flex items-center"
                      >
                        {toAddress}
                        <ExternalLinkIcon className="h-3 w-3 ml-1" />
                      </a>
                    </span>
                  </code>
                </div>
              );
            }

            // Fallback if we can't parse the addresses
            return (
              <div key={`calldata-${formattedLine.substring(0, 30)}`} className="mb-3">
                <code className="block font-mono text-xs bg-muted p-3 rounded whitespace-pre-wrap overflow-x-auto">
                  {formattedLine}
                </code>
              </div>
            );
          }

          if (isEventLine) {
            // Format event as code
            const eventMatch = processedLine.match(/`([^`]+)`/);
            if (eventMatch) {
              const eventText = eventMatch[1];

              // Format the event with proper styling
              return (
                <div key={`event-${eventText.substring(0, 30)}-${index}`} className="mb-3">
                  <code className="block font-mono text-xs bg-muted p-3 rounded whitespace-pre-wrap overflow-x-auto">
                    {eventText}
                  </code>
                </div>
              );
            }
          }

          // Use a different approach to avoid assignment in the while condition
          match = addressRegex.exec(processedLine);
          while (match !== null) {
            // Add text before the match
            if (match.index > lastIndex) {
              parts.push(processedLine.substring(lastIndex, match.index));
            }

            // Add the address as a link
            const address = match[1];
            parts.push(
              <a
                key={`address-${address}-${match.index}`}
                href={`https://etherscan.io/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs bg-muted-foreground/10 px-1 py-0.5 rounded hover:underline inline-flex items-center"
              >
                {address}
                <ExternalLinkIcon className="h-3 w-3 ml-1" />
              </a>,
            );

            lastIndex = match.index + match[0].length;
            match = addressRegex.exec(processedLine);
          }

          // Add remaining text
          if (lastIndex < processedLine.length) {
            parts.push(processedLine.substring(lastIndex));
          }

          // For simple informational lines like "No ETH is required..."
          if (
            processedLine.includes('No ETH is required') ||
            processedLine.includes('No ETH transfers detected') ||
            (parts.length === 1 && typeof parts[0] === 'string' && !processedLine.includes('`'))
          ) {
            return (
              <div
                key={`info-${processedLine.substring(0, 30).replace(/\s+/g, '-')}`}
                className="mb-3"
              >
                <p className="text-muted-foreground">{parts.length > 0 ? parts : processedLine}</p>
              </div>
            );
          }

          return (
            <p key={`line-${index}-${processedLine.substring(0, 20)}`} className="mb-2">
              {parts.length > 0 ? parts : processedLine}
            </p>
          );
        })}
      </>
    );
  }, [check.details]);

  const stateChanges = parseStateChanges(check.details);
  const hasStateChanges = stateChanges.length > 0;

  return (
    <div className="border border-muted rounded-md overflow-hidden">
      <button
        type="button"
        className="w-full p-4 text-left hover:bg-muted/50 transition-colors cursor-pointer flex justify-between items-start"
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
      >
        <div className="flex items-start gap-2">
          {getStatusIcon()}
          <h4 className="font-medium">{check.title}</h4>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          {check.details &&
            (isExpanded ? (
              <ChevronUpIcon className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
            ))}
        </div>
      </button>
      {isExpanded && check.details && (
        <div className="p-5 pt-0 pl-11 text-sm border-t border-muted bg-muted/10">
          {hasStateChanges ? (
            <div className="mt-4 space-y-6">
              {/* Group state changes by contract */}
              {Object.entries(
                stateChanges.reduce<Record<string, SimulationStateChange[]>>((acc, change) => {
                  // Contract always exists on change but may be generic
                  const contractName = change.contract;

                  // We'll keep the original contract name in the key for grouping
                  const contractAddress = change.contractAddress || '';
                  const key = `${contractName}|${contractAddress}`;

                  if (!acc[key]) {
                    acc[key] = [];
                  }
                  acc[key].push(change);
                  return acc;
                }, {}),
              ).map(([contractKey, changes]) => {
                const [contractName, contractAddress] = contractKey.split('|');
                return (
                  <div key={contractKey} className="space-y-3">
                    {/* Contract header */}
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">
                        {contractName === 'balances'
                          ? 'Token Balances'
                          : contractName === 'storage'
                            ? 'Contract Storage'
                            : contractName === 'code'
                              ? 'Contract Code'
                              : contractName}
                        {contractAddress && (
                          <span className="ml-2 text-sm font-normal">
                            at{' '}
                            <a
                              href={`https://etherscan.io/address/${contractAddress}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-xs bg-muted-foreground/10 px-1 py-0.5 rounded hover:underline inline-flex items-center"
                            >
                              {contractAddress}
                              <ExternalLinkIcon className="h-3 w-3 ml-1" />
                            </a>
                          </span>
                        )}
                      </h3>
                    </div>
                    {/* State changes for this contract */}
                    <div className="space-y-3 pl-2">
                      {changes.map((change, index) => (
                        <StateChangeItem
                          key={`check-state-${change.contract}-${change.key}-${index}`}
                          stateChange={change}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 whitespace-pre-wrap">{FormattedDetails}</div>
          )}
        </div>
      )}
    </div>
  );
}

function StateChangeItem({ stateChange }: { stateChange: SimulationStateChange }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Clean values by removing quotes if they exist
  const cleanValue = (value: string): string => {
    // If the value is wrapped in quotes (like JSON strings often are)
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1);
    }
    return value;
  };

  const oldValueCleaned = cleanValue(stateChange.oldValue);
  const newValueCleaned = cleanValue(stateChange.newValue);

  // Determine if the change is a simple value change or a complex one
  const isNumericChange =
    !Number.isNaN(Number(oldValueCleaned)) && !Number.isNaN(Number(newValueCleaned));
  const isAddressChange = oldValueCleaned.startsWith('0x') && newValueCleaned.startsWith('0x');
  const isBooleanChange =
    (oldValueCleaned === 'true' || oldValueCleaned === 'false') &&
    (newValueCleaned === 'true' || newValueCleaned === 'false');

  // Calculate difference for numeric values
  const getDifference = () => {
    if (isNumericChange) {
      try {
        // Parse the values as BigInt to handle very large numbers
        const oldNum = BigInt(oldValueCleaned);
        const newNum = BigInt(newValueCleaned);
        const diff = newNum - oldNum;

        // Determine if the change is positive, negative, or zero
        const isPositive = diff > BigInt(0);
        const isNegative = diff < BigInt(0);
        const absDiff = isNegative ? -diff : diff;

        // Format the difference with commas for readability
        const formattedDiff = absDiff.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

        // Calculate percentage for display
        let percentageDisplay = '';

        // Only calculate percentage if old value is not zero
        if (oldNum !== BigInt(0)) {
          try {
            // For very large numbers, use a simplified approach
            // Just use the first few digits for an approximate percentage
            const oldNumDigits = oldNum.toString().length;
            const diffDigits = diff.toString().length;

            // If numbers are too large for JS Number, use a simplified calculation
            if (oldNumDigits > 15 || diffDigits > 15) {
              // Use the first 5 digits for percentage calculation
              const oldNumPrefix = Number(oldNum.toString().substring(0, 5));
              const diffPrefix = Number(diff.toString().substring(0, 5));

              // Calculate an approximate percentage
              const percentChange = Math.abs((diffPrefix / oldNumPrefix) * 100);

              // Only show percentage if it's meaningful
              if (percentChange > 0.1 && percentChange < 10000) {
                percentageDisplay = `${isPositive ? '+' : '-'}${Math.round(percentChange)}%`;
              }
            } else {
              // For smaller numbers, calculate exact percentage
              const percentChange = Math.abs(Number((diff * BigInt(100)) / oldNum));
              if (percentChange > 0 && percentChange < 10000) {
                percentageDisplay = `${isPositive ? '+' : '-'}${percentChange}%`;
              }
            }
          } catch (_) {
            // Silently fail if percentage calculation errors
          }
        }

        return (
          <div className="bg-muted p-3 rounded-md mt-4">
            <div className="text-sm flex items-center justify-between">
              <span className="text-muted-foreground">Change</span>
              <div className="flex flex-col items-end">
                <span
                  className={`font-bold ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : ''}`}
                >
                  {isPositive ? '+' : isNegative ? '-' : ''}
                  {formattedDiff}
                </span>
                {percentageDisplay && (
                  <span
                    className={`text-xs ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : ''}`}
                  >
                    {percentageDisplay}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      } catch (error) {
        // Fallback for any parsing errors
        console.error('Error calculating difference:', error);
        return (
          <div className="bg-muted p-3 rounded-md mt-4">
            <div className="text-sm text-muted-foreground">Change</div>
            <div className="font-medium text-xs">Value changed</div>
          </div>
        );
      }
    }

    if (isBooleanChange) {
      return (
        <div className="bg-muted p-3 rounded-md mt-4">
          <div className="text-sm flex items-center justify-between">
            <span className="text-muted-foreground">Change</span>
            <span
              className={`font-bold ${newValueCleaned === 'true' ? 'text-green-600' : 'text-red-600'}`}
            >
              {oldValueCleaned} → {newValueCleaned}
            </span>
          </div>
        </div>
      );
    }

    if (isAddressChange) {
      return (
        <div className="bg-muted p-3 rounded-md mt-4">
          <div className="text-sm text-muted-foreground">Address Change</div>
          <div className="font-medium text-xs">
            <div className="flex flex-col gap-1">
              <span>
                From:{' '}
                <code className="bg-muted-foreground/10 px-1 py-0.5 rounded">
                  <a
                    href={`https://etherscan.io/address/${oldValueCleaned}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline inline-flex items-center"
                  >
                    {oldValueCleaned}
                    <ExternalLinkIcon className="h-3 w-3 ml-1" />
                  </a>
                </code>
              </span>
              <span>
                To:{' '}
                <code className="bg-muted-foreground/10 px-1 py-0.5 rounded">
                  <a
                    href={`https://etherscan.io/address/${newValueCleaned}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline inline-flex items-center"
                  >
                    {newValueCleaned}
                    <ExternalLinkIcon className="h-3 w-3 ml-1" />
                  </a>
                </code>
              </span>
            </div>
          </div>
        </div>
      );
    }

    // For other types of changes, show a generic difference indicator
    return (
      <div className="bg-muted p-3 rounded-md mt-4">
        <div className="text-sm text-muted-foreground">Change</div>
        <div className="font-medium text-xs">Value changed</div>
      </div>
    );
  };

  return (
    <div className="border border-muted rounded-md overflow-hidden">
      <button
        type="button"
        className="w-full p-4 text-left hover:bg-muted/50 transition-colors cursor-pointer flex justify-between items-start"
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
      >
        <div className="flex items-start gap-2">
          {stateChange.key.startsWith('0x') && (
            <div className="text-xs bg-muted-foreground/10 px-2 py-1 rounded text-muted-foreground">
              Balance
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <code className="text-xs bg-muted-foreground/20 px-2 py-1 rounded">
            {stateChange.key.startsWith('0x') ? (
              <a
                href={`https://etherscan.io/address/${stateChange.key}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline inline-flex items-center"
                onClick={(e) => e.stopPropagation()} // Prevent toggling when clicking the link
              >
                {stateChange.key}
                <ExternalLinkIcon className="h-3 w-3 ml-1" />
              </a>
            ) : (
              stateChange.key
            )}
          </code>
          {isExpanded ? (
            <ChevronUpIcon className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>
      {isExpanded && (
        <div className="p-5 pt-0 pl-11 text-sm border-t border-muted bg-muted/10">
          {getDifference()}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <span className="text-muted-foreground font-medium">Old Value: </span>
              <div className="font-mono text-xs break-all mt-2 bg-muted p-3 rounded">
                {stateChange.oldValue}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground font-medium">New Value: </span>
              <div className="font-mono text-xs break-all mt-2 bg-muted p-3 rounded">
                {stateChange.newValue}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
