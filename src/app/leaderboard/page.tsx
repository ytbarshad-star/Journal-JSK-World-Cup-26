'use client';
// src/app/leaderboard/page.tsx

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { LeaderboardRowSkeleton } from '@/components/ui/Skeleton';
import { Medal, MapPin, RefreshCw, Loader2, Trophy } from 'lucide-react';
import { getInitials } from '@/lib/utils';

export default function LeaderboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then(({ user: u }) => {
        if (!u) router.replace('/');
        else { setUser(u); loadLeaderboard(); }
      });
  }, []);

  async function loadLeaderboard() {
    setRefreshing(true);
    const res = await fetch('/api/leaderboard?limit=100');
    const data = await res.json();
    setLeaderboard(data.leaderboard || []);
    setLoading(false);
    setRefreshing(false);
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  const myRank = leaderboard.findIndex((e) => e.id === user.id) + 1;

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar user={user} />

      <div className="pt-14 pb-20 md:pb-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="px-4 mt-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Medal className="w-5 h-5 text-amber-400" />
            <h1 className="text-white font-black text-xl">Leaderboard</h1>
          </div>
          <button
            onClick={loadLeaderboard}
            disabled={refreshing}
            className="p-2 text-slate-400 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Your rank banner */}
        {myRank > 0 && (
          <div className="mx-4 mb-4 bg-blue-900/30 border border-blue-700/30 rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-blue-400" />
              <span className="text-blue-300 text-sm">Your rank</span>
            </div>
            <span className="text-white font-black text-lg">#{myRank}</span>
          </div>
        )}

        {/* Top 3 podium */}
        {!loading && leaderboard.length >= 3 && (
          <div className="px-4 mb-5">
            <div className="flex items-end justify-center gap-3">
              {/* 2nd */}
              <div className="flex-1 flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-slate-600 flex items-center justify-center text-sm font-black text-white overflow-hidden mb-2">
                  {leaderboard[1].photo ? (
                    <img src={leaderboard[1].photo} alt="" className="w-full h-full object-cover" />
                  ) : getInitials(leaderboard[1].name)}
                </div>
                <div className="rank-silver w-full rounded-t-xl py-3 text-center">
                  <p className="text-slate-800 font-black text-sm">🥈</p>
                  <p className="text-slate-800 font-bold text-xs truncate px-1">{leaderboard[1].name.split(' ')[0]}</p>
                  <p className="text-slate-700 font-black text-sm">{leaderboard[1].total_points}</p>
                </div>
              </div>
              {/* 1st */}
              <div className="flex-1 flex flex-col items-center">
                <div className="w-14 h-14 rounded-xl border-2 border-amber-400 flex items-center justify-center text-sm font-black text-white overflow-hidden mb-2">
                  {leaderboard[0].photo ? (
                    <img src={leaderboard[0].photo} alt="" className="w-full h-full object-cover" />
                  ) : getInitials(leaderboard[0].name)}
                </div>
                <div className="rank-gold w-full rounded-t-xl py-4 text-center">
                  <p className="text-slate-800 font-black text-base">🥇</p>
                  <p className="text-slate-800 font-bold text-xs truncate px-1">{leaderboard[0].name.split(' ')[0]}</p>
                  <p className="text-slate-700 font-black text-base">{leaderboard[0].total_points}</p>
                </div>
              </div>
              {/* 3rd */}
              <div className="flex-1 flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-amber-800 flex items-center justify-center text-sm font-black text-white overflow-hidden mb-2">
                  {leaderboard[2].photo ? (
                    <img src={leaderboard[2].photo} alt="" className="w-full h-full object-cover" />
                  ) : getInitials(leaderboard[2].name)}
                </div>
                <div className="rank-bronze w-full rounded-t-xl py-2.5 text-center">
                  <p className="text-white font-black text-sm">🥉</p>
                  <p className="text-amber-100 font-bold text-xs truncate px-1">{leaderboard[2].name.split(' ')[0]}</p>
                  <p className="text-white font-black text-sm">{leaderboard[2].total_points}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full list */}
        <div className="mx-4 bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_auto] gap-0 divide-y divide-slate-700/30">
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => <LeaderboardRowSkeleton key={i} />)
            ) : leaderboard.length === 0 ? (
              <div className="col-span-3 py-8 text-center text-slate-500">No participants yet</div>
            ) : (
              leaderboard.map((entry, idx) => (
                <div
                  key={entry.id}
                  className={`col-span-3 flex items-center gap-3 px-4 py-3 leaderboard-row ${entry.id === user.id ? 'bg-blue-900/20' : ''}`}
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  {/* Rank */}
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${
                    idx === 0 ? 'rank-gold text-slate-900' :
                    idx === 1 ? 'rank-silver text-slate-900' :
                    idx === 2 ? 'rank-bronze text-white' :
                    entry.id === user.id ? 'bg-blue-600 text-white' :
                    'bg-slate-700 text-slate-300'
                  }`}>
                    {idx + 1}
                  </div>
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800">
                    {entry.photo ? (
                      <img src={entry.photo} alt="" className="w-full h-full object-cover" />
                    ) : getInitials(entry.name)}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm truncate ${entry.id === user.id ? 'text-blue-300' : 'text-white'}`}>
                      {entry.name} {entry.id === user.id && <span className="text-blue-400 text-xs">(You)</span>}
                    </p>
                    <p className="text-slate-500 text-xs flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      {entry.place}
                    </p>
                  </div>
                  {/* Points */}
                  <div className={`font-black text-base flex-shrink-0 ${
                    idx === 0 ? 'text-amber-400' :
                    idx === 1 ? 'text-slate-300' :
                    idx === 2 ? 'text-amber-700' :
                    'text-white'
                  }`}>
                    {entry.total_points}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
