import type { GivenValues } from "@/types/puzzle";
import { fmt } from "@/lib/circuit";

// Zigzag resistor spanning x0..x0+80 on a horizontal wire at height y.
function zigzag(x0: number, y: number): string {
  const pts: [number, number][] = [
    [x0, y],
    [x0 + 10, y],
    [x0 + 15, y - 10],
    [x0 + 25, y + 10],
    [x0 + 35, y - 10],
    [x0 + 45, y + 10],
    [x0 + 55, y - 10],
    [x0 + 65, y + 10],
    [x0 + 70, y],
    [x0 + 80, y],
  ];
  return "M" + pts.map(([x, yy]) => `${x} ${yy}`).join(" L");
}

function ResistorLabel({ x, y, name, value, below }: { x: number; y: number; name: string; value: number; below?: boolean }) {
  const cx = x + 40;
  return (
    <g data-testid={`schematic-label-${name.toLowerCase()}`}>
      <text x={cx} y={below ? y + 34 : y - 20} textAnchor="middle" className="fill-[#0F172A] font-heading text-[17px] font-bold">
        {name}
      </text>
      <text x={cx} y={below ? y + 52 : y + 30} textAnchor="middle" className="fill-[#1E40AF] font-mono text-[15px] font-semibold">
        {fmt(value)} Ω
      </text>
    </g>
  );
}

export default function Schematic({ given }: { given: GivenValues }) {
  const wire = { stroke: "#0F172A", strokeWidth: 2.5, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg
      viewBox="22 20 616 272"
      className="h-auto w-full"
      role="img"
      aria-label={`Combination circuit: source ${given.E} volts, R1 ${given.R1} ohms in series, then R2 ${given.R2} ohms and R3 ${given.R3} ohms in series, in parallel with R4 ${given.R4} ohms`}
      data-testid="schematic-svg"
    >
      {/* Source (battery) */}
      <path {...wire} d="M70 150 L70 60 L150 60" />
      <path {...wire} d="M70 186 L70 280 L620 280 L620 190" />
      <line x1="48" y1="150" x2="92" y2="150" stroke="#0F172A" strokeWidth="2.5" />
      <line x1="60" y1="162" x2="80" y2="162" stroke="#0F172A" strokeWidth="5" />
      <line x1="48" y1="174" x2="92" y2="174" stroke="#0F172A" strokeWidth="2.5" />
      <line x1="60" y1="186" x2="80" y2="186" stroke="#0F172A" strokeWidth="5" />
      <text x="40" y="146" textAnchor="middle" className="fill-[#0F172A] font-mono text-[16px] font-semibold">+</text>
      <text x="40" y="198" textAnchor="middle" className="fill-[#0F172A] font-mono text-[18px] font-semibold">−</text>
      <g data-testid="schematic-label-source">
        <text x="104" y="160" className="fill-[#0F172A] font-heading text-[17px] font-bold">E<tspan className="text-[12px]" dy="4">T</tspan></text>
        <text x="104" y="182" className="fill-[#1E40AF] font-mono text-[15px] font-semibold">{fmt(given.E)} V</text>
      </g>

      {/* R1 in series */}
      <path {...wire} d={zigzag(150, 60)} />
      <ResistorLabel x={150} y={60} name="R1" value={given.R1} />
      <path {...wire} d="M230 60 L350 60" />

      {/* Upper branch: R2 + R3 */}
      <path {...wire} d={zigzag(350, 60)} />
      <ResistorLabel x={350} y={60} name="R2" value={given.R2} />
      <path {...wire} d="M430 60 L480 60" />
      <path {...wire} d={zigzag(480, 60)} />
      <ResistorLabel x={480} y={60} name="R3" value={given.R3} />
      <path {...wire} d="M560 60 L620 60 L620 190" />

      {/* Lower branch: R4 */}
      <path {...wire} d="M300 60 L300 190 L420 190" />
      <path {...wire} d={zigzag(420, 190)} />
      <ResistorLabel x={420} y={190} name="R4" value={given.R4} below />
      <path {...wire} d="M500 190 L620 190" />

      {/* Junction nodes */}
      <circle cx="300" cy="60" r="5" fill="#0F172A" />
      <circle cx="620" cy="190" r="5" fill="#0F172A" />
    </svg>
  );
}
