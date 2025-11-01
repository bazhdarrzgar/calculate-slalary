import { NextResponse } from 'next/server';
import { getDb } from '@/database/db';

export async function GET() {
  try {
    const db = getDb();
    const denominations = db.prepare(
      'SELECT value, image_name, is_available, amount FROM denominations ORDER BY value DESC'
    ).all();
    
    return NextResponse.json(
      denominations.map((row: any) => ({
        value: row.value,
        image_name: row.image_name,
        is_available: Boolean(row.is_available),
        amount: row.amount || 100
      }))
    );
  } catch (error) {
    console.error('Error fetching denominations:', error);
    return NextResponse.json({ error: 'Failed to fetch denominations' }, { status: 500 });
  }
}
