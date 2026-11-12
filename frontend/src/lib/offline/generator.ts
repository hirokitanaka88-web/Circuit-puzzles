// Browser-side puzzle generator — a TypeScript port of backend/routers/puzzles.py, used by the
// GitHub Pages (no-server) build. Keep the two in sync when changing topologies or steps.
import type { Element, ElementValues, GivenValues, SolutionStep, Topology } from "@/types/puzzle";
import { fmt as f } from "@/lib/circuit";
import { add, clean, div, fr, mul, num, par, sub } from "@/lib/fraction";
import type { Fr } from "@/lib/fraction";

export const TOPOLOGIES: Topology[] = ["series_parallel", "parallel_branch", "series_parallel_series"];
const RESISTORS = [5, 10, 12, 15, 20, 25, 30, 40, 45, 50, 60, 75, 80, 90, 100, 120, 150];
const CURRENTS = [fr(1, 2), fr(1), fr(3, 2), fr(2), fr(5, 2), fr(3), fr(4), fr(5), fr(6)];
const NICE_SOURCES = [6, 9, 12, 18, 24, 30, 36, 40, 45, 48, 50, 60, 72, 75, 80, 90, 100, 108, 110,
  120, 125, 150, 160, 180, 200, 208, 220, 225, 240, 250, 270, 277, 300, 360, 400, 480];
const PRESETS: Record<Topology, [number, number, number, number, number]> = {
  series_parallel: [10, 25, 5, 15, 60],
  parallel_branch: [30, 10, 30, 60, 60],
  series_parallel_series: [10, 30, 60, 20, 100],
};

type Row = [Fr, Fr, Fr]; // E, I, R
type Rows = Record<Element, Row>;
type Inter = Record<string, Fr>;
type R4 = [number, number, number, number];

const pick = <T,>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)];

function solve(t: Topology, [r1, r2, r3, r4]: R4, e: Fr): [Rows, Inter] {
  const R = (x: number) => fr(x);
  if (t === "series_parallel") {
    const r23 = R(r2 + r3), rp = par(r23, R(r4)), rt = add(R(r1), rp), it = div(e, rt);
    const ep = mul(it, rp), i23 = div(ep, r23);
    return [{ R1: [mul(it, R(r1)), it, R(r1)], R2: [mul(i23, R(r2)), i23, R(r2)], R3: [mul(i23, R(r3)), i23, R(r3)],
      R4: [ep, div(ep, R(r4)), R(r4)], Total: [e, it, rt] }, { r23, rp }];
  }
  if (t === "parallel_branch") {
    const r34 = par(R(r3), R(r4)), rb = add(R(r2), r34), rt = par(R(r1), rb);
    const ib = div(e, rb), e34 = mul(ib, r34);
    return [{ R1: [e, div(e, R(r1)), R(r1)], R2: [mul(ib, R(r2)), ib, R(r2)], R3: [e34, div(e34, R(r3)), R(r3)],
      R4: [e34, div(e34, R(r4)), R(r4)], Total: [e, div(e, rt), rt] }, { r34, rb }];
  }
  const r23 = par(R(r2), R(r3)), rt = add(add(R(r1), r23), R(r4)), it = div(e, rt), e23 = mul(it, r23);
  return [{ R1: [mul(it, R(r1)), it, R(r1)], R2: [e23, div(e23, R(r2)), R(r2)], R3: [e23, div(e23, R(r3)), R(r3)],
    R4: [mul(it, R(r4)), it, R(r4)], Total: [e, it, rt] }, { r23 }];
}

const power = ([, i, r]: Row) => mul(mul(i, i), r);
const isNice = (rows: Rows) =>
  Object.values(rows).every((row) => row.every(clean) && clean(power(row))) && num(rows.Total[1]) <= 10;

function choose(t: Topology): [R4, Fr, Rows, Inter] {
  for (let k = 0; k < 50000; k++) {
    const r: R4 = [pick(RESISTORS), pick(RESISTORS), pick(RESISTORS), pick(RESISTORS)];
    let e: Fr;
    if (t === "series_parallel_series") {
      const rt = add(add(fr(r[0]), par(fr(r[1]), fr(r[2]))), fr(r[3]));
      e = mul(pick(CURRENTS), rt);
      if (e.d !== 1 || e.n < 6 || e.n > 480) continue;
    } else {
      e = fr(pick(NICE_SOURCES));
    }
    const [rows, inter] = solve(t, r, e);
    if (isNice(rows)) return [r, e, rows, inter];
  }
  const [a, b, c, d, e] = PRESETS[t];
  const [rows, inter] = solve(t, [a, b, c, d], fr(e));
  return [[a, b, c, d], fr(e), rows, inter];
}

const s = (x: Fr) => f(num(x));

function powerSteps(rows: Rows, n: number): SolutionStep[] {
  const w = (el: Element) => s(power(rows[el]));
  return [
    { title: `${n}. Power (P = E × I)`, work: `P1 = ${w("R1")} W;  P2 = ${w("R2")} W;  P3 = ${w("R3")} W;  P4 = ${w("R4")} W` },
    { title: `${n + 1}. Total power (check)`,
      work: `PT = ET × IT = ${s(rows.Total[0])} × ${s(rows.Total[1])} = ${w("Total")} W  =  P1 + P2 + P3 + P4` },
  ];
}

function steps(t: Topology, [r1, r2, r3, r4]: R4, rows: Rows, x: Inter): SolutionStep[] {
  const [eT, iT, rT] = rows.Total;
  if (t === "series_parallel") {
    const e1 = rows.R1[0], ep = rows.R4[0], i23 = rows.R2[1], i4 = rows.R4[1];
    return [
      { title: "1. Upper branch (R2 + R3 in series)", work: `R2,3 = R2 + R3 = ${r2} + ${r3} = ${s(x.r23)} Ω` },
      { title: "2. Parallel bank (R2,3 ∥ R4)",
        work: `Rp = (R2,3 × R4) ÷ (R2,3 + R4) = (${s(x.r23)} × ${r4}) ÷ (${s(x.r23)} + ${r4}) = ${s(x.rp)} Ω` },
      { title: "3. Total resistance", work: `RT = R1 + Rp = ${r1} + ${s(x.rp)} = ${s(rT)} Ω` },
      { title: "4. Total current (Ohm's law)",
        work: `IT = ET ÷ RT = ${s(eT)} ÷ ${s(rT)} = ${s(iT)} A  (IT flows through R1, so I1 = ${s(iT)} A)` },
      { title: "5. Voltage drop across R1", work: `E1 = I1 × R1 = ${s(iT)} × ${r1} = ${s(e1)} V` },
      { title: "6. Voltage across the parallel bank", work: `Ep = ET − E1 = ${s(eT)} − ${s(e1)} = ${s(ep)} V  (so E4 = ${s(ep)} V)` },
      { title: "7. Branch currents",
        work: `I2 = I3 = Ep ÷ R2,3 = ${s(ep)} ÷ ${s(x.r23)} = ${s(i23)} A;  I4 = Ep ÷ R4 = ${s(ep)} ÷ ${r4} = ${s(i4)} A` },
      { title: "8. Voltage drops in the upper branch",
        work: `E2 = I2 × R2 = ${s(i23)} × ${r2} = ${s(rows.R2[0])} V;  E3 = I3 × R3 = ${s(i23)} × ${r3} = ${s(rows.R3[0])} V` },
      ...powerSteps(rows, 9),
    ];
  }
  if (t === "parallel_branch") {
    const i1 = rows.R1[1], e2 = rows.R2[0], i2 = rows.R2[1], e34 = rows.R3[0];
    return [
      { title: "1. Lower part of the right branch (R3 ∥ R4)",
        work: `R3,4 = (R3 × R4) ÷ (R3 + R4) = (${r3} × ${r4}) ÷ (${r3} + ${r4}) = ${s(x.r34)} Ω` },
      { title: "2. Right branch (R2 + R3,4 in series)", work: `Rb = R2 + R3,4 = ${r2} + ${s(x.r34)} = ${s(x.rb)} Ω` },
      { title: "3. Total resistance (R1 ∥ Rb)",
        work: `RT = (R1 × Rb) ÷ (R1 + Rb) = (${r1} × ${s(x.rb)}) ÷ (${r1} + ${s(x.rb)}) = ${s(rT)} Ω` },
      { title: "4. Total current (Ohm's law)", work: `IT = ET ÷ RT = ${s(eT)} ÷ ${s(rT)} = ${s(iT)} A` },
      { title: "5. R1 is directly across the source", work: `E1 = ET = ${s(eT)} V;  I1 = E1 ÷ R1 = ${s(eT)} ÷ ${r1} = ${s(i1)} A` },
      { title: "6. Right branch current (flows through R2)",
        work: `I2 = ET ÷ Rb = ${s(eT)} ÷ ${s(x.rb)} = ${s(i2)} A  (check: IT − I1 = ${s(iT)} − ${s(i1)});  E2 = I2 × R2 = ${s(i2)} × ${r2} = ${s(e2)} V` },
      { title: "7. Voltage across R3 ∥ R4",
        work: `E3 = E4 = ET − E2 = ${s(eT)} − ${s(e2)} = ${s(e34)} V;  I3 = ${s(e34)} ÷ ${r3} = ${s(rows.R3[1])} A;  I4 = ${s(e34)} ÷ ${r4} = ${s(rows.R4[1])} A` },
      ...powerSteps(rows, 8),
    ];
  }
  const e23 = rows.R2[0];
  return [
    { title: "1. Circuit current from R4's given power",
      work: `I4 = √(P4 ÷ R4) = √(${s(power(rows.R4))} ÷ ${r4}) = ${s(iT)} A  — R1 and R4 are in series with the source, so IT = I1 = I4 = ${s(iT)} A` },
    { title: "2. Parallel bank (R2 ∥ R3)",
      work: `R2,3 = (R2 × R3) ÷ (R2 + R3) = (${r2} × ${r3}) ÷ (${r2} + ${r3}) = ${s(x.r23)} Ω` },
    { title: "3. Total resistance", work: `RT = R1 + R2,3 + R4 = ${r1} + ${s(x.r23)} + ${r4} = ${s(rT)} Ω` },
    { title: "4. Source voltage (Ohm's law)", work: `ET = IT × RT = ${s(iT)} × ${s(rT)} = ${s(eT)} V` },
    { title: "5. Series voltage drops",
      work: `E1 = IT × R1 = ${s(iT)} × ${r1} = ${s(rows.R1[0])} V;  E4 = IT × R4 = ${s(iT)} × ${r4} = ${s(rows.R4[0])} V` },
    { title: "6. Voltage and currents in the parallel bank",
      work: `E2 = E3 = IT × R2,3 = ${s(iT)} × ${s(x.r23)} = ${s(e23)} V;  I2 = ${s(e23)} ÷ ${r2} = ${s(rows.R2[1])} A;  I3 = ${s(e23)} ÷ ${r3} = ${s(rows.R3[1])} A` },
    ...powerSteps(rows, 7),
  ];
}

export interface FullPuzzle {
  id: string;
  topology: Topology;
  given: GivenValues;
  given_cells: string[];
  issued_at: string;
  solution: ElementValues[];
  steps: SolutionStep[];
  revealed: boolean;
  locked: boolean;
  points: number;
  locked_elapsed: number;
}

export function generatePuzzle(exclude?: string): FullPuzzle {
  const t = pick(TOPOLOGIES.filter((x) => x !== exclude));
  const [r, e, rows, inter] = choose(t);
  const solution = (Object.keys(rows) as Element[]).map((el) => {
    const [ev, i, rr] = rows[el];
    return { element: el, E: num(ev), I: num(i), R: num(rr), W: num(power(rows[el])) };
  });
  const isP4 = t === "series_parallel_series";
  const given: GivenValues = {
    R1: r[0], R2: r[1], R3: r[2], R4: r[3],
    E: isP4 ? null : num(e),
    P4: isP4 ? num(power(rows.R4)) : null,
  };
  return {
    id: crypto.randomUUID(),
    topology: t,
    given,
    given_cells: ["R-R1", "R-R2", "R-R3", "R-R4", isP4 ? "W-R4" : "E-Total"],
    issued_at: new Date().toISOString(),
    solution,
    steps: steps(t, r, rows, inter),
    revealed: false,
    locked: false,
    points: 0,
    locked_elapsed: 0,
  };
}
