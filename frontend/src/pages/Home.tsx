import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, CheckCheck, Eraser, RefreshCw } from "lucide-react";
import { apiGet } from "@/lib/api";
import type { Element, Puzzle, Quantity } from "@/types/puzzle";
import { SAMPLE_PUZZLE } from "@/lib/samplePuzzle";
import { TOLERANCE, cellKey, checkAnswers } from "@/lib/circuit";
import type { Answers, Results } from "@/lib/circuit";
import { Button } from "@/components/ui/button";
import Schematic from "@/components/circuit/Schematic";
import AnswerTable from "@/components/circuit/AnswerTable";
import WorkedSolution from "@/components/circuit/WorkedSolution";

export default function Home() {
  const qc = useQueryClient();
  const { data, isError, isFetching } = useQuery({
    queryKey: ["puzzle"],
    queryFn: () => apiGet<Puzzle>("/puzzles/new"),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: 1,
  });
  // Fall back to a bundled sample so the worksheet still works without a backend.
  const puzzle = isError || !data ? SAMPLE_PUZZLE : data;
  const loading = isFetching && !data;

  const [answers, setAnswers] = useState<Answers>({});
  const [results, setResults] = useState<Results | null>(null);
  const [revealed, setRevealed] = useState(false);

  const resetWork = () => {
    setAnswers({});
    setResults(null);
    setRevealed(false);
  };

  const newPuzzle = async () => {
    resetWork();
    await qc.refetchQueries({ queryKey: ["puzzle"] });
  };

  const onChange = (q: Quantity, el: Element, value: string) => {
    setAnswers((a) => ({ ...a, [cellKey(q, el)]: value }));
    setResults((r) => {
      if (!r) return r;
      const next = { ...r };
      delete next[cellKey(q, el)];
      return next;
    });
  };

  const statuses = results ? Object.values(results) : [];
  const correct = statuses.filter((s) => s === "correct").length;

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <article className="rounded-sm border border-[#CBD5E1] bg-white font-serif text-[#1a1a1a] shadow-[0_1px_0_#CBD5E1,0_12px_32px_-16px_rgba(15,23,42,0.18)]">
          <h1 className="sr-only" data-testid="app-title">Combination Circuit Practice</h1>

          <div className="space-y-6 px-5 py-6 sm:px-10 sm:py-8">
            <p className="text-base sm:pl-4" data-testid="instructions">
              <span className="mr-4">1.</span>Solve for the missing values:
            </p>

            {/* Schematic */}
            <figure className={loading ? "opacity-40 transition-opacity duration-200" : "transition-opacity duration-200"}>
              <Schematic given={puzzle.given} />
            </figure>

            {/* Answer table */}
            <AnswerTable puzzle={puzzle} answers={answers} results={results} revealed={revealed} onChange={onChange} />

            {/* Actions */}
            <div className="flex flex-col gap-3 border-t border-[#E2E8F0] pt-5 font-sans sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <Button
                  size="lg"
                  className="h-11 bg-[#1E3A8A] px-5 text-white transition-[background-color,transform] duration-150 hover:bg-[#1D4ED8] active:scale-[0.98]"
                  onClick={() => setResults(checkAnswers(puzzle, answers))}
                  data-testid="btn-check-answers"
                >
                  <CheckCheck /> Check Answers
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-11 border-[#0F172A] px-5 transition-[background-color,transform] duration-150 active:scale-[0.98]"
                  onClick={() => setRevealed((r) => !r)}
                  data-testid="btn-reveal-solution"
                >
                  <BookOpen /> {revealed ? "Hide Solution" : "Reveal Solution"}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="lg"
                  variant="ghost"
                  className="h-11 transition-[background-color,transform] duration-150 active:scale-[0.98]"
                  onClick={resetWork}
                  data-testid="btn-clear-inputs"
                >
                  <Eraser /> Clear
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-11 border border-[#CBD5E1] transition-[background-color,transform] duration-150 active:scale-[0.98]"
                  onClick={newPuzzle}
                  disabled={isFetching}
                  data-testid="btn-new-puzzle"
                >
                  <RefreshCw className={isFetching ? "animate-spin" : undefined} /> New Puzzle
                </Button>
              </div>
            </div>

            {results && (
              <div
                className={
                  "animate-in fade-in rounded-sm border px-4 py-3 font-sans text-sm duration-200 " +
                  (correct === statuses.length
                    ? "border-[#86EFAC] bg-[#F0FDF4] text-[#14532D]"
                    : "border-[#FECACA] bg-[#FEF2F2] text-[#7F1D1D]")
                }
                data-testid="validation-summary-badge"
              >
                <span className="font-semibold">
                  {correct} / {statuses.length} correct (±{TOLERANCE * 100}%)
                </span>
                {correct === statuses.length
                  ? " — excellent, every value checks out."
                  : " — cells marked ✕ are wrong or blank. Fix them and check again, or reveal the solution."}
              </div>
            )}

            {revealed && <WorkedSolution steps={puzzle.steps} />}
          </div>
        </article>
        {isError && (
          <p className="mt-3 text-center text-xs text-[#475569]" data-testid="offline-note">
            Offline — showing a sample problem.
          </p>
        )}
      </div>
    </main>
  );
}
