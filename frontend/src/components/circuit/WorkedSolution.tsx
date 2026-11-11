import type { SolutionStep } from "@/types/puzzle";

export default function WorkedSolution({ steps }: { steps: SolutionStep[] }) {
  return (
    <section
      className="animate-in fade-in slide-in-from-top-2 rounded-md border border-[#86EFAC] bg-[#F0FDF4] p-5 duration-300 sm:p-6"
      data-testid="worked-solution-card"
    >
      <h2 className="font-serif text-xl font-bold text-[#14532D]">Worked Solution</h2>
      <p className="mt-1 text-sm text-[#166534]">Correct values are now shown beneath each answer cell.</p>
      <ol className="mt-4 space-y-3">
        {steps.map((s, i) => (
          <li key={i} className="border-l-2 border-[#16A34A] pl-3" data-testid={`solution-step-${i + 1}`}>
            <div className="text-sm font-semibold text-[#14532D]">{s.title}</div>
            <div className="mt-0.5 break-words font-serif text-base text-[#0F172A]">{s.work}</div>
          </li>
        ))}
      </ol>
    </section>
  );
}
