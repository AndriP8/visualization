import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { fixedSizeChunks, SAMPLE_DOC } from "./chunking-utils";

const CHUNK_SIZE = 300;

export function OverlapTradeoffDemo() {
	const [overlapPct, setOverlapPct] = useState(20);

	const overlapChars = Math.round((overlapPct / 100) * CHUNK_SIZE);
	const chunks = useMemo(
		() => fixedSizeChunks(SAMPLE_DOC, CHUNK_SIZE, overlapChars),
		[overlapChars],
	);

	// Total characters across all chunks vs document size = redundancy multiplier.
	const totalCharsInChunks = chunks.reduce((sum, c) => sum + c.text.length, 0);
	const redundancy = totalCharsInChunks / SAMPLE_DOC.length;

	// Approximate "boundary miss probability": chance that an important phrase
	// straddles a chunk boundary and gets cut. Assume an average phrase length
	// of 40 chars (~10 words). The miss rate is (phrase_len - overlap) / stride
	// when overlap < phrase_len, clamped to [0, 1].
	const PHRASE_LEN = 40;
	const stride = CHUNK_SIZE - overlapChars;
	const boundaryMissRate = Math.max(
		0,
		Math.min(1, (PHRASE_LEN - overlapChars) / stride),
	);

	// Extract text around the boundary between chunk 0 and 1 so the user
	// can see the overlap in action (or the cut when overlap is 0).
	const boundaryCtx = useMemo(() => {
		if (chunks.length < 2) return null;
		const ctx = 60;
		const c0 = chunks[0].text;
		const c1 = chunks[1].text;
		if (overlapChars === 0) {
			return {
				before: c0.slice(-ctx),
				shared: "",
				after: c1.slice(0, ctx),
				hasOverlap: false,
			};
		}
		const shared = c0.slice(-overlapChars);
		return {
			before: c0.slice(-overlapChars - ctx, -overlapChars),
			shared,
			after: c1.slice(overlapChars, overlapChars + ctx),
			hasOverlap: true,
		};
	}, [chunks, overlapChars]);

	return (
		<DemoSection
			title="Demo 2: How Much Should Chunks Overlap?"
			description={`Cut a document at fixed intervals, and every cut risks slicing through a key phrase. Overlap means each chunk starts a few words before the previous one ended — duplicating those words so no phrase gets cut. You pay for that duplication in storage and embedding cost.`}
		>
			<div className="space-y-5">
				<div className="space-y-2">
					<div className="flex justify-between text-xs text-zinc-500">
						<span className="uppercase tracking-wider">Overlap</span>
						<span className="font-mono text-zinc-300">
							{overlapPct}% ({overlapChars} chars){" "}
							{overlapPct >= 100
								? "— clamped"
								: overlapPct === 0
									? "— no overlap"
									: ""}
						</span>
					</div>
					<input
						type="range"
						min={0}
						max={80}
						step={5}
						value={overlapPct}
						onChange={(e) => setOverlapPct(Number(e.target.value))}
						className="w-full accent-violet-500"
					/>
					<p className="text-[11px] text-zinc-500">
						Chunk size fixed at {CHUNK_SIZE} chars. Stride = chunk size −
						overlap = {stride} chars.
					</p>
				</div>

				<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
					<MetricBar
						label="Chunks produced"
						value={chunks.length.toString()}
						suffix=""
						fillPct={Math.min(100, chunks.length * 8)}
						color="violet"
					/>
					<MetricBar
						label="Extra storage cost"
						value={redundancy.toFixed(2)}
						suffix="×"
						fillPct={Math.min(100, (redundancy - 1) * 200)}
						color="rose"
						hint="1.0× = each char stored once. Higher = same text stored in 2+ chunks (more embeddings, more DB space)"
					/>
					<MetricBar
						label="Chance a key phrase gets cut"
						value={`${Math.round(boundaryMissRate * 100)}%`}
						suffix=""
						fillPct={boundaryMissRate * 100}
						color="amber"
						invert
						hint="out of 100 ~40-char phrases, this many straddle a boundary and get split in half"
					/>
				</div>

				{/* Concrete text example — shows the boundary between chunk 0 and 1 */}
				{boundaryCtx && (
					<div className="space-y-2">
						<p className="text-xs text-zinc-500 uppercase tracking-wider">
							{boundaryCtx.hasOverlap
								? `Overlap in action (${overlapChars} shared chars)`
								: "Without overlap: a phrase gets cut"}
						</p>
						<div className="grid grid-cols-1 gap-1.5 font-mono text-[11px] leading-relaxed">
							<div className="rounded border border-zinc-700/60 bg-zinc-900 px-2.5 py-2">
								<span className="text-zinc-500">Chunk 0 </span>
								<span className="text-zinc-300">…{boundaryCtx.before}</span>
								{boundaryCtx.hasOverlap ? (
									<span className="bg-cyan-500/15 text-cyan-300 border border-cyan-500/25 rounded-sm px-1 ml-0.5">
										{boundaryCtx.shared.length > 55
											? `${boundaryCtx.shared.slice(0, 55)}…`
											: boundaryCtx.shared}
									</span>
								) : (
									<span className="text-rose-400/60 mx-1 select-none">╎</span>
								)}
							</div>
							<div className="rounded border border-zinc-700/60 bg-zinc-900 px-2.5 py-2">
								<span className="text-zinc-500">Chunk 1 </span>
								{boundaryCtx.hasOverlap ? (
									<span className="bg-cyan-500/15 text-cyan-300 border border-cyan-500/25 rounded-sm px-1 mr-0.5">
										{boundaryCtx.shared.length > 55
											? `${boundaryCtx.shared.slice(0, 55)}…`
											: boundaryCtx.shared}
									</span>
								) : (
									<span className="text-rose-400/60 mx-1 select-none">╎</span>
								)}
								<span className="text-zinc-300">{boundaryCtx.after}…</span>
							</div>
						</div>
						<p className="text-[11px] text-zinc-500">
							{boundaryCtx.hasOverlap
								? "The highlighted text lives in both chunks. A phrase that crosses the boundary survives intact in one of them."
								: "The ╎ is a boundary. A phrase that straddles it is split across two chunks — neither chunk contains the whole thing."}
						</p>
					</div>
				)}

				{/* Visualization of chunk overlap on a timeline */}
				<div className="space-y-2">
					<p className="text-xs text-zinc-500 uppercase tracking-wider">
						Chunk ranges over the document
					</p>
					<div className="relative h-24 rounded-lg border border-zinc-800 bg-zinc-950 p-2 overflow-hidden">
						{chunks.map((chunk, idx) => {
							const leftPct = (chunk.start / SAMPLE_DOC.length) * 100;
							const widthPct =
								((chunk.end - chunk.start) / SAMPLE_DOC.length) * 100;
							const topPx = 4 + (idx % 4) * 18;
							const colors = [
								"bg-violet-500/40 border-violet-400",
								"bg-cyan-500/40 border-cyan-400",
								"bg-amber-500/40 border-amber-400",
								"bg-emerald-500/40 border-emerald-400",
							];
							return (
								<motion.div
									key={`${chunk.id}-${chunk.start}`}
									layout
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									className={`absolute h-4 rounded border ${
										colors[idx % colors.length]
									}`}
									style={{
										left: `${leftPct}%`,
										width: `${widthPct}%`,
										top: `${topPx}px`,
									}}
									title={`Chunk ${chunk.id}: chars ${chunk.start}–${chunk.end}`}
								/>
							);
						})}
					</div>
					<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500">
						<span className="flex items-center gap-1.5">
							<span className="inline-block h-3 w-3 rounded-sm bg-violet-500/40 border border-violet-400" />
							Chunk 1
						</span>
						<span className="flex items-center gap-1.5">
							<span className="inline-block h-3 w-3 rounded-sm bg-cyan-500/40 border border-cyan-400" />
							Chunk 2
						</span>
						<span className="flex items-center gap-1.5">
							<span className="inline-block h-3 w-3 rounded-sm bg-amber-500/40 border border-amber-400" />
							Chunk 3
						</span>
						<span className="flex items-center gap-1.5">
							<span className="inline-block h-3 w-3 rounded-sm bg-emerald-500/40 border border-emerald-400" />
							Chunk 4+
						</span>
					</div>
					<p className="text-[11px] text-zinc-500">
						Each bar is one chunk's span over the document; colors just tell
						chunks apart. Where two bars sit on different rows but cover the
						same x-range, that text appears in both chunks — the shared text
						overlap creates.
					</p>
				</div>

				<div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-3 text-xs text-zinc-400 space-y-1.5">
					<p>
						<span className="text-amber-300 font-medium">No overlap (0%):</span>{" "}
						Minimum storage cost. A phrase like "stale-while-revalidate" that
						happens to straddle a boundary is split — neither chunk contains the
						whole term, so neither will match a query for it.
					</p>
					<p>
						<span className="text-emerald-300 font-medium">
							Typical (10–20%):
						</span>{" "}
						Industry default. Most "key phrase straddles boundary" misses are
						eliminated with modest storage cost.
					</p>
					<p>
						<span className="text-rose-300 font-medium">Heavy (50%+):</span>{" "}
						Chunk count nearly doubles. You pay 2× embedding cost, 2× vector DB
						storage, and the same content appears in retrieval results twice —
						which can starve the context window.
					</p>
				</div>
			</div>
		</DemoSection>
	);
}

function MetricBar({
	label,
	value,
	suffix,
	fillPct,
	color,
	hint,
	invert = false,
}: {
	label: string;
	value: string;
	suffix: string;
	fillPct: number;
	color: "violet" | "rose" | "amber";
	hint?: string;
	invert?: boolean;
}) {
	const colorClass = {
		violet: "bg-violet-500",
		rose: "bg-rose-500",
		amber: "bg-amber-500",
	}[color];
	const textColor = {
		violet: "text-violet-300",
		rose: "text-rose-300",
		amber: "text-amber-300",
	}[color];
	return (
		<div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
			<div className="text-[10px] uppercase tracking-wider text-zinc-400">
				{label}
			</div>
			<div className={`text-xl font-mono font-semibold ${textColor}`}>
				{value}
				<span className="text-sm text-zinc-400">{suffix}</span>
			</div>
			<div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
				<motion.div
					className={`h-full ${colorClass} rounded-full`}
					animate={{
						width: `${invert ? Math.max(2, fillPct) : Math.max(2, fillPct)}%`,
					}}
					transition={{ duration: 0.3 }}
				/>
			</div>
			{hint && <div className="text-[9px] text-zinc-500 mt-1">{hint}</div>}
		</div>
	);
}
