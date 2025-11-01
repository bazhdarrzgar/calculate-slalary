import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/database/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT id, name, rank, salary, breakdown, total_notes, created_at
      FROM calculations
      ORDER BY created_at DESC
    `).all();
    
    const result = rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      rank: row.rank,
      salary: row.salary,
      breakdown: JSON.parse(row.breakdown),
      total_notes: row.total_notes,
      created_at: row.created_at
    }));
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, rank, salary, breakdown, total_notes } = body;
    
    const calcId = uuidv4();
    const createdAt = new Date().toISOString();
    const breakdownJson = JSON.stringify(breakdown);
    
    const db = getDb();
    db.prepare(`
      INSERT INTO calculations (id, name, rank, salary, breakdown, total_notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(calcId, name, rank, salary, breakdownJson, total_notes, createdAt);
    
    return NextResponse.json({
      id: calcId,
      name,
      rank,
      salary,
      breakdown,
      total_notes,
      created_at: createdAt
    });
  } catch (error) {
    console.error('Error saving calculation:', error);
    return NextResponse.json({ error: 'Failed to save calculation' }, { status: 500 });
  }
}
