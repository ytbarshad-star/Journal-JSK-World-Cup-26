'use client';
// src/app/predictions/page.tsx

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import MatchCard from '@/components/ui/MatchCard';
import { MatchCardSkeleton } from '@/components/ui/Skeleton';
import { showToast } from '@/components/ui/Toast';
import { Target, RefreshCw, Loader2 } from 'lucide-react';

type FilterType = 'upcoming' | 'live' | 'recent' | 'all';

export default function PredictionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('upcoming');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then(({ user: u }) => {
        if (!u) router.replace('/');
        else setUser(u);
      });
  }, []);

  const loadData = useCallback(async (currentFilter: FilterType = filter) => {
    const filterMap: Record<FilterType, string> = {
      upcoming: 'upcoming24h',
      live: 'live',
      recent: 'recent',
      all: 'all',
    };

    const [matchesRes, predsRes] = await Promise.all([
      fetch(`/api/matches?filter=${filterMap[currentFilter]}`),
      fetch('/api/predictions'),
    ]);

    const [matchesData, predsData] = await Promise.all([
      matchesRes.json(),
      predsRes.json(),
    ]);

    setMatches(matchesData.matches || []);
    setPredictions(predsData.predictions || []);
    setLoading(false);
    setRefreshing(false);
  }, [filter]);

  useEffect(() => {
    loadData(filter);
  }, [filter]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadData(filter);
  }

  async function handlePredictionSubmit(matchId: string, scoreA: number, scoreB: number) {
    const res = await fetch('/api/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        match_id: matchId,
        predicted_team_a_score: scoreA,
        predicted_team_b_score: scoreB,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    // Update predictions list
    setPredictions((prev) => [...prev, { ...data.prediction, match_id: matchId }]);
  }

  const predByMatch: Record<string, any> = {};
  predictions.forEach((p) => { if (p.match_id) predByMatch[p.match_id] = p; });

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: 'upcoming', label: 'Next 24h' },
    { key: 'live', label: '🔴 Live' },
    { key: 'recent', label: 'Recent' },
    { key: 'all', label: 'All' },
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar user={user} />

      <div className="pt-14 pb-20 md:pb-8 px-4 max-w-2xl mx-auto">
        <div className="mt-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-400" />
            <h1 className="text-white font-black text-xl">Predictions</h1>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-slate-400 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => {
                setFilter(key);
                setLoading(true);
              }}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                filter === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Points info */}
        <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl px-4 py-2.5 mb-4 flex items-center gap-4 text-xs text-slate-400">
          <span>✅ Correct winner = <strong className="text-white">+5 pts</strong></span>
          <span>🎯 Exact score = <strong className="text-white">+5 pts</strong></span>
          <span>🏅 Max = <strong className="text-amber-400">10 pts</strong></span>
        </div>

        {/* Matches */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <MatchCardSkeleton key={i} />)}
          </div>
        ) : matches.length === 0 ? (
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-8 text-center">
            <Target className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">
              {filter === 'upcoming' ? 'No matches in the next 24 hours' :
               filter === 'live' ? 'No live matches right now' :
               filter === 'recent' ? 'No recently finished matches' :
               'No matches found'}
            </p>
            <p className="text-slate-500 text-sm mt-1">Check back later</p>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                prediction={predByMatch[match.id]}
                onPredictionSubmit={
                  filter !== 'recent' ? handlePredictionSubmit : undefined
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
