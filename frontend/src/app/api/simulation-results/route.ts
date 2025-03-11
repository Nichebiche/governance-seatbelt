import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Read the simulation results from the public directory
    const filePath = join(process.cwd(), 'public', 'simulation-results.json');
    const fileContents = await readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContents);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reading simulation results:', error);
    return NextResponse.json({ error: 'Failed to read simulation results' }, { status: 500 });
  }
}
