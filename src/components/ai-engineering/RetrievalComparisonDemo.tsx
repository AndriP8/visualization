import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import {
	type Chunk,
	fixedSizeChunks,
	recursiveChunks,
	SAMPLE_DOC,
	semanticChunks,
} from "./chunking-utils";

// Pre-set queries that exercise each topic in the sample document.
const QUERIES = [
	{
		id: "btree",
		label: "How do B-Tree indexes stay shallow?",
		expectedTopic: "B-Trees",
	},
	{
		id: "cache",
		label: "What HTTP header controls cache reuse?",
		expectedTopic: "HTTP caching",
	},
	{
		id: "oauth",
		label: "Is OAuth for authentication?",
		expectedTopic: "OAuth",
	},
] as const;

type QueryId = (typeof QUERIES)[number]["id"];

// ---------- Lexical scoring (NOT embeddings) ----------
// A simple BM25-lite score: count query-term hits in each chunk, normalized
// by chunk length. This is a faithful demo of how chunk choice affects what
// gets retrieved, even though production systems use vector similarity.
const STOP = new Set([
	"the",
	"a",
	"is",
	"are",
	"of",
	"to",
	"in",
	"on",
	"for",
	"do",
	"does",
	"how",
	"what",
	"why",
	"when",
	"where",
	"stay",
	"control",
]);

function tokenize(s: string): string[] {
	const words = s.toLowerCase().match(/[a-z][a-z'-]+/g) ?? [];
	return words.filter((w) => w.length > 2 && !STOP.has(w));
}

function score(chunk: Chunk, queryTerms: string[]): number {
	const chunkLower = chunk.text.toLowerCase();
	let hits = 0;
	for (const term of queryTerms) {
		// Each occurrence of the term contributes; partial matches count too.
		const matches = chunkLower.split(term).length - 1;
		hits += matches;
	}
	// Length normalization keeps long chunks from dominating purely by size.
	const lengthFactor = Math.sqrt(chunk.text.length / 100);
	return hits / Math.max(0.5, lengthFactor);
}

function rank(
	chunks: Chunk[],
	queryTerms: string[],
): { chunk: Chunk; score: number }[] {
	return chunks
		.map((c) => ({ chunk: c, score: score(c, queryTerms) }))
		.sort((a, b) => b.score - a.score);
}

export function RetrievalComparisonDemo() {
	const [queryId, setQueryId] = useState<QueryId>("cache");

	const query = QUERIES.find((q) => q.id === queryId) ?? QUERIES[0];
	const queryTerms = useMemo(() => tokenize(query.label), [query.label]);

	const ranked = useMemo(() => {
		const fixed = rank(fixedSizeChunks(SAMPLE_DOC, 200), queryTerms);
		const recursive = rank(recursiveChunks(SAMPLE_DOC, 200), queryTerms);
		const semantic = rank(semanticChunks(SAMPLE_DOC, 0.08), queryTerms);
		return { fixed, recursive, semantic };
	}, [queryTerms]);

	return (
		<DemoSection
			title="Demo 4: Retrieval — Same Query, Different Chunks"
			description="A retrieval system embeds the query, finds the most similar chunks, and feeds them to the LLM. The same question against the same document returns different top-k results depending on how the document was chunked."
		>
			<div className="space-y-5">
				<div className="space-y-1.5">
					<p className="text-xs text-zinc-500 uppercase tracking-wider">
						Query
					</p>
					<div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
						{QUERIES.map((q) => (
							<button
								type="button"
								key={q.id}
								onClick={() => setQueryId(q.id)}
								className={`px-3 py-2 rounded-lg border text-left text-xs transition-colors ${
									queryId === q.id
										? "border-cyan-500/60 bg-cyan-500/10 text-cyan-200"
										: "border-zinc-700 text-zinc-400 hover:border-zinc-500"
								}`}
							>
								"{q.label}"
							</button>
						))}
					</div>
					<p className="text-[11px] text-zinc-600 mt-1">
						Search terms extracted:{" "}
						<span className="font-mono text-zinc-400">
							{queryTerms.map((t) => `"${t}"`).join(", ")}
						</span>
					</p>
				</div>

				<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
					<RankColumn
						title="Fixed-size (200)"
						accent="violet"
						results={ranked.fixed}
						queryTerms={queryTerms}
					/>
					<RankColumn
						title="Recursive (200)"
						accent="cyan"
						results={ranked.recursive}
						queryTerms={queryTerms}
					/>
					<RankColumn
						title="Semantic"
						accent="amber"
						results={ranked.semantic}
						queryTerms={queryTerms}
					/>
				</div>

				<div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-3 text-xs text-zinc-400 space-y-1.5">
					<p>
						<span className="text-violet-300 font-medium">Fixed-size</span>{" "}
						often produces a top chunk that mixes the answer with unrelated
						content from a neighboring topic — adding noise to the LLM's
						context.
					</p>
					<p>
						<span className="text-cyan-300 font-medium">Recursive</span> chunks
						usually land on paragraph boundaries, so the top hit is more
						topically focused. Same retrieval scoring, cleaner candidate set.
					</p>
					<p>
						<span className="text-amber-300 font-medium">Semantic</span> chunks
						group all sentences on one topic together. The top hit is large and
						complete, but if you ask for top-k chunks you'll get fewer, longer
						ones — different latency/cost profile downstream.
					</p>
					<p className="text-zinc-500 italic pt-1 border-t border-zinc-800">
						Honest caveat: this demo scores chunks with simple term overlap
						(BM25-lite), not vector embeddings. Production retrievers use cosine
						similarity over learned vectors — the absolute scores would differ,
						but the ordering effects of chunking remain the same.
					</p>
				</div>
			</div>
		</DemoSection>
	);
}

function RankColumn({
	title,
	accent,
	results,
	queryTerms,
}: {
	title: string;
	accent: "violet" | "cyan" | "amber";
	results: { chunk: Chunk; score: number }[];
	queryTerms: string[];
}) {
	const top = results.slice(0, 3);
	const maxScore = Math.max(...results.map((r) => r.score), 0.01);
	const headerColor = {
		violet: "text-violet-300 border-violet-500/30",
		cyan: "text-cyan-300 border-cyan-500/30",
		amber: "text-amber-300 border-amber-500/30",
	}[accent];
	const barColor = {
		violet: "bg-violet-500",
		cyan: "bg-cyan-500",
		amber: "bg-amber-500",
	}[accent];

	return (
		<div className="rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden">
			<div
				className={`px-3 py-2 border-b text-sm font-semibold ${headerColor}`}
			>
				{title}
			</div>
			<div className="p-3 space-y-3">
				{top.map((r, idx) => (
					<motion.div
						key={`${title}-${r.chunk.id}-${r.chunk.start}`}
						initial={{ opacity: 0, y: 4 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: idx * 0.05, duration: 0.2 }}
					>
						<div className="flex items-center justify-between text-[10px] mb-1">
							<span className="text-zinc-500 font-mono">
								#{idx + 1} · source segment {r.chunk.id + 1} of {results.length}
							</span>
							<span className="text-zinc-400 font-mono">
								match {r.score.toFixed(2)}
							</span>
						</div>
						<div
							className="h-1 bg-zinc-800 rounded-full mb-1.5 overflow-hidden"
							title={`Match score: ${r.score.toFixed(2)} (relative to the top result)`}
						>
							<motion.div
								className={`h-full ${barColor}`}
								animate={{
									width: `${Math.max(2, (r.score / maxScore) * 100)}%`,
								}}
								transition={{ duration: 0.3 }}
							/>
						</div>
						<p className="text-[11px] font-mono leading-relaxed text-zinc-300 line-clamp-4">
							{highlightTerms(r.chunk.text, queryTerms)}
						</p>
					</motion.div>
				))}
				{top.every((r) => r.score === 0) && (
					<p className="text-[11px] text-zinc-600 italic">
						No chunks matched any query term.
					</p>
				)}
			</div>
		</div>
	);
}

function highlightTerms(text: string, terms: string[]): React.ReactNode {
	if (terms.length === 0) return text;
	const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
	const splitter = new RegExp(`(${escaped.join("|")})`, "gi");
	const matcher = new RegExp(`^(?:${escaped.join("|")})$`, "i");
	const parts = text.split(splitter);
	return parts.map((part, i) =>
		matcher.test(part) ? (
			<span
				key={`h${i}-${part}`}
				className="bg-emerald-500/30 text-emerald-200 rounded-sm"
			>
				{part}
			</span>
		) : (
			part
		),
	);
}
