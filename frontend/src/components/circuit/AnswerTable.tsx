import { Check, X } from "lucide-react";
import type { Element, Puzzle, Quantity } from "@/types/puzzle";
import { ELEMENTS, QUANTITIES, cellKey, expected, fmt, isGiven } from "@/lib/circuit";
import type { Answers, Results } from "@/lib/circuit";
import { cn } from "@/lib/utils";

const HEADERS: Record<Quantity, { sym: string; label: string; unit: string }> = {
  E: { sym: "E", label: "Voltage", unit: "V" },
  I: { sym: "I", label: "Current", unit: "A" },
  R: { sym: "R", label: "Resistance", unit: "Ω" },
  W: { sym: "W", label: "Power", unit: "W" },
};

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
      <table className="w-full min-w-[520px] border-collapse border-2 border-[#0F172A] text-left" data-testid="table-eirw-matrix">
        <thead>
          <tr className="bg-[#F1F5F9]">
            <th className="w-20 border border-[#0F172A] px-3 py-2 font-heading text-sm font-bold">Element</th>
            {QUANTITIES.map((q) => (
              <th key={q} className="border border-[#0F172A] px-3 py-2 text-center" data-testid={`column-header-${q}`}>
                <span className="font-heading text-lg font-bold">{HEADERS[q].sym}</span>
                <span className="block text-xs font-medium text-[#475569]">
                  {HEADERS[q].label} ({HEADERS[q].unit})
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ELEMENTS.map((el) => (
            <tr key={el} className={cn(el === "Total" && "border-t-2 border-[#0F172A] bg-[#F8FAFC]")}>
              <th scope="row" className="border border-[#0F172A] px-3 py-2 font-heading text-base font-bold" data-testid={`row-label-${el}`}>
                {el === "Total" ? "Total" : el}
              </th>
              {QUANTITIES.map((q) => {
                const key = cellKey(q, el);
                const exp = expected(puzzle, q, el);
                if (isGiven(q, el)) {
                  return (
                    <td key={q} className="border border-[#0F172A] bg-[#EFF6FF] px-3 py-2 text-center" data-testid={`given-${key}`}>
                      <span className="font-mono text-base font-semibold text-[#1E40AF]">{fmt(exp)}</span>
                      <span className="ml-1 text-[10px] font-semibold uppercase tracking-wider text-[#1E40AF]/70">given</span>
                    </td>
                  );
                }
                const status = results?.[key];
                return (
                  <td key={q} className="border border-[#0F172A] p-1.5 align-top">
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        aria-label={`${HEADERS[q].label} for ${el}`}
                        value={answers[key] ?? ""}
                        onChange={(e) => onChange(q, el, e.target.value)}
                        data-testid={`input-${key}`}
                        data-status={status ?? "unchecked"}
                        className={cn(
                          "h-11 w-full rounded-sm border bg-white px-2 pr-7 text-center font-mono text-base outline-none transition-[border-color,box-shadow,background-color] duration-150 ease-out focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/25",
                          !status && "border-[#94A3B8]",
                          status === "correct" && "border-[#16A34A] bg-[#F0FDF4]",
                          status === "incorrect" && "animate-shake border-[#DC2626] bg-[#FEF2F2]",
                          status === "blank" && "border-[#D97706] bg-[#FFFBEB]",
                        )}
                      />
                      {status === "correct" && (
                        <Check className="absolute right-1.5 top-1/2 size-4 -translate-y-1/2 animate-pop text-[#16A34A]" data-testid={`mark-correct-${key}`} />
                      )}
                      {(status === "incorrect" || status === "blank") && (
                        <X className="absolute right-1.5 top-1/2 size-4 -translate-y-1/2 animate-pop text-[#DC2626]" data-testid={`mark-incorrect-${key}`} />
                      )}
                    </div>
                    {revealed && (
                      <div className="mt-1 text-center font-mono text-xs font-semibold text-[#166534]" data-testid={`solution-${key}`}>
                        = {fmt(exp)} {HEADERS[q].unit}
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
