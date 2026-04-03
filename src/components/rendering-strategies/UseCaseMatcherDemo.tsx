import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
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
		<div className="space-y-6">
			{/* Strategy pills — live elimination view */}
			<div className="flex flex-wrap gap-2 items-center">
				<span className="text-xs text-text-muted mr-1">Candidates:</span>
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
					const eliminated_by_this =
						answered && answerValue !== undefined
							? answerValue
								? q.eliminatedOnYes
								: q.eliminatedOnNo
							: [];

					return (
						<motion.div
							key={q.id}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							className={clsx(
								"rounded-xl border p-4 space-y-3 transition-colors",
								isPast && answered
									? "border-border-primary bg-surface-primary/30"
									: "border-violet-500/30 bg-violet-500/5",
							)}
						>
							<div className="flex items-start gap-3">
								<span className="text-xs font-bold text-text-faint w-5 shrink-0 mt-0.5">
									Q{i + 1}
								</span>
								<p className="text-sm text-text-secondary font-medium">
									{q.text}
								</p>
							</div>

							{!answered && isCurrent && (
								<div className="flex gap-3 pl-8">
									<button
										type="button"
										onClick={() => answer(q.id, true)}
										className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold bg-green-500/15 text-accent-green-soft border border-green-500/30 hover:bg-green-500/25 transition-colors text-left"
									>
										✅ {q.yesLabel}
									</button>
									<button
										type="button"
										onClick={() => answer(q.id, false)}
										className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold bg-surface-secondary text-text-secondary border border-border-secondary hover:bg-surface-tertiary transition-colors text-left"
									>
										❌ {q.noLabel}
									</button>
								</div>
							)}

							{answered && (
								<div className="pl-8 space-y-2">
									<div className="flex gap-2 items-center flex-wrap">
										<span
											className={clsx(
												"text-xs px-2 py-0.5 rounded font-semibold",
												answerValue
													? "bg-green-500/15 text-accent-green-soft"
													: "bg-surface-tertiary text-text-secondary",
											)}
										>
											{answerValue ? `✅ ${q.yesLabel}` : `❌ ${q.noLabel}`}
										</span>
										{eliminated_by_this.length > 0 && (
											<span className="text-[10px] text-text-muted">
												→ eliminated:{" "}
												{eliminated_by_this.map((s) => (
													<span
														key={s}
														className="font-bold line-through"
														style={{ color: STRATEGY_COLORS[s] }}
													>
														{s}{" "}
													</span>
												))}
											</span>
										)}
									</div>
									{explain && (
										<p className="text-xs text-text-tertiary leading-relaxed">
											{explain}
										</p>
									)}
								</div>
							)}
						</motion.div>
					);
				})}
			</div>

			{/* Result */}
			<AnimatePresence>
				{isComplete && (
					<motion.div
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0 }}
						className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-5 space-y-3"
					>
						{remaining.length === 0 ? (
							<>
								<p className="text-sm font-semibold text-accent-amber-soft">
									⚠️ All strategies eliminated
								</p>
								<p className="text-xs text-text-tertiary">
									Your requirements are very strict. In practice, you'd likely
									use SSR or CSR with careful architecture (e.g., edge SSR +
									client-side real-time updates), depending on your performance
									vs. freshness trade-off.
								</p>
							</>
						) : (
							<>
								<p className="text-sm font-semibold text-text-secondary">
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
								<p className="text-xs text-text-muted">
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
						className="text-xs text-text-muted hover:text-text-secondary transition-colors underline"
					>
						↩ Start over
					</button>
				</motion.div>
			)}
		</div>
	);
}
