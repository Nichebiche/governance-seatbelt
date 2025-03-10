import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Define the path to the simulation results file
    const filePath = join(process.cwd(), 'public', 'simulation-results.json');

    // Check if the file exists
    if (!existsSync(filePath)) {
      console.error('Simulation results file not found:', filePath);
      return NextResponse.json(
        {
          error: 'Simulation results not found',
          message: 'Please run a simulation first to generate results',
        },
        { status: 404 },
      );
    }

    // Read the file
    const fileContents = await readFile(filePath, 'utf-8');

    // Parse the JSON
    let data: Record<string, unknown>[] | Record<string, unknown>;
    try {
      data = JSON.parse(fileContents);
    } catch (error: unknown) {
      console.error('Error parsing simulation results JSON:', error);
      return NextResponse.json(
        {
          error: 'Invalid simulation results format',
          message: 'The simulation results file contains invalid JSON',
        },
        { status: 500 },
      );
    }

    // Return the data
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Error serving simulation results:', error);
    return NextResponse.json(
      {
        error: 'Server error',
        message: 'An error occurred while retrieving simulation results',
      },
      { status: 500 },
    );
  }
}
