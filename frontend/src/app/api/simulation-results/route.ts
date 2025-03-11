import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Read the simulation results from the public directory
    const filePath = join(process.cwd(), 'public', 'simulation-results.json');
    console.log('Reading simulation results from:', filePath);

    const fileContents = await readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContents);

    if (!data || (Array.isArray(data) && data.length === 0)) {
      console.error('No simulation data found');
      return NextResponse.json({ error: 'No simulation data found' }, { status: 404 });
    }

    // Add CORS headers
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error reading simulation results:', error);
    return NextResponse.json({ error: 'Failed to read simulation results' }, { status: 500 });
  }
}
