import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircleIcon, AlertTriangleIcon, InfoIcon, ExternalLinkIcon } from 'lucide-react';
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{report.title}</CardTitle>
        <CardDescription>
          Status:{' '}
          <span
            className={
              report.status === 'success'
                ? 'text-green-500'
                : report.status === 'warning'
                  ? 'text-yellow-500'
                  : 'text-red-500'
            }
          >
            {report.status === 'success'
              ? 'Passed'
              : report.status === 'warning'
                ? 'Passed with warnings'
                : 'Failed'}
          </span>
        </CardDescription>
      </CardHeader>
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="checks">Checks</TabsTrigger>
          <TabsTrigger value="state-changes">State Changes</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <CardContent>
            <div className="space-y-4">
              {report.proposalText && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Proposal Details</h3>
                  <div className="bg-muted p-4 rounded-md whitespace-pre-wrap">
                    {report.proposalText}
                  </div>
                </div>
              )}

              {report.calldata && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Calldata Decoded</h3>
                  <div className="bg-muted p-4 rounded-md font-mono text-sm overflow-x-auto">
                    {report.calldata.decoded}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold mb-2">Metadata</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted p-3 rounded-md">
                    <div className="text-sm text-muted-foreground">Block Number</div>
                    <div className="font-medium">{report.metadata.blockNumber}</div>
                  </div>
                  <div className="bg-muted p-3 rounded-md">
                    <div className="text-sm text-muted-foreground">Timestamp</div>
                    <div className="font-medium">
                      {new Date(parseInt(report.metadata.timestamp) * 1000).toLocaleString()}
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
                        className="text-blue-600 hover:underline inline-flex items-center"
                      >
                        {report.metadata.proposer}
                        <ExternalLinkIcon className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </TabsContent>

        <TabsContent value="checks">
          <CardContent>
            <div className="space-y-4">
              {report.checks.length === 0 ? (
                <div className="flex items-center justify-center p-6 text-muted-foreground">
                  <InfoIcon className="h-4 w-4 mr-2" />
                  <span>No checks found in the report</span>
                </div>
              ) : (
                report.checks.map((check, index) => (
                  <CheckItem key={`check-${index}`} check={check} />
                ))
              )}
            </div>
          </CardContent>
        </TabsContent>

        <TabsContent value="state-changes">
          <CardContent>
            <div className="space-y-4">
              {report.stateChanges.length === 0 ? (
                <div className="flex items-center justify-center p-6 text-muted-foreground">
                  <InfoIcon className="h-4 w-4 mr-2" />
                  <span>No state changes found in the report</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {report.stateChanges.map((change, index) => (
                    <StateChangeItem key={`state-${index}`} stateChange={change} />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </TabsContent>

        <TabsContent value="events">
          <CardContent>
            <div className="space-y-4">
              {report.events.length === 0 ? (
                <div className="flex items-center justify-center p-6 text-muted-foreground">
                  <InfoIcon className="h-4 w-4 mr-2" />
                  <span>No events found in the report</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {report.events.map((event, index) => (
                    <EventItem key={`event-${index}`} event={event} />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

// Helper components
function CheckItem({ check }: { check: SimulationCheck }) {
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

  return (
    <div className="border rounded-md p-4">
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-2">
          {getStatusIcon()}
          <h4 className="font-medium">{check.title}</h4>
        </div>
        {getStatusBadge()}
      </div>
      {check.details && (
        <div className="mt-2 pl-7 text-sm text-muted-foreground whitespace-pre-wrap">
          {check.details}
        </div>
      )}
    </div>
  );
}

function StateChangeItem({ stateChange }: { stateChange: SimulationStateChange }) {
  return (
    <div className="bg-muted p-3 rounded-md text-sm">
      <div className="font-medium">{stateChange.contract}</div>
      <div className="mt-1">
        <span className="text-muted-foreground">Key: </span>
        <code className="text-xs bg-muted-foreground/20 px-1 py-0.5 rounded">
          {stateChange.key}
        </code>
      </div>
      <div className="mt-1 grid grid-cols-2 gap-2">
        <div>
          <span className="text-muted-foreground">Old: </span>
          <span className="font-mono text-xs break-all">{stateChange.oldValue}</span>
        </div>
        <div>
          <span className="text-muted-foreground">New: </span>
          <span className="font-mono text-xs break-all">{stateChange.newValue}</span>
        </div>
      </div>
    </div>
  );
}

function EventItem({ event }: { event: SimulationEvent }) {
  return (
    <div className="bg-muted p-3 rounded-md text-sm">
      <div className="font-medium">{event.contract}</div>
      <div className="mt-1">
        <span className="text-muted-foreground">Event: </span>
        <code className="text-xs bg-muted-foreground/20 px-1 py-0.5 rounded">{event.name}</code>
      </div>
      <div className="mt-1">
        <span className="text-muted-foreground">Parameters: </span>
        <div className="font-mono text-xs mt-1 break-all">
          {event.params.map((param, index) => (
            <div key={`param-${index}`} className="mb-1">
              <span className="text-muted-foreground">{param.name}: </span>
              {param.value}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
