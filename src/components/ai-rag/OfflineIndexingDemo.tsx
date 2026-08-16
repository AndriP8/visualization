import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { DemoSection } from "../shared/DemoSection";

const SOURCE_DOC = `# Refund Policy

Customers may request a refund within 30 days of purchase. Refunds are issued to the original payment method within 5 business days.

Subscription cancellations take effect at the end of the current billing cycle. Prorated refunds are not offered for partial months.`;

type Chunk = {
	id: string;
	text: string;
	vector: number[];
};

const CHUNKS: Chunk[] = [
	{
		id: "c1",
		text: "Customers may request a refund within 30 days of purchase.",
		vector: [0.81, -0.12, 0.44, 0.07, -0.33],
	},
	{
		id: "c2",
		text: "Refunds are issued to the original payment method within 5 business days.",
		vector: [0.76, -0.21, 0.39, 0.12, -0.29],
	},
	{
		id: "c3",
		text: "Subscription cancellations take effect at the end of the current billing cycle.",
		vector: [0.22, 0.61, -0.18, 0.55, 0.14],
	},
	{
		id: "c4",
		text: "Prorated refunds are not offered for partial months.",
		vector: [0.41, 0.33, 0.12, 0.48, -0.07],
	},
];

type Stage = "idle" | "chunking" | "embedding" | "storing" | "done";

export function OfflineIndexingDemo() {
	const [stage, setStage] = useState<Stage>("idle");
	const [visibleChunks, setVisibleChunks] = useState(0);
	const [embeddedChunks, setEmbeddedChunks] = useState(0);
	const [storedChunks, setStoredChunks] = useState(0);
	const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

	function reset() {
		timeouts.current.forEach(clearTimeout);
		timeouts.current = [];
		setStage("idle");
		setVisibleChunks(0);
		setEmbeddedChunks(0);
		setStoredChunks(0);
	}

	function run() {
		reset();
		setStage("chunking");

		const stepDelay = 350;
		let t = 0;

		// chunking
		CHUNKS.forEach((_, i) => {
			t += stepDelay;
			timeouts.current.push(setTimeout(() => setVisibleChunks(i + 1), t));
		});

		// embedding
		t += stepDelay;
		timeouts.current.push(setTimeout(() => setStage("embedding"), t));
		CHUNKS.forEach((_, i) => {
			t += stepDelay;
			timeouts.current.push(setTimeout(() => setEmbeddedChunks(i + 1), t));
		});

		// storing
		t += stepDelay;
		timeouts.current.push(setTimeout(() => setStage("storing"), t));
		CHUNKS.forEach((_, i) => {
			t += stepDelay;
			timeouts.current.push(setTimeout(() => setStoredChunks(i + 1), t));
		});

		t += stepDelay;
		timeouts.current.push(setTimeout(() => setStage("done"), t));
	}

	useEffect(() => () => timeouts.current.forEach(clearTimeout), []);

	return (
		<DemoSection
			title="Demo 1: Offline Indexing"
			description="Run once per document. Chunk → embed → store. This work happens before any user query — at query time the vector DB is already populated."
		>
			<div className="space-y-6">
				{/* Stage pipeline */}
				<div className="grid grid-cols-4 gap-2">
					{(
						[
							["chunking", "1. Chunk"],
							["embedding", "2. Embed"],
							["storing", "3. Store"],
							["done", "Done"],
						] as const
					).map(([key, label]) => {
						const active = stage === key;
						const passed =
							(key === "chunking" &&
								(stage === "embedding" ||
									stage === "storing" ||
									stage === "done")) ||
							(key === "embedding" &&
								(stage === "storing" || stage === "done")) ||
							(key === "storing" && stage === "done");
						return (
							<div
								key={key}
								className={`rounded-md border px-3 py-2 text-center text-xs font-medium transition-colors ${
									active
										? "border-violet-500/60 bg-violet-500/10 text-violet-200"
										: passed
											? "border-emerald-500/40 bg-emerald-500/5 text-emerald-300"
											: "border-zinc-800 bg-zinc-900 text-zinc-500"
								}`}
							>
								{label}
							</div>
						);
					})}
				</div>

				<div className="grid lg:grid-cols-3 gap-4">
					{/* Source doc */}
					<div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
						<p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
							Source document
						</p>
						<pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed">
							{SOURCE_DOC}
						</pre>
					</div>

					{/* Chunks */}
					<div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
						<p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
							Chunks ({visibleChunks}/{CHUNKS.length})
						</p>
						<div className="space-y-2">
							<AnimatePresence>
								{CHUNKS.slice(0, visibleChunks).map((c) => {
									const isEmbedded =
										CHUNKS.findIndex((x) => x.id === c.id) < embeddedChunks;
									return (
										<motion.div
											key={c.id}
											initial={{ opacity: 0, x: -10 }}
											animate={{ opacity: 1, x: 0 }}
											className={`text-xs rounded border p-2 transition-colors ${
												isEmbedded
													? "border-cyan-500/40 bg-cyan-500/5 text-zinc-300"
													: "border-zinc-700 bg-zinc-800/50 text-zinc-400"
											}`}
										>
											<div>{c.text}</div>
											{isEmbedded && (
												<motion.div
													initial={{ opacity: 0 }}
													animate={{ opacity: 1 }}
													className="text-cyan-400/70 font-mono mt-1 text-[10px]"
												>
													[{c.vector.map((v) => v.toFixed(2)).join(", ")}, …]
												</motion.div>
											)}
										</motion.div>
									);
								})}
							</AnimatePresence>
						</div>
					</div>

					{/* Vector DB */}
					<div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
						<p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
							Vector DB ({storedChunks} rows)
						</p>
						<div className="space-y-1.5">
							<AnimatePresence>
								{CHUNKS.slice(0, storedChunks).map((c) => (
									<motion.div
										key={c.id}
										initial={{ opacity: 0, scale: 0.9 }}
										animate={{ opacity: 1, scale: 1 }}
										className="flex items-center gap-2 text-xs font-mono rounded border border-violet-500/30 bg-violet-500/5 px-2 py-1.5"
									>
										<span className="text-violet-300">{c.id}</span>
										<span className="text-zinc-500">→</span>
										<span className="text-zinc-400 text-[10px] truncate">
											vec({c.vector.length}d)
										</span>
									</motion.div>
								))}
							</AnimatePresence>
							{storedChunks === 0 && (
								<p className="text-xs text-zinc-600 italic">empty</p>
							)}
						</div>
					</div>
				</div>

				<div className="flex gap-3">
					<button
						type="button"
						onClick={run}
						disabled={stage !== "idle" && stage !== "done"}
						className="px-4 py-2 rounded-lg bg-violet-700 hover:bg-violet-600 disabled:opacity-40 text-white text-sm font-medium transition-colors"
					>
						{stage === "idle"
							? "Run indexing"
							: stage === "done"
								? "Run again"
								: "Indexing…"}
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
				</div>

				<div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-3 text-xs text-zinc-400">
					<span className="text-violet-300 font-medium">Why offline:</span>{" "}
					Embedding is the expensive step (one model call per chunk). Doing it
					at query time would add seconds of latency per request. Indexing
					trades upfront compute for fast lookup later — and only re-runs when
					documents change.
				</div>
			</div>
		</DemoSection>
	);
}
