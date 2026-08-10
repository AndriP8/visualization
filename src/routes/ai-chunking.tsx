import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { BoundaryFailureDemo } from "../components/ai-engineering/BoundaryFailureDemo";
import { OverlapTradeoffDemo } from "../components/ai-engineering/OverlapTradeoffDemo";
import { RetrievalComparisonDemo } from "../components/ai-engineering/RetrievalComparisonDemo";
import { SideBySideChunkerDemo } from "../components/ai-engineering/SideBySideChunkerDemo";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/ai-chunking")({
	component: ChunkingPage,
});

function ChunkingPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-8">
			<PageHeader
				topic={{ label: "AI Engineering", color: "emerald" }}
				title="Chunking Strategies"
				subtitle="A retrieval pipeline never sees your document — it sees the chunks you cut it into. Chunk size and boundary strategy decide whether the LLM gets a coherent passage or a fragment that happens to share a few keywords with the query."
				gradient={{ from: "emerald-400", via: "cyan-400", to: "violet-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								Chunking is the step in a RAG pipeline that turns long documents
								into the small, embedding-sized units that get stored in a
								vector database. Every retrieval result comes back as one or
								more whole chunks — so a chunk that{" "}
								<span className="text-emerald-300 font-medium">
									cuts a sentence in half
								</span>{" "}
								or{" "}
								<span className="text-emerald-300 font-medium">
									mixes two unrelated topics
								</span>{" "}
								directly degrades the LLM's answer, no matter how good the
								embedding model is.
							</p>
							<p>
								Three strategies dominate in practice:{" "}
								<span className="text-cyan-300 font-medium">fixed-size</span>{" "}
								(split every N characters — fast, oblivious to content),{" "}
								<span className="text-cyan-300 font-medium">recursive</span>{" "}
								(walk a hierarchy of separators like paragraph → sentence → word
								— LangChain's default), and{" "}
								<span className="text-cyan-300 font-medium">semantic</span>{" "}
								(break when adjacent sentences become topically dissimilar).
								Overlap is an orthogonal knob that buys back the phrases lost at
								any boundary, at the cost of storage redundancy.
							</p>
							<p className="text-zinc-400">
								The demos below run all three strategies live on the same
								document, show the storage-vs-recall trade-off of overlap,
								illustrate how a single boundary collision breaks retrieval, and
								rank the same query against each strategy's chunks.
							</p>
						</div>
					),
				}}
			/>

			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.2, duration: 0.4 }}
				className="space-y-8"
			>
				<SideBySideChunkerDemo />
				<OverlapTradeoffDemo />
				<BoundaryFailureDemo />
				<RetrievalComparisonDemo />
			</motion.div>
		</div>
	);
}
