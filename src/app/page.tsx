'use client';
// src/app/page.tsx — Login Page

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trophy, Phone, Loader2, Star, MapPin, Crown } from 'lucide-react';
import { showToast } from '@/components/ui/Toast';
import { getInitials } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [dailyWinner, setDailyWinner] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then(({ user }) => {
        if (user) router.replace('/dashboard');
        else setCheckingSession(false);
      })
      .catch(() => setCheckingSession(false));

    Promise.all([
      fetch('/api/daily-winner').then((r) => r.json()),
      fetch('/api/leaderboard?preview=true').then((r) => r.json()),
    ]).then(([winnerData, lbData]) => {
      setDailyWinner(winnerData.winner);
      setLeaderboard(lbData.leaderboard || []);
    }).catch(() => {});
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) { showToast('Enter your phone number', 'error'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('Welcome back! 🏆', 'success');
      router.push('/dashboard');
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-transparent" />
        <div className="relative px-4 pt-12 pb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500 rounded-2xl shadow-xl mb-4">
            <Trophy className="w-8 h-8 text-slate-900" />
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">THE JOURNAL</h1>
          <p className="text-amber-400 text-sm font-bold tracking-widest uppercase mt-0.5">Thanal JSK</p>
          <div className="mt-2">
            <p className="text-slate-300 text-base font-semibold">World Cup Prediction</p>
            <p className="text-blue-400 font-black text-2xl">Competition 2026</p>
          </div>
        </div>
      </div>

      <div className="px-4 pb-8 max-w-md mx-auto space-y-5">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
          <h2 className="text-white font-bold text-lg mb-4">Sign In</h2>
          <form onSubmit={handleLogin} className="space-y-3">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
                className="w-full bg-slate-900 border border-slate-600 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 outline-none text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in...</> : 'Sign In →'}
            </button>
          </form>
          <div className="mt-3 pt-3 border-t border-slate-700/50 text-center">
            <p className="text-slate-400 text-sm">
              New user?{' '}
              <Link href="/register" className="text-amber-400 font-semibold hover:text-amber-300">
                Create Account
              </Link>
            </p>
          </div>
        </div>

        {dailyWinner?.user && (
          <div className="bg-gradient-to-r from-amber-900/30 to-amber-800/10 border border-amber-600/30 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-4 h-4 text-amber-400" />
              <h3 className="text-amber-400 font-bold text-sm uppercase tracking-wide">Yesterday's Champion</h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-lg font-bold text-amber-300 overflow-hidden">
                {dailyWinner.user.photo ? (
                  <img src={dailyWinner.user.photo} alt="" className="w-full h-full object-cover" />
                ) : getInitials(dailyWinner.user.name)}
              </div>
              <div className="flex-1">
                <p className="text-white font-bold">{dailyWinner.user.name}</p>
                <p className="text-slate-400 text-xs flex items-center gap-1">
                  <MapPin className="w-3 h-3" />{dailyWinner.user.place}
                </p>
              </div>
              <div className="text-right">
                <p className="text-amber-400 font-black text-xl">{dailyWinner.points}</p>
                <p className="text-slate-500 text-xs">pts today</p>
              </div>
            </div>
          </div>
        )}

        {leaderboard.length > 0 && (
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" />
                <h3 className="text-white font-bold text-sm">Leaderboard</h3>
              </div>
              <Link href="/leaderboard" className="text-blue-400 text-xs hover:text-blue-300">View all</Link>
            </div>
            <div className="divide-y divide-slate-700/30">
              {leaderboard.slice(0, 5).map((entry: any, idx: number) => (
                <div key={entry.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${idx === 0 ? 'rank-gold text-slate-900' : idx === 1 ? 'rank-silver text-slate-900' : idx === 2 ? 'rank-bronze text-white' : 'bg-slate-700 text-slate-300'}`}>
                    {idx + 1}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center text-xs font-bold text-blue-300 overflow-hidden">
                    {entry.photo ? <img src={entry.photo} alt="" className="w-full h-full object-cover" /> : getInitials(entry.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{entry.name}</p>
                    <p className="text-slate-500 text-xs truncate">{entry.place}</p>
                  </div>
                  <span className="text-amber-400 font-black text-sm">{entry.total_points}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
