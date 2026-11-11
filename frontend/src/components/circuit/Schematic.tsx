import type { GivenValues, Topology } from "@/types/puzzle";
import { fmt } from "@/lib/circuit";

const INK = "#1a1a1a";
const WIRE = { stroke: INK, strokeWidth: 1.8, fill: "none" } as const;
const A = 7; // zigzag amplitude

// Textbook zigzag resistor, 70 units long, horizontal (x0..x0+70 at y) or vertical (y0..y0+70 at x).
function hzig(x0: number, y: number): string {
  const xs = [0, 8, 13, 22, 31, 40, 49, 57, 62, 70];
  const ys = [0, 0, -A, A, -A, A, -A, A, 0, 0];
  return "M" + xs.map((dx, i) => `${x0 + dx} ${y + ys[i]}`).join(" L");
}
function vzig(x: number, y0: number): string {
  const ys = [0, 8, 13, 22, 31, 40, 49, 57, 62, 70];
  const xs = [0, 0, A, -A, A, -A, A, -A, 0, 0];
  return "M" + ys.map((dy, i) => `${x + xs[i]} ${y0 + dy}`).join(" L");
}

const boxWidth = (text: string) => Math.max(70, text.length * 11 + 22);

// Boxed value label, like the printed worksheet ("150Ω" in a rectangle). x is the left edge.
function ValueBox({ x, y, text, testId }: { x: number; y: number; text: string; testId: string }) {
  const w = boxWidth(text);
  return (
    <g data-testid={testId}>
      <rect x={x} y={y} width={w} height={30} fill="#fff" stroke={INK} strokeWidth={1.5} />
      <text x={x + w / 2} y={y + 21} textAnchor="middle" fill={INK} className="font-serif text-[17px]">
        {text}
      </text>
    </g>
  );
}

function Name({ x, y, name, anchor = "middle" }: { x: number; y: number; name: string; anchor?: "middle" | "start" }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fill={INK} className="font-serif text-[16px] font-bold">
      R<tspan dy="4" className="text-[12px]">{name.slice(1)}</tspan>
    </text>
  );
}

/** Horizontal resistor: name and boxed value centered below it. */
function HRes({ x, y, name, value, extra }: { x: number; y: number; name: string; value: number; extra?: string }) {
  const text = `${fmt(value)}Ω`;
  const cx = x + 35;
  return (
    <g>
      <path d={hzig(x, y)} {...WIRE} strokeLinejoin="miter" />
      <Name x={cx} y={y + 30} name={name} />
      <ValueBox x={cx - boxWidth(text) / 2} y={y + 42} text={text} testId={`schematic-label-${name.toLowerCase()}`} />
      {extra && <ValueBox x={cx - boxWidth(extra) / 2} y={y + 72} text={extra} testId={`schematic-given-${name.toLowerCase()}-power`} />}
    </g>
  );
}

/** Vertical resistor: name and boxed value to its right. */
function VRes({ x, y, name, value }: { x: number; y: number; name: string; value: number }) {
  return (
    <g>
      <path d={vzig(x, y)} {...WIRE} strokeLinejoin="miter" />
      <Name x={x + 16} y={y + 30} name={name} anchor="start" />
      <ValueBox x={x + 14} y={y + 40} text={`${fmt(value)}Ω`} testId={`schematic-label-${name.toLowerCase()}`} />
    </g>
  );
}

/** Two-cell battery, + on top. Connect wires at (x, y) and (x, y + 34). */
function Battery({ x, y }: { x: number; y: number }) {
  return (
    <g data-testid="schematic-battery">
      {[y, y + 26].map((yy) => (
        <g key={yy}>
          <line x1={x - 17} y1={yy} x2={x + 17} y2={yy} stroke={INK} strokeWidth={1.8} />
          <line x1={x - 9} y1={yy + 8} x2={x + 9} y2={yy + 8} stroke={INK} strokeWidth={4} />
        </g>
      ))}
      <text x={x - 15} y={y - 8} textAnchor="middle" fill={INK} className="font-serif text-[18px] font-bold">+</text>
    </g>
  );
}

const Dot = ({ x, y }: { x: number; y: number }) => <circle cx={x} cy={y} r={5} fill={INK} />;

function SourceBox({ given, x, y }: { given: GivenValues; x: number; y: number }) {
  if (given.E == null) return null;
  return <ValueBox x={x} y={y} text={`${fmt(given.E)}V`} testId="schematic-label-source" />;
}

// E -> R1 -> [ (R2 + R3) || R4 ]  — parallel bank drawn as a hexagon.
function SeriesParallel({ given }: { given: GivenValues }) {
  return (
    <>
      <Battery x={55} y={248} />
      <path {...WIRE} d="M55 248 L55 150 L190 150" />
      <path {...WIRE} d="M55 290 L55 370 L830 370 L830 150 L800 150" />
      <path {...WIRE} d="M55 282 L55 290" />
      <SourceBox given={given} x={93} y={254} />
      <HRes x={190} y={150} name="R1" value={given.R1} />
      <path {...WIRE} d="M260 150 L370 150" />
      <path {...WIRE} d="M370 150 L430 85 L480 85" />
      <HRes x={480} y={85} name="R2" value={given.R2} />
      <path {...WIRE} d="M550 85 L630 85" />
      <HRes x={630} y={85} name="R3" value={given.R3} />
      <path {...WIRE} d="M700 85 L740 85 L800 150" />
      <path {...WIRE} d="M370 150 L430 215 L555 215" />
      <HRes x={555} y={215} name="R4" value={given.R4} />
      <path {...WIRE} d="M625 215 L740 215 L800 150" />
    </>
  );
}

// R1 directly across the source, in parallel with R2 -> [ R3 || R4 ].
function ParallelBranch({ given }: { given: GivenValues }) {
  return (
    <>
      <Battery x={60} y={185} />
      <path {...WIRE} d="M60 185 L60 50 L640 50 L640 90" />
      <path {...WIRE} d="M60 219 L60 370 L640 370 L640 330" />
      <SourceBox given={given} x={100} y={192} />
      {/* R1 rung */}
      <path {...WIRE} d="M300 50 L300 165 M300 235 L300 370" />
      <VRes x={300} y={165} name="R1" value={given.R1} />
      <Dot x={300} y={50} />
      <Dot x={300} y={370} />
      {/* R2 in series with R3 || R4 */}
      <VRes x={640} y={90} name="R2" value={given.R2} />
      <path {...WIRE} d="M640 160 L640 190 M560 190 L720 190 L720 225 M560 190 L560 225" />
      <VRes x={560} y={225} name="R3" value={given.R3} />
      <VRes x={720} y={225} name="R4" value={given.R4} />
      <path {...WIRE} d="M560 295 L560 330 L720 330 L720 295" />
    </>
  );
}

// E -> R1 -> [ R2 || R3 ] -> R4, with R4's power given instead of the source voltage.
function SeriesParallelSeries({ given }: { given: GivenValues }) {
  return (
    <>
      <Battery x={55} y={248} />
      <path {...WIRE} d="M55 248 L55 160 L150 160" />
      <path {...WIRE} d="M55 282 L55 370 L820 370 L820 160 L750 160" />
      <HRes x={150} y={160} name="R1" value={given.R1} />
      <path {...WIRE} d="M220 160 L320 160" />
      <path {...WIRE} d="M320 80 L320 240 M320 80 L420 80 M490 80 L600 80 M320 240 L420 240 M490 240 L600 240 M600 80 L600 240" />
      <HRes x={420} y={80} name="R2" value={given.R2} />
      <HRes x={420} y={240} name="R3" value={given.R3} />
      <path {...WIRE} d="M600 160 L680 160" />
      <HRes x={680} y={160} name="R4" value={given.R4} extra={given.P4 != null ? `${fmt(given.P4)}W` : undefined} />
      <Dot x={320} y={160} />
      <Dot x={600} y={160} />
    </>
  );
}

const DESCRIPTIONS: Record<Topology, (g: GivenValues) => string> = {
  series_parallel: (g) =>
    `Source ${g.E} volts, R1 ${g.R1} ohms in series, then R2 ${g.R2} ohms and R3 ${g.R3} ohms in series, in parallel with R4 ${g.R4} ohms`,
  parallel_branch: (g) =>
    `Source ${g.E} volts. R1 ${g.R1} ohms across the source, in parallel with R2 ${g.R2} ohms in series with R3 ${g.R3} ohms parallel R4 ${g.R4} ohms`,
  series_parallel_series: (g) =>
    `R1 ${g.R1} ohms in series, then R2 ${g.R2} ohms parallel R3 ${g.R3} ohms, then R4 ${g.R4} ohms in series dissipating ${g.P4} watts`,
};

export default function Schematic({ topology, given }: { topology: Topology; given: GivenValues }) {
  return (
    <svg
      viewBox="20 30 830 360"
      className="h-auto w-full"
      role="img"
      aria-label={`Combination circuit: ${DESCRIPTIONS[topology](given)}`}
      data-testid="schematic-svg"
      data-topology={topology}
    >
      {topology === "series_parallel" && <SeriesParallel given={given} />}
      {topology === "parallel_branch" && <ParallelBranch given={given} />}
      {topology === "series_parallel_series" && <SeriesParallelSeries given={given} />}
    </svg>
  );
}
