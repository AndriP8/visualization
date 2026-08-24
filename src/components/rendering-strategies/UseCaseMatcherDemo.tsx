import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ALL_STRATEGIES, STRATEGY_COLORS, type Strategy } from "./constants";

interface Question {
	id: string;
	text: string;
	yesLabel: string;
	noLabel: string;
	/** Strategies eliminated if user answers YES */
	eliminatedOnYes: Strategy[];
	/** Strategies eliminated if user answers NO */
	eliminatedOnNo: Strategy[];
	yesExplain: string;
	noExplain: string;
}

const QUESTIONS: Question[] = [
	{
		id: "q1",
		text: "Does your page need user-specific (personalized) data?",
		yesLabel: "Yes — user dashboard, profile, feeds",
		noLabel: "No — same content for everyone",
		eliminatedOnYes: ["SSG", "ISR"],
		eliminatedOnNo: [],
		yesExplain:
			"SSG and ISR pre-render a single shared HTML page for all users. They cannot embed per-user data into the initial HTML. For personalized pages you need SSR, CSR, or Streaming SSR.",
		noExplain:
			"All strategies are still in play — no personalization means static rendering is a valid choice.",
	},
	{
		id: "q2",
		text: "Is SEO critical? (e.g., marketing site, blog, landing page)",
		yesLabel: "Yes — search rankings matter",
		noLabel: "No — behind auth, internal tool, or app",
		eliminatedOnYes: ["CSR"],
		eliminatedOnNo: [],
		yesExplain:
			"Pure CSR delivers an empty HTML shell to crawlers. While Googlebot executes JS, the indexing is delayed and unreliable. For SEO-critical content, you need HTML in the server response.",
		noExplain:
			"CSR stays in the running. Apps behind authentication or internal tools don't need search visibility.",
	},
	{
		id: "q3",
		text: "Does your content change more often than every few minutes?",
		yesLabel: "Yes — real-time prices, live scores, breaking news",
		noLabel: "No — content changes once a day or slower",
		eliminatedOnYes: ["SSG"],
		eliminatedOnNo: [],
		yesExplain:
			"SSG requires a full rebuild to update content. For frequently-changing data, ISR (automatic revalidation) or SSR (per-request rendering) is more appropriate. ISR is borderline — its `revalidate` interval can go as low as 1 second but adds CDN staleness.",
		noExplain:
			"SSG and ISR are still valid. If content changes daily or slower, the build + CDN cache cycle works well.",
	},
	{
		id: "q4",
		text: "Do you need real-time or freshly-fetched data on every page load?",
		yesLabel: "Yes — prices, inventory, live chat",
		noLabel: "No — content is relatively static between loads",
		eliminatedOnYes: ["ISR"],
		eliminatedOnNo: [],
		yesExplain:
			"ISR serves a cached (potentially stale) page — the requesting user always sees the version from the last regeneration cycle. For truly fresh-per-request data, use SSR or Streaming SSR. CSR with client-side fetching is also an option.",
		noExplain:
			"ISR stays — its stale-while-revalidate model works well when serving data that was fresh within the last revalidation window is acceptable.",
	},
];

interface UseCaseMatcherDemoProps {
	onEliminatedChange: (eliminated: Set<Strategy>) => void;
}

export function UseCaseMatcherDemo({
	onEliminatedChange,
}: UseCaseMatcherDemoProps) {
	const [answers, setAnswers] = useState<Record<string, boolean>>({});
	const [currentStep, setCurrentStep] = useState(0);

	// Computed eliminated set from all answers so far
	const eliminated = new Set<Strategy>();
	for (const q of QUESTIONS) {
		const answer = answers[q.id];
		if (answer === true) {
			for (const s of q.eliminatedOnYes) eliminated.add(s);
		} else if (answer === false) {
			for (const s of q.eliminatedOnNo) eliminated.add(s);
		}
	}

	const remaining = ALL_STRATEGIES.filter((s) => !eliminated.has(s));
	const isComplete = currentStep >= QUESTIONS.length;

	function answer(qId: string, value: boolean) {
		setAnswers((prev) => {
			const newAnswers = { ...prev, [qId]: value };

			// Recompute and propagate eliminated strategies immediately
			const newEliminated = new Set<Strategy>();
			for (const q of QUESTIONS) {
				const a = newAnswers[q.id];
				if (a === true) {
					for (const s of q.eliminatedOnYes) newEliminated.add(s);
				} else if (a === false) {
					for (const s of q.eliminatedOnNo) newEliminated.add(s);
				}
			}
			onEliminatedChange(newEliminated);

			return newAnswers;
		});
		setCurrentStep((s) => s + 1);
	}

	function reset() {
		setAnswers({});
		setCurrentStep(0);
		onEliminatedChange(new Set());
	}

	return (
		<DemoSection
			title="Demo 4: Use Case Matcher"
			description="Answer 4 yes/no questions about your project. Strategies that can't satisfy your requirements are eliminated — and dimmed on the Timeline above — until only the best fit remains."
		>
			<div className="space-y-6">
				{/* Strategy pills — live elimination view */}
				<div className="flex flex-wrap gap-2 items-center">
					<span className="text-xs text-zinc-500 mr-1">Candidates:</span>
					{ALL_STRATEGIES.map((s) => (
						<motion.span
							key={s}
							animate={{
								opacity: eliminated.has(s) ? 0.25 : 1,
								scale: eliminated.has(s) ? 0.9 : 1,
							}}
							transition={{ duration: 0.3 }}
							className={clsx(
								"text-xs font-bold px-2 py-0.5 rounded-full",
								eliminated.has(s) ? "line-through" : "",
							)}
							style={{
								color: STRATEGY_COLORS[s],
								backgroundColor: `${STRATEGY_COLORS[s]}15`,
							}}
						>
							{eliminated.has(s) ? "✗" : "✓"} {s}
						</motion.span>
					))}
				</div>

				{/* Questions */}
				<div className="space-y-3">
					{QUESTIONS.map((q, i) => {
						const answered = q.id in answers;
						const answerValue = answers[q.id];
						const isCurrent = i === currentStep;
						const isPast = i < currentStep;

						if (!isCurrent && !isPast) return null;

						const explain =
							answered && answerValue !== undefined
								? answerValue
									? q.yesExplain
									: q.noExplain
								: null;

						return (
							<div
								key={q.id}
								className={clsx(
									"rounded-xl border p-4 transition-all duration-300",
									isCurrent
										? "border-violet-500/60 bg-zinc-800/80 shadow-lg shadow-violet-500/10"
										: "border-zinc-800 bg-zinc-900/40",
								)}
							>
								{/* Question header */}
								<div className="flex items-center gap-2 mb-3">
									<span
										className={clsx(
											"w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0",
											answered
												? "bg-zinc-700 text-zinc-300"
												: "bg-violet-600 text-white",
										)}
									>
										{i + 1}
									</span>
									<span className="text-sm font-semibold text-zinc-200">
										{q.text}
									</span>
								</div>

								{/* Yes/No Buttons */}
								{!answered && (
									<div className="flex flex-wrap gap-2 pl-7">
										<button
											type="button"
											onClick={() => answer(q.id, true)}
											className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-700 hover:bg-emerald-600/30 hover:border-emerald-500/50 hover:text-emerald-300 text-zinc-300 border border-zinc-600 transition-all"
										>
											{q.yesLabel}
										</button>
										<button
											type="button"
											onClick={() => answer(q.id, false)}
											className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-700 hover:bg-zinc-600 text-zinc-300 border border-zinc-600 transition-all"
										>
											{q.noLabel}
										</button>
									</div>
								)}

								{/* Answer summary */}
								{answered && (
									<div className="pl-7 space-y-1.5">
										<div className="flex items-center gap-2">
											<span
												className={clsx(
													"text-xs font-bold px-2 py-0.5 rounded",
													answerValue
														? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
														: "bg-zinc-700/60 text-zinc-400 border border-zinc-600/30",
												)}
											>
												{answerValue ? "YES" : "NO"}
											</span>
											<span className="text-xs text-zinc-400">
												{answerValue ? q.yesLabel : q.noLabel}
											</span>
										</div>
										{explain && (
											<p className="text-xs text-zinc-500 leading-relaxed">
												{explain}
											</p>
										)}
									</div>
								)}
							</div>
						);
					})}
				</div>

				{/* Result / Recommendation */}
				<AnimatePresence>
					{isComplete && (
						<motion.div
							initial={{ opacity: 0, scale: 0.96 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0 }}
							className="rounded-xl border border-violet-500/40 bg-violet-500/10 p-5 space-y-3"
						>
							{remaining.length === 0 ? (
								<p className="text-sm text-zinc-400">
									No single strategy perfectly matches all requirements.
									Consider a hybrid architecture (e.g., SSG marketing + CSR
									authenticated app).
								</p>
							) : (
								<>
									<p className="text-sm font-semibold text-zinc-200">
										🎯 Best fit for your use case:
									</p>
									<div className="flex flex-wrap gap-2">
										{remaining.map((s) => (
											<span
												key={s}
												className="px-3 py-1.5 rounded-lg text-sm font-bold"
												style={{
													color: STRATEGY_COLORS[s],
													backgroundColor: `${STRATEGY_COLORS[s]}20`,
													border: `1px solid ${STRATEGY_COLORS[s]}40`,
												}}
											>
												✓ {s}
											</span>
										))}
									</div>
									<p className="text-xs text-zinc-500">
										💡 The Timeline Comparison above dims the eliminated
										strategies so you can focus on what fits.
									</p>
								</>
							)}
						</motion.div>
					)}
				</AnimatePresence>

				{/* Reset */}
				{currentStep > 0 && (
					<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
						<button
							type="button"
							onClick={reset}
							className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors underline"
						>
							↩ Start over
						</button>
					</motion.div>
				)}
			</div>
		</DemoSection>
	);
}
