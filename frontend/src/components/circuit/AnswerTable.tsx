import { Check, X } from "lucide-react";
import type { Element, Puzzle, Quantity } from "@/types/puzzle";
import { QUANTITIES, cellKey, expected, fmt, isGiven } from "@/lib/circuit";
import type { Answers, Results } from "@/lib/circuit";
import { cn } from "@/lib/utils";

// Worksheet order: Total column first, then R1..R4.
const COLUMNS: Element[] = ["Total", "R1", "R2", "R3", "R4"];

const SYM: Record<Quantity, string> = { E: "E", I: "I", R: "R", W: "P" };
const UNIT: Record<Quantity, string> = { E: "V", I: "A", R: "Ω", W: "W" };
const NAME: Record<Quantity, string> = { E: "Voltage", I: "Current", R: "Resistance", W: "Power" };

function CellLabel({ q, el }: { q: Quantity; el: Element }) {
  return (
    <span className="shrink-0 whitespace-nowrap">
      {SYM[q]}
      <sub className="text-[0.7em]">{el === "Total" ? "T" : el.slice(1)}</sub> =
    </span>
  );
}

interface Props {
  puzzle: Puzzle;
  answers: Answers;
  results: Results | null;
  revealed: boolean;
  onChange: (q: Quantity, el: Element, value: string) => void;
}

export default function AnswerTable({ puzzle, answers, results, revealed, onChange }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] table-fixed border-collapse border border-[#1a1a1a] font-serif text-[17px] text-[#1a1a1a]" data-testid="table-eirw-matrix">
        <tbody>
          {QUANTITIES.map((q) => (
            <tr key={q} data-testid={`row-${q}`}>
              {COLUMNS.map((el) => {
                const key = cellKey(q, el);
                const exp = expected(puzzle, q, el);
                if (isGiven(q, el)) {
                  return (
                    <td key={el} className="border border-[#1a1a1a] px-2 py-2" data-testid={`given-${key}`}>
                      <span className="flex items-baseline gap-1">
                        <CellLabel q={q} el={el} />
                        <span className="font-semibold">
                          {fmt(exp)} {UNIT[q]}
                        </span>
                      </span>
                    </td>
                  );
                }
                const status = results?.[key];
                return (
                  <td
                    key={el}
                    className={cn(
                      "border border-[#1a1a1a] px-2 py-1.5 transition-[background-color] duration-150",
                      status === "correct" && "bg-[#F0FDF4]",
                      status === "incorrect" && "bg-[#FEF2F2]",
                      status === "blank" && "bg-[#FFFBEB]",
                    )}
                  >
                    <label className="flex items-center gap-1">
                      <CellLabel q={q} el={el} />
                      <span className="relative min-w-0 flex-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          aria-label={`${NAME[q]} for ${el}`}
                          value={answers[key] ?? ""}
                          onChange={(e) => onChange(q, el, e.target.value)}
                          data-testid={`input-${key}`}
                          data-status={status ?? "unchecked"}
                          className={cn(
                            "h-9 w-full border-0 border-b border-dashed border-[#94A3B8] bg-transparent px-1 pr-5 font-serif text-[17px] outline-none transition-[border-color] duration-150 focus:border-solid focus:border-[#1E3A8A]",
                            status === "correct" && "border-[#16A34A]",
                            status === "incorrect" && "animate-shake border-[#DC2626]",
                          )}
                        />
                        {status === "correct" && (
                          <Check className="absolute right-0 top-1/2 size-4 -translate-y-1/2 animate-pop text-[#16A34A]" data-testid={`mark-correct-${key}`} />
                        )}
                        {(status === "incorrect" || status === "blank") && (
                          <X className="absolute right-0 top-1/2 size-4 -translate-y-1/2 animate-pop text-[#DC2626]" data-testid={`mark-incorrect-${key}`} />
                        )}
                      </span>
                    </label>
                    {revealed && (
                      <div className="mt-0.5 text-right font-serif text-sm font-semibold text-[#166534]" data-testid={`solution-${key}`}>
                        = {fmt(exp)} {UNIT[q]}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
