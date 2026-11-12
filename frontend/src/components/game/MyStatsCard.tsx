import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { loadStats, resetStats } from "@/lib/myStats";
import { formatClock } from "@/lib/circuit";
import { Button } from "@/components/ui/button";

/** GitHub Pages build: personal points instead of the shared leaderboard. */
export default function MyStatsCard() {
  const qc = useQueryClient();
  const { data: s = loadStats() } = useQuery({ queryKey: ["my-stats"], queryFn: async () => loadStats() });
  const items: [string, string, string][] = [
    ["Total points", String(s.points), "my-stats-points"],
    ["Puzzles scored", String(s.puzzles), "my-stats-puzzles"],
    ["Best puzzle", `${s.best} pts`, "my-stats-best"],
    ["Fastest perfect", s.fastestPerfect != null ? formatClock(s.fastestPerfect) : "—", "my-stats-fastest"],
  ];
  return (
    <section
      className="rounded-sm border border-[#CBD5E1] bg-white p-4 font-sans shadow-[0_1px_0_#CBD5E1,0_12px_32px_-16px_rgba(15,23,42,0.18)]"
      data-testid="my-stats-card"
    >
      <h2 className="mb-1 flex items-center gap-2 font-serif text-base font-bold text-[#1a1a1a]">
        <Trophy className="size-4 text-[#B45309]" /> My Points
      </h2>
      <p className="mb-3 text-xs text-[#475569]">
        10 pts per correct box on your first check — full points under 2 min, dropping to 0 at 15 min. Revealing the solution scores 0. Saved on this device.
      </p>
      <dl className="grid grid-cols-2 gap-2">
        {items.map(([label, value, id]) => (
          <div key={id} className="rounded-sm bg-[#F8FAFC] px-3 py-2">
            <dt className="text-xs text-[#475569]">{label}</dt>
            <dd className="font-mono text-lg font-semibold tabular-nums text-[#0F172A]" data-testid={id}>{value}</dd>
          </div>
        ))}
      </dl>
      {s.puzzles > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 text-xs text-[#475569]"
          onClick={() => {
            resetStats();
            qc.invalidateQueries({ queryKey: ["my-stats"] });
          }}
          data-testid="my-stats-reset-button"
        >
          Reset my points
        </Button>
      )}
    </section>
  );
}
