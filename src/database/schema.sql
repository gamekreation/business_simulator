-- Database Schema for Business Empire V0.1
-- Create a game_saves table to hold anonymous player state

CREATE TABLE IF NOT EXISTS game_saves (
    id TEXT PRIMARY KEY, -- Can be a generated UUID saved in localStorage
    money NUMERIC NOT NULL DEFAULT 5000,
    resources JSONB NOT NULL DEFAULT '{"iron": 0, "coal": 0, "cotton": 0, "clothes": 0, "steel": 0}'::jsonb,
    buildings JSONB NOT NULL DEFAULT '[]'::jsonb,
    companies JSONB NOT NULL DEFAULT '[]'::jsonb,
    skills JSONB NOT NULL DEFAULT '{"production": 0, "marketing": 0, "finance": 0}'::jsonb,
    unlocked_land INTEGER NOT NULL DEFAULT 100, -- 100 acres (10x10)
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
