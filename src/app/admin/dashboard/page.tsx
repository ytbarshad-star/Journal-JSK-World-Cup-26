'use client';
// src/app/admin/dashboard/page.tsx

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield, Users, Target, Calendar, Award, Crown, LogOut,
  Search, Ban, Trash2, RefreshCw, Edit3, CheckCircle, Loader2, X
} from 'lucide-react';
import { showToast } from '@/components/ui/Toast';
import { getInitials, formatDateTime, formatDate } from '@/lib/utils';

type Tab = 'users' | 'predictions' | 'matches' | 'winners';

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('users');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Verify admin session by hitting a protected endpoint
    fetch('/api/admin/users')
      .then((res) => {
        if (res.status === 401) router.replace('/admin/login');
        else setChecking(false);
      })
      .catch(() => router.replace('/admin/login'));
  }, []);

  async function handleLogout() {
    document.cookie = 'wc26_admin=; Max-Age=0; path=/;';
    router.push('/admin/login');
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  const TABS: { key: Tab; label: string; icon: any }[] = [
    { key: 'users', label: 'Users', icon: Users },
    { key: 'predictions', label: 'Predictions', icon: Target },
    { key: 'matches', label: 'Matches', icon: Calendar },
    { key: 'winners', label: 'Daily Winners', icon: Crown },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Admin Header */}
      <div className="bg-slate-900 border-b border-slate-700/50 sticky top-0 z-40">
        <div className="px-4 h-14 flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <span className="text-white font-bold text-sm">Admin Panel</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-slate-400 hover:text-red-400 text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-3 max-w-6xl mx-auto">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                tab === key ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-8 max-w-6xl mx-auto">
        {tab === 'users' && <UsersTab />}
        {tab === 'predictions' && <PredictionsTab />}
        {tab === 'matches' && <MatchesTab />}
        {tab === 'winners' && <WinnersTab />}
      </div>
    </div>
  );
}

// ============ USERS TAB ============
function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingPoints, setEditingPoints] = useState<string | null>(null);
  const [pointsValue, setPointsValue] = useState('');

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    setLoading(true);
    const res = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}`);
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }

  async function handleAction(id: string, action: string, points?: string) {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action, points }),
    });
    if (res.ok) {
      showToast('Updated successfully', 'success');
      loadUsers();
      setEditingPoints(null);
    } else {
      showToast('Action failed', 'error');
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      showToast('User deleted', 'success');
      loadUsers();
    } else {
      showToast('Delete failed', 'error');
    }
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
            placeholder="Search by name, phone, or place..."
            className="w-full bg-slate-800 border border-slate-600 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 outline-none text-sm"
          />
        </div>
        <button onClick={loadUsers} className="px-4 bg-slate-800 border border-slate-600 rounded-xl text-slate-300 hover:text-white">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50 text-slate-400 text-xs uppercase">
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Phone</th>
                <th className="text-left px-4 py-3">Place</th>
                <th className="text-right px-4 py-3">Points</th>
                <th className="text-center px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-500">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-500">No users found</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-700/30 hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white overflow-hidden flex-shrink-0">
                          {u.photo ? <img src={u.photo} alt="" className="w-full h-full object-cover" /> : getInitials(u.name)}
                        </div>
                        <span className="text-white font-medium">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{u.phone}</td>
                    <td className="px-4 py-3 text-slate-300">{u.place}</td>
                    <td className="px-4 py-3 text-right">
                      {editingPoints === u.id ? (
                        <div className="flex items-center gap-1 justify-end">
                          <input
                            type="number"
                            value={pointsValue}
                            onChange={(e) => setPointsValue(e.target.value)}
                            className="w-16 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-xs"
                            autoFocus
                          />
                          <button onClick={() => handleAction(u.id, 'edit_points', pointsValue)} className="text-green-400 hover:text-green-300">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingPoints(null)} className="text-slate-500 hover:text-white">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-amber-400 font-bold">{u.total_points}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {u.is_blocked ? (
                        <span className="bg-red-900/40 text-red-400 text-xs px-2 py-1 rounded-full">Blocked</span>
                      ) : (
                        <span className="bg-green-900/40 text-green-400 text-xs px-2 py-1 rounded-full">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          title="Edit points"
                          onClick={() => { setEditingPoints(u.id); setPointsValue(String(u.total_points)); }}
                          className="p-1.5 text-slate-400 hover:text-blue-400"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          title={u.is_blocked ? 'Unblock' : 'Block'}
                          onClick={() => handleAction(u.id, u.is_blocked ? 'unblock' : 'block')}
                          className="p-1.5 text-slate-400 hover:text-amber-400"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                        <button
                          title="Reset points"
                          onClick={() => { if (confirm('Reset points to 0?')) handleAction(u.id, 'reset_points'); }}
                          className="p-1.5 text-slate-400 hover:text-orange-400"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          title="Delete user"
                          onClick={() => handleDelete(u.id, u.name)}
                          className="p-1.5 text-slate-400 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============ PREDICTIONS TAB ============
function PredictionsTab() {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/predictions')
      .then((r) => r.json())
      .then((d) => { setPredictions(d.predictions || []); setLoading(false); });
  }, []);

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/50 text-slate-400 text-xs uppercase">
              <th className="text-left px-4 py-3">User</th>
              <th className="text-left px-4 py-3">Match</th>
              <th className="text-center px-4 py-3">Prediction</th>
              <th className="text-center px-4 py-3">Actual</th>
              <th className="text-right px-4 py-3">Points</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-slate-500">Loading...</td></tr>
            ) : predictions.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-slate-500">No predictions yet</td></tr>
            ) : (
              predictions.map((p) => (
                <tr key={p.id} className="border-b border-slate-700/30 hover:bg-slate-800/50">
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{p.user?.name}</p>
                    <p className="text-slate-500 text-xs">{p.user?.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {p.match?.team_a} vs {p.match?.team_b}
                    <p className="text-slate-500 text-xs">{p.match?.match_date && formatDateTime(p.match.match_date)}</p>
                  </td>
                  <td className="px-4 py-3 text-center text-white font-medium">
                    {p.predicted_team_a_score}–{p.predicted_team_b_score}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-300">
                    {p.match?.status === 'FINISHED' ? `${p.match.team_a_score}–${p.match.team_b_score}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p.points_awarded > 0 ? (
                      <span className="bg-amber-500 text-slate-900 text-xs font-bold px-2 py-1 rounded-lg">+{p.points_awarded}</span>
                    ) : (
                      <span className="text-slate-500 text-xs">0</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ MATCHES TAB ============
function MatchesTab() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  async function loadMatches() {
    setLoading(true);
    const res = await fetch('/api/admin/matches');
    const data = await res.json();
    setMatches(data.matches || []);
    setLoading(false);
  }

  useEffect(() => { loadMatches(); }, []);

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch('/api/admin/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync' }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Matches synced!', 'success');
        loadMatches();
      } else {
        showToast(data.error || 'Sync failed', 'error');
      }
    } catch {
      showToast('Sync failed', 'error');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Force Match Sync
        </button>
      </div>

      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50 text-slate-400 text-xs uppercase">
                <th className="text-left px-4 py-3">Match</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-center px-4 py-3">Status</th>
                <th className="text-center px-4 py-3">Score</th>
                <th className="text-left px-4 py-3">Winner</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">Loading...</td></tr>
              ) : matches.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">No matches synced yet</td></tr>
              ) : (
                matches.map((m) => (
                  <tr key={m.id} className="border-b border-slate-700/30 hover:bg-slate-800/50">
                    <td className="px-4 py-3 text-white font-medium">
                      {m.team_a_flag} {m.team_a} vs {m.team_b} {m.team_b_flag}
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-xs">{formatDateTime(m.match_date)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded-full">{m.status}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-white">
                      {m.team_a_score !== null ? `${m.team_a_score}–${m.team_b_score}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-amber-400 text-xs">{m.winner_team || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============ WINNERS TAB ============
function WinnersTab() {
  const [winners, setWinners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/winners')
      .then((r) => r.json())
      .then((d) => { setWinners(d.winners || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
      <div className="divide-y divide-slate-700/30">
        {loading ? (
          <p className="text-center py-8 text-slate-500">Loading...</p>
        ) : winners.length === 0 ? (
          <p className="text-center py-8 text-slate-500">No daily winners recorded yet</p>
        ) : (
          winners.map((w) => (
            <div key={w.id} className="flex items-center gap-3 px-4 py-3">
              <Crown className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                {w.user?.photo ? <img src={w.user.photo} alt="" className="w-full h-full object-cover" /> : getInitials(w.user?.name || '?')}
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">{w.user?.name}</p>
                <p className="text-slate-500 text-xs">{formatDate(w.date)} • {w.user?.place}</p>
              </div>
              <span className="text-amber-400 font-bold">{w.points} pts</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
