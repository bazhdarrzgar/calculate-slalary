import { NextResponse } from 'next/server';
import { getDb } from '@/database/db';

export async function GET() {
  try {
    const db = getDb();
    // Test the connection by running a simple query
    const result = db.prepare('SELECT 1 as test').get();
    
    if (result) {
      return NextResponse.json({ 
        connected: true, 
        message: 'Database connected successfully' 
      });
    } else {
      return NextResponse.json({ 
        connected: false, 
        message: 'Database query failed' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({ 
      connected: false, 
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    // Force reconnection by getting a fresh database instance
    const db = getDb();
    
    // Verify tables exist
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name IN ('calculations', 'denominations', 'salary_templates')
    `).all();
    
    if (tables.length === 3) {
      return NextResponse.json({ 
        connected: true, 
        message: 'Database reconnected successfully',
        tables: tables.map((t: any) => t.name)
      });
    } else {
      return NextResponse.json({ 
        connected: false, 
        message: 'Some database tables are missing' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Database reconnection error:', error);
    return NextResponse.json({ 
      connected: false, 
      message: 'Failed to reconnect to database',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
