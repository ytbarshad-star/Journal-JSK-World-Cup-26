// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Dubai',
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Dubai',
  });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function isMatchLocked(matchDate: string): boolean {
  return new Date() >= new Date(matchDate);
}

export function getStatusBadge(status: string): { label: string; color: string } {
  switch (status) {
    case 'IN_PLAY':
    case 'LIVE':
      return { label: 'LIVE', color: 'bg-red-500' };
    case 'PAUSED':
      return { label: 'HT', color: 'bg-yellow-500' };
    case 'FINISHED':
      return { label: 'FT', color: 'bg-gray-500' };
    case 'SCHEDULED':
      return { label: 'Upcoming', color: 'bg-blue-500' };
    case 'POSTPONED':
      return { label: 'Postponed', color: 'bg-orange-500' };
    default:
      return { label: status, color: 'bg-gray-400' };
  }
}

export function getRankSuffix(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}
