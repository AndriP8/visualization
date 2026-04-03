import { motion } from "motion/react";
import { useState } from "react";

type QuizQuestion = {
	id: string;
	question: string;
	answer: string;
	explanation: string;
	codeSnippet?: string;
};

const QUIZ_DATA: QuizQuestion[] = [
	{
		id: "q1",
		question:
			"Can you use a column alias defined in SELECT inside the WHERE clause?",
		answer: "No, you cannot.",
		explanation:
			"The WHERE clause executes BEFORE the SELECT clause. When the database engine evaluates WHERE, it hasn't processed the SELECT aliases yet. (Note: standard ANSI SQL dictates this).",
		codeSnippet:
			"-- Fails in standard SQL\nSELECT salary as base_pay\nFROM employees\nWHERE base_pay > 100000;",
	},
	{
		id: "q2",
		question: "Why can you use aliases in ORDER BY but not in WHERE?",
		answer: "ORDER BY executes AFTER SELECT.",
		explanation:
			"Because ORDER BY is the second-to-last step in the execution pipeline (Step 6), the SELECT clause (Step 5) has already run. The aliases are now known to the engine.",
		codeSnippet:
			"-- Works perfectly\nSELECT dept, COUNT(*) as size\nFROM employees\nGROUP BY dept\nORDER BY size DESC;",
	},
	{
		id: "q3",
		question: "What is the fundamental difference between WHERE and HAVING?",
		answer: "WHERE filters rows. HAVING filters groups.",
		explanation:
			"Use WHERE to strip out individual raw rows (e.g., status = 'inactive') before aggregation. Use HAVING to discard grouped buckets based on aggregate conditions (e.g., COUNT(*) > 5).",
		codeSnippet:
			"-- WHERE vs HAVING\nSELECT dept, AVG(salary)\nFROM employees\nWHERE status = 'active'\nGROUP BY dept\nHAVING AVG(salary) > 80000;",
	},
	{
		id: "q4",
		question: "Does a LIMIT clause speed up an un-indexed ORDER BY?",
		answer: "Usually, yes.",
		explanation:
			"While LIMIT executes last logically, modern optimizers recognize ORDER BY + LIMIT together and combine them into a single Top-N heap operation. Instead of sorting the full table, it maintains only the top N rows in memory, drastically reducing memory and CPU usage.",
	},
];

export function ExecutionQuizDemo() {
	const [activeId, setActiveId] = useState<string | null>(null);

	return (
		<div className="bg-surface-base border border-border-primary rounded-xl p-6 lg:p-8 flex flex-col gap-6">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{QUIZ_DATA.map((q) => {
					const isFlipped = activeId === q.id;

					return (
						<button
							key={q.id}
							type="button"
							className="relative text-left h-64 md:h-72 perspective-[1000px] cursor-pointer group"
							onClick={() => setActiveId(isFlipped ? null : q.id)}
						>
							<motion.div
								className="w-full h-full relative transform-3d transition-all duration-500"
								initial={false}
								animate={{ rotateY: isFlipped ? 180 : 0 }}
								transition={{ type: "spring", stiffness: 260, damping: 20 }}
							>
								{/* Front Card */}
								<div
									className={`absolute inset-0 backface-hidden bg-surface-primary border ${
										isFlipped
											? "border-blue-500/50"
											: "border-border-primary group-hover:border-border-tertiary"
									} rounded-xl p-6 flex flex-col justify-center items-center text-center gap-4 shadow-lg transition-colors`}
								>
									<div className="w-12 h-12 rounded-full bg-blue-500/10 text-accent-blue-soft flex items-center justify-center font-bold text-xl mb-2">
										?
									</div>
									<h3 className="font-semibold text-text-secondary text-lg md:text-xl px-2">
										{q.question}
									</h3>
									<div className="text-text-muted text-sm mt-auto">
										Click to reveal answer
									</div>
								</div>

								{/* Back Card */}
								<div
									className="absolute inset-0 backface-hidden bg-linear-to-br from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-xl p-5 flex flex-col shadow-xl overflow-hidden"
									style={{ transform: "rotateY(180deg)" }}
								>
									<div className="text-accent-blue font-bold mb-2 uppercase text-[10px] tracking-wider shrink-0">
										Answer
									</div>
									<h4 className="font-semibold text-text-primary text-[15px] leading-tight mb-2 shrink-0">
										{q.answer}
									</h4>
									<p className="text-text-secondary text-[13px] leading-relaxed overflow-y-auto pr-2 custom-scrollbar min-h-0">
										{q.explanation}
									</p>
									{q.codeSnippet && (
										<div className="mt-3 bg-black/40 border border-white/10 rounded text-[11px] overflow-hidden shrink-0">
											<pre className="p-2.5 overflow-x-auto text-accent-emerald font-mono leading-relaxed">
												{q.codeSnippet}
											</pre>
										</div>
									)}
								</div>
							</motion.div>
						</button>
					);
				})}
			</div>
		</div>
	);
}
