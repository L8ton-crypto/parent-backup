import { NextRequest, NextResponse } from 'next/server';
import { ensureDb, sql } from '@/lib/db';

// GET /api/plans?scenarioId=X&familyId=Y - Get plans for a scenario (filtered by family)
// GET /api/plans?planId=X&familyId=Y - Get a single plan by ID
export async function GET(request: NextRequest) {
  try {
    await ensureDb();
    
    const { searchParams } = new URL(request.url);
    const scenarioId = searchParams.get('scenarioId');
    const planId = searchParams.get('planId');
    const familyId = searchParams.get('familyId');
    
    if (!familyId) {
      return NextResponse.json({ error: 'Family ID is required' }, { status: 400 });
    }
    
    // Single plan fetch
    if (planId) {
      const plans = await sql`
        SELECT id, scenario_id, family_id, title, priority, steps, contacts, notes, last_used, times_used, created_at
        FROM bp_plans
        WHERE id = ${planId} AND family_id = ${familyId}
      `;
      if (plans.length === 0) {
        return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
      }
      return NextResponse.json(plans[0]);
    }
    
    if (!scenarioId) {
      return NextResponse.json({ error: 'Scenario ID is required' }, { status: 400 });
    }
    
    const plans = await sql`
      SELECT id, scenario_id, family_id, title, priority, steps, contacts, notes, last_used, times_used, created_at
      FROM bp_plans
      WHERE scenario_id = ${scenarioId} AND family_id = ${familyId}
      ORDER BY priority ASC, created_at ASC
    `;
    
    return NextResponse.json(plans);
  } catch (error) {
    console.error('Plans fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
  }
}

// POST /api/plans - Create plan
export async function POST(request: NextRequest) {
  try {
    await ensureDb();
    
    const { scenarioId, familyId, title, priority, steps, contacts, notes } = await request.json();
    
    if (!scenarioId || !familyId || !title) {
      return NextResponse.json({ 
        error: 'Scenario ID, family ID, and title are required' 
      }, { status: 400 });
    }
    
    const result = await sql`
      INSERT INTO bp_plans (scenario_id, family_id, title, priority, steps, contacts, notes)
      VALUES (
        ${scenarioId}, 
        ${familyId}, 
        ${title}, 
        ${priority || 1}, 
        ${JSON.stringify(steps || [])}, 
        ${JSON.stringify(contacts || [])}, 
        ${notes || ''}
      )
      RETURNING id, scenario_id, family_id, title, priority, steps, contacts, notes, last_used, times_used, created_at
    `;
    
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Plan creation error:', error);
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
  }
}