import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

let initialized = false;

export async function ensureDb() {
  if (initialized) return;
  
  try {
    // Create families table
    await sql`
      CREATE TABLE IF NOT EXISTS bp_families (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Create scenarios table
    await sql`
      CREATE TABLE IF NOT EXISTS bp_scenarios (
        id SERIAL PRIMARY KEY,
        family_id INTEGER REFERENCES bp_families(id),
        category TEXT NOT NULL CHECK (category IN ('childcare', 'weather', 'health', 'transport', 'school', 'general')),
        title TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        is_template BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Create plans table
    await sql`
      CREATE TABLE IF NOT EXISTS bp_plans (
        id SERIAL PRIMARY KEY,
        scenario_id INTEGER NOT NULL REFERENCES bp_scenarios(id) ON DELETE CASCADE,
        family_id INTEGER NOT NULL REFERENCES bp_families(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        priority INTEGER DEFAULT 1,
        steps JSONB DEFAULT '[]',
        contacts JSONB DEFAULT '[]',
        notes TEXT,
        last_used TIMESTAMPTZ,
        times_used INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Check if template scenarios exist
    const templateCount = await sql`
      SELECT COUNT(*) as count FROM bp_scenarios WHERE is_template = true
    `;

    if (templateCount[0].count === '0') {
      // Insert template scenarios
      const templateScenarios = [
        // Childcare
        { category: 'childcare', title: 'Childminder sick', description: 'Your regular childminder has called in sick', icon: '🤒' },
        { category: 'childcare', title: 'Nursery closed unexpectedly', description: 'Nursery closed due to emergency or staff shortage', icon: '🏫' },
        { category: 'childcare', title: 'After-school club cancelled', description: 'After-school activities cancelled at short notice', icon: '⚽' },
        
        // Weather
        { category: 'weather', title: 'Rainy day - outdoor plans cancelled', description: 'Bad weather has ruined your outdoor plans', icon: '🌧️' },
        { category: 'weather', title: 'Snow day - school closed', description: 'Heavy snow has closed schools', icon: '❄️' },
        { category: 'weather', title: 'Heatwave - too hot for park', description: 'Extreme heat makes outdoor activities unsafe', icon: '🌡️' },
        
        // Health
        { category: 'health', title: 'Child sick - can\'t go to school', description: 'Your child is unwell and needs to stay home', icon: '🤧' },
        { category: 'health', title: 'Parent sick - need backup', description: 'You\'re too unwell to handle normal routine', icon: '😷' },
        { category: 'health', title: 'A&E visit needed', description: 'Emergency hospital visit required', icon: '🚑' },
        
        // Transport
        { category: 'transport', title: 'Car won\'t start on school run', description: 'Vehicle breakdown during morning routine', icon: '🚗' },
        { category: 'transport', title: 'Public transport strike', description: 'Buses/trains not running due to strike action', icon: '🚌' },
        
        // School
        { category: 'school', title: 'School closed for INSET day (forgotten)', description: 'You forgot about a teacher training day', icon: '📚' },
        { category: 'school', title: 'School event I forgot about', description: 'Suddenly remembered about a school event today', icon: '🎭' },
        
        // General
        { category: 'general', title: 'Power cut', description: 'Electricity outage affecting your routine', icon: '⚡' },
        { category: 'general', title: 'Unexpected visitors', description: 'Friends or family have arrived unannounced', icon: '👋' },
        { category: 'general', title: 'Double-booked commitments', description: 'You\'ve accidentally scheduled two things at once', icon: '📅' }
      ];

      for (const scenario of templateScenarios) {
        await sql`
          INSERT INTO bp_scenarios (family_id, category, title, description, icon, is_template)
          VALUES (NULL, ${scenario.category}, ${scenario.title}, ${scenario.description}, ${scenario.icon}, true)
        `;
      }
    }

    initialized = true;
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

export { sql };