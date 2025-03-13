import type { Address } from 'viem';
import { useSuspenseQuery } from '@tanstack/react-query';
import type { Report } from '@/components/ReportCard';
import { useCallback } from 'react';

export interface Proposal {
  id: string;
  targets: Address[];
  values: bigint[];
  calldatas: `0x${string}`[];
  signatures: string[];
  description: string;
}

export interface SimulationResponse {
  proposalData: Proposal;
  report: {
    status: 'success' | 'warning' | 'error';
    summary: string;
    markdownReport: string;
  };
}

/**
 * Hook to fetch simulation results from the API
 */
export function useSimulationResults() {
  return useSuspenseQuery<SimulationResponse>({
    queryKey: ['simulation-results'],
    queryFn: async () => {
      const response = await fetch('/api/simulation-results');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch simulation data');
      }

      const data = await response.json();

      // Get the first item from the array
      const firstResult = data[0];

      if (!firstResult) {
        throw new Error('No simulation results found');
      }

      // Convert string values to BigInt for the proposal data
      return {
        proposalData: {
          ...firstResult.proposalData,
          values: firstResult.proposalData.values.map((value: string) => BigInt(value)),
        },
        report: firstResult.report,
      };
    },
  });
}

/**
 * Helper function to convert the markdown report to a Report object
 * that can be used with the ReportCard component
 */
export function useReportFromMarkdown() {
  return useCallback((markdownReport: string): Report => {
    // Create a basic report structure
    const report: Report = {
      status: 'success',
      summary: 'Simulation completed successfully',
      gasUsed: '850,000',
      findings: [],
      stateChanges: [],
      logs: [],
    };

    // Extract findings from the markdown report
    const findingMatches = markdownReport.matchAll(
      /###\s+(.+?)\s+(✅ Passed|❗❗ \*\*Passed with warnings\*\*|❌ \*\*Failed\*\*)/g,
    );
    let findingId = 1;

    for (const match of findingMatches) {
      const title = match[1];
      const status = match[2];

      let severity: 'info' | 'warning' | 'critical' = 'info';

      if (status.includes('warnings')) {
        severity = 'warning';
      } else if (status.includes('Failed')) {
        severity = 'critical';
      }

      report.findings.push({
        id: String(findingId++),
        title,
        description: `Check: ${title}`,
        severity,
      });
    }

    // Extract logs from the markdown report
    const logMatches = markdownReport.match(/\[INFO\].+/g);
    if (logMatches) {
      report.logs = logMatches;
    }

    // Extract state changes from the markdown report
    const stateChangeMatches = markdownReport.match(
      /\*\s+`(.+?)`\s+key\s+`(.+?)`\s+changed\s+from\s+`(.+?)`\s+to\s+`(.+?)`/g,
    );
    if (stateChangeMatches) {
      for (const match of stateChangeMatches) {
        const parts = match.match(
          /\*\s+`(.+?)`\s+key\s+`(.+?)`\s+changed\s+from\s+`(.+?)`\s+to\s+`(.+?)`/,
        );
        if (parts) {
          report.stateChanges.push({
            contract: parts[1],
            property: `${parts[1]}.${parts[2]}`,
            oldValue: parts[3],
            newValue: parts[4],
          });
        }
      }
    }

    return report;
  }, []);
}
