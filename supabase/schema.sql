-- ============================================================
-- THE JOURNAL | THANAL JSK
-- WORLD CUP 2026 PREDICTION COMPETITION
-- Complete Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 5 AND age <= 100),
  gender TEXT NOT NULL CHECK (gender IN ('Male', 'Female')),
  place TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  photo TEXT,
  total_points INTEGER DEFAULT 0,
  is_blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_match_id TEXT UNIQUE NOT NULL,
  team_a TEXT NOT NULL,
  team_b TEXT NOT NULL,
  team_a_flag TEXT DEFAULT '',
  team_b_flag TEXT DEFAULT '',
  match_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'SCHEDULED',
  team_a_score INTEGER,
  team_b_score INTEGER,
  winner_team TEXT,
  competition TEXT DEFAULT 'FIFA World Cup 2026',
  results_processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  predicted_team_a_score INTEGER NOT NULL CHECK (predicted_team_a_score >= 0),
  predicted_team_b_score INTEGER NOT NULL CHECK (predicted_team_b_score >= 0),
  points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

-- Daily Winners table
CREATE TABLE IF NOT EXISTS daily_winners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match_id ON predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_match_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_total_points ON users(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_daily_winners_date ON daily_winners(date DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Users: anyone can read, insert handled via API
CREATE POLICY "Users are publicly readable" ON users FOR SELECT USING (true);
CREATE POLICY "Users can be inserted via service role" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can be updated via service role" ON users FOR UPDATE USING (true);
CREATE POLICY "Users can be deleted via service role" ON users FOR DELETE USING (true);

-- Matches: public read
CREATE POLICY "Matches are publicly readable" ON matches FOR SELECT USING (true);
CREATE POLICY "Matches can be managed via service role" ON matches FOR ALL USING (true);

-- Predictions: public read (for admin), insert/update via API
CREATE POLICY "Predictions are publicly readable" ON predictions FOR SELECT USING (true);
CREATE POLICY "Predictions can be inserted via service role" ON predictions FOR INSERT WITH CHECK (true);
CREATE POLICY "Predictions can be updated via service role" ON predictions FOR UPDATE USING (true);
CREATE POLICY "Predictions can be deleted via service role" ON predictions FOR DELETE USING (true);

-- Daily winners: public read
CREATE POLICY "Daily winners are publicly readable" ON daily_winners FOR SELECT USING (true);
CREATE POLICY "Daily winners managed via service role" ON daily_winners FOR ALL USING (true);

-- Admins: no public access
CREATE POLICY "Admins not publicly accessible" ON admins FOR ALL USING (false);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Function to calculate and update points after match result
CREATE OR REPLACE FUNCTION update_prediction_points(p_match_id UUID)
RETURNS void AS $$
DECLARE
  v_match matches%ROWTYPE;
  v_prediction predictions%ROWTYPE;
  v_points INTEGER;
  v_winner_correct BOOLEAN;
  v_exact_score BOOLEAN;
  v_actual_winner TEXT;
  v_predicted_winner TEXT;
BEGIN
  -- Get match
  SELECT * INTO v_match FROM matches WHERE id = p_match_id;
  
  IF v_match.status != 'FINISHED' THEN
    RETURN;
  END IF;
  
  -- Loop through all predictions for this match
  FOR v_prediction IN SELECT * FROM predictions WHERE match_id = p_match_id AND points_awarded = 0 LOOP
    v_points := 0;
    
    -- Check exact score
    v_exact_score := (v_prediction.predicted_team_a_score = v_match.team_a_score AND 
                      v_prediction.predicted_team_b_score = v_match.team_b_score);
    
    IF v_exact_score THEN v_points := v_points + 5; END IF;
    
    -- Check winner
    IF v_match.team_a_score > v_match.team_b_score THEN v_actual_winner := 'A';
    ELSIF v_match.team_b_score > v_match.team_a_score THEN v_actual_winner := 'B';
    ELSE v_actual_winner := 'DRAW'; END IF;
    
    IF v_prediction.predicted_team_a_score > v_prediction.predicted_team_b_score THEN v_predicted_winner := 'A';
    ELSIF v_prediction.predicted_team_b_score > v_prediction.predicted_team_a_score THEN v_predicted_winner := 'B';
    ELSE v_predicted_winner := 'DRAW'; END IF;
    
    v_winner_correct := (v_actual_winner = v_predicted_winner);
    IF v_winner_correct THEN v_points := v_points + 5; END IF;
    
    -- Update prediction
    UPDATE predictions SET points_awarded = v_points WHERE id = v_prediction.id;
    
    -- Update user total points
    UPDATE users SET total_points = total_points + v_points WHERE id = v_prediction.user_id;
    
  END LOOP;
  
  -- Mark match as processed
  UPDATE matches SET results_processed = TRUE WHERE id = p_match_id;
  
END;
$$ LANGUAGE plpgsql;

-- Function to calculate daily winner
CREATE OR REPLACE FUNCTION calculate_daily_winner(target_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day')
RETURNS void AS $$
DECLARE
  v_best_user_id UUID;
  v_best_points INTEGER;
BEGIN
  -- Find user with most points from predictions made on target_date
  SELECT 
    p.user_id,
    SUM(p.points_awarded) as day_points
  INTO v_best_user_id, v_best_points
  FROM predictions p
  WHERE DATE(p.created_at AT TIME ZONE 'Asia/Dubai') = target_date
    AND p.points_awarded > 0
  GROUP BY p.user_id
  ORDER BY day_points DESC
  LIMIT 1;
  
  IF v_best_user_id IS NOT NULL THEN
    INSERT INTO daily_winners (date, user_id, points)
    VALUES (target_date, v_best_user_id, v_best_points)
    ON CONFLICT (date) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      points = EXCLUDED.points;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- SEED ADMIN
-- ============================================================
-- Password: admin123 (bcrypt hash - change in production!)
INSERT INTO admins (username, password_hash) 
VALUES ('admin', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewFpxVNqEkABKXby')
ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- SAMPLE MATCHES (for testing - will be replaced by API sync)
-- ============================================================
INSERT INTO matches (api_match_id, team_a, team_b, team_a_flag, team_b_flag, match_date, status, competition)
VALUES 
  ('test_001', 'Brazil', 'Germany', '🇧🇷', '🇩🇪', NOW() + INTERVAL '2 hours', 'SCHEDULED', 'FIFA World Cup 2026'),
  ('test_002', 'Argentina', 'France', '🇦🇷', '🇫🇷', NOW() + INTERVAL '5 hours', 'SCHEDULED', 'FIFA World Cup 2026'),
  ('test_003', 'Spain', 'Portugal', '🇪🇸', '🇵🇹', NOW() + INTERVAL '8 hours', 'SCHEDULED', 'FIFA World Cup 2026')
ON CONFLICT (api_match_id) DO NOTHING;
