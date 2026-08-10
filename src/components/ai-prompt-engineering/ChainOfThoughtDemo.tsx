import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { match } from "ts-pattern";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

export function ChainOfThoughtDemo() {
	const [useReasoning, setUseReasoning] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const timerRef = useRef<number | undefined>(undefined);

	useEffect(() => () => window.clearTimeout(timerRef.current), []);

	const generate = () => {
		window.clearTimeout(timerRef.current);
		setIsGenerating(true);
		timerRef.current = window.setTimeout(() => setIsGenerating(false), 650);
	};

	const result = match({ useReasoning, isGenerating })
		.with({ isGenerating: true }, () => ({
			answer: "Generating…",
			score: "—",
			tone: "text-zinc-400",
		}))
		.with({ useReasoning: true }, () => ({
			answer: "10 apples",
			score: "Correct",
			tone: "text-emerald-300",
		}))
		.otherwise(() => ({
			answer: "11 apples",
			score: "Incorrect",
			tone: "text-rose-300",
		}));

	return (
		<DemoSection
			title="Demo 2: Reasoning Strategy"
			description="A reasoning scaffold can improve multi-step accuracy, but it consumes extra tokens and should be evaluated as a latency/cost trade-off—not treated as a magic instruction."
		>
			<div className="space-y-5">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
						<input
							type="checkbox"
							checked={useReasoning}
							onChange={(event) => setUseReasoning(event.target.checked)}
							className="accent-cyan-500"
						/>
						Use a step-by-step scaffold
					</label>
					<button
						type="button"
						onClick={generate}
						disabled={isGenerating}
						className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-300 transition-colors hover:bg-cyan-500/20 disabled:opacity-50"
					>
						{isGenerating ? "Generating…" : "Run example"}
					</button>
				</div>

				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
					<div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
						<div className="mb-3 text-[10px] uppercase tracking-wider text-zinc-500">
							Task
						</div>
						<ShikiCode
							language="text"
							showLineNumbers={false}
							code={`A farmer has 12 apples.\nHe gives away half, buys 3,\ndrops 1, then finds 2. How many remain?`}
						/>
						<div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-xs text-zinc-400">
							{useReasoning
								? "The scaffold asks for intermediate arithmetic before the final answer."
								: "The model must perform all arithmetic while producing the answer."}
						</div>
					</div>

					<div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
						<div className="mb-3 text-[10px] uppercase tracking-wider text-zinc-500">
							Model result
						</div>
						<motion.div
							key={`${useReasoning}-${isGenerating}`}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="min-h-28 rounded-lg border border-zinc-800 bg-zinc-950 p-4"
						>
							{useReasoning && !isGenerating && (
								<div className="mb-3 space-y-1 border-l-2 border-cyan-500/60 pl-3 font-mono text-xs text-zinc-400">
									<div>12 ÷ 2 = 6</div>
									<div>6 + 3 − 1 + 2 = 10</div>
								</div>
							)}
							<div className={`font-mono text-lg font-semibold ${result.tone}`}>
								{result.answer}
							</div>
						</motion.div>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
					<Metric label="Accuracy" value={result.score} />
					<Metric label="Extra tokens" value={useReasoning ? "+18" : "0"} />
					<Metric
						label="Strategy"
						value={useReasoning ? "Scaffolded" : "Direct"}
					/>
				</div>

				<div className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-3 text-xs text-zinc-400">
					<span className="font-medium text-cyan-300">Production note:</span>{" "}
					Modern reasoning models may keep intermediate reasoning internal.
					Evaluate the observable answer, cost, and latency rather than
					requiring hidden thoughts to be exposed.
				</div>
			</div>
		</DemoSection>
	);
}

function Metric({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
			<div className="text-[10px] uppercase tracking-wider text-zinc-500">
				{label}
			</div>
			<div className="font-mono text-lg font-semibold text-zinc-200">
				{value}
			</div>
		</div>
	);
}
