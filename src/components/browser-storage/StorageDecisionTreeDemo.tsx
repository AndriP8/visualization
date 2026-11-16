import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";
import {
	STORAGE_QUESTIONS,
	STORAGE_RECOMMENDATIONS,
	type StorageAnswer,
	type StorageApiId,
} from "./storageModel";

export function StorageDecisionTreeDemo() {
	const [currentQuestion, setCurrentQuestion] = useState("start");
	const [answers, setAnswers] = useState<Record<string, StorageAnswer>>({});
	const [finalResult, setFinalResult] = useState<StorageApiId | null>(null);

	const question = STORAGE_QUESTIONS[currentQuestion];
	const result = finalResult ? STORAGE_RECOMMENDATIONS[finalResult] : null;

	const handleAnswer = (answer: StorageAnswer) => {
		setAnswers((previous) => ({ ...previous, [currentQuestion]: answer }));

		const nextKey = answer === "yes" ? question.yesNext : question.noNext;

		if (nextKey === "result") {
			const resultKey =
				answer === "yes" ? question.yesResult : question.noResult;
			if (resultKey) setFinalResult(resultKey);
			return;
		}

		setCurrentQuestion(nextKey);
	};

	const reset = () => {
		setCurrentQuestion("start");
		setAnswers({});
		setFinalResult(null);
	};

	return (
		<DemoSection
			title="Demo 11: Which storage API should you use?"
			description="Answer a few questions about what you need to store and get a recommendation, with the code to get started."
		>
			<div className="space-y-6">
				<div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
					<AnimatePresence mode="wait">
						{!result ? (
							<motion.div
								key={currentQuestion}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -20 }}
								className="w-full max-w-2xl"
							>
								<div className="mb-8 flex items-center justify-center gap-2">
									{Object.keys(STORAGE_QUESTIONS).map((id, index, all) => {
										const answered = answers[id] !== undefined;
										const current = id === currentQuestion;
										return (
											<div key={id} className="flex items-center gap-2">
												<div
													className={`h-2 w-2 rounded-full transition-colors ${
														answered
															? "bg-emerald-400"
															: current
																? "bg-orange-400 animate-pulse"
																: "bg-zinc-700"
													}`}
												/>
												{index < all.length - 1 && (
													<div className="h-0.5 w-8 bg-zinc-700" />
												)}
											</div>
										);
									})}
								</div>

								<h3 className="mb-8 text-center text-2xl font-semibold text-white">
									{question.text}
								</h3>

								<div className="grid grid-cols-2 gap-4">
									<button
										type="button"
										onClick={() => handleAnswer("yes")}
										className="rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 px-8 py-6 text-lg font-semibold text-emerald-300 transition-all hover:bg-emerald-500/20"
									>
										✓ Yes
									</button>
									<button
										type="button"
										onClick={() => handleAnswer("no")}
										className="rounded-xl border-2 border-rose-500/40 bg-rose-500/10 px-8 py-6 text-lg font-semibold text-rose-300 transition-all hover:bg-rose-500/20"
									>
										✗ No
									</button>
								</div>
							</motion.div>
						) : (
							<motion.div
								key="result"
								initial={{ opacity: 0, scale: 0.95 }}
								animate={{ opacity: 1, scale: 1 }}
								className="w-full max-w-2xl"
							>
								<div className="mb-6 text-center">
									<div className="mb-3 text-5xl">{result.icon}</div>
									<h3 className="text-3xl font-bold text-white">
										{result.headline}
									</h3>
									<p className="mt-2 text-zinc-400">{result.description}</p>
								</div>

								<div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
									<h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
										Common use cases
									</h4>
									<div className="grid gap-2 sm:grid-cols-2">
										{result.useCases.map((useCase) => (
											<div
												key={useCase}
												className="flex items-center gap-2 text-sm text-zinc-300"
											>
												<span className="text-orange-400">•</span>
												<span>{useCase}</span>
											</div>
										))}
									</div>
								</div>

								<ShikiCode
									language="javascript"
									code={result.code}
									showLineNumbers={false}
									className="text-xs"
								/>

								<button
									type="button"
									onClick={reset}
									className="mt-6 w-full rounded-lg bg-orange-600 py-3 font-semibold text-white transition-colors hover:bg-orange-500"
								>
									↺ Start Over
								</button>
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				{!result ? (
					<div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-5">
						<h4 className="mb-3 text-sm font-semibold text-white">
							Quick guide
						</h4>
						<div className="space-y-2 text-sm text-zinc-400">
							<div className="flex gap-2">
								<span className="text-amber-400">🍪</span>
								<span>
									<strong className="text-white">Cookie:</strong> the server has
									to read it on its own
								</span>
							</div>
							<div className="flex gap-2">
								<span className="text-orange-400">💾</span>
								<span>
									<strong className="text-white">localStorage:</strong> small
									values that outlive the tab
								</span>
							</div>
							<div className="flex gap-2">
								<span className="text-cyan-400">🕒</span>
								<span>
									<strong className="text-white">sessionStorage:</strong>{" "}
									temporary values for one tab
								</span>
							</div>
							<div className="flex gap-2">
								<span className="text-sky-400">🗄️</span>
								<span>
									<strong className="text-white">IndexedDB:</strong> structured
									records and large datasets
								</span>
							</div>
							<div className="flex gap-2">
								<span className="text-emerald-400">📦</span>
								<span>
									<strong className="text-white">Cache API:</strong> whole
									responses keyed by URL
								</span>
							</div>
						</div>
					</div>
				) : null}
			</div>
		</DemoSection>
	);
}
