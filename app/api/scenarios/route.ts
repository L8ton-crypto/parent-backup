import { NextRequest, NextResponse } from 'next/server';
import { ensureDb, sql } from '@/lib/db';

// GET /api/scenarios?familyId=X - Get all scenarios (templates + family custom)
export async function GET(request: NextRequest) {
  try {
    await ensureDb();
    
    const { searchParams } = new URL(request.url);
    const familyId = searchParams.get('familyId');
    
    if (!familyId) {
      return NextResponse.json({ error: 'Family ID is required' }, { status: 400 });
    }
    
    // Get template scenarios and family-specific scenarios
    const scenarios = await sql`
      SELECT 
        s.id,
        s.family_id,
        s.category,
        s.title,
        s.description,
        s.icon,
        s.is_template,
        s.created_at,
        COUNT(p.id) as plan_count
      FROM bp_scenarios s
      LEFT JOIN bp_plans p ON s.id = p.scenario_id AND p.family_id = ${familyId}
      WHERE s.is_template = true OR s.family_id = ${familyId}
      GROUP BY s.id, s.family_id, s.category, s.title, s.description, s.icon, s.is_template, s.created_at
      ORDER BY s.category, s.title
    `;
    
    return NextResponse.json(scenarios);
  } catch (error) {
    console.error('Scenarios fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch scenarios' }, { status: 500 });
  }
}

// POST /api/scenarios - Create custom scenario
export async function POST(request: NextRequest) {
  try {
    await ensureDb();
    
    const { familyId, category, title, description, icon } = await request.json();
    
    if (!familyId || !category || !title) {
      return NextResponse.json({ 
        error: 'Family ID, category, and title are required' 
      }, { status: 400 });
    }
    
    const validCategories = ['childcare', 'weather', 'health', 'transport', 'school', 'general'];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }
    
    const result = await sql`
      INSERT INTO bp_scenarios (family_id, category, title, description, icon, is_template)
      VALUES (${familyId}, ${category}, ${title}, ${description || ''}, ${icon || ''}, false)
      RETURNING id, family_id, category, title, description, icon, is_template, created_at
    `;
    
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Scenario creation error:', error);
    return NextResponse.json({ error: 'Failed to create scenario' }, { status: 500 });
  }
}