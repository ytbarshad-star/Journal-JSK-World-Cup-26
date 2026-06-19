'use client';
// src/app/dashboard/page.tsx

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import MatchCard from '@/components/ui/MatchCard';
import { StatCardSkeleton, MatchCardSkeleton } from '@/components/ui/Skeleton';
import { Target, Trophy, CheckCircle, TrendingUp, ChevronRight, Loader2 } from 'lucide-react';
import { getInitials, formatDateTime, getRankSuffix } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Check auth
      const sessionRes = await fetch('/api/auth/session');
      const { user: sessionUser } = await sessionRes.json();
      if (!sessionUser) { router.replace('/'); return; }
      setUser(sessionUser);

      // Load all data in parallel
      const [statsRes, predsRes, matchesRes] = await Promise.all([
        fetch('/api/users/stats'),
        fetch('/api/predictions'),
        fetch('/api/matches?filter=upcoming24h'),
      ]);

      const [statsData, predsData, matchesData] = await Promise.all([
        statsRes.json(),
        predsRes.json(),
        matchesRes.json(),
      ]);

      setStats(statsData.stats);
      setPredictions(predsData.predictions || []);
      setUpcomingMatches(matchesData.matches || []);
      setLoading(false);
    }
    load();
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  // Map predictions by match id
  const predByMatch: Record<string, any> = {};
  predictions.forEach((p) => { if (p.match_id) predByMatch[p.match_id] = p; });

  const recentPredictions = predictions.slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar user={user} />

      <div className="pt-14 pb-20 md:pb-8 px-4 max-w-2xl mx-auto">
        {/* Profile Header */}
        <div className="mt-4 mb-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-lg font-black text-white overflow-hidden flex-shrink-0">
            {user.photo ? (
              <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
            ) : getInitials(user.name)}
          </div>
          <div>
            <h1 className="text-white font-black text-xl leading-tight">{user.name}</h1>
            <p className="text-slate-400 text-sm">{user.place}</p>
          </div>
          {stats && (
            <div className="ml-auto text-right">
              <p className="text-amber-400 font-black text-2xl">{stats.total_points}</p>
              <p className="text-slate-500 text-xs">total pts</p>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {loading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : stats ? (
            <>
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span className="text-slate-400 text-xs">Your Rank</span>
                </div>
                <p className="text-white font-black text-2xl">{getRankSuffix(stats.rank)}</p>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span className="text-slate-400 text-xs">Total Points</span>
                </div>
                <p className="text-amber-400 font-black text-2xl">{stats.total_points}</p>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400 text-xs">Predictions</span>
                </div>
                <p className="text-white font-black text-2xl">{stats.total_predictions}</p>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400 text-xs">Correct</span>
                </div>
                <p className="text-green-400 font-black text-2xl">{stats.correct_predictions}</p>
              </div>
            </>
          ) : null}
        </div>

        {/* Upcoming Predictions */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-bold text-base">Upcoming Matches</h2>
            <Link href="/predictions" className="text-blue-400 text-sm flex items-center gap-1 hover:text-blue-300">
              Predict <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <MatchCardSkeleton />
          ) : upcomingMatches.length === 0 ? (
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-6 text-center">
              <p className="text-slate-400 text-sm">No matches in the next 24 hours</p>
              <Link href="/predictions" className="text-blue-400 text-sm mt-1 block hover:text-blue-300">
                View all matches →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingMatches.slice(0, 2).map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  prediction={predByMatch[match.id]}
                />
              ))}
            </div>
          )}
        </div>

        {/* Recent Predictions */}
        {recentPredictions.length > 0 && (
          <div>
            <h2 className="text-white font-bold text-base mb-3">Recent Predictions</h2>
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
              {recentPredictions.map((pred, idx) => (
                <div
                  key={pred.id}
                  className={`flex items-center gap-3 px-4 py-3 ${idx < recentPredictions.length - 1 ? 'border-b border-slate-700/30' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {pred.match?.team_a} vs {pred.match?.team_b}
                    </p>
                    <p className="text-slate-500 text-xs">
                      Your: {pred.predicted_team_a_score}–{pred.predicted_team_b_score}
                      {pred.match?.status === 'FINISHED' && pred.match.team_a_score !== null && (
                        <span className="ml-1 text-slate-400">
                          | Final: {pred.match.team_a_score}–{pred.match.team_b_score}
                        </span>
                      )}
                    </p>
                  </div>
                  {pred.points_awarded > 0 ? (
                    <span className="bg-amber-500 text-slate-900 text-xs font-bold px-2 py-1 rounded-lg">
                      +{pred.points_awarded}
                    </span>
                  ) : pred.match?.status === 'FINISHED' ? (
                    <span className="text-slate-500 text-xs">0 pts</span>
                  ) : (
                    <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded-lg">Pending</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
