import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import type { Report, Finding } from '@/components/ReportCard';

// Helper function to read the simulation results file
function readSimulationResults() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'simulation-results.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error('Error reading simulation results:', error);
    return null;
  }
}

// Generate a report based on the proposal data
function generateReport(proposal: any): Report {
  const { targets, values, signatures, calldatas, description } = proposal;

  return {
    status: 'success',
    summary: `Simulation completed successfully for proposal: "${description}". The transaction is ready to be proposed.`,
    gasUsed: '850,000', // Mock gas usage
    findings: [
      {
        id: '1',
        title: 'Standard ERC20 transfer',
        description: 'This proposal executes a standard ERC20 transfer function.',
        severity: 'info',
      },
      // Add more findings based on the calldata if needed
      ...(calldatas[0].startsWith('0xa9059cbb')
        ? [
            {
              id: '2',
              title: 'Token transfer detected',
              description: 'The proposal transfers tokens to another address.',
              severity: 'info' as const,
            },
          ]
        : []),
    ],
    stateChanges: [
      {
        contract: targets[0],
        property: 'balanceOf(sender)',
        oldValue: 'X',
        newValue: 'X - amount',
      },
      {
        contract: targets[0],
        property: 'balanceOf(recipient)',
        oldValue: 'Y',
        newValue: 'Y + amount',
      },
    ],
    logs: [
      `[INFO] Simulation started for proposal: ${description}`,
      `[INFO] Target contract: ${targets[0]}`,
      `[INFO] Function signature: ${signatures[0] || 'Raw calldata'}`,
      `[INFO] Calldata: ${calldatas[0]}`,
      `[INFO] Value: ${values[0]}`,
      '[INFO] Simulation completed successfully',
    ],
  };
}

// Mock simulation results (in a real app, this would come from a file or database)
function generateSimulationResults(proposal: any) {
  return {
    success: true,
    gasUsed: 850000,
    blockNumber: 18500000,
    timestamp: new Date().toISOString(),
    transactions: [
      {
        hash: `0x${'1'.repeat(64)}`,
        from: `0x${'2'.repeat(40)}`,
        to: proposal.targets[0],
        value: proposal.values[0],
        data: proposal.calldatas[0],
        logs: [
          {
            address: proposal.targets[0],
            topics: [
              '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', // Transfer event
              `0x${'0'.repeat(64)}`, // from
              `0x${'f'.repeat(64)}`, // to
            ],
            data: `0x${'a'.repeat(64)}`, // amount
          },
        ],
      },
    ],
  };
}

export async function GET() {
  try {
    // Read the simulation results file
    const results = readSimulationResults();

    if (!results || !results.length) {
      return NextResponse.json({ error: 'No simulation results found' }, { status: 404 });
    }

    // Get the proposal data (first item in the results)
    const proposalData = results[0];

    // Generate the report based on the proposal data
    const report = generateReport(proposalData);

    // Generate simulation results
    const simulationResults = generateSimulationResults(proposalData);

    // Return all data in one response
    return NextResponse.json({
      proposalData,
      report,
      simulationResults,
    });
  } catch (error) {
    console.error('Error in simulation results API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
