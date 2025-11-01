import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/database/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const row = db.prepare(`
      SELECT id, name, rank, salary, breakdown, total_notes, created_at
      FROM calculations
      WHERE id = ?
    `).get(id) as any;
    
    if (!row) {
      return NextResponse.json({ error: 'Calculation not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      id: row.id,
      name: row.name,
      rank: row.rank,
      salary: row.salary,
      breakdown: JSON.parse(row.breakdown),
      total_notes: row.total_notes,
      created_at: row.created_at
    });
  } catch (error) {
    console.error('Error fetching calculation:', error);
    return NextResponse.json({ error: 'Failed to fetch calculation' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, rank, salary, breakdown, total_notes } = body;
    
    const db = getDb();
    const breakdownJson = JSON.stringify(breakdown);
    
    const result = db.prepare(`
      UPDATE calculations 
      SET name = ?, rank = ?, salary = ?, breakdown = ?, total_notes = ?
      WHERE id = ?
    `).run(name, rank, salary, breakdownJson, total_notes, id);
    
    if (result.changes === 0) {
      return NextResponse.json({ error: 'Calculation not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      id,
      name,
      rank,
      salary,
      breakdown,
      total_notes,
      message: 'Calculation updated successfully'
    });
  } catch (error) {
    console.error('Error updating calculation:', error);
    return NextResponse.json({ error: 'Failed to update calculation' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const result = db.prepare('DELETE FROM calculations WHERE id = ?').run(id);
    
    if (result.changes === 0) {
      return NextResponse.json({ error: 'Calculation not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Calculation deleted successfully' });
  } catch (error) {
    console.error('Error deleting calculation:', error);
    return NextResponse.json({ error: 'Failed to delete calculation' }, { status: 500 });
  }
}
