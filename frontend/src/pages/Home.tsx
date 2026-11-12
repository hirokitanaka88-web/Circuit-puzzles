import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, CheckCheck, Eraser, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ApiError, apiGet } from "@/lib/api";
import { STATIC_MODE, checkPuzzle, newPuzzle, revealPuzzle } from "@/lib/puzzleService";
import type { CheckRequest, Element, Puzzle, Quantity, Reveal, ScoreResult } from "@/types/puzzle";
import type { User } from "@/types/users";
import { SAMPLE_PUZZLE, SAMPLE_REVEAL } from "@/lib/samplePuzzle";
import { ELEMENTS, POINTS_PER_BOX, QUANTITIES, TOLERANCE, cellKey, checkAnswersLocally, formatClock, isGiven, timeFactor } from "@/lib/circuit";
import type { Answers, Results } from "@/lib/circuit";
import { loadWorksheet, saveWorksheet } from "@/lib/worksheetStorage";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Schematic from "@/components/circuit/Schematic";
import AnswerTable from "@/components/circuit/AnswerTable";
import WorkedSolution from "@/components/circuit/WorkedSolution";
import FormulaWheelPanel from "@/components/circuit/FormulaWheel";
import PlayerBar from "@/components/game/PlayerBar";
import LeaderboardCard from "@/components/game/LeaderboardCard";
import MyStatsCard from "@/components/game/MyStatsCard";


const isLocked = (s: ScoreResult | null) => s?.status === "awarded" || s?.status === "already_locked";

function scoreMessage(s: ScoreResult): string {
  switch (s.status) {
    case "awarded":
      return `+${s.points} points added to ${STATIC_MODE ? "your total" : "the leaderboard"} (checked at ${formatClock(s.elapsed_seconds)}).`;
    case "already_locked":
      return `Score locked at ${s.points} points on your first check — fixing answers now is practice only.`;
    case "revealed":
      return "The solution was revealed, so this puzzle doesn't score points.";
    case "not_signed_in":
      return "Sign in with a username above to earn points for this puzzle.";
  }
}

export default function Home() {
  const qc = useQueryClient();
  // The current puzzle and the learner's work are restored from this device's storage,
  // so leaving the tab, reloading or locking the phone never loses them.
  const [saved] = useState(loadWorksheet);
  const [current, setCurrent] = useState<Puzzle | null>(saved?.puzzle ?? null);
  const [answers, setAnswers] = useState<Answers>(saved?.answers ?? {});
  const [results, setResults] = useState<Results | null>(saved?.results ?? null);
  const [score, setScore] = useState<ScoreResult | null>(saved?.score ?? null);
  const [reveal, setReveal] = useState<Reveal | null>(saved?.reveal ?? null);
  const [showSolution, setShowSolution] = useState(saved?.showSolution ?? false);
  const [confirmReveal, setConfirmReveal] = useState(false);
  const [confirmCheck, setConfirmCheck] = useState(false);
  const [blankCount, setBlankCount] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => apiGet<User | null>("/auth/me"),
    staleTime: 5 * 60_000,
    retry: false,
    enabled: !STATIC_MODE, // GitHub Pages build has no accounts
  });
  const user = me.isError || STATIC_MODE ? null : me.data;

  // Only fetch a first puzzle when nothing was saved.
  const first = useQuery({
    queryKey: ["puzzle", "first"],
    queryFn: () => newPuzzle(),
    enabled: current === null,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: 1,
  });
  useEffect(() => {
    if (current === null && first.data) setCurrent(first.data); // pin it so cache clears never swap it
  }, [current, first.data]);

  // Fall back to a bundled sample so the worksheet still works without a backend.
  const puzzle = current ?? first.data ?? SAMPLE_PUZZLE;
  const isSample = puzzle.id === SAMPLE_PUZZLE.id;
  const isError = current === null && first.isError;
  const loading = current === null && first.isFetching;

  const resetWork = () => {
    setAnswers({});
    setResults(null);
    setShowSolution(false);
  };

  // New Puzzle always switches to a different circuit design than the one on screen.
  const next = useMutation({
    mutationFn: () => newPuzzle(puzzle.topology),
    onSuccess: (p) => {
      setCurrent(p);
      resetWork();
      setScore(null);
      setReveal(null);
    },
    onError: () => toast.error("Couldn't load a new puzzle. Check your connection and try again."),
  });

  const check = useMutation({
    mutationFn: (body: CheckRequest) => checkPuzzle(puzzle.id, body),
    onSuccess: (r) => {
      setResults(r.results);
      setScore(r.score);
      if (r.score.status === "awarded") {
        toast.success(`+${r.score.points} points!`);
        qc.invalidateQueries({ queryKey: ["leaderboard"] });
        qc.invalidateQueries({ queryKey: ["my-stats"] });
      }
    },
    onError: (e) =>
      toast.error(
        e instanceof ApiError && e.status === 404
          ? "This puzzle has expired — press New Puzzle."
          : "Couldn't check answers. Check your connection and try again.",
      ),
  });

  const revealMut = useMutation({
    mutationFn: () => revealPuzzle(puzzle.id),
    onSuccess: (r) => {
      setReveal(r);
      setShowSolution(true);
      if (!isLocked(score)) setScore((s) => ({ status: "revealed", points: 0, elapsed_seconds: s?.elapsed_seconds ?? 0 }));
    },
    onError: () => toast.error("Couldn't load the solution. Check your connection and try again."),
  });

  const onCheck = () => {
    if (isSample) {
      setResults(checkAnswersLocally(puzzle, SAMPLE_REVEAL.solution, answers));
      return;
    }
    // The first check locks the score — warn if boxes are still empty.
    const blanks = ELEMENTS.flatMap((el) => QUANTITIES.map((q) => [q, el] as const)).filter(
      ([q, el]) => !isGiven(puzzle, q, el) && !(answers[cellKey(q, el)] ?? "").trim(),
    ).length;
    if ((user || STATIC_MODE) && !isLocked(score) && score?.status !== "revealed" && blanks > 0) {
      setBlankCount(blanks);
      setConfirmCheck(true);
      return;
    }
    submitCheck();
  };
  const submitCheck = () => check.mutate({ answers: answers as Record<string, string> });

  const onRevealClick = () => {
    if (reveal) {
      setShowSolution((v) => !v);
      return;
    }
    if (isSample) {
      setReveal(SAMPLE_REVEAL);
      setShowSolution(true);
      return;
    }
    // Revealing before the score is locked forfeits this puzzle's points — confirm first.
    if (!isLocked(score)) setConfirmReveal(true);
    else revealMut.mutate();
  };

  useEffect(() => {
    if (isSample) return; // never pin the offline sample
    saveWorksheet({ puzzle, answers, results, score, reveal, showSolution });
  }, [isSample, puzzle, answers, results, score, reveal, showSolution]);

  // Live timer from the server's issue time; stops once the score is locked or solution revealed.
  const frozen = isLocked(score) || score?.status === "revealed" || isSample;
  useEffect(() => {
    if (frozen) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [frozen]);
  const liveElapsed = (now - Date.parse(puzzle.issued_at)) / 1000;
  const shownElapsed = isLocked(score) ? score!.elapsed_seconds : liveElapsed;
  const pointsPerBox = frozen ? null : Math.round(POINTS_PER_BOX * timeFactor(liveElapsed));
  const clockNote = isSample
    ? "Offline practice"
    : isLocked(score)
      ? `Locked · ${score!.points} pts`
      : "Solution revealed · practice only";

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
  const isFetching = loading || next.isPending;

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-6 sm:px-6 sm:py-10">
      <Toaster />
      <div className="mx-auto grid max-w-4xl gap-6 lg:max-w-7xl lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="min-w-0">
          <PlayerBar
            user={user}
            clock={isSample ? "--:--" : formatClock(shownElapsed)}
            clockNote={clockNote}
            pointsPerBox={isSample ? null : pointsPerBox}
            accounts={!STATIC_MODE}
          />
          <article className="rounded-sm border border-[#CBD5E1] bg-white font-serif text-[#1a1a1a] shadow-[0_1px_0_#CBD5E1,0_12px_32px_-16px_rgba(15,23,42,0.18)]">
            <h1 className="sr-only" data-testid="app-title">Combination Circuit Practice</h1>

            <div className="space-y-6 px-5 py-6 sm:px-10 sm:py-8">
              <p className="text-base sm:pl-4" data-testid="instructions">
                <span className="mr-4">1.</span>Solve for the missing values:
              </p>

              <figure className={loading ? "opacity-40 transition-opacity duration-200" : "transition-opacity duration-200"}>
                <Schematic topology={puzzle.topology} given={puzzle.given} />
              </figure>

              <AnswerTable
                puzzle={puzzle}
                answers={answers}
                results={results}
                solution={showSolution && reveal ? reveal.solution : null}
                onChange={onChange}
              />

              <div className="flex flex-col gap-3 border-t border-[#E2E8F0] pt-5 font-sans sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="lg"
                    className="h-11 bg-[#1E3A8A] px-5 text-white transition-[background-color,transform] duration-150 hover:bg-[#1D4ED8] active:scale-[0.98]"
                    onClick={onCheck}
                    disabled={check.isPending}
                    data-testid="btn-check-answers"
                  >
                    <CheckCheck /> Check Answers
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-11 border-[#0F172A] px-5 transition-[background-color,transform] duration-150 active:scale-[0.98]"
                    onClick={onRevealClick}
                    disabled={revealMut.isPending}
                    data-testid="btn-reveal-solution"
                  >
                    <BookOpen /> {showSolution && reveal ? "Hide Solution" : "Reveal Solution"}
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
                    onClick={() => next.mutate()}
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
                  {score && !isSample && (
                    <div className="mt-1 font-medium" data-testid="score-message">
                      {scoreMessage(score)}
                    </div>
                  )}
                </div>
              )}

              {showSolution && reveal && <WorkedSolution steps={reveal.steps} />}
            </div>
          </article>
          {isError && (
            <p className="mt-3 text-center text-xs text-[#475569]" data-testid="offline-note">
              Offline — showing a sample problem.
            </p>
          )}
        </div>
        <div className="space-y-6 lg:sticky lg:top-6">
          <FormulaWheelPanel />
          {STATIC_MODE ? <MyStatsCard /> : <LeaderboardCard me={user?.username} />}
        </div>
      </div>

      <Dialog open={confirmCheck} onOpenChange={setConfirmCheck}>
        <DialogContent data-testid="check-confirm-dialog">
          <DialogHeader>
            <DialogTitle>Lock in your score?</DialogTitle>
            <DialogDescription>
              {blankCount} box{blankCount === 1 ? " is" : "es are"} still empty. Your first check locks this puzzle's points — empty boxes score 0.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" data-testid="check-cancel-button" />}>Keep solving</DialogClose>
            <Button
              className="bg-[#1E3A8A] text-white hover:bg-[#1D4ED8]"
              onClick={() => {
                setConfirmCheck(false);
                submitCheck();
              }}
              data-testid="check-confirm-button"
            >
              Check now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmReveal} onOpenChange={setConfirmReveal}>
        <DialogContent data-testid="reveal-confirm-dialog">
          <DialogHeader>
            <DialogTitle>Reveal the solution?</DialogTitle>
            <DialogDescription>
              You haven't scored this puzzle yet. Revealing the answers now means this puzzle earns 0 leaderboard points.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" data-testid="reveal-cancel-button" />}>Keep solving</DialogClose>
            <Button
              className="bg-[#1E3A8A] text-white hover:bg-[#1D4ED8]"
              onClick={() => {
                setConfirmReveal(false);
                revealMut.mutate();
              }}
              data-testid="reveal-confirm-button"
            >
              Reveal anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
