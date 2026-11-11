import type { GivenValues } from "@/types/puzzle";
import { fmt } from "@/lib/circuit";

const INK = "#1a1a1a";

// Small textbook zigzag resistor spanning x0..x0+70 on a horizontal wire at height y.
function zigzag(x0: number, y: number): string {
  const a = 7;
  const pts: [number, number][] = [
    [x0, y],
    [x0 + 8, y],
    [x0 + 13, y - a],
    [x0 + 22, y + a],
    [x0 + 31, y - a],
    [x0 + 40, y + a],
    [x0 + 49, y - a],
    [x0 + 57, y + a],
    [x0 + 62, y],
    [x0 + 70, y],
  ];
  return "M" + pts.map(([x, yy]) => `${x} ${yy}`).join(" L");
}

// Boxed value label, like the printed worksheet ("150Ω" in a rectangle).
function ValueBox({ cx, y, text, testId }: { cx: number; y: number; text: string; testId: string }) {
  const w = Math.max(70, text.length * 11 + 22);
  return (
    <g data-testid={testId}>
      <rect x={cx - w / 2} y={y} width={w} height={30} fill="#fff" stroke={INK} strokeWidth={1.5} />
      <text x={cx} y={y + 21} textAnchor="middle" fill={INK} className="font-serif text-[17px]">
        {text}
      </text>
    </g>
  );
}

function Resistor({ x, y, name, value }: { x: number; y: number; name: string; value: number }) {
  const cx = x + 35;
  return (
    <g>
      <path d={zigzag(x, y)} fill="none" stroke={INK} strokeWidth={1.8} strokeLinejoin="miter" />
      <text x={cx} y={y + 30} textAnchor="middle" fill={INK} className="font-serif text-[16px] font-bold">
        R<tspan dy="4" className="text-[12px]">{name.slice(1)}</tspan>
      </text>
      <ValueBox cx={cx} y={y + 42} text={`${fmt(value)}Ω`} testId={`schematic-label-${name.toLowerCase()}`} />
    </g>
  );
}

export default function Schematic({ given }: { given: GivenValues }) {
  const wire = { stroke: INK, strokeWidth: 1.8, fill: "none" };
  return (
    <svg
      viewBox="20 40 820 350"
      className="h-auto w-full"
      role="img"
      aria-label={`Combination circuit: source ${given.E} volts, R1 ${given.R1} ohms in series, then R2 ${given.R2} ohms and R3 ${given.R3} ohms in series, in parallel with R4 ${given.R4} ohms`}
      data-testid="schematic-svg"
    >
      {/* Source: multi-cell battery, + on top */}
      <path {...wire} d="M55 248 L55 150 L190 150" />
      <path {...wire} d="M55 300 L55 370 L830 370 L830 150 L800 150" />
      {[248, 274].map((y) => (
        <g key={y}>
          <line x1="38" y1={y} x2="72" y2={y} stroke={INK} strokeWidth={1.8} />
          <line x1="46" y1={y + 8} x2="64" y2={y + 8} stroke={INK} strokeWidth={4} />
        </g>
      ))}
      <line x1="55" y1="282" x2="55" y2="300" stroke={INK} strokeWidth={1.8} />
      <text x="40" y="240" textAnchor="middle" fill={INK} className="font-serif text-[18px] font-bold">+</text>
      <ValueBox cx={128} y={254} text={`${fmt(given.E)}V`} testId="schematic-label-source" />

      {/* R1 in series */}
      <Resistor x={190} y={150} name="R1" value={given.R1} />
      <path {...wire} d="M260 150 L370 150" />

      {/* Parallel bank drawn as a hexagon: upper R2 + R3, lower R4 */}
      <path {...wire} d="M370 150 L430 85 L480 85" />
      <Resistor x={480} y={85} name="R2" value={given.R2} />
      <path {...wire} d="M550 85 L630 85" />
      <Resistor x={630} y={85} name="R3" value={given.R3} />
      <path {...wire} d="M700 85 L740 85 L800 150" />

      <path {...wire} d="M370 150 L430 215 L555 215" />
      <Resistor x={555} y={215} name="R4" value={given.R4} />
      <path {...wire} d="M625 215 L740 215 L800 150" />
    </svg>
  );
}
