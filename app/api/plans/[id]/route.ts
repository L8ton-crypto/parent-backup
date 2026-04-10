import { NextRequest, NextResponse } from 'next/server';
import { ensureDb, getDb } from '@/lib/db';

// PUT /api/plans/[id] - Update plan
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDb();
    const sql = getDb();
    
    const { id } = await params;
    const { title, priority, steps, contacts, notes } = await request.json();
    
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    
    const result = await sql`
      UPDATE bp_plans 
      SET 
        title = ${title},
        priority = ${priority || 1},
        steps = ${JSON.stringify(steps || [])},
        contacts = ${JSON.stringify(contacts || [])},
        notes = ${notes || ''}
      WHERE id = ${id}
      RETURNING id, scenario_id, family_id, title, priority, steps, contacts, notes, last_used, times_used, created_at
    `;
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }
    
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Plan update error:', error);
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
  }
}

// DELETE /api/plans/[id] - Delete plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDb();
    const sql = getDb();
    
    const { id } = await params;
    
    const result = await sql`
      DELETE FROM bp_plans WHERE id = ${id}
      RETURNING id
    `;
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, id: result[0].id });
  } catch (error) {
    console.error('Plan deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 });
  }
}