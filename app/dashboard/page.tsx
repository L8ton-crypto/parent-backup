'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Scenario {
  id: number;
  category: string;
  title: string;
  description: string;
  icon: string;
  plan_count: number;
}

interface RecentPlan {
  id: number;
  title: string;
  scenario_title: string;
  scenario_icon: string;
  last_used: string;
  priority: number;
}

const categoryInfo = {
  childcare: { name: 'Childcare', emoji: '👶' },
  weather: { name: 'Weather', emoji: '🌤️' },
  health: { name: 'Health', emoji: '🏥' },
  transport: { name: 'Transport', emoji: '🚗' },
  school: { name: 'School', emoji: '🏫' },
  general: { name: 'General', emoji: '📋' },
};

export default function Dashboard() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [recentPlans, setRecentPlans] = useState<RecentPlan[]>([]);
  const [familyCode, setFamilyCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const familyId = localStorage.getItem('familyId');
    const storedCode = localStorage.getItem('familyCode');
    
    if (!familyId) {
      router.push('/');
      return;
    }

    setFamilyCode(storedCode || '');
    loadDashboardData(familyId);
  }, [router]);

  const loadDashboardData = async (familyId: string) => {
    try {
      setLoading(true);
      
      // Load scenarios
      const scenariosRes = await fetch(`/api/scenarios?familyId=${familyId}`);
      if (scenariosRes.ok) {
        const scenariosData = await scenariosRes.json();
        setScenarios(scenariosData);
      }

      // TODO: Load recent plans - would need additional API endpoint
      // For now, using empty array
      setRecentPlans([]);
      
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const categorizeScenarios = () => {
    const categorized: { [key: string]: Scenario[] } = {};
    
    scenarios.forEach(scenario => {
      if (!categorized[scenario.category]) {
        categorized[scenario.category] = [];
      }
      categorized[scenario.category].push(scenario);
    });
    
    return categorized;
  };

  const getCategoryStats = (category: string) => {
    const categoryScenarios = scenarios.filter(s => s.category === category);
    const totalPlans = categoryScenarios.reduce((sum, s) => sum + parseInt(s.plan_count.toString()), 0);
    return {
      scenarios: categoryScenarios.length,
      plans: totalPlans
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading your backup plans...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-400">{error}</div>
          <button 
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🅿 Parent Backup Plan</h1>
            {familyCode && (
              <p className="text-gray-400 text-sm mt-1">Family: {familyCode}</p>
            )}
          </div>

        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-8">
        {/* Quick Access - Recent Plans */}
        {recentPlans.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4 text-blue-400">⚡ Quick Access</h2>
            <div className="grid gap-3">
              {recentPlans.slice(0, 3).map((plan) => (
                <Link
                  key={plan.id}
                  href={`/plan/${plan.id}`}
                  className="bg-gray-800 hover:bg-gray-700 p-4 rounded-lg border border-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{plan.scenario_icon}</span>
                    <div className="flex-1">
                      <div className="font-semibold">{plan.title}</div>
                      <div className="text-sm text-gray-400">{plan.scenario_title}</div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Last used: {new Date(plan.last_used).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Categories Grid */}
        <section>
          <h2 className="text-xl font-semibold mb-4">📋 All Categories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(categoryInfo).map(([category, info]) => {
              const stats = getCategoryStats(category);
              return (
                <Link
                  key={category}
                  href={`/category/${category}`}
                  className="bg-gray-800 hover:bg-gray-700 p-6 rounded-lg border border-gray-600 transition-colors text-center space-y-3"
                >
                  <div className="text-4xl">{info.emoji}</div>
                  <div>
                    <h3 className="font-semibold text-lg">{info.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {stats.scenarios} scenarios • {stats.plans} plans
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Empty State */}
        {scenarios.length === 0 && (
          <div className="text-center py-12 space-y-4">
            <div className="text-6xl">📝</div>
            <h3 className="text-xl font-semibold">Ready to create your first backup plan?</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              Browse the categories above to see common scenarios, or create a custom plan for your family.
            </p>
            <Link 
              href="/category/childcare" 
              className="inline-block bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold"
            >
              Explore Childcare Plans
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}