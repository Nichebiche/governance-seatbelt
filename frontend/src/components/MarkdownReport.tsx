import React, { ReactNode } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircleIcon, AlertTriangleIcon, InfoIcon, ExternalLinkIcon } from 'lucide-react';

interface MarkdownReportProps {
  markdownReport: string;
}

export function MarkdownReport({ markdownReport }: MarkdownReportProps) {
  // Parse the markdown report
  const title = extractTitle(markdownReport);
  const sections = extractSections(markdownReport);
  const checks = extractChecks(markdownReport);
  const stateChanges = extractStateChanges(markdownReport);
  const events = extractEvents(markdownReport);
  const calldata = extractCalldata(markdownReport);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title || 'Simulation Report'}</CardTitle>
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
              {sections.proposal && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Proposal Details</h3>
                  <div className="bg-muted p-4 rounded-md whitespace-pre-wrap">
                    {formatText(sections.proposal)}
                  </div>
                </div>
              )}

              {calldata && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Calldata Decoded</h3>
                  <div className="bg-muted p-4 rounded-md font-mono text-sm overflow-x-auto">
                    {formatLinks(calldata)}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </TabsContent>

        <TabsContent value="checks">
          <CardContent>
            <div className="space-y-4">
              {checks.length === 0 ? (
                <div className="flex items-center justify-center p-6 text-muted-foreground">
                  <InfoIcon className="h-4 w-4 mr-2" />
                  <span>No checks found in the report</span>
                </div>
              ) : (
                checks.map((check) => <CheckItem key={`check-${check.title}`} check={check} />)
              )}
            </div>
          </CardContent>
        </TabsContent>

        <TabsContent value="state-changes">
          <CardContent>
            <div className="space-y-4">
              {stateChanges.length === 0 ? (
                <div className="flex items-center justify-center p-6 text-muted-foreground">
                  <InfoIcon className="h-4 w-4 mr-2" />
                  <span>No state changes found in the report</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {stateChanges.map((change) => (
                    <StateChangeItem
                      key={`state-${change.contract}-${change.key}`}
                      stateChange={change}
                    />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </TabsContent>

        <TabsContent value="events">
          <CardContent>
            <div className="space-y-4">
              {events.length === 0 ? (
                <div className="flex items-center justify-center p-6 text-muted-foreground">
                  <InfoIcon className="h-4 w-4 mr-2" />
                  <span>No events found in the report</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {events.map((event) => (
                    <EventItem key={`event-${event.contract}-${event.name}`} event={event} />
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
function CheckItem({ check }: { check: { title: string; status: string; details?: string } }) {
  const getStatusIcon = () => {
    if (check.status.includes('Passed with warnings')) {
      return <AlertTriangleIcon className="h-5 w-5 text-yellow-500" />;
    }
    if (check.status.includes('Failed')) {
      return <AlertTriangleIcon className="h-5 w-5 text-red-500" />;
    }
    return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
  };

  const getStatusBadge = () => {
    if (check.status.includes('Passed with warnings')) {
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
          Warning
        </Badge>
      );
    }
    if (check.status.includes('Failed')) {
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
        <div className="mt-2 pl-7 text-sm text-muted-foreground">{formatText(check.details)}</div>
      )}
    </div>
  );
}

function StateChangeItem({
  stateChange,
}: { stateChange: { contract: string; key: string; oldValue: string; newValue: string } }) {
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

function EventItem({ event }: { event: { contract: string; name: string; params: string } }) {
  return (
    <div className="bg-muted p-3 rounded-md text-sm">
      <div className="font-medium">{event.contract}</div>
      <div className="mt-1">
        <span className="text-muted-foreground">Event: </span>
        <code className="text-xs bg-muted-foreground/20 px-1 py-0.5 rounded">{event.name}</code>
      </div>
      <div className="mt-1">
        <span className="text-muted-foreground">Parameters: </span>
        <div className="font-mono text-xs mt-1 break-all">{event.params}</div>
      </div>
    </div>
  );
}

// Helper functions to parse the markdown report
function extractTitle(markdown: string): string {
  const titleMatch = markdown.match(/# (.+)/);
  return titleMatch ? titleMatch[1] : 'Simulation Report';
}

function extractSections(markdown: string): { proposal: string } {
  const sections: { proposal: string } = { proposal: '' };

  // Extract proposal section (between ## Proposal Text and the next ##)
  const proposalMatch = markdown.match(/## Proposal Text\n\n>([\s\S]*?)(?=\n\n##|$)/);
  if (proposalMatch) {
    sections.proposal = proposalMatch[1].trim();
  }

  return sections;
}

function extractChecks(
  markdown: string,
): Array<{ title: string; status: string; details?: string }> {
  const checks: Array<{ title: string; status: string; details?: string }> = [];

  // Find all check sections
  const checkSections = markdown.match(
    /### (.+?) (✅ Passed|❗❗ \*\*Passed with warnings\*\*|❌ \*\*Failed\*\*)[\s\S]*?(?=###|$)/g,
  );

  if (checkSections) {
    for (const section of checkSections) {
      const titleMatch = section.match(
        /### (.+?) (✅ Passed|❗❗ \*\*Passed with warnings\*\*|❌ \*\*Failed\*\*)/,
      );
      if (titleMatch) {
        const title = titleMatch[1];
        const status = titleMatch[2];

        // Extract details (everything after the status line and before the next section)
        const detailsMatch = section.match(
          /(?:✅ Passed|❗❗ \*\*Passed with warnings\*\*|❌ \*\*Failed\*\*)[\s\S]*?\n\n([\s\S]*)/,
        );
        const details = detailsMatch ? detailsMatch[1].trim() : undefined;

        checks.push({ title, status, details });
      }
    }
  }

  return checks;
}

function extractStateChanges(
  markdown: string,
): Array<{ contract: string; key: string; oldValue: string; newValue: string }> {
  const stateChanges: Array<{ contract: string; key: string; oldValue: string; newValue: string }> =
    [];

  // Find all state changes
  const stateChangeMatches = markdown.matchAll(
    /\*\s+`(.+?)`\s+key\s+`(.+?)`\s+changed\s+from\s+`(.+?)`\s+to\s+`(.+?)`/g,
  );

  for (const match of stateChangeMatches) {
    stateChanges.push({
      contract: match[1],
      key: match[2],
      oldValue: match[3],
      newValue: match[4],
    });
  }

  return stateChanges;
}

function extractEvents(
  markdown: string,
): Array<{ contract: string; name: string; params: string }> {
  const events: Array<{ contract: string; name: string; params: string }> = [];

  // Find the events section
  const eventsSection = markdown.match(
    /### Reports all events emitted from the proposal[\s\S]*?(?=###|$)/,
  );

  if (eventsSection) {
    // Extract individual events
    const eventMatches = eventsSection[0].matchAll(
      /\*\s+`(.+?)`\s+at\s+`(.+?)`\s*\n\s+\*\s+`(.+?)`/g,
    );

    for (const match of eventMatches) {
      events.push({
        name: match[1],
        contract: match[2],
        params: match[3],
      });
    }
  }

  return events;
}

function extractCalldata(markdown: string): string | null {
  // Find the calldata section
  const calldataSection = markdown.match(
    /### Decodes target calldata into a human-readable format[\s\S]*?(?=###|$)/,
  );

  if (calldataSection) {
    // Extract the calldata info
    const calldataMatch = calldataSection[0].match(/\*\*Info\*\*:\n\n\*\s+(.+)/);
    return calldataMatch ? calldataMatch[1] : null;
  }

  return null;
}

// Helper function to format text with links
function formatText(text: string): ReactNode {
  if (!text) return null;

  // Split the text by markdown links
  const parts = text.split(/(\[.*?\]\(.*?\))/g);

  return (
    <>
      {parts.map((part, partIndex) => {
        // Check if this part is a markdown link
        const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
        if (linkMatch) {
          const [, linkText, linkUrl] = linkMatch;
          const isExternal = linkUrl.startsWith('http');

          if (isExternal) {
            return (
              <a
                key={`link-${partIndex}-${linkText}`}
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center"
              >
                {linkText}
                <ExternalLinkIcon className="h-3 w-3 ml-1" />
              </a>
            );
          }

          return (
            <Link
              key={`link-${partIndex}-${linkText}`}
              href={linkUrl}
              className="text-blue-600 hover:underline"
            >
              {linkText}
            </Link>
          );
        }

        // For non-link parts, render with code formatting
        // Use a safer approach than dangerouslySetInnerHTML
        const codeRegex = /`([^`]+)`/g;
        let lastCodeIndex = 0;
        const formattedParts: ReactNode[] = [];
        let codeMatch: RegExpExecArray | null = null;

        // Use a safer approach to iterate through regex matches
        const findCodeMatches = () => {
          const matches = part.match(codeRegex);
          if (!matches) return [];

          return matches.map((match) => {
            const matchIndex = part.indexOf(match, lastCodeIndex);
            const content = match.replace(/`/g, '');
            lastCodeIndex = matchIndex + match.length;
            return { index: matchIndex, content, fullMatch: match };
          });
        };

        const codeMatches = findCodeMatches();

        if (codeMatches.length === 0) {
          // No code blocks, just return the text
          return <span key={`part-${partIndex}`}>{part}</span>;
        }

        // Process text with code blocks
        let currentIndex = 0;
        const result: ReactNode[] = [];

        codeMatches.forEach((match, matchIndex) => {
          // Add text before the code
          if (match.index > currentIndex) {
            result.push(
              <span key={`text-${partIndex}-${matchIndex}`}>
                {part.substring(currentIndex, match.index)}
              </span>,
            );
          }

          // Add the code
          result.push(
            <code
              key={`code-${partIndex}-${matchIndex}`}
              className="bg-muted-foreground/20 px-1 py-0.5 rounded text-xs"
            >
              {match.content}
            </code>,
          );

          currentIndex = match.index + match.fullMatch.length;
        });

        // Add any remaining text
        if (currentIndex < part.length) {
          result.push(<span key={`text-${partIndex}-end`}>{part.substring(currentIndex)}</span>);
        }

        return result;
      })}
    </>
  );
}

// Helper function to format links in text
function formatLinks(text: string): ReactNode {
  if (!text) return null;

  // Extract Ethereum addresses with their labels
  const addressPattern =
    /\[`(0x[a-fA-F0-9]{40})`\]\((https:\/\/etherscan\.io\/address\/0x[a-fA-F0-9]{40}(?:#code)?)\)/g;
  const parts: ReactNode[] = [];
  let lastIndex = 0;

  const textContent = text || '';

  // Use a safer approach to iterate through regex matches
  const findAddressMatches = () => {
    const matches = textContent.match(addressPattern);
    if (!matches) return [];

    return matches
      .map((match) => {
        const matchIndex = textContent.indexOf(match, lastIndex);
        const addressMatch = match.match(
          /\[`(0x[a-fA-F0-9]{40})`\]\((https:\/\/etherscan\.io\/address\/0x[a-fA-F0-9]{40}(?:#code)?)\)/,
        );

        if (!addressMatch) return null;

        const [fullMatch, address, url] = addressMatch;
        lastIndex = matchIndex + fullMatch.length;

        return { index: matchIndex, address, url, fullMatch };
      })
      .filter(Boolean);
  };

  const addressMatches = findAddressMatches();

  if (addressMatches.length === 0) {
    // No address links, just return the text
    return <span>{textContent}</span>;
  }

  // Process text with address links
  let currentIndex = 0;

  addressMatches.forEach((match, matchIndex) => {
    if (!match) return;

    // Add text before the match
    if (match.index > currentIndex) {
      parts.push(
        <span key={`text-${matchIndex}`}>{textContent.substring(currentIndex, match.index)}</span>,
      );
    }

    // Add the formatted link
    parts.push(
      <a
        key={`link-${matchIndex}-${match.address}`}
        href={match.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline inline-flex items-center"
      >
        <code className="bg-muted-foreground/20 px-1 py-0.5 rounded text-xs">{match.address}</code>
        <ExternalLinkIcon className="h-3 w-3 ml-1" />
      </a>,
    );

    currentIndex = match.index + match.fullMatch.length;
  });

  // Add any remaining text
  if (currentIndex < textContent.length) {
    parts.push(<span key="text-end">{textContent.substring(currentIndex)}</span>);
  }

  return <>{parts}</>;
}
