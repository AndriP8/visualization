import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { fixedSizeChunks, recursiveChunks } from "./chunking-utils";

// A short, deliberately constructed sentence where the key technical phrase
// sits near a likely fixed-size boundary. The phrase a user would search for
// — "stale-while-revalidate" — is what gets cut in half.
const SAMPLE = `Browsers and CDNs honor a Cache-Control directive named stale-while-revalidate that lets a stale response be served immediately while a background request refreshes the cache. This eliminates user-visible latency on cache misses without giving up freshness guarantees. Combined with a short max-age and a generous stale-while-revalidate window, an API can feel instant even when its origin is slow.`;

const KEY_PHRASE = "stale-while-revalidate";

function phraseSpansBoundary(text: string, phrase: string): boolean {
	// True if the phrase does NOT appear intact in the text (some chunk lost it).
	return !text.includes(phrase);
}

function highlightPhrase(text: string, phrase: string): React.ReactNode {
	if (!text.includes(phrase)) {
		// Show partial matches at the edges of the chunk to make the cut visible.
		const partial = findEdgeFragment(text, phrase);
		if (partial) {
			const idx = text.indexOf(partial);
			return (
				<>
					{text.slice(0, idx)}
					<span className="bg-rose-500/30 text-rose-200 px-0.5 rounded">
						{partial}
					</span>
					<span className="text-rose-500/70 italic">…cut here</span>
					{text.slice(idx + partial.length)}
				</>
			);
		}
		return text;
	}
	const parts = text.split(phrase);
	const nodes: React.ReactNode[] = [];
	let cursor = 0;
	for (let i = 0; i < parts.length; i++) {
		const part = parts[i];
		if (i > 0) {
			cursor += parts[i - 1].length;
			nodes.push(
				<span
					key={`hl-${cursor}`}
					className="bg-emerald-500/30 text-emerald-200 px-0.5 rounded font-semibold"
				>
					{phrase}
				</span>,
			);
			cursor += phrase.length;
		}
		nodes.push(part);
	}
	return nodes;
}

// Find the longest prefix or suffix of `phrase` that appears at the edges of
// `text`. This tells us where the phrase got chopped.
function findEdgeFragment(text: string, phrase: string): string | null {
	for (let len = phrase.length - 1; len >= 4; len--) {
		const suffix = phrase.slice(0, len);
		if (text.endsWith(suffix)) return suffix;
		const prefix = phrase.slice(phrase.length - len);
		if (text.startsWith(prefix)) return prefix;
	}
	return null;
}

export function BoundaryFailureDemo() {
	const [chunkSize, setChunkSize] = useState(120);

	const fixed = useMemo(() => fixedSizeChunks(SAMPLE, chunkSize), [chunkSize]);
	const recursive = useMemo(
		() => recursiveChunks(SAMPLE, chunkSize),
		[chunkSize],
	);

	const fixedBroken = fixed.filter((c) =>
		phraseSpansBoundary(c.text, KEY_PHRASE),
	).length;
	const fixedHasIntact = fixed.some((c) => c.text.includes(KEY_PHRASE));
	const recursiveHasIntact = recursive.some((c) => c.text.includes(KEY_PHRASE));

	return (
		<DemoSection
			title="Demo 3: When the Boundary Eats the Key Phrase"
			description="A user searches for “stale-while-revalidate”. If chunking cut that phrase in half, neither chunk will match the query at retrieval time — even though the document literally contains the answer."
		>
			<div className="space-y-5">
				<div className="space-y-2">
					<div className="flex justify-between text-xs text-zinc-500">
						<span className="uppercase tracking-wider">Chunk size (chars)</span>
						<span className="font-mono text-zinc-300">{chunkSize}</span>
					</div>
					<input
						type="range"
						min={60}
						max={250}
						step={5}
						value={chunkSize}
						onChange={(e) => setChunkSize(Number(e.target.value))}
						className="w-full accent-violet-500"
					/>
					<p className="text-[11px] text-zinc-600">
						Shrink chunks to make boundary collisions more frequent.
					</p>
				</div>

				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
					<StrategyColumn
						label="Fixed-size"
						chunks={fixed}
						intactPresent={fixedHasIntact}
						accent="rose"
					/>
					<StrategyColumn
						label="Recursive"
						chunks={recursive}
						intactPresent={recursiveHasIntact}
						accent="emerald"
					/>
				</div>

				<div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-xs space-y-1.5">
					<p className="text-zinc-400">
						<span className="font-mono text-amber-300">Query:</span>{" "}
						<code className="text-zinc-200">"{KEY_PHRASE}"</code> — a lexical
						match in retrieval needs the phrase to appear intact inside at least
						one chunk.
					</p>
					<p className="text-zinc-400">
						<span className="font-mono text-amber-300">Fixed-size result:</span>{" "}
						{fixedHasIntact ? (
							<span className="text-emerald-300">
								phrase found intact in one chunk
							</span>
						) : (
							<span className="text-rose-300">
								phrase split across {fixedBroken > 0 ? fixedBroken : 2} chunks —
								retrieval misses it
							</span>
						)}
						.
					</p>
					<p className="text-zinc-400">
						<span className="font-mono text-amber-300">Recursive result:</span>{" "}
						{recursiveHasIntact ? (
							<span className="text-emerald-300">
								phrase preserved — recursive splitter prefers word boundaries
							</span>
						) : (
							<span className="text-rose-300">
								phrase still split (rare — happens only when chunk size is
								smaller than the phrase)
							</span>
						)}
						.
					</p>
				</div>

				<div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-3 text-xs text-zinc-400">
					<span className="text-amber-300 font-medium">Why this matters:</span>{" "}
					Embedding similarity is also degraded when a phrase is cut — the
					tokens for "stale-while" and "revalidate" don't carry the same
					semantic weight as the full term. The fix isn't always a smarter
					splitter; for the fixed-size case, overlap (Demo 2) is the pragmatic
					answer.
				</div>
			</div>
		</DemoSection>
	);
}

function StrategyColumn({
	label,
	chunks,
	intactPresent,
	accent,
}: {
	label: string;
	chunks: { id: number; text: string }[];
	intactPresent: boolean;
	accent: "rose" | "emerald";
}) {
	const headerColor =
		accent === "emerald" ? "text-emerald-300" : "text-rose-300";
	return (
		<div className="rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden">
			<div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
				<span className={`text-sm font-semibold ${headerColor}`}>{label}</span>
				<span className="text-[10px] text-zinc-500">
					{chunks.length} chunks · phrase{" "}
					{intactPresent ? (
						<span className="text-emerald-400">intact</span>
					) : (
						<span className="text-rose-400">split</span>
					)}
				</span>
			</div>
			<div className="p-3 space-y-2 max-h-[280px] overflow-y-auto">
				{chunks.map((c, idx) => (
					<motion.div
						key={`${label}-${c.id}`}
						initial={{ opacity: 0, x: -4 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.2, delay: idx * 0.03 }}
						className="text-[11px] font-mono leading-relaxed border-l-2 border-zinc-700 pl-2 text-zinc-300"
					>
						<span className="text-zinc-600 mr-1">#{c.id}</span>
						{highlightPhrase(c.text, KEY_PHRASE)}
					</motion.div>
				))}
			</div>
		</div>
	);
}
