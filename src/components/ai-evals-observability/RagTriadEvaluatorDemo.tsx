import { motion } from "motion/react";
import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";

interface ClaimItem {
	statement: string;
	supported: boolean;
	rationale: string;
}

interface RagPreset {
	id: string;
	name: string;
	tag: string;
	query: string;
	context: string;
	answer: string;
	faithfulness: number;
	answerRelevance: number;
	contextPrecision: number;
	verdict: "pass" | "fail-faithfulness" | "fail-relevance" | "fail-precision";
	claims: ClaimItem[];
}

const PRESETS: RagPreset[] = [
	{
		id: "healthy",
		name: "Grounded & Accurate",
		tag: "Healthy RAG",
		query: "What is the height of the Eiffel Tower including its antenna?",
		context:
			"The Eiffel Tower in Paris, France stands at 330 metres (1,083 ft) tall including the tip antenna installed in March 2022. It was designed by Gustave Eiffel.",
		answer:
			"The Eiffel Tower stands at 330 metres (1,083 ft) tall including its tip antenna.",
		faithfulness: 1.0,
		answerRelevance: 0.98,
		contextPrecision: 0.95,
		verdict: "pass",
		claims: [
			{
				statement: "The Eiffel Tower stands at 330 metres (1,083 ft) tall.",
				supported: true,
				rationale:
					"Matches retrieved context directly (330 metres / 1,083 ft).",
			},
			{
				statement: "This measurement includes the tip antenna.",
				supported: true,
				rationale:
					"Supported by context mentioning the tip antenna installation.",
			},
		],
	},
	{
		id: "hallucination",
		name: "Hallucinated Output",
		tag: "Faithfulness Failure",
		query: "How does Redis handle data persistence to disk?",
		context:
			"Redis is an in-memory data store that keeps datasets in RAM. To persist data to disk, Redis supports snapshotting (RDB) and Append Only Files (AOF) written to SSD/storage drives.",
		answer:
			"Redis stores all records directly to magnetic tape storage by default and synchronizes live replica nodes over Bluetooth.",
		faithfulness: 0.15,
		answerRelevance: 0.88,
		contextPrecision: 0.92,
		verdict: "fail-faithfulness",
		claims: [
			{
				statement:
					"Redis stores all records directly to magnetic tape storage.",
				supported: false,
				rationale:
					"Hallucination: Context explicitly states Redis uses RAM with RDB/AOF on SSD/disk.",
			},
			{
				statement: "Redis synchronizes replica nodes over Bluetooth.",
				supported: false,
				rationale:
					"Hallucination: Bluetooth synchronization is unsupported and fabricated.",
			},
		],
	},
	{
		id: "noise",
		name: "Irrelevant Context Retrieval",
		tag: "Context Precision Failure",
		query: "How do I create a composite index in PostgreSQL?",
		context:
			"PostgreSQL was created at UC Berkeley in 1986. Many database administrators enjoy artisan French roast coffee in the morning. PostgreSQL supports B-tree, Hash, GiST, GIN indexes. To create a composite index on multiple columns: CREATE INDEX idx_users ON users (last_name, first_name);",
		answer:
			"To create a composite index in PostgreSQL across multiple columns, run: CREATE INDEX idx_users ON users (last_name, first_name);",
		faithfulness: 1.0,
		answerRelevance: 0.96,
		contextPrecision: 0.38,
		verdict: "fail-precision",
		claims: [
			{
				statement:
					"Create a composite index with CREATE INDEX idx ON users (col1, col2).",
				supported: true,
				rationale:
					"Syntax is faithful to the code snippet in retrieved context.",
			},
		],
	},
	{
		id: "incomplete",
		name: "Off-Topic Generation",
		tag: "Answer Relevance Failure",
		query: "What are the 3 steps to migrate MySQL to AWS Aurora?",
		context:
			"To migrate MySQL to Aurora: 1. Create a DB snapshot with mysqldump. 2. Provision an AWS Aurora cluster. 3. Replicate changes using AWS DMS and perform cutover.",
		answer:
			"Relational databases are fundamental to modern cloud engineering. MySQL was initially created in 1995 and has been adopted widely across web applications.",
		faithfulness: 0.8,
		answerRelevance: 0.28,
		contextPrecision: 0.94,
		verdict: "fail-relevance",
		claims: [
			{
				statement: "Relational databases are fundamental to cloud engineering.",
				supported: true,
				rationale:
					"Broad claim, but does not answer the user's migration query.",
			},
			{
				statement: "MySQL was initially created in 1995.",
				supported: true,
				rationale: "Historical trivia, failing to answer migration steps.",
			},
		],
	},
];

export function RagTriadEvaluatorDemo() {
	const [activePresetId, setActivePresetId] = useState("healthy");
	const [query, setQuery] = useState(PRESETS[0].query);
	const [context, setContext] = useState(PRESETS[0].context);
	const [answer, setAnswer] = useState(PRESETS[0].answer);

	const activePreset =
		PRESETS.find((p) => p.id === activePresetId) ?? PRESETS[0];

	const handlePresetSelect = (preset: RagPreset) => {
		setActivePresetId(preset.id);
		setQuery(preset.query);
		setContext(preset.context);
		setAnswer(preset.answer);
	};

	const isCustom =
		query !== activePreset.query ||
		context !== activePreset.context ||
		answer !== activePreset.answer;

	// Calculate dynamic scores or fallback to preset calibrated scores
	const faithfulness = isCustom
		? answer.length > 0 &&
			context.toLowerCase().includes(answer.slice(0, 15).toLowerCase())
			? 0.9
			: 0.4
		: activePreset.faithfulness;

	const answerRelevance = isCustom
		? query.length > 0 &&
			answer.toLowerCase().includes(query.slice(0, 10).toLowerCase())
			? 0.85
			: 0.5
		: activePreset.answerRelevance;

	const contextPrecision = isCustom
		? context.length > 0 &&
			query.toLowerCase().includes(context.slice(0, 10).toLowerCase())
			? 0.8
			: 0.6
		: activePreset.contextPrecision;

	const isPassed =
		faithfulness >= 0.8 && answerRelevance >= 0.8 && contextPrecision >= 0.7;

	return (
		<DemoSection
			title="Demo 2: RAG Triad Evaluator (Ragas Metrics)"
			description="Evaluates retrieval and generation quality along the three core Ragas axes: Faithfulness (factual grounding), Answer Relevance (query alignment), and Context Precision (retrieval signal-to-noise ratio)."
		>
			<div className="space-y-6">
				{/* Preset Selector */}
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex flex-wrap gap-2">
						{PRESETS.map((preset) => (
							<button
								key={preset.id}
								type="button"
								onClick={() => handlePresetSelect(preset)}
								className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
									activePresetId === preset.id && !isCustom
										? "border-emerald-500/60 bg-emerald-500/10 text-emerald-200"
										: "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
								}`}
							>
								<span>{preset.name}</span>
								<span className="ml-1.5 opacity-60 text-[10px]">
									({preset.tag})
								</span>
							</button>
						))}
					</div>
					{isCustom && (
						<button
							type="button"
							onClick={() => handlePresetSelect(activePreset)}
							className="text-xs text-violet-400 hover:text-violet-300 underline"
						>
							Reset to preset values
						</button>
					)}
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
					{/* Input form fields */}
					<div className="lg:col-span-7 space-y-4">
						<div>
							<label
								htmlFor="rag-query"
								className="block text-xs font-medium text-zinc-400 mb-1"
							>
								User Query
							</label>
							<input
								id="rag-query"
								type="text"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								className="w-full bg-zinc-900/90 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600"
							/>
						</div>

						<div>
							<label
								htmlFor="rag-context"
								className="block text-xs font-medium text-zinc-400 mb-1"
							>
								Retrieved Context Chunks (Vector Store / Hybrid Search)
							</label>
							<textarea
								id="rag-context"
								value={context}
								onChange={(e) => setContext(e.target.value)}
								className="w-full bg-zinc-900/90 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-300 h-24 resize-none focus:outline-none focus:border-zinc-600"
							/>
						</div>

						<div>
							<label
								htmlFor="rag-answer"
								className="block text-xs font-medium text-zinc-400 mb-1"
							>
								Generated Answer (LLM Synthesizer)
							</label>
							<textarea
								id="rag-answer"
								value={answer}
								onChange={(e) => setAnswer(e.target.value)}
								className="w-full bg-zinc-900/90 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-300 h-20 resize-none focus:outline-none focus:border-zinc-600"
							/>
						</div>

						{/* Atomic Claims Decomposition */}
						{!isCustom && activePreset.claims.length > 0 && (
							<div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 space-y-2.5">
								<div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-zinc-500">
									<span>Faithfulness: Atomic Statement Decomposition</span>
									<span>
										{activePreset.claims.filter((c) => c.supported).length} /{" "}
										{activePreset.claims.length} Supported
									</span>
								</div>
								<div className="space-y-2">
									{activePreset.claims.map((claim) => (
										<div
											key={claim.statement}
											className={`rounded border p-2.5 text-xs ${
												claim.supported
													? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
													: "border-rose-500/30 bg-rose-500/10 text-rose-300"
											}`}
										>
											<div className="flex items-start gap-2">
												<span className="font-bold">
													{claim.supported ? "✓" : "✕"}
												</span>
												<div className="space-y-0.5">
													<div className="font-mono text-zinc-200">
														"{claim.statement}"
													</div>
													<div className="text-[11px] opacity-80">
														{claim.rationale}
													</div>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</div>

					{/* Metrics Panel */}
					<div className="lg:col-span-5 rounded-lg border border-zinc-800 bg-zinc-950 p-5 flex flex-col justify-between gap-6">
						<div className="space-y-5">
							<div className="text-xs uppercase tracking-wider text-zinc-500 font-semibold border-b border-zinc-800 pb-2">
								RAG Triad Scorecard (0.00 – 1.00)
							</div>

							{/* Faithfulness */}
							<MetricBar
								title="Faithfulness (Groundedness)"
								score={faithfulness}
								threshold={0.8}
								color="emerald"
								description="Is the answer logically entailed by the retrieved context without hallucination?"
							/>

							{/* Answer Relevance */}
							<MetricBar
								title="Answer Relevance"
								score={answerRelevance}
								threshold={0.8}
								color="blue"
								description="Does the answer directly address all aspects of the user's prompt?"
							/>

							{/* Context Precision */}
							<MetricBar
								title="Context Precision"
								score={contextPrecision}
								threshold={0.7}
								color="violet"
								description="Are the retrieved context chunks concentrated with relevant ground truth?"
							/>
						</div>

						{/* Verdict Banner */}
						<div
							className={`rounded-lg border p-3 text-xs ${
								isPassed
									? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
									: "border-rose-500/40 bg-rose-500/10 text-rose-200"
							}`}
						>
							<div className="font-semibold uppercase tracking-wide text-[10px] mb-0.5">
								{isPassed
									? "✓ Production Gate: Passed"
									: "✕ Production Gate: Quality Regression"}
							</div>
							<div className="text-[11px] opacity-90">
								{isPassed
									? "All Triad metrics exceed production threshold limits (Faithfulness >= 0.80, Relevance >= 0.80, Precision >= 0.70)."
									: "One or more metrics fell below acceptable thresholds. Inspect the decomposition breakdown to diagnose the failure."}
							</div>
						</div>
					</div>
				</div>
			</div>
		</DemoSection>
	);
}

function MetricBar({
	title,
	score,
	threshold,
	color,
	description,
}: {
	title: string;
	score: number;
	threshold: number;
	color: "emerald" | "blue" | "violet";
	description: string;
}) {
	const isPassing = score >= threshold;
	const colorClasses = {
		emerald: {
			text: "text-emerald-400",
			bar: isPassing ? "bg-emerald-500" : "bg-rose-500",
		},
		blue: {
			text: "text-blue-400",
			bar: isPassing ? "bg-blue-500" : "bg-rose-500",
		},
		violet: {
			text: "text-violet-400",
			bar: isPassing ? "bg-violet-500" : "bg-rose-500",
		},
	}[color];

	return (
		<div className="space-y-1.5">
			<div className="flex items-center justify-between text-xs">
				<span className={`font-semibold ${colorClasses.text}`}>{title}</span>
				<div className="flex items-center gap-2">
					<span
						className={`font-mono text-xs px-1.5 py-0.5 rounded ${
							isPassing
								? "bg-emerald-500/10 text-emerald-300"
								: "bg-rose-500/10 text-rose-300"
						}`}
					>
						{score.toFixed(2)}
					</span>
					<span className="text-[10px] text-zinc-500">
						(min {threshold.toFixed(2)})
					</span>
				</div>
			</div>

			<div className="h-2 bg-zinc-900 rounded-full overflow-hidden relative">
				<motion.div
					className={`h-full ${colorClasses.bar}`}
					initial={{ width: 0 }}
					animate={{ width: `${Math.min(score * 100, 100)}%` }}
					transition={{ duration: 0.4 }}
				/>
			</div>

			<p className="text-[11px] text-zinc-500 leading-tight">{description}</p>
		</div>
	);
}
