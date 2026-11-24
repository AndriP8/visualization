import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { AdjacencyMatrixDemo } from "../components/graphs/AdjacencyMatrixDemo";
import { GraphPlaygroundDemo } from "../components/graphs/GraphPlaygroundDemo";
import { ShortestPathDemo } from "../components/graphs/ShortestPathDemo";
import { TraversalDemo } from "../components/graphs/TraversalDemo";
import { GraphUseCasesDemo } from "../components/graphs/UseCasesDemo";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/graphs")({ component: GraphsPage });

function GraphsPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-8">
			<PageHeader
				topic={{ label: "Data Structures", color: "purple" }}
				title="Graphs"
				subtitle="A graph stores a set of nodes and a set of edges between them. Every edge connects two nodes that already exist, and that is the only rule it must never break."
				gradient={{ from: "purple-400", to: "fuchsia-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								A graph keeps only two things: the{" "}
								<span className="text-purple-300 font-medium">nodes</span> and
								the <span className="text-purple-300 font-medium">edges</span>{" "}
								that join them. It does not sort the nodes, place them on a
								line, or make one node the parent of another. An undirected edge
								is stored twice in memory, once from each end, because either
								end can lead to the other.
							</p>
							<p>
								How you store the edges decides which questions are cheap. One
								way gives every node a short list of the neighbors it really
								has. That is called an{" "}
								<span className="text-purple-300 font-medium">
									adjacency list
								</span>
								, and its space grows with the number of nodes plus edges. The
								other way is a grid with one cell for every possible pair,
								called an{" "}
								<span className="text-purple-300 font-medium">
									adjacency matrix
								</span>
								. It reserves a cell even for pairs that are not connected. A
								graph with 1,000 nodes reserves a million cells, most of them
								empty (O(V²) space). In return, checking whether two nodes are
								connected becomes one array lookup.
							</p>
							<p className="text-zinc-400">
								The demos start with those two storage layouts. Then a
								playground lets you add and remove nodes and edges while the
								neighbor lists stay visible. Next come the queries this shape
								unlocks: can I reach this node, and what is the fewest hops? The
								last demo applies the same structure to route finding and social
								networks.
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
				<AdjacencyMatrixDemo />
				<GraphPlaygroundDemo />
				<TraversalDemo />
				<ShortestPathDemo />
				<GraphUseCasesDemo />
			</motion.div>
		</div>
	);
}
