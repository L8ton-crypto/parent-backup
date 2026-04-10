import { NextRequest, NextResponse } from 'next/server';
import { ensureDb, getDb } from '@/lib/db';

// POST /api/plans/[id]/activate - Activate plan (track usage)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDb();
    const sql = getDb();
    
    const { id } = await params;
    
    const result = await sql`
      UPDATE bp_plans 
      SET 
        last_used = NOW(),
        times_used = times_used + 1
      WHERE id = ${id}
      RETURNING id, scenario_id, family_id, title, priority, steps, contacts, notes, last_used, times_used, created_at
    `;
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }
    
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Plan activation error:', error);
    return NextResponse.json({ error: 'Failed to activate plan' }, { status: 500 });
  }
}