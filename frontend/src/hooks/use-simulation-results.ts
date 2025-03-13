import type { Report } from '@/components/ReportCard';
import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import type { Address } from 'viem';

export interface Proposal {
  id: string;
  targets: Address[];
  values: bigint[];
  calldatas: `0x${string}`[];
  signatures: string[];
  description: string;
}

export interface SimulationCheck {
  title: string;
  status: 'passed' | 'warning' | 'failed';
  details?: string;
}

export interface SimulationStateChange {
  contract: string;
  contractAddress?: string;
  key: string;
  oldValue: string;
  newValue: string;
}

export interface SimulationEvent {
  name: string;
  contract: string;
  contractAddress?: string;
  params: Array<{
    name: string;
    value: string;
    type: string;
  }>;
}

export interface SimulationCalldata {
  decoded: string;
  raw: string;
  links?: Array<{
    text: string;
    address: string;
    href: string;
  }>;
}

export interface StructuredSimulationReport {
  title: string;
  proposalText: string;
  status: 'success' | 'warning' | 'error';
  summary: string;
  checks: SimulationCheck[];
  stateChanges: SimulationStateChange[];
  events: SimulationEvent[];
  calldata?: SimulationCalldata;
  metadata: {
    blockNumber: string;
    timestamp: string;
    proposalId: string;
    proposer: Address;
  };
}

export interface SimulationResponse {
  proposalData: {
    targets: Address[];
    values: string[];
    signatures: `0x${string}`[];
    calldatas: `0x${string}`[];
    description: string;
  };
  report: {
    structuredReport?: StructuredSimulationReport;
    markdownReport: string;
    status: 'success' | 'warning' | 'error';
    summary: string;
  };
}

/**
 * Hook to fetch simulation results from the API
 */
export function useSimulationResults() {
  return useQuery<SimulationResponse, Error>({
    queryKey: ['simulationResults'],
    queryFn: async () => {
      const response = await fetch('/simulation-results.json');
      if (!response.ok) {
        throw new Error('Failed to fetch simulation results');
      }

      const data = await response.json();
      console.log('Simulation results:', data); // Log the data to see its structure

      // The data is an array of results
      if (data && data.length > 0) {
        const result = data[0];
        console.log('First result:', result); // Log the first result
        console.log('Report:', result.report); // Log the report
        console.log('Structured report:', result.report.structuredReport); // Log the structured report

        // Convert values to BigInt-compatible strings
        if (result.proposalData?.values) {
          result.proposalData.values = result.proposalData.values.map((value: any) =>
            typeof value === 'string' ? value : value.toString(),
          );
        }

        return {
          proposalData: result.proposalData,
          report: result.report,
        };
      }

      throw new Error('No simulation results found');
    },
    retry: false,
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

/**
 * Helper function to convert the structured report to a Report object
 * that can be used with the ReportCard component
 */
export function useReportFromStructured() {
  return useCallback((structuredReport: StructuredSimulationReport): Report => {
    // Create a report structure from the structured report
    const report: Report = {
      status: structuredReport.status,
      summary: structuredReport.summary,
      gasUsed: '850,000', // This is a placeholder as it's not in the structured report
      findings: [],
      stateChanges: [],
      logs: [],
    };

    // Convert checks to findings
    report.findings = structuredReport.checks.map((check, index) => {
      let severity: 'info' | 'warning' | 'critical' = 'info';

      if (check.status === 'warning') {
        severity = 'warning';
      } else if (check.status === 'failed') {
        severity = 'critical';
      }

      return {
        id: String(index + 1),
        title: check.title,
        description: check.details || `Check: ${check.title}`,
        severity,
      };
    });

    // Convert state changes
    report.stateChanges = structuredReport.stateChanges.map((change) => ({
      contract: change.contract,
      property: `${change.contract}.${change.key}`,
      oldValue: change.oldValue,
      newValue: change.newValue,
    }));

    // Convert events to logs
    report.logs = structuredReport.events.map(
      (event) =>
        `Event: ${event.name} from ${event.contract} with params: ${event.params.map((p) => p.value).join(', ')}`,
    );

    return report;
  }, []);
}

/**
 * Hook to fetch the structured simulation report from the API
 */
export function useStructuredReport() {
  return useQuery<{
    proposalData: Proposal;
    report: {
      status: 'success' | 'warning' | 'error';
      summary: string;
      markdownReport: string;
      parsedReport: {
        title: string;
        proposalText: string;
        status: 'success' | 'warning' | 'error';
        checks: Array<{ title: string; status: string; details?: string }>;
        stateChanges: Array<{ contract: string; key: string; oldValue: string; newValue: string }>;
        events: Array<{ contract: string; name: string; params: string }>;
        calldata: string | null;
      };
    };
  }>({
    queryKey: ['structured-report'],
    queryFn: async () => {
      const response = await fetch('/api/simulation-report');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch structured report');
      }

      const data = await response.json();

      // Convert string values to BigInt for the proposal data
      return {
        proposalData: {
          ...data.proposalData,
          values: data.proposalData.values.map((value: string) => BigInt(value)),
        },
        report: data.report,
      };
    },
  });
}
