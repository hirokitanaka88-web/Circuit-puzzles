// Tiny exact-fraction helpers so browser-generated puzzles match the server's "clean answer" guarantee.
export interface Fr {
  n: number;
  d: number;
}

const gcd = (a: number, b: number): number => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
};

export function fr(n: number, d = 1): Fr {
  if (d < 0) [n, d] = [-n, -d];
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}

export const add = (a: Fr, b: Fr) => fr(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a: Fr, b: Fr) => fr(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a: Fr, b: Fr) => fr(a.n * b.n, a.d * b.d);
export const div = (a: Fr, b: Fr) => fr(a.n * b.d, a.d * b.n);
export const par = (a: Fr, b: Fr) => div(mul(a, b), add(a, b)); // a ∥ b
export const num = (a: Fr) => a.n / a.d;
/** Exact to at most 2 decimal places. */
export const clean = (a: Fr) => 100 % a.d === 0;
