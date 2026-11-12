import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { apiGet } from "@/lib/api";
import type { Leaderboard } from "@/types/users";
import { cn } from "@/lib/utils";

export default function LeaderboardCard({ me }: { me?: string }) {
  const { data, isError, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => apiGet<Leaderboard>("/leaderboard?limit=25"),
    refetchInterval: 30_000,
  });
  const entries = isError ? [] : (data?.entries ?? []);
  return (
    <section
      className="rounded-sm border border-[#CBD5E1] bg-white p-4 font-sans shadow-[0_1px_0_#CBD5E1,0_12px_32px_-16px_rgba(15,23,42,0.18)]"
      data-testid="leaderboard-card"
    >
      <h2 className="mb-1 flex items-center gap-2 font-serif text-base font-bold text-[#1a1a1a]">
        <Trophy className="size-4 text-[#B45309]" /> Leaderboard
      </h2>
      <p className="mb-3 text-xs text-[#475569]">
        10 pts per correct box on your first check — full points under 2 min, dropping to 0 at 15 min. Revealing the solution scores 0.
      </p>
      {isLoading ? (
        <p className="text-sm text-[#475569]">Loading…</p>
      ) : isError ? (
        <p className="text-sm text-[#475569]" data-testid="leaderboard-unavailable">Leaderboard unavailable right now.</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-[#475569]" data-testid="leaderboard-empty">No scores yet — be the first!</p>
      ) : (
        <ol className="max-h-80 space-y-1 overflow-y-auto pr-1" data-testid="leaderboard-list">
          {entries.map((e) => (
            <li
              key={e.username}
              className={cn(
                "flex items-center gap-3 rounded-sm px-2 py-1.5 text-sm",
                me && e.username === me ? "bg-[#EFF6FF] ring-1 ring-[#BFDBFE]" : e.rank % 2 === 0 && "bg-[#F8FAFC]",
              )}
              data-testid={`leaderboard-row-${e.rank}`}
            >
              <span className={cn("w-6 text-right font-mono font-semibold", e.rank <= 3 ? "text-[#B45309]" : "text-[#475569]")}>{e.rank}</span>
              <span className="min-w-0 flex-1 truncate font-medium text-[#0F172A]" data-testid={`leaderboard-name-${e.rank}`}>{e.username}</span>
              <span className="text-xs text-[#64748B]">{e.puzzles} puz</span>
              <span className="w-14 text-right font-mono font-semibold tabular-nums text-[#0F172A]" data-testid={`leaderboard-points-${e.rank}`}>{e.points}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
