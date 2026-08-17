import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { BruteForceKnnDemo } from "../components/ai-vector-search/BruteForceKnnDemo";
import { HnswGraphBuildDemo } from "../components/ai-vector-search/HnswGraphBuildDemo";
import { HnswSearchDemo } from "../components/ai-vector-search/HnswSearchDemo";
import { RecallSpeedTradeoffDemo } from "../components/ai-vector-search/RecallSpeedTradeoffDemo";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/ai-vector-search")({
	component: VectorSearchPage,
});

function VectorSearchPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-8">
			<PageHeader
				topic={{ label: "AI Engineering", color: "violet" }}
				title="Vector Search (HNSW)"
				subtitle="Exact nearest-neighbor search over millions of embeddings is O(n·d) per query — too slow for production. Approximate Nearest Neighbor (ANN) algorithms trade a small recall loss for orders-of-magnitude speedup."
				gradient={{ from: "violet-400", to: "indigo-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								<span className="text-violet-300 font-medium">
									The problem:
								</span>{" "}
								To find the closest match among millions of items, checking
								every single one works fine at small scale. But once your data
								grows large, comparing a query against everything becomes the
								bottleneck.
							</p>
							<p>
								<span className="text-indigo-300 font-medium">
									HNSW's solution:
								</span>{" "}
								Build a map of shortcuts. It's a graph in layers — a sparse top
								layer for long jumps, denser layers below for fine detail. A
								search hops across the top, then narrows in, only ever touching
								a tiny slice of the data.
							</p>
							<p>
								<span className="text-violet-300 font-medium">
									The trade-off:
								</span>{" "}
								Shortcuts can occasionally skip the true best match. The speedup
								is worth it, and a single dial lets you shift the balance
								between accuracy and speed.
							</p>
							<p className="text-zinc-400">
								The demos below start from the brute-force baseline, then show
								the shortcut graph being built, a search running through it, and
								the accuracy-versus-speed curve you tune in production.
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
				<BruteForceKnnDemo />
				<HnswGraphBuildDemo />
				<HnswSearchDemo />
				<RecallSpeedTradeoffDemo />
			</motion.div>
		</div>
	);
}
