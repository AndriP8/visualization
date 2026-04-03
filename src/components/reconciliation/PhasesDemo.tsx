import { motion } from "motion/react";
import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";

interface Phase {
	label: string;
	description: string;
	nodes: string[];
	color: string;
	interruptible: boolean;
}

const PHASES: Phase[] = [
	{
		label: "1. Trigger",
		description: "setState() is called — React schedules a re-render",
		nodes: ["App"],
		color: "#a78bfa",
		interruptible: false,
	},
	{
		label: "2. Render Phase — Walk Tree",
		description:
			"React calls your component functions top-down, building a new fiber tree. This phase is INTERRUPTIBLE.",
		nodes: ["App", "Header", "Main"],
		color: "#60a5fa",
		interruptible: true,
	},
	{
		label: "3. Render Phase — Diff",
		description:
			"React compares new fibers with the current tree. Marks nodes that need DOM changes as 'effects'.",
		nodes: ["h1 (update)", "p (delete)", "p (insert)"],
		color: "#fbbf24",
		interruptible: true,
	},
	{
		label: "4. Commit Phase — Mutate DOM",
		description:
			"React applies all collected effects to the real DOM in one synchronous batch. This phase is NOT interruptible.",
		nodes: ["DOM: h1.textContent", "DOM: remove p", "DOM: insert p"],
		color: "#34d399",
		interruptible: false,
	},
	{
		label: "5. Commit Phase — Effects",
		description:
			"useLayoutEffect runs synchronously. Then useEffect runs asynchronously after paint.",
		nodes: ["useLayoutEffect", "paint", "useEffect"],
		color: "#f472b6",
		interruptible: false,
	},
];

export function PhasesDemo() {
	const [step, setStep] = useState(-1);
	const [paused, setPaused] = useState(false);

	const advance = () => {
		if (paused) {
			setPaused(false);
			return;
		}
		if (step < PHASES.length - 1) {
			const nextStep = step + 1;
			setStep(nextStep);
			if (PHASES[nextStep].interruptible) {
				setPaused(true);
			}
		}
	};

	const reset = () => {
		setStep(-1);
		setPaused(false);
	};

	return (
		<DemoSection
			title="Demo 2: Render vs Commit Phase"
			description="Step through the reconciliation pipeline. Notice which phases can be paused (interruptible)."
		>
			{/* Controls */}
			<div className="flex gap-3 mb-6">
				<button
					type="button"
					onClick={advance}
					disabled={step >= PHASES.length - 1 && !paused}
					className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-500/20 text-accent-violet border border-violet-500/30 hover:bg-violet-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
				>
					{step === -1
						? "▶ Start"
						: paused
							? "▶ Resume (interruptible!)"
							: "▶ Next Step"}
				</button>
				<button
					type="button"
					onClick={reset}
					className="px-4 py-2 rounded-lg text-sm font-medium bg-surface-secondary text-text-tertiary border border-border-secondary hover:text-text-secondary transition-colors"
				>
					↺ Reset
				</button>
			</div>

			{/* Phase timeline */}
			<div className="space-y-3">
				{PHASES.map((phase, i) => {
					const isActive = i === step;
					const isPast = i < step;
					const isFuture = i > step;

					return (
						<motion.div
							key={phase.label}
							animate={{
								opacity: isFuture ? 0.3 : 1,
								scale: isActive ? 1.01 : 1,
							}}
							transition={{ duration: 0.3 }}
							className={`p-4 rounded-lg border relative overflow-hidden ${
								isActive
									? "border-white/20 bg-surface-secondary"
									: isPast
										? "border-border-secondary/50 bg-surface-secondary/30"
										: "border-border-primary bg-surface-primary/30"
							}`}
						>
							{/* Glow line for active phase */}
							{isActive && (
								<motion.div
									className="absolute left-0 top-0 bottom-0 w-1 rounded-full"
									style={{ backgroundColor: phase.color }}
									layoutId="phase-indicator"
								/>
							)}

							<div className="flex items-start justify-between gap-4 pl-3">
								<div>
									<div className="flex items-center gap-2">
										<span
											className="text-sm font-semibold"
											style={{
												color:
													isActive || isPast
														? phase.color
														: "var(--svg-text-muted)",
											}}
										>
											{phase.label}
										</span>
										{phase.interruptible && (
											<span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-accent-blue-soft border border-blue-500/20">
												INTERRUPTIBLE
											</span>
										)}
										{!phase.interruptible && isActive && (
											<span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-accent-red-soft border border-red-500/20">
												SYNCHRONOUS
											</span>
										)}
									</div>
									<p className="text-xs text-text-tertiary mt-1">
										{phase.description}
									</p>
								</div>
							</div>

							{/* Affected nodes */}
							{(isActive || isPast) && (
								<motion.div
									initial={{ height: 0, opacity: 0 }}
									animate={{ height: "auto", opacity: 1 }}
									className="flex flex-wrap gap-1.5 mt-3 pl-3"
								>
									{phase.nodes.map((node) => (
										<span
											key={node}
											className="px-2 py-1 text-xs rounded font-mono border"
											style={{
												borderColor: `${phase.color}44`,
												backgroundColor: `${phase.color}11`,
												color: phase.color,
											}}
										>
											{node}
										</span>
									))}
								</motion.div>
							)}

							{/* Paused overlay */}
							{isActive && paused && (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									className="mt-3 pl-3 text-xs text-accent-blue-soft flex items-center gap-2"
								>
									<span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
									Paused — browser can handle events & paint frames here
								</motion.div>
							)}
						</motion.div>
					);
				})}
			</div>
		</DemoSection>
	);
}
