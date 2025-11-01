import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/database/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ value: string }> }
) {
  try {
    const { value } = await params;
    const body = await request.json();
    const { amount } = body;
    
    if (amount < 0) {
      return NextResponse.json({ error: 'Amount cannot be negative' }, { status: 400 });
    }
    
    const db = getDb();
    const result = db.prepare('UPDATE denominations SET amount = ? WHERE value = ?').run(amount, parseInt(value));
    
    if (result.changes === 0) {
      return NextResponse.json({ error: 'Denomination not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      message: 'Amount updated successfully',
      value: parseInt(value),
      amount
    });
  } catch (error) {
    console.error('Error updating denomination amount:', error);
    return NextResponse.json({ error: 'Failed to update amount' }, { status: 500 });
  }
}
