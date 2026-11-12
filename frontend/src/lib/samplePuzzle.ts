// Offline sample (backend seed=6, series_parallel) used only when /api is unreachable, e.g. static preview.
import type { Puzzle, Reveal } from "@/types/puzzle";

export const SAMPLE_PUZZLE: Puzzle = {
  "id": "offline-sample",
  "topology": "series_parallel",
  "given": {
    "R1": 10.0,
    "R2": 25.0,
    "R3": 5.0,
    "R4": 15.0,
    "E": 180.0,
    "P4": null
  },
  "given_cells": [
    "R-R1",
    "R-R2",
    "R-R3",
    "R-R4",
    "E-Total"
  ],
  "issued_at": "2026-01-01T00:00:00Z"
};

export const SAMPLE_REVEAL: Reveal = {
  "solution": [
    {
      "element": "R1",
      "E": 90.0,
      "I": 9.0,
      "R": 10.0,
      "W": 810.0
    },
    {
      "element": "R2",
      "E": 75.0,
      "I": 3.0,
      "R": 25.0,
      "W": 225.0
    },
    {
      "element": "R3",
      "E": 15.0,
      "I": 3.0,
      "R": 5.0,
      "W": 45.0
    },
    {
      "element": "R4",
      "E": 90.0,
      "I": 6.0,
      "R": 15.0,
      "W": 540.0
    },
    {
      "element": "Total",
      "E": 180.0,
      "I": 9.0,
      "R": 20.0,
      "W": 1620.0
    }
  ],
  "steps": [
    {
      "title": "1. Upper branch (R2 + R3 in series)",
      "work": "R2,3 = R2 + R3 = 25 + 5 = 30 Ω"
    },
    {
      "title": "2. Parallel bank (R2,3 ∥ R4)",
      "work": "Rp = (R2,3 × R4) ÷ (R2,3 + R4) = (30 × 15) ÷ (30 + 15) = 10 Ω"
    },
    {
      "title": "3. Total resistance",
      "work": "RT = R1 + Rp = 10 + 10 = 20 Ω"
    },
    {
      "title": "4. Total current (Ohm's law)",
      "work": "IT = ET ÷ RT = 180 ÷ 20 = 9 A  (IT flows through R1, so I1 = 9 A)"
    },
    {
      "title": "5. Voltage drop across R1",
      "work": "E1 = I1 × R1 = 9 × 10 = 90 V"
    },
    {
      "title": "6. Voltage across the parallel bank",
      "work": "Ep = ET − E1 = 180 − 90 = 90 V  (so E4 = 90 V)"
    },
    {
      "title": "7. Branch currents",
      "work": "I2 = I3 = Ep ÷ R2,3 = 90 ÷ 30 = 3 A;  I4 = Ep ÷ R4 = 90 ÷ 15 = 6 A"
    },
    {
      "title": "8. Voltage drops in the upper branch",
      "work": "E2 = I2 × R2 = 3 × 25 = 75 V;  E3 = I3 × R3 = 3 × 5 = 15 V"
    },
    {
      "title": "9. Power (P = E × I)",
      "work": "P1 = 810 W;  P2 = 225 W;  P3 = 45 W;  P4 = 540 W"
    },
    {
      "title": "10. Total power (check)",
      "work": "PT = ET × IT = 180 × 9 = 1620 W  =  P1 + P2 + P3 + P4"
    }
  ]
};
