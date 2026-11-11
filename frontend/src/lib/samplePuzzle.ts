// Offline sample (backend seed=6) shown only if /api is unreachable, e.g. static preview.
import type { Puzzle } from "@/types/puzzle";

export const SAMPLE_PUZZLE: Puzzle = {
  "id": "offline-sample",
  "given": {
    "E": 60.0,
    "R1": 10.0,
    "R2": 25.0,
    "R3": 5.0,
    "R4": 15.0
  },
  "solution": [
    {
      "element": "R1",
      "E": 30.0,
      "I": 3.0,
      "R": 10.0,
      "W": 90.0
    },
    {
      "element": "R2",
      "E": 25.0,
      "I": 1.0,
      "R": 25.0,
      "W": 25.0
    },
    {
      "element": "R3",
      "E": 5.0,
      "I": 1.0,
      "R": 5.0,
      "W": 5.0
    },
    {
      "element": "R4",
      "E": 30.0,
      "I": 2.0,
      "R": 15.0,
      "W": 60.0
    },
    {
      "element": "Total",
      "E": 60.0,
      "I": 3.0,
      "R": 20.0,
      "W": 180.0
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
      "work": "IT = ET ÷ RT = 60 ÷ 20 = 3 A  (IT flows through R1, so I1 = 3 A)"
    },
    {
      "title": "5. Voltage drop across R1",
      "work": "E1 = I1 × R1 = 3 × 10 = 30 V"
    },
    {
      "title": "6. Voltage across the parallel bank",
      "work": "Ep = ET − E1 = 60 − 30 = 30 V  (so E4 = 30 V)"
    },
    {
      "title": "7. Branch currents",
      "work": "I2 = I3 = Ep ÷ R2,3 = 30 ÷ 30 = 1 A;  I4 = Ep ÷ R4 = 30 ÷ 15 = 2 A"
    },
    {
      "title": "8. Voltage drops in the upper branch",
      "work": "E2 = I2 × R2 = 1 × 25 = 25 V;  E3 = I3 × R3 = 1 × 5 = 5 V"
    },
    {
      "title": "9. Power (P = E × I)",
      "work": "P1 = 90 W;  P2 = 25 W;  P3 = 5 W;  P4 = 60 W"
    },
    {
      "title": "10. Total power (check)",
      "work": "PT = ET × IT = 60 × 3 = 180 W  =  P1 + P2 + P3 + P4"
    }
  ]
};
