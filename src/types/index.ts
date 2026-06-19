// src/types/index.ts

export interface User {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female';
  place: string;
  phone: string;
  photo?: string;
  total_points: number;
  is_blocked?: boolean;
  created_at: string;
}

export interface Match {
  id: string;
  api_match_id: string;
  team_a: string;
  team_b: string;
  team_a_flag: string;
  team_b_flag: string;
  match_date: string;
  status: 'SCHEDULED' | 'LIVE' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'POSTPONED' | 'CANCELLED';
  team_a_score: number | null;
  team_b_score: number | null;
  winner_team: string | null;
  competition?: string;
  created_at: string;
}

export interface Prediction {
  id: string;
  user_id: string;
  match_id: string;
  predicted_team_a_score: number;
  predicted_team_b_score: number;
  points_awarded: number;
  created_at: string;
  match?: Match;
  user?: User;
}

export interface DailyWinner {
  id: string;
  date: string;
  user_id: string;
  points: number;
  user?: User;
}

export interface Admin {
  id: string;
  username: string;
  password_hash: string;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  place: string;
  photo?: string;
  total_points: number;
}

export interface DashboardStats {
  rank: number;
  total_points: number;
  total_predictions: number;
  correct_predictions: number;
}
