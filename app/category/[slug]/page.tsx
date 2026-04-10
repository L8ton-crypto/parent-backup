'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Scenario {
  id: number;
  category: string;
  title: string;
  description: string;
  icon: string;
  plan_count: number;
  is_template: boolean;
}

const categoryInfo: { [key: string]: { name: string; emoji: string } } = {
  childcare: { name: 'Childcare', emoji: '👶' },
  weather: { name: 'Weather', emoji: '🌤️' },
  health: { name: 'Health', emoji: '🏥' },
  transport: { name: 'Transport', emoji: '🚗' },
  school: { name: 'School', emoji: '🏫' },
  general: { name: 'General', emoji: '📋' },
};

export default function CategoryPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const categoryDetails = categoryInfo[slug];

  useEffect(() => {
    if (!categoryDetails) {
      router.push('/dashboard');
      return;
    }

    const familyId = localStorage.getItem('familyId');
    if (!familyId) {
      router.push('/');
      return;
    }

    loadScenarios(familyId);
  }, [slug, categoryDetails, router]);

  const loadScenarios = async (familyId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/scenarios?familyId=${familyId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load scenarios');
      }
      
      const data = await response.json();
      const categoryScenarios = data.filter((s: Scenario) => s.category === slug);
      setScenarios(categoryScenarios);
    } catch (err) {
      setError('Failed to load scenarios');
    } finally {
      setLoading(false);
    }
  };

  if (!categoryDetails) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading scenarios...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-4xl mx-auto">
          <Link 
            href="/dashboard" 
            className="text-blue-400 hover:text-blue-300 text-sm mb-2 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-4xl">{categoryDetails.emoji}</span>
            <div>
              <h1 className="text-3xl font-bold">{categoryDetails.name}</h1>
              <p className="text-gray-400 mt-1">{scenarios.length} scenarios available</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6 text-red-200">
            {error}
          </div>
        )}

        {/* Scenarios List */}
        <div className="space-y-4">
          {scenarios.map((scenario) => (
            <div key={scenario.id} className="bg-gray-800 rounded-lg border border-gray-600 overflow-hidden">
              <Link 
                href={`/scenario/${scenario.id}`}
                className="block p-6 hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{scenario.icon}</span>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{scenario.title}</h3>
                    {scenario.description && (
                      <p className="text-gray-300 mb-3">{scenario.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      <span className={
                        scenario.plan_count > 0
                          ? "bg-green-900 text-green-200 px-2 py-1 rounded"
                          : "bg-gray-700 text-gray-300 px-2 py-1 rounded"
                      }>
                        {scenario.plan_count} {scenario.plan_count === 1 ? 'plan' : 'plans'}
                      </span>
                      {!scenario.is_template && (
                        <span className="bg-blue-900 text-blue-200 px-2 py-1 rounded text-xs">
                          Custom
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-gray-500">
                    →
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {scenarios.length === 0 && (
          <div className="text-center py-12 space-y-4">
            <div className="text-6xl">{categoryDetails.emoji}</div>
            <h3 className="text-xl font-semibold">No scenarios in {categoryDetails.name} yet</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              Create a custom scenario for this category to get started.
            </p>
            <Link 
              href="/dashboard"
              className="inline-block bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold"
            >
              Back to Dashboard
            </Link>
          </div>
        )}

        {/* Add Scenario Button */}
        {scenarios.length > 0 && (
          <div className="mt-8 text-center">

          </div>
        )}
      </main>
    </div>
  );
}