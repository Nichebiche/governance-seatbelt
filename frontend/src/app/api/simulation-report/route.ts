import fs from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';

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

// Helper function to parse the markdown report
function parseMarkdownReport(markdownReport: string) {
  // Extract title
  const titleMatch = markdownReport.match(/# (.+)/);
  const title = titleMatch ? titleMatch[1] : 'Simulation Report';

  // Extract proposal section
  const proposalMatch = markdownReport.match(/## Proposal Text\n\n>([\s\S]*?)(?=\n\n##|$)/);
  const proposalText = proposalMatch ? proposalMatch[1].trim() : '';

  // Extract checks
  const checks: Array<{ title: string; status: string; details?: string }> = [];
  const checkSections = markdownReport.match(
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

        // Extract details
        const detailsMatch = section.match(
          /(?:✅ Passed|❗❗ \*\*Passed with warnings\*\*|❌ \*\*Failed\*\*)[\s\S]*?\n\n([\s\S]*)/,
        );
        const details = detailsMatch ? detailsMatch[1].trim() : undefined;

        checks.push({ title, status, details });
      }
    }
  }

  // Extract state changes
  const stateChanges: Array<{ contract: string; key: string; oldValue: string; newValue: string }> =
    [];
  const stateChangeMatches = markdownReport.matchAll(
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

  // Extract events
  const events: Array<{ contract: string; name: string; params: string }> = [];
  const eventsSection = markdownReport.match(
    /### Reports all events emitted from the proposal[\s\S]*?(?=###|$)/,
  );

  if (eventsSection) {
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

  // Extract calldata
  const calldataSection = markdownReport.match(
    /### Decodes target calldata into a human-readable format[\s\S]*?(?=###|$)/,
  );
  const calldataMatch = calldataSection
    ? calldataSection[0].match(/\*\*Info\*\*:\n\n\*\s+(.+)/)
    : null;
  const calldata = calldataMatch ? calldataMatch[1] : null;

  // Determine overall status
  let status: 'success' | 'warning' | 'error' = 'success';
  for (const check of checks) {
    if (check.status.includes('Failed')) {
      status = 'error';
      break;
    }
    if (check.status.includes('warnings') && status === 'success') {
      status = 'warning';
    }
  }

  return {
    title,
    proposalText,
    status,
    checks,
    stateChanges,
    events,
    calldata,
  };
}

export async function GET() {
  try {
    // Read the simulation results file
    const results = readSimulationResults();

    if (!results || !results.length) {
      return NextResponse.json({ error: 'No simulation results found' }, { status: 404 });
    }

    // Get the first item from the array
    const firstResult = results[0];

    if (!firstResult.report || !firstResult.report.markdownReport) {
      return NextResponse.json(
        { error: 'No markdown report found in simulation results' },
        { status: 404 },
      );
    }

    // Parse the markdown report
    const parsedReport = parseMarkdownReport(firstResult.report.markdownReport);

    // Return the structured report
    return NextResponse.json({
      proposalData: {
        ...firstResult.proposalData,
        values: firstResult.proposalData.values.map((value: string) => value.toString()),
      },
      report: {
        ...firstResult.report,
        parsedReport,
      },
    });
  } catch (error) {
    console.error('Error in simulation report API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
