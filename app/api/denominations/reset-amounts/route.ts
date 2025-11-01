import { NextResponse } from 'next/server';
import { getDb } from '@/database/db';

export async function POST() {
  try {
    const db = getDb();
    db.prepare('UPDATE denominations SET amount = 100').run();
    
    return NextResponse.json({ message: 'All amounts reset to 100' });
  } catch (error) {
    console.error('Error resetting amounts:', error);
    return NextResponse.json({ error: 'Failed to reset amounts' }, { status: 500 });
  }
}
