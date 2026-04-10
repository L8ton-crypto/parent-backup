import { NextRequest, NextResponse } from 'next/server';
import { ensureDb, sql } from '@/lib/db';

// POST /api/family/join - Join existing family with code
export async function POST(request: NextRequest) {
  try {
    await ensureDb();
    
    const { code } = await request.json();
    
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Family code is required' }, { status: 400 });
    }
    
    const family = await sql`
      SELECT id, name, code, created_at
      FROM bp_families
      WHERE code = ${code.trim().toUpperCase()}
    `;
    
    if (family.length === 0) {
      return NextResponse.json({ error: 'Invalid family code' }, { status: 404 });
    }
    
    return NextResponse.json(family[0]);
  } catch (error) {
    console.error('Family join error:', error);
    return NextResponse.json({ error: 'Failed to join family' }, { status: 500 });
  }
}