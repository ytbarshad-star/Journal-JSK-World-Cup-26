'use client';
// src/components/ui/MatchCard.tsx

import { useState } from 'react';
import { Lock, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { Match, Prediction } from '@/types';
import { cn, formatDate, formatTime, getStatusBadge, isMatchLocked } from '@/lib/utils';
import { showToast } from './Toast';

interface MatchCardProps {
  match: Match;
  prediction?: Prediction;
  onPredictionSubmit?: (matchId: string, scoreA: number, scoreB: number) => Promise<void>;
}

export default function MatchCard({ match, prediction, onPredictionSubmit }: MatchCardProps) {
  const [scoreA, setScoreA] = useState<string>(prediction ? String(prediction.predicted_team_a_score) : '');
  const [scoreB, setScoreB] = useState<string>(prediction ? String(prediction.predicted_team_b_score) : '');
  const [submitting, setSubmitting] = useState(false);
  const locked = isMatchLocked(match.match_date) || !['SCHEDULED', 'TIMED'].includes(match.status);
  const statusBadge = getStatusBadge(match.status);

  async function handleSubmit() {
    if (!onPredictionSubmit) return;
    const a = parseInt(scoreA);
    const b = parseInt(scoreB);
    if (isNaN(a) || isNaN(b) || a < 0 || b < 0) {
      showToast('Enter valid scores', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await onPredictionSubmit(match.id, a, b);
      showToast('Prediction saved! 🎯', 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to save', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={cn(
      'bg-slate-800/60 border rounded-2xl overflow-hidden transition-all',
      locked ? 'border-slate-700/50' : 'border-blue-700/30 hover:border-blue-600/50'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/50">
        <span className="text-slate-400 text-xs">{match.competition || 'FIFA World Cup 2026'}</span>
        <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full text-white', statusBadge.color)}>
          {statusBadge.label}
        </span>
      </div>

      {/* Teams */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Team A */}
          <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-3xl">{match.team_a_flag || '🏳️'}</span>
            <span className="text-white font-semibold text-sm text-center leading-tight">{match.team_a}</span>
          </div>

          {/* Score / VS */}
          <div className="flex flex-col items-center gap-1 min-w-[80px]">
            {match.status === 'FINISHED' && match.team_a_score !== null ? (
              <div className="flex items-center gap-2">
                <span className="text-white font-black text-2xl">{match.team_a_score}</span>
                <span className="text-slate-400 text-lg">–</span>
                <span className="text-white font-black text-2xl">{match.team_b_score}</span>
              </div>
            ) : match.status === 'IN_PLAY' || match.status === 'LIVE' || match.status === 'PAUSED' ? (
              <div className="flex items-center gap-2">
                <span className="text-white font-black text-2xl">{match.team_a_score ?? 0}</span>
                <span className="text-red-400 text-lg animate-pulse">●</span>
                <span className="text-white font-black text-2xl">{match.team_b_score ?? 0}</span>
              </div>
            ) : (
              <span className="text-slate-400 font-bold text-xl">VS</span>
            )}
            <div className="flex items-center gap-1 text-slate-500 text-xs">
              <Clock className="w-3 h-3" />
              {formatTime(match.match_date)}
            </div>
            <span className="text-slate-500 text-xs">{formatDate(match.match_date)}</span>
          </div>

          {/* Team B */}
          <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-3xl">{match.team_b_flag || '🏳️'}</span>
            <span className="text-white font-semibold text-sm text-center leading-tight">{match.team_b}</span>
          </div>
        </div>

        {/* Winner display */}
        {match.status === 'FINISHED' && match.winner_team && (
          <div className="mt-3 text-center">
            <span className="text-amber-400 text-sm font-medium">
              {match.winner_team === 'Draw' ? '🤝 Draw' : `🏆 Winner: ${match.winner_team}`}
            </span>
          </div>
        )}
      </div>

      {/* Prediction section */}
      {onPredictionSubmit && (
        <div className="px-4 pb-4 border-t border-slate-700/50 pt-3">
          {prediction ? (
            <div className="flex items-center justify-between bg-green-900/20 border border-green-700/30 rounded-xl px-4 py-2.5">
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>Your prediction:</span>
                <span className="font-bold text-white">
                  {prediction.predicted_team_a_score} – {prediction.predicted_team_b_score}
                </span>
              </div>
              {prediction.points_awarded > 0 && (
                <span className="bg-amber-500 text-slate-900 text-xs font-bold px-2 py-1 rounded-lg">
                  +{prediction.points_awarded}pts
                </span>
              )}
            </div>
          ) : locked ? (
            <div className="flex items-center justify-center gap-2 text-slate-500 text-sm py-1">
              <Lock className="w-4 h-4" />
              <span>Predictions locked</span>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-slate-400 text-xs text-center">Enter your prediction</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-slate-400 text-xs truncate w-full text-center">{match.team_a}</span>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={scoreA}
                    onChange={(e) => setScoreA(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-xl text-center text-white text-xl font-bold py-2 focus:border-blue-500 outline-none"
                    placeholder="0"
                  />
                </div>
                <span className="text-slate-500 font-bold text-lg">–</span>
                <div className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-slate-400 text-xs truncate w-full text-center">{match.team_b}</span>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={scoreB}
                    onChange={(e) => setScoreB(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-xl text-center text-white text-xl font-bold py-2 focus:border-blue-500 outline-none"
                    placeholder="0"
                  />
                </div>
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  'Submit Prediction'
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
