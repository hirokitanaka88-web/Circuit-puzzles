# Combination Circuit Worksheet Generator & Trainer

## Project Overview
Interactive electrical combination circuit practice worksheet generator. Produces textbook-style SVG circuit schematics (DC source, series R1, parallel split of R2+R3 series on top branch and R4 on bottom branch), along with a standard 5×4 E-I-R-W (VIRP) calculation matrix, automatic validation with ±1% tolerance, and step-by-step worked solutions.

## Architecture
- **Frontend**: React 19 + TypeScript + Vite + Tailwind v4 + Lucide icons + Shadcn Base-Nova UI.
- **Key Modules**:
  - `SchematicDiagram.tsx`: SVG schematic renderer with standard IEEE electrical symbols, nodes, and given annotations.
  - `AnswerMatrixTable.tsx`: 5x4 matrix input grid for components R1..R4 and Total with given cell locks, validation badges, and auto-focus navigation.
  - `WorkedSolution.tsx`: Detailed physics and mathematical breakdown (Ohm's & Joule's laws).
  - `circuitEngine.ts`: Circuit solver, generator for clean whole/decimal numbers, and ±1% validation engine.
