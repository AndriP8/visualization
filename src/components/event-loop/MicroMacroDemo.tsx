import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

const CODE_LINES = [
	"setTimeout(() => console.log('timeout'), 0);",
	"Promise.resolve().then(() => console.log('promise'));",
	"queueMicrotask(() => console.log('microtask'));",
	"console.log('sync');",
];

const CORRECT_ORDER = ["sync", "promise", "microtask", "timeout"];

const CHOICES = [
	{ id: "sync", label: "sync", color: "#6366f1" },
	{ id: "promise", label: "promise", color: "#22d3ee" },
	{ id: "microtask", label: "microtask", color: "#22d3ee" },
	{ id: "timeout", label: "timeout", color: "#f97316" },
];

interface RevealStep {
	output: string[];
	description: string;
	category: string;
}

const REVEAL_STEPS: RevealStep[] = [
	{
		output: [],
		description:
			"The engine reads all 4 lines top-to-bottom synchronously. setTimeout registers a macrotask, Promise.then and queueMicrotask register microtasks. console.log('sync') runs immediately.",
		category: "",
	},
	{
		output: ["sync"],
		description:
			"console.log('sync') runs synchronously — it's regular call stack execution. This always runs first.",
		category: "Synchronous",
	},
	{
		output: ["sync", "promise"],
		description:
			"Call stack is empty → drain ALL microtasks. Promise.resolve().then() callback runs. Microtasks have higher priority than macrotasks.",
		category: "Microtask",
	},
	{
		output: ["sync", "microtask"],
		description:
			"Still draining microtasks! queueMicrotask() callback runs next. ALL microtasks drain before any macrotask.",
		category: "Microtask",
	},
	{
		output: ["sync", "promise", "microtask", "timeout"],
		description:
			"Microtask queue empty → pick ONE macrotask. setTimeout(fn, 0) callback finally runs. Even with 0ms delay, it waits for all microtasks.",
		category: "Macrotask",
	},
];

const CATEGORY_COLORS: Record<string, string> = {
	Synchronous: "#6366f1",
	Microtask: "#22d3ee",
	Macrotask: "#f97316",
};

export function MicroMacroDemo() {
	const [userPrediction, setUserPrediction] = useState<string[]>([]);
	const [phase, setPhase] = useState<"predict" | "reveal">("predict");
	const [revealStep, setRevealStep] = useState(0);

	const addPrediction = useCallback(
		(id: string) => {
			if (phase !== "predict") return;
			if (userPrediction.includes(id)) {
				setUserPrediction(userPrediction.filter((p) => p !== id));
			} else if (userPrediction.length < 4) {
				setUserPrediction([...userPrediction, id]);
			}
		},
		[phase, userPrediction],
	);

	const startReveal = () => {
		setPhase("reveal");
		setRevealStep(0);
	};

	const nextReveal = () => {
		if (revealStep < REVEAL_STEPS.length - 1) setRevealStep(revealStep + 1);
	};
	const prevReveal = () => {
		if (revealStep > 0) setRevealStep(revealStep - 1);
	};

	const resetAll = () => {
		setUserPrediction([]);
		setPhase("predict");
		setRevealStep(0);
	};

	const isCorrect =
		userPrediction.length === 4 &&
		userPrediction.every((p, i) => p === CORRECT_ORDER[i]);

	const currentReveal = REVEAL_STEPS[revealStep];

	return (
		<DemoSection
			title="Demo 3: Microtask vs Macrotask Priority"
			description="Predict the output order, then step through to see the actual execution. Can you get it right?"
		>
			{/* Code */}
			<div className="mb-5">
				<div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
					What&apos;s the console output order?
				</div>
				<ShikiCode code={CODE_LINES.join("\n")} language="javascript" />
			</div>

			<div className="flex flex-col lg:flex-row gap-6">
				{/* Prediction area */}
				<div className="flex-1">
					<div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
						{phase === "predict"
							? "Click to predict the order:"
							: "Your prediction:"}
					</div>

					{/* Available choices */}
					{phase === "predict" && (
						<div className="flex flex-wrap gap-2 mb-4">
							{CHOICES.map((choice) => {
								const index = userPrediction.indexOf(choice.id);
								const isSelected = index >= 0;
								return (
									<button
										key={choice.id}
										type="button"
										onClick={() => addPrediction(choice.id)}
										className={`px-3 py-2 rounded-lg text-sm font-mono transition-all border ${
											isSelected
												? "border-emerald-500/50 bg-emerald-500/10 text-accent-emerald"
												: "border-border-secondary bg-surface-secondary text-text-tertiary hover:text-text-secondary hover:border-border-tertiary"
										}`}
									>
										{isSelected && (
											<span className="text-accent-emerald-soft mr-1.5 font-semibold">
												{index + 1}.
											</span>
										)}
										{choice.label}
									</button>
								);
							})}
						</div>
					)}

					{/* Prediction result */}
					<div className="flex gap-2 items-center mb-3">
						{userPrediction.map((p) => (
							<motion.div
								key={p}
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{ opacity: 1, scale: 1 }}
								className="px-2 py-1 rounded text-xs font-mono bg-surface-secondary text-text-secondary border border-border-secondary"
							>
								<span className="text-text-muted mr-1">
									{userPrediction.indexOf(p) + 1}.
								</span>
								{p}
							</motion.div>
						))}
						{userPrediction.length === 0 && (
							<span className="text-xs text-text-faint">
								Click the options above in order
							</span>
						)}
					</div>

					{phase === "predict" && userPrediction.length === 4 && (
						<div className="flex gap-3 items-center">
							<button
								type="button"
								onClick={startReveal}
								className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500/20 text-accent-emerald border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
							>
								Check & Reveal →
							</button>
							{isCorrect ? (
								<span className="text-sm text-accent-emerald-soft font-medium">
									✓ Correct!
								</span>
							) : (
								<span className="text-sm text-accent-amber-soft font-medium">
									✗ Not quite — let&apos;s see why
								</span>
							)}
						</div>
					)}
				</div>

				{/* Reveal area */}
				{phase === "reveal" && (
					<div className="flex-1">
						<div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
							Actual Execution
						</div>

						{/* Output */}
						<div className="p-3 rounded-lg bg-surface-primary border border-border-primary min-h-20 mb-4">
							<AnimatePresence>
								{currentReveal.output.map((out) => {
									const catColor =
										out === "sync"
											? "#6366f1"
											: out === "timeout"
												? "#f97316"
												: "#22d3ee";
									return (
										<motion.div
											key={out}
											initial={{ opacity: 0, x: -5 }}
											animate={{ opacity: 1, x: 0 }}
											className="text-xs font-mono flex items-center gap-2 py-0.5"
										>
											<span className="text-text-faint">{">"}</span>
											<span style={{ color: catColor }}>{out}</span>
										</motion.div>
									);
								})}
							</AnimatePresence>
							{currentReveal.output.length === 0 && (
								<span className="text-xs text-text-faint font-mono">
									(no output yet)
								</span>
							)}
						</div>

						{/* Category badge */}
						{currentReveal.category && (
							<motion.span
								key={revealStep}
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
								className="inline-block px-2 py-1 rounded text-xs font-semibold mb-3 border"
								style={{
									color:
										CATEGORY_COLORS[currentReveal.category] ||
										"var(--svg-text)",
									borderColor: `${CATEGORY_COLORS[currentReveal.category] || "var(--svg-border)"}44`,
									backgroundColor: `${CATEGORY_COLORS[currentReveal.category] || "var(--svg-border)"}15`,
								}}
							>
								{currentReveal.category}
							</motion.span>
						)}
					</div>
				)}
			</div>

			{/* Reveal controls */}
			{phase === "reveal" && (
				<>
					<div className="flex items-center gap-3 mt-5">
						<button
							type="button"
							onClick={prevReveal}
							disabled={revealStep <= 0}
							className="px-4 py-2 rounded-lg text-sm font-medium bg-surface-secondary text-text-tertiary border border-border-secondary hover:text-text-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
						>
							← Back
						</button>
						<button
							type="button"
							onClick={nextReveal}
							disabled={revealStep >= REVEAL_STEPS.length - 1}
							className="px-4 py-2 rounded-lg text-sm font-medium bg-cyan-500/20 text-accent-cyan border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
						>
							Next →
						</button>
						<button
							type="button"
							onClick={resetAll}
							className="px-4 py-2 rounded-lg text-sm font-medium bg-surface-secondary text-text-tertiary border border-border-secondary hover:text-text-secondary transition-colors"
						>
							↺ Try Again
						</button>
						<span className="text-xs text-text-faint ml-auto">
							Step {revealStep + 1} / {REVEAL_STEPS.length}
						</span>
					</div>

					<motion.div
						key={revealStep}
						initial={{ opacity: 0, y: 5 }}
						animate={{ opacity: 1, y: 0 }}
						className="mt-4 p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20 text-sm text-accent-cyan"
					>
						{currentReveal.description}
					</motion.div>
				</>
			)}

			{/* Rule callout */}
			{phase === "reveal" && revealStep === REVEAL_STEPS.length - 1 && (
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					className="mt-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30"
				>
					<p className="text-sm font-semibold text-accent-emerald mb-1">
						🔑 The Rule
					</p>
					<p className="text-sm text-emerald-200/80">
						Microtasks <strong>always drain completely</strong> before the next
						macrotask. <code className="text-accent-cyan">Promise.then</code>{" "}
						and <code className="text-accent-cyan">queueMicrotask</code> run
						before <code className="text-accent-orange">setTimeout(fn, 0)</code>{" "}
						— even though setTimeout was registered first.
					</p>
				</motion.div>
			)}
		</DemoSection>
	);
}
