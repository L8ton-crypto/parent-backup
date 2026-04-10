import { NextRequest, NextResponse } from 'next/server';
import { ensureDb, getDb } from '@/lib/db';

// POST /api/family - Create a new family
export async function POST(request: NextRequest) {
  try {
    await ensureDb();
    const sql = getDb();
    
    const { name } = await request.json();
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Family name is required' }, { status: 400 });
    }
    
    // Generate unique family code
    const code = `PLAN-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    const result = await sql`
      INSERT INTO bp_families (name, code)
      VALUES (${name.trim()}, ${code})
      RETURNING id, name, code, created_at
    `;
    
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Family creation error:', error);
    return NextResponse.json({ error: 'Failed to create family' }, { status: 500 });
  }
}