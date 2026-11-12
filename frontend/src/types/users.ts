// Mirrors backend/models/users.py — keep in sync by hand.
export interface LoginRequest {
  username: string;
  pin: string;
}

export interface User {
  id: string;
  username: string;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  points: number;
  puzzles: number;
  correct: number;
  last_played: string;
}

export interface Leaderboard {
  entries: LeaderboardEntry[];
}
