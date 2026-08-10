import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { match } from "ts-pattern";
import { DemoSection } from "../shared/DemoSection";
import {
	type Chunk,
	fixedSizeChunks,
	midSentenceBreaks,
	recursiveChunks,
	SAMPLE_DOC,
	semanticChunks,
} from "./chunking-utils";

type Strategy = "fixed" | "recursive" | "semantic";

const STRATEGIES: { id: Strategy; label: string; blurb: string }[] = [
	{
		id: "fixed",
		label: "Fixed-size",
		blurb: "Split every N characters. Ignores content.",
	},
	{
		id: "recursive",
		label: "Recursive",
		blurb: 'Try \\n\\n → \\n → ". " → " " in order, respecting size cap.',
	},
	{
		id: "semantic",
		label: "Semantic",
		blurb: "Break when adjacent sentences become dissimilar.",
	},
];

// Visually distinct hues so adjacent chunks are easy to tell apart.
const CHUNK_BG_COLORS = [
	"bg-violet-500/20 border-l-2 border-violet-400",
	"bg-cyan-500/20 border-l-2 border-cyan-400",
	"bg-amber-500/20 border-l-2 border-amber-400",
	"bg-emerald-500/20 border-l-2 border-emerald-400",
	"bg-rose-500/20 border-l-2 border-rose-400",
	"bg-fuchsia-500/20 border-l-2 border-fuchsia-400",
	"bg-blue-500/20 border-l-2 border-blue-400",
	"bg-orange-500/20 border-l-2 border-orange-400",
];

const CHUNK_TEXT_COLORS = [
	"text-violet-300",
	"text-cyan-300",
	"text-amber-300",
	"text-emerald-300",
	"text-rose-300",
	"text-fuchsia-300",
	"text-blue-300",
	"text-orange-300",
];

export function SideBySideChunkerDemo() {
	const [strategy, setStrategy] = useState<Strategy>("fixed");
	const [chunkSize, setChunkSize] = useState(400);
	const [threshold, setThreshold] = useState(0.1);

	const chunks: Chunk[] = useMemo(
		() =>
			match(strategy)
				.with("fixed", () => fixedSizeChunks(SAMPLE_DOC, chunkSize))
				.with("recursive", () => recursiveChunks(SAMPLE_DOC, chunkSize))
				.with("semantic", () => semanticChunks(SAMPLE_DOC, threshold))
				.exhaustive(),
		[strategy, chunkSize, threshold],
	);

	const broken = midSentenceBreaks(chunks, SAMPLE_DOC.length);
	const avgTokens =
		chunks.length === 0
			? 0
			: Math.round(
					chunks.reduce((sum, c) => sum + c.tokens, 0) / chunks.length,
				);

	return (
		<DemoSection
			title="Demo 1: Same Document, Three Strategies"
			description="The sample document covers three distinct topics (B-Trees → HTTP caching → OAuth). Pick a strategy and watch where chunk boundaries land in the same text."
		>
			<div className="space-y-5">
				{/* Strategy picker */}
				<div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
					{STRATEGIES.map((s) => (
						<button
							type="button"
							key={s.id}
							onClick={() => setStrategy(s.id)}
							className={`px-3 py-2.5 rounded-lg border text-left text-sm transition-colors ${
								strategy === s.id
									? "border-violet-500/60 bg-violet-500/10 text-violet-200"
									: "border-zinc-700 text-zinc-400 hover:border-zinc-500"
							}`}
						>
							<div className="font-medium">{s.label}</div>
							<div className="text-[11px] text-zinc-500 mt-0.5">{s.blurb}</div>
						</button>
					))}
				</div>

				{/* Strategy-specific control */}
				{strategy === "semantic" ? (
					<div className="space-y-1.5">
						<div className="flex justify-between text-xs text-zinc-500">
							<span className="uppercase tracking-wider">
								Similarity threshold
							</span>
							<span className="font-mono text-zinc-300">
								{threshold.toFixed(2)}
							</span>
						</div>
						<input
							type="range"
							min={0.0}
							max={0.5}
							step={0.01}
							value={threshold}
							onChange={(e) => setThreshold(Number(e.target.value))}
							className="w-full accent-violet-500"
						/>
						<p className="text-[11px] text-zinc-600">
							Higher threshold → break more aggressively. Lower → keep more
							together.
						</p>
					</div>
				) : (
					<div className="space-y-1.5">
						<div className="flex justify-between text-xs text-zinc-500">
							<span className="uppercase tracking-wider">
								Chunk size (chars)
							</span>
							<span className="font-mono text-zinc-300">
								{chunkSize} chars · ~{Math.ceil(chunkSize / 4)} tokens
							</span>
						</div>
						<input
							type="range"
							min={150}
							max={800}
							step={25}
							value={chunkSize}
							onChange={(e) => setChunkSize(Number(e.target.value))}
							className="w-full accent-violet-500"
						/>
					</div>
				)}

				{/* Stats */}
				<div className="grid grid-cols-3 gap-2 text-center">
					<Stat label="Chunks" value={chunks.length.toString()} />
					<Stat label="Avg tokens" value={`~${avgTokens}`} hint="estimated" />
					<Stat
						label="Mid-sentence breaks"
						value={broken.toString()}
						tone={broken === 0 ? "good" : broken <= 1 ? "warn" : "bad"}
					/>
				</div>

				{/* Rendered chunks */}
				<div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 max-h-[420px] overflow-y-auto">
					<div className="flex flex-wrap leading-relaxed text-[13px] font-mono whitespace-pre-wrap">
						{chunks.map((chunk, idx) => (
							<motion.span
								key={`${strategy}-${chunk.id}-${chunk.start}`}
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ duration: 0.25, delay: idx * 0.02 }}
								className={`px-1.5 py-0.5 my-0.5 rounded-sm ${
									CHUNK_BG_COLORS[idx % CHUNK_BG_COLORS.length]
								}`}
							>
								<span
									className={`text-[9px] font-bold mr-1 ${
										CHUNK_TEXT_COLORS[idx % CHUNK_TEXT_COLORS.length]
									}`}
								>
									#{chunk.id}
								</span>
								<span className="text-zinc-200">{chunk.text}</span>
							</motion.span>
						))}
					</div>
				</div>

				<div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-3 text-xs text-zinc-400 space-y-1.5">
					{match(strategy)
						.with("fixed", () => (
							<p>
								<span className="text-violet-300 font-medium">Fixed-size:</span>{" "}
								Boundaries land wherever the character counter expires —
								frequently mid-sentence and mid-topic. Cheapest to compute,
								worst coherence.
							</p>
						))
						.with("recursive", () => (
							<p>
								<span className="text-cyan-300 font-medium">Recursive:</span>{" "}
								Prefers paragraph breaks (
								<code className="text-zinc-300">\n\n</code>), falls back to
								newlines, then sentences, then words. Notice how chunks tend to
								end on <code className="text-zinc-300">.</code> when the size
								budget allows.
							</p>
						))
						.with("semantic", () => (
							<p>
								<span className="text-amber-300 font-medium">Semantic:</span>{" "}
								Breaks align with topic shifts in the document. Lower the
								threshold and you'll see B-Trees, HTTP caching, and OAuth merge
								into one chunk; raise it and chunks fragment.{" "}
								<span className="text-zinc-500">
									(This demo uses lexical Jaccard overlap as a similarity proxy;
									production semantic chunkers use sentence embeddings — same
									shape, different signal.)
								</span>
							</p>
						))
						.exhaustive()}
				</div>
			</div>
		</DemoSection>
	);
}

function Stat({
	label,
	value,
	hint,
	tone = "neutral",
}: {
	label: string;
	value: string;
	hint?: string;
	tone?: "neutral" | "good" | "warn" | "bad";
}) {
	const toneClass = match(tone)
		.with("good", () => "text-emerald-300")
		.with("warn", () => "text-amber-300")
		.with("bad", () => "text-rose-300")
		.with("neutral", () => "text-zinc-200")
		.exhaustive();
	return (
		<div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
			<div className="text-[10px] uppercase tracking-wider text-zinc-500">
				{label}
			</div>
			<div className={`text-lg font-mono font-semibold ${toneClass}`}>
				{value}
			</div>
			{hint && <div className="text-[9px] text-zinc-600">{hint}</div>}
		</div>
	);
}
