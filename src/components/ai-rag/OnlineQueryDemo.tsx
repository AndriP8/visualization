import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { DemoSection } from "../shared/DemoSection";

type Chunk = {
	id: string;
	text: string;
	annScore: number;
	rerankScore: number;
};

const USER_QUERY = "How long do I have to ask for a refund?";

const QUERY_VECTOR = [0.79, -0.15, 0.42, 0.09, -0.31];

// pre-baked: ANN returns top-5 by cosine similarity; reranker re-orders by true relevance
const CANDIDATES: Chunk[] = [
	{
		id: "c1",
		text: "Customers may request a refund within 30 days of purchase.",
		annScore: 0.94,
		rerankScore: 0.98,
	},
	{
		id: "c2",
		text: "Refunds are issued to the original payment method within 5 business days.",
		annScore: 0.91,
		rerankScore: 0.62,
	},
	{
		id: "c4",
		text: "Prorated refunds are not offered for partial months.",
		annScore: 0.78,
		rerankScore: 0.41,
	},
	{
		id: "c7",
		text: "Refund eligibility excludes digital downloads after first access.",
		annScore: 0.72,
		rerankScore: 0.55,
	},
	{
		id: "c3",
		text: "Subscription cancellations take effect at the end of the current billing cycle.",
		annScore: 0.51,
		rerankScore: 0.18,
	},
];

type Stage =
	| "idle"
	| "embedding"
	| "searching"
	| "reranking"
	| "assembling"
	| "generating"
	| "done";

const STAGES: { key: Stage; label: string }[] = [
	{ key: "embedding", label: "1. Embed query" },
	{ key: "searching", label: "2. ANN search" },
	{ key: "reranking", label: "3. Rerank" },
	{ key: "assembling", label: "4. Assemble prompt" },
	{ key: "generating", label: "5. LLM generates" },
];

export function OnlineQueryDemo() {
	const [stage, setStage] = useState<Stage>("idle");
	const [useReranker, setUseReranker] = useState(true);
	const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

	function reset() {
		timeouts.current.forEach(clearTimeout);
		timeouts.current = [];
		setStage("idle");
	}

	function run() {
		reset();
		const seq: Stage[] = useReranker
			? [
					"embedding",
					"searching",
					"reranking",
					"assembling",
					"generating",
					"done",
				]
			: ["embedding", "searching", "assembling", "generating", "done"];

		let t = 0;
		seq.forEach((s) => {
			t += 700;
			timeouts.current.push(setTimeout(() => setStage(s), t));
		});
	}

	useEffect(() => () => timeouts.current.forEach(clearTimeout), []);

	const showResults =
		stage === "searching" ||
		stage === "reranking" ||
		stage === "assembling" ||
		stage === "generating" ||
		stage === "done";

	const showRerankedOrder =
		useReranker &&
		(stage === "reranking" ||
			stage === "assembling" ||
			stage === "generating" ||
			stage === "done");

	const orderedCandidates = showRerankedOrder
		? [...CANDIDATES].sort((a, b) => b.rerankScore - a.rerankScore)
		: CANDIDATES;

	const topK = orderedCandidates.slice(0, 3);

	const showPrompt =
		stage === "assembling" || stage === "generating" || stage === "done";
	const showOutput = stage === "generating" || stage === "done";

	return (
		<DemoSection
			title="Demo 2: Online Query Pipeline"
			description="What happens on every user request: embed → search → (optional rerank) → assemble prompt → generate. The reranker is optional but typically lifts precision when the embedding model is noisy."
		>
			<div className="space-y-6">
				{/* Stages */}
				<div className="flex flex-wrap gap-2">
					{STAGES.filter((s) => useReranker || s.key !== "reranking").map(
						(s) => {
							const order: Stage[] = useReranker
								? [
										"embedding",
										"searching",
										"reranking",
										"assembling",
										"generating",
										"done",
									]
								: [
										"embedding",
										"searching",
										"assembling",
										"generating",
										"done",
									];
							const currentIdx = order.indexOf(stage);
							const myIdx = order.indexOf(s.key);
							const active = stage === s.key;
							const passed = currentIdx > myIdx && currentIdx >= 0;
							return (
								<div
									key={s.key}
									className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
										active
											? "border-violet-500/60 bg-violet-500/10 text-violet-200"
											: passed
												? "border-emerald-500/40 bg-emerald-500/5 text-emerald-300"
												: "border-zinc-800 bg-zinc-900 text-zinc-500"
									}`}
								>
									{s.label}
								</div>
							);
						},
					)}
				</div>

				<div className="grid lg:grid-cols-2 gap-4">
					{/* Query side */}
					<div className="space-y-3">
						<div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
							<p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
								User query
							</p>
							<p className="text-sm text-zinc-200">"{USER_QUERY}"</p>
							{stage !== "idle" && (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									className="text-cyan-400/70 font-mono mt-2 text-[10px]"
								>
									[{QUERY_VECTOR.map((v) => v.toFixed(2)).join(", ")}, …]
								</motion.div>
							)}
						</div>

						{/* Retrieved candidates */}
						<div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
							<p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
								{showRerankedOrder
									? "After reranking"
									: showResults
										? "ANN candidates (cosine)"
										: "Vector DB"}
							</p>
							<div className="space-y-1.5">
								<AnimatePresence mode="popLayout">
									{(showResults ? orderedCandidates : []).map((c, i) => {
										const inTopK = i < 3;
										const score = showRerankedOrder
											? c.rerankScore
											: c.annScore;
										return (
											<motion.div
												key={c.id}
												layout
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												transition={{ duration: 0.3 }}
												className={`flex items-start gap-3 text-xs rounded border px-2 py-1.5 ${
													inTopK
														? "border-emerald-500/40 bg-emerald-500/5"
														: "border-zinc-800 bg-zinc-900/50 opacity-50"
												}`}
											>
												<span className="text-violet-300 font-mono">
													{c.id}
												</span>
												<span className="flex-1 text-zinc-300">{c.text}</span>
												<span
													className={`font-mono ${
														showRerankedOrder
															? "text-emerald-300"
															: "text-cyan-300"
													}`}
												>
													{score.toFixed(2)}
												</span>
											</motion.div>
										);
									})}
								</AnimatePresence>
								{!showResults && (
									<p className="text-xs text-zinc-600 italic">
										waiting for query…
									</p>
								)}
							</div>
							{showRerankedOrder && (
								<p className="text-[11px] text-zinc-500 mt-2">
									Reranker demoted{" "}
									<span className="font-mono text-zinc-400">c2</span> — high
									cosine but answers "how long until refund arrives", not "how
									long to request one".
								</p>
							)}
						</div>
					</div>

					{/* Output side */}
					<div className="space-y-3">
						<div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 min-h-[180px]">
							<p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
								Assembled prompt
							</p>
							{showPrompt ? (
								<motion.pre
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									className="text-[11px] text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed"
								>
									{`Answer the question using only the context below.

<context>
${topK.map((c) => `- ${c.text}`).join("\n")}
</context>

Question: ${USER_QUERY}`}
								</motion.pre>
							) : (
								<p className="text-xs text-zinc-600 italic">
									prompt not assembled yet…
								</p>
							)}
						</div>

						<div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 min-h-[80px]">
							<p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
								LLM output
							</p>
							{showOutput ? (
								<motion.p
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									className="text-sm text-emerald-300"
								>
									You have 30 days from your purchase date to request a refund.
								</motion.p>
							) : (
								<p className="text-xs text-zinc-600 italic">
									waiting for context…
								</p>
							)}
						</div>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-3">
					<button
						type="button"
						onClick={run}
						disabled={stage !== "idle" && stage !== "done"}
						className="px-4 py-2 rounded-lg bg-violet-700 hover:bg-violet-600 disabled:opacity-40 text-white text-sm font-medium transition-colors"
					>
						{stage === "idle"
							? "Run query"
							: stage === "done"
								? "Run again"
								: "Running…"}
					</button>
					{stage !== "idle" && (
						<button
							type="button"
							onClick={reset}
							className="px-4 py-2 rounded-lg border border-zinc-700 hover:border-zinc-500 text-zinc-300 text-sm transition-colors"
						>
							Reset
						</button>
					)}
					<label className="flex items-center gap-2 ml-auto text-xs text-zinc-400 cursor-pointer">
						<input
							type="checkbox"
							checked={useReranker}
							onChange={(e) => {
								setUseReranker(e.target.checked);
								reset();
							}}
							className="accent-violet-500"
						/>
						Use reranker
					</label>
				</div>

				<div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-3 text-xs text-zinc-400">
					<span className="text-violet-300 font-medium">Why rerank:</span>{" "}
					Embedding similarity is a cheap, lossy proxy for relevance. A
					cross-encoder reranker reads the query and each candidate together,
					producing a precision boost — at the cost of one extra model call per
					candidate. Skip it if your embedding model is already strong enough
					for your domain.
				</div>
			</div>
		</DemoSection>
	);
}
