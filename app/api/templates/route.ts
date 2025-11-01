import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/database/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const db = getDb();
    const templates = db.prepare(`
      SELECT id, name, rank, department, salary, created_at
      FROM salary_templates
      ORDER BY name ASC
    `).all();
    
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, rank, department, salary } = body;
    
    if (!name || !salary) {
      return NextResponse.json({ error: 'Name and salary are required' }, { status: 400 });
    }
    
    const templateId = uuidv4();
    const createdAt = new Date().toISOString();
    
    const db = getDb();
    
    // Ensure table exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS salary_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        rank TEXT,
        department TEXT,
        salary INTEGER NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
    
    db.prepare(`
      INSERT INTO salary_templates (id, name, rank, department, salary, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(templateId, name, rank || '', department || '', salary, createdAt);
    
    return NextResponse.json({
      id: templateId,
      name,
      rank: rank || '',
      department: department || '',
      salary,
      created_at: createdAt
    });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
    }
    
    const db = getDb();
    db.prepare('DELETE FROM salary_templates WHERE id = ?').run(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
