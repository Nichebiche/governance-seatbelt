import React, { useState } from 'react';
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
    <div className="w-full">
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
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="checks">Checks</TabsTrigger>
          <TabsTrigger value="state-changes">State Changes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-6">
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
                <div className="font-medium">{report.metadata.blockNumber}</div>
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
                <div className="text-sm text-muted-foreground">Proposer</div>
                <div className="font-medium font-mono text-xs truncate">
                  <a
                    href={`https://etherscan.io/address/${report.metadata.proposer}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center cursor-pointer"
                  >
                    {report.metadata.proposer}
                    <ExternalLinkIcon className="h-3 w-3 ml-1" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="checks" className="mt-4">
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

        <TabsContent value="state-changes" className="mt-4">
          <div className="space-y-4">
            {report.stateChanges.length === 0 ? (
              <div className="flex items-center justify-center p-6 text-muted-foreground border border-muted rounded-md">
                <InfoIcon className="h-4 w-4 mr-2" />
                <span>No state changes found in the report</span>
              </div>
            ) : (
              <div className="space-y-3">
                {report.stateChanges.map((change, index) => (
                  <StateChangeItem
                    key={`state-${change.contract}-${change.key}-${index}`}
                    stateChange={change}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
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
          <div className="mt-4 whitespace-pre-wrap">{check.details}</div>
        </div>
      )}
    </div>
  );
}

function StateChangeItem({ stateChange }: { stateChange: SimulationStateChange }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
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
          <div className="font-medium">{stateChange.contract}</div>
        </div>
        <div className="flex items-center gap-2">
          <code className="text-xs bg-muted-foreground/20 px-1 py-0.5 rounded">
            {stateChange.key}
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
