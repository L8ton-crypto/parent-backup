'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Step {
  order: number;
  text: string;
}

interface Contact {
  name: string;
  phone: string;
  role: string;
}

interface Plan {
  id: number;
  scenario_id: number;
  family_id: number;
  title: string;
  priority: number;
  steps: Step[];
  contacts: Contact[];
  notes: string;
}

export default function EditPlanPage() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState(1);
  const [steps, setSteps] = useState<Step[]>([{ order: 1, text: '' }]);
  const [contacts, setContacts] = useState<Contact[]>([{ name: '', phone: '', role: '' }]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const params = useParams();
  const planId = params?.id as string;

  useEffect(() => {
    const familyId = localStorage.getItem('familyId');
    if (!familyId) {
      router.push('/');
      return;
    }

    if (!planId || isNaN(Number(planId))) {
      router.push('/dashboard');
      return;
    }

    loadPlan();
  }, [planId, router]);

  const loadPlan = async () => {
    try {
      setInitialLoading(true);
      const familyId = localStorage.getItem('familyId');
      const planRes = await fetch(`/api/plans?planId=${planId}&familyId=${familyId}`);
      
      if (!planRes.ok) {
        throw new Error('Plan not found');
      }
      
      const foundPlan = await planRes.json();
      
      setPlan(foundPlan);
      setTitle(foundPlan.title);
      setPriority(foundPlan.priority);
      setSteps(foundPlan.steps.length > 0 ? foundPlan.steps : [{ order: 1, text: '' }]);
      setContacts(foundPlan.contacts.length > 0 ? foundPlan.contacts : [{ name: '', phone: '', role: '' }]);
      setNotes(foundPlan.notes || '');
      
    } catch (err) {
      setError('Failed to load plan');
    } finally {
      setInitialLoading(false);
    }
  };

  const addStep = () => {
    setSteps([...steps, { order: steps.length + 1, text: '' }]);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      const newSteps = steps.filter((_, i) => i !== index);
      newSteps.forEach((step, i) => {
        step.order = i + 1;
      });
      setSteps(newSteps);
    }
  };

  const updateStep = (index: number, text: string) => {
    const newSteps = [...steps];
    newSteps[index].text = text;
    setSteps(newSteps);
  };

  const addContact = () => {
    setContacts([...contacts, { name: '', phone: '', role: '' }]);
  };

  const removeContact = (index: number) => {
    if (contacts.length > 1) {
      setContacts(contacts.filter((_, i) => i !== index));
    }
  };

  const updateContact = (index: number, field: string, value: string) => {
    const newContacts = [...contacts];
    (newContacts[index] as any)[field] = value;
    setContacts(newContacts);
  };

  const savePlan = async () => {
    if (!title.trim()) {
      setError('Please enter a plan title');
      return;
    }

    const validSteps = steps.filter(s => s.text.trim().length > 0);
    if (validSteps.length === 0) {
      setError('Please add at least one step');
      return;
    }

    const validContacts = contacts.filter(c => c.name.trim().length > 0 && c.phone.trim().length > 0);

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/plans/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          priority,
          steps: validSteps,
          contacts: validContacts,
          notes: notes.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update plan');
      }

      router.push(`/scenario/${plan?.scenario_id}`);
    } catch (err) {
      setError('Failed to update plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deletePlan = async () => {
    if (!confirm('Are you sure you want to delete this plan? This cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/plans/${planId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete plan');
      }

      router.push(`/scenario/${plan?.scenario_id}`);
    } catch (err) {
      setError('Failed to delete plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading plan...</div>
      </div>
    );
  }

  if (error && !plan) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-400">{error}</div>
          <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-4xl mx-auto">
          <Link 
            href={`/scenario/${plan?.scenario_id}`} 
            className="text-blue-400 hover:text-blue-300 text-sm mb-2 inline-block"
          >
            ← Back to scenario
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Edit Backup Plan</h1>
            <p className="text-gray-400 mt-1">Plan: {plan?.title}</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6 text-red-200">
            {error}
          </div>
        )}

        <div className="bg-gray-800 rounded-lg border border-gray-600 p-6 space-y-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-blue-400">Plan Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Call Grandma, Work from home"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-blue-400">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                disabled={loading}
              >
                <option value={1}>Plan A (First choice)</option>
                <option value={2}>Plan B (Fallback)</option>
                <option value={3}>Plan C (Last resort)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-4 text-blue-400">Steps to Follow *</label>
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-3">
                  <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-2">
                    {step.order}
                  </div>
                  <input
                    type="text"
                    value={step.text}
                    onChange={(e) => updateStep(index, e.target.value)}
                    placeholder="e.g., Call grandma to ask if she can help"
                    className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                    disabled={loading}
                  />
                  {steps.length > 1 && (
                    <button
                      onClick={() => removeStep(index)}
                      className="text-red-400 hover:text-red-300 p-2"
                      disabled={loading}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addStep}
              className="mt-3 text-blue-400 hover:text-blue-300 text-sm"
              disabled={loading}
            >
              + Add another step
            </button>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-4 text-green-400">Emergency Contacts</label>
            <div className="space-y-3">
              {contacts.map((contact, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-gray-700 rounded-lg">
                  <input
                    type="text"
                    value={contact.name}
                    onChange={(e) => updateContact(index, 'name', e.target.value)}
                    placeholder="Name"
                    className="px-4 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
                    disabled={loading}
                  />
                  <input
                    type="tel"
                    value={contact.phone}
                    onChange={(e) => updateContact(index, 'phone', e.target.value)}
                    placeholder="Phone number"
                    className="px-4 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
                    disabled={loading}
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={contact.role}
                      onChange={(e) => updateContact(index, 'role', e.target.value)}
                      placeholder="Role (e.g., Grandma)"
                      className="flex-1 px-4 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
                      disabled={loading}
                    />
                    {contacts.length > 1 && (
                      <button
                        onClick={() => removeContact(index)}
                        className="text-red-400 hover:text-red-300 p-2"
                        disabled={loading}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={addContact}
              className="mt-3 text-green-400 hover:text-green-300 text-sm"
              disabled={loading}
            >
              + Add another contact
            </button>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-blue-400">Additional Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any extra information, reminders, or context for this plan..."
              rows={4}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              disabled={loading}
            />
          </div>

          <div className="flex justify-between pt-4">
            <div className="flex gap-4">
              <button
                onClick={savePlan}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <Link 
                href={`/scenario/${plan?.scenario_id}`}
                className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold inline-block"
              >
                Cancel
              </Link>
            </div>
            
            <button
              onClick={deletePlan}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Delete Plan
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}