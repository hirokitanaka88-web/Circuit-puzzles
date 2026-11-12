import { useState } from "react";
import { CircleDot, X } from "lucide-react";
import { cn } from "@/lib/utils";

const INK = "#1a1a1a";

type Formula =
  | { t: string } // plain text, e.g. "EI"
  | { n: string; d: string; sqrt?: boolean } // fraction, optionally under a radical
  | { sqrt: string }; // radical over plain text

// Outer ring, clockwise from 12 o'clock (three per quadrant: I, E, R, P).
const OUTER: Formula[] = [
  { n: "P", d: "R", sqrt: true }, { n: "P", d: "E" }, { n: "E", d: "R" }, // I
  { sqrt: "PR" }, { t: "IR" }, { n: "P", d: "I" }, // E
  { n: "E²", d: "P" }, { n: "P", d: "I²" }, { n: "E", d: "I" }, // R
  { t: "I²R" }, { t: "EI" }, { n: "E²", d: "R" }, // P
];

const R_OUT = 190;
const R_IN = 66;
const polar = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return [r * Math.sin(a), -r * Math.cos(a)] as const;
};

function FormulaText({ f, x, y }: { f: Formula; x: number; y: number }) {
  const cls = "font-serif text-[22px]";
  if ("t" in f) {
    return (
      <text x={x} y={y + 8} textAnchor="middle" fill={INK} className={cls}>
        {f.t}
      </text>
    );
  }
  if ("n" in f) {
    const off = f.sqrt ? 8 : 0;
    return (
      <g>
        {f.sqrt && <path d={`M${x - 26} ${y + 4} L${x - 21} ${y + 2} L${x - 15} ${y + 26} L${x - 9} ${y - 26} L${x + 22} ${y - 26}`} fill="none" stroke={INK} strokeWidth={1.4} />}
        <text x={x + off} y={y - 5} textAnchor="middle" fill={INK} className={cls}>{f.n}</text>
        <line x1={x + off - 13} y1={y} x2={x + off + 13} y2={y} stroke={INK} strokeWidth={1.6} />
        <text x={x + off} y={y + 21} textAnchor="middle" fill={INK} className={cls}>{f.d}</text>
      </g>
    );
  }
  return (
    <g>
      <path d={`M${x - 26} ${y + 2} L${x - 21} ${y} L${x - 15} ${y + 12} L${x - 9} ${y - 14} L${x + 24} ${y - 14}`} fill="none" stroke={INK} strokeWidth={1.4} />
      <text x={x + 8} y={y + 8} textAnchor="middle" fill={INK} className={cls}>{f.sqrt}</text>
    </g>
  );
}

/** The printed "Ohm's law wheel" (E, I, R, P formula chart). */
export function OhmsLawWheel({ className }: { className?: string }) {
  return (
    <svg viewBox="-200 -200 400 400" className={cn("h-auto w-full", className)} role="img" aria-label="Ohm's law formula wheel" data-testid="ohms-law-wheel">
      <circle r={R_OUT} fill="#fff" stroke={INK} strokeWidth={2} />
      {Array.from({ length: 12 }, (_, i) => {
        const [x1, y1] = polar(i % 3 === 0 ? 0 : R_IN, i * 30);
        const [x2, y2] = polar(R_OUT, i * 30);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={INK} strokeWidth={1.4} />;
      })}
      <circle r={R_IN} fill="#fff" stroke={INK} strokeWidth={2} />
      <line x1={0} y1={-R_IN} x2={0} y2={R_IN} stroke={INK} strokeWidth={1.4} />
      <line x1={-R_IN} y1={0} x2={R_IN} y2={0} stroke={INK} strokeWidth={1.4} />
      {[
        ["P", -26, -14],
        ["I", 26, -14],
        ["E", 26, 38],
        ["R", -26, 38],
      ].map(([l, x, y]) => (
        <text key={l} x={x} y={y} textAnchor="middle" fill={INK} className="font-serif text-[36px] font-bold">
          {l}
        </text>
      ))}
      {OUTER.map((f, i) => {
        const [x, y] = polar(130, i * 30 + 15);
        return <FormulaText key={i} f={f} x={x} y={y} />;
      })}
    </svg>
  );
}

/** Sticky side panel on wide screens; floating toggle + corner panel on phones/tablets. */
export default function FormulaWheelPanel() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <aside className="hidden lg:block" data-testid="formula-wheel-sidebar">
        <div className="rounded-sm border border-[#CBD5E1] bg-white p-4 shadow-[0_1px_0_#CBD5E1,0_12px_32px_-16px_rgba(15,23,42,0.18)]">
          <h2 className="mb-2 font-serif text-base font-bold text-[#1a1a1a]">Formula Wheel</h2>
          <OhmsLawWheel />
        </div>
      </aside>

      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 lg:hidden">
        {open && (
          <div
            className="animate-in fade-in zoom-in-95 w-[min(78vw,300px)] rounded-md border border-[#94A3B8] bg-white/95 p-3 shadow-xl backdrop-blur duration-150"
            data-testid="formula-wheel-popup"
          >
            <OhmsLawWheel />
          </div>
        )}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex h-11 items-center gap-2 rounded-full bg-[#1E3A8A] px-4 font-sans text-sm font-medium text-white shadow-lg transition-[background-color,transform] duration-150 hover:bg-[#1D4ED8] active:scale-95"
          aria-expanded={open}
          data-testid="formula-wheel-toggle"
        >
          {open ? <X className="size-4" /> : <CircleDot className="size-4" />}
          {open ? "Hide formulas" : "Formulas"}
        </button>
      </div>
    </>
  );
}
