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
  is_template: boolean;
}

interface Plan {
  id: number;
  scenario_id: number;
  family_id: number;
  title: string;
  priority: number;
  steps: Array<{ order: number; text: string; done?: boolean }>;
  contacts: Array<{ name: string; phone: string; role: string }>;
  notes: string;
  last_used: string | null;
  times_used: number;
}

export default function ScenarioPage() {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activatingPlan, setActivatingPlan] = useState<number | null>(null);
  const router = useRouter();
  const params = useParams();
  const scenarioId = params?.id as string;

  useEffect(() => {
    const familyId = localStorage.getItem('familyId');
    if (!familyId) {
      router.push('/');
      return;
    }

    if (!scenarioId || isNaN(Number(scenarioId))) {
      router.push('/dashboard');
      return;
    }

    loadScenarioData(familyId);
  }, [scenarioId, router]);

  const loadScenarioData = async (familyId: string) => {
    try {
      setLoading(true);
      
      // Load scenarios to find this one
      const scenariosRes = await fetch(`/api/scenarios?familyId=${familyId}`);
      if (scenariosRes.ok) {
        const scenarios = await scenariosRes.json();
        const currentScenario = scenarios.find((s: Scenario) => s.id === Number(scenarioId));
        if (currentScenario) {
          setScenario(currentScenario);
        } else {
          throw new Error('Scenario not found');
        }
      }

      // Load plans for this scenario (filtered by family)
      const plansRes = await fetch(`/api/plans?scenarioId=${scenarioId}&familyId=${familyId}`);
      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setPlans(plansData);
      }
      
    } catch (err) {
      setError('Failed to load scenario data');
    } finally {
      setLoading(false);
    }
  };

  const activatePlan = async (planId: number) => {
    setActivatingPlan(planId);
    try {
      const response = await fetch(`/api/plans/${planId}/activate`, {
        method: 'POST',
      });
      
      if (response.ok) {
        // Reload plans to get updated usage data
        const familyId = localStorage.getItem('familyId');
        if (familyId) {
          loadScenarioData(familyId);
        }
      }
    } catch (err) {
      // Silent fail - activation tracking is not critical
    } finally {
      setActivatingPlan(null);
    }
  };

  const getPriorityBadge = (priority: number) => {
    const badges = {
      1: { text: 'Plan A', class: 'bg-green-600' },
      2: { text: 'Plan B', class: 'bg-yellow-600' },
      3: { text: 'Plan C', class: 'bg-red-600' },
    };
    return badges[priority as keyof typeof badges] || { text: `Plan ${priority}`, class: 'bg-gray-600' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading scenario...</div>
      </div>
    );
  }

  if (error || !scenario) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-400">{error || 'Scenario not found'}</div>
          <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-4xl mx-auto">
          <Link 
            href={`/category/${scenario.category}`} 
            className="text-blue-400 hover:text-blue-300 text-sm mb-2 inline-block"
          >
            ← Back to {scenario.category}
          </Link>
          <div className="flex items-start gap-4">
            <span className="text-4xl">{scenario.icon}</span>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{scenario.title}</h1>
              {scenario.description && (
                <p className="text-gray-300 text-lg">{scenario.description}</p>
              )}
              <div className="flex items-center gap-4 mt-3">
                <span className="text-sm text-gray-400">{plans.length} backup plans</span>
                {!scenario.is_template && (
                  <span className="bg-blue-900 text-blue-200 px-2 py-1 rounded text-xs">
                    Custom Scenario
                  </span>
                )}
              </div>
            </div>
            <Link 
              href={`/plan/new?scenarioId=${scenarioId}`}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-semibold"
            >
              + Add Plan
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {/* Plans List */}
        {plans.length > 0 ? (
          <div className="space-y-6">
            {plans.map((plan) => {
              const badge = getPriorityBadge(plan.priority);
              return (
                <div key={plan.id} className="bg-gray-800 rounded-lg border border-gray-600 overflow-hidden">
                  {/* Plan Header */}
                  <div className="p-6 border-b border-gray-600">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`${badge.class} text-white text-sm font-bold px-3 py-1 rounded-full`}>
                            {badge.text}
                          </span>
                          <h3 className="text-xl font-semibold">{plan.title}</h3>
                        </div>
                        {plan.notes && (
                          <p className="text-gray-300 mb-3">{plan.notes}</p>
                        )}
                        {plan.times_used > 0 && (
                          <div className="text-sm text-gray-400">
                            Used {plan.times_used} times
                            {plan.last_used && (
                              <span> • Last used {new Date(plan.last_used).toLocaleDateString()}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => activatePlan(plan.id)}
                          disabled={activatingPlan === plan.id}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded font-semibold text-sm"
                        >
                          {activatingPlan === plan.id ? 'Activating...' : '🚨 Activate Plan'}
                        </button>
                        <Link 
                          href={`/plan/${plan.id}/edit`}
                          className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Plan Content */}
                  <div className="p-6 space-y-6">
                    {/* Steps Checklist */}
                    {plan.steps && plan.steps.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-lg mb-3 text-blue-400">📋 Steps to Follow</h4>
                        <div className="space-y-2">
                          {plan.steps.sort((a, b) => a.order - b.order).map((step, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 bg-gray-700 rounded">
                              <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                                {step.order}
                              </div>
                              <span className="text-gray-100">{step.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Emergency Contacts */}
                    {plan.contacts && plan.contacts.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-lg mb-3 text-green-400">📞 Emergency Contacts</h4>
                        <div className="space-y-2">
                          {plan.contacts.map((contact, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                              <div>
                                <div className="font-semibold">{contact.name}</div>
                                {contact.role && (
                                  <div className="text-sm text-gray-400">{contact.role}</div>
                                )}
                              </div>
                              <a 
                                href={`tel:${contact.phone}`}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold text-sm"
                              >
                                📱 Call {contact.phone}
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12 space-y-4">
            <div className="text-6xl">📝</div>
            <h3 className="text-xl font-semibold">No backup plans yet</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              Create your first backup plan for "{scenario.title}" to be prepared when this situation happens.
            </p>
            <Link 
              href={`/plan/new?scenarioId=${scenarioId}`}
              className="inline-block bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold"
            >
              Create First Plan
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}