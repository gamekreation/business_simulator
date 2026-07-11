import { GameState } from "../database/supabaseClient";

export type SimulationPresetMode = "debug" | "fast_testing" | "development" | "beta_testing" | "release";

export interface TimePreset {
  mode: SimulationPresetMode;
  name: string;
  secondsPerGameDay: number;
}

export const TIME_PRESETS: Record<SimulationPresetMode, TimePreset> = {
  debug: { mode: "debug", name: "Debug (10s/day)", secondsPerGameDay: 10 },
  fast_testing: { mode: "fast_testing", name: "Fast Testing (30s/day)", secondsPerGameDay: 30 },
  development: { mode: "development", name: "Development (1m/day)", secondsPerGameDay: 60 },
  beta_testing: { mode: "beta_testing", name: "Beta Testing (2m/day)", secondsPerGameDay: 120 },
  release: { mode: "release", name: "Release (5m 20s/day)", secondsPerGameDay: 320 },
};

export const DAYS_PER_MONTH = 30;
export const MONTHS_PER_YEAR = 12;

export function getSecondsPerGameDay(state: GameState): number {
  const mode = state.timePresetMode || "development";
  return TIME_PRESETS[mode]?.secondsPerGameDay || 60;
}
