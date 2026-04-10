'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [isJoining, setIsJoining] = useState(false);
  const [familyName, setFamilyName] = useState('');
  const [familyCode, setFamilyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const createFamily = async () => {
    if (!familyName.trim()) {
      setError('Please enter a family name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: familyName }),
      });

      if (!response.ok) {
        throw new Error('Failed to create family');
      }

      const family = await response.json();
      localStorage.setItem('familyId', family.id);
      localStorage.setItem('familyCode', family.code);
      router.push('/dashboard');
    } catch (err) {
      setError('Failed to create family. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const joinFamily = async () => {
    if (!familyCode.trim()) {
      setError('Please enter a family code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/family/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: familyCode }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Invalid family code');
        }
        throw new Error('Failed to join family');
      }

      const family = await response.json();
      localStorage.setItem('familyId', family.id);
      localStorage.setItem('familyCode', family.code);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to join family. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Header */}
        <div className="space-y-4">
          <div className="text-6xl">🆘</div>
          <h1 className="text-4xl font-bold tracking-tight">
            Parent Backup Plan
          </h1>
          <p className="text-xl text-gray-300">
            Emergency backup plans for every parenting scenario.
            <br />
            <span className="text-blue-400 font-semibold">Be prepared, not panicked.</span>
          </p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-3 text-red-200">
            {error}
          </div>
        )}

        {/* Main Actions */}
        <div className="space-y-6">
          {!isJoining ? (
            // Create Family Flow
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter your family name"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none text-lg"
                disabled={loading}
              />
              <button
                onClick={createFamily}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-lg"
              >
                {loading ? 'Creating...' : 'Create Family Backup Plan'}
              </button>
            </div>
          ) : (
            // Join Family Flow
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter family code (PLAN-XXXX)"
                value={familyCode}
                onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none text-lg text-center font-mono"
                disabled={loading}
              />
              <button
                onClick={joinFamily}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-lg"
              >
                {loading ? 'Joining...' : 'Join Family'}
              </button>
            </div>
          )}

          {/* Toggle between create/join */}
          <button
            onClick={() => {
              setIsJoining(!isJoining);
              setError('');
              setFamilyName('');
              setFamilyCode('');
            }}
            className="text-gray-400 hover:text-white underline"
            disabled={loading}
          >
            {isJoining ? 'New here? Create a family plan' : 'Already have a family code? Join instead'}
          </button>
        </div>

        {/* Features */}
        <div className="pt-8 space-y-4 text-sm text-gray-400">
          <div className="flex items-center justify-center gap-2">
            <span>⚡</span>
            <span>3-tap emergency access</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span>📱</span>
            <span>One-tap calling</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span>📋</span>
            <span>Ready-made checklists</span>
          </div>
        </div>
      </div>
    </div>
  );
}
