import { Fragment } from "react";
import { DemoSection } from "../shared/DemoSection";
import { EDGES, GRAPH, NODES } from "./graph";

export function AdjacencyMatrixDemo() {
	const size = NODES.length;
	return (
		<DemoSection
			title="Variants & memory layout"
			description="Graphs come in several flavors, but they are stored in only two layouts: a list of real neighbors for each node, or a grid with one cell for every possible pair. The left panel is the list. The right panel is the grid. Notice how much of the grid is empty for this small graph."
		>
			<div className="mb-6 grid gap-3 sm:grid-cols-3">
				<div className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2.5">
					<p className="text-sm font-medium text-purple-300">
						Directed / undirected
					</p>
					<p className="mt-1 text-xs text-zinc-500">
						Undirected edges are stored twice — each endpoint lists the other.
						Directed edges are stored once.
					</p>
				</div>
				<div className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2.5">
					<p className="text-sm font-medium text-purple-300">
						Weighted / unweighted
					</p>
					<p className="mt-1 text-xs text-zinc-500">
						A weight upgrades an edge from "connected" to "connected, at this
						cost" — the extra number lives beside the neighbor.
					</p>
				</div>
				<div className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2.5">
					<p className="text-sm font-medium text-purple-300">
						Cyclic / acyclic
					</p>
					<p className="mt-1 text-xs text-zinc-500">
						Whether following edges can lead back to a node you've already
						visited. Storage is identical — only queries differ.
					</p>
				</div>
			</div>
			<div className="grid gap-6 md:grid-cols-2">
				<div>
					<p className="mb-3 text-sm font-medium text-zinc-200">
						Adjacency list · {size} node lists holding {EDGES.length * 2}{" "}
						neighbor entries (each undirected edge stored twice)
					</p>
					<div className="grid gap-2 sm:grid-cols-3">
						{NODES.map(({ id }) => (
							<p
								key={id}
								className="rounded-md border border-zinc-800 bg-zinc-950/40 px-3 py-2 font-mono text-xs text-zinc-400"
							>
								{id}: {(GRAPH[id] ?? []).join(", ")}
							</p>
						))}
					</div>
					<p className="mt-3 text-xs text-zinc-500">
						Compact for sparse graphs; checking one edge means scanning a
						neighbor list.
					</p>
				</div>
				<div>
					<p className="mb-3 text-sm font-medium text-zinc-200">
						Adjacency matrix · O(V²) = {size ** 2}
					</p>
					<div
						className="inline-grid gap-1 font-mono text-xs"
						style={{ gridTemplateColumns: `1.75rem repeat(${size}, 1.75rem)` }}
					>
						<span />
						{NODES.map(({ id }) => (
							<span key={id} className="text-center text-zinc-500">
								{id}
							</span>
						))}
						{NODES.map(({ id }) => (
							<Fragment key={id}>
								<span className="flex h-7 items-center justify-center text-zinc-500">
									{id}
								</span>
								{NODES.map(({ id: other }) => {
									const has = (GRAPH[id] ?? []).includes(other);
									return (
										<span
											key={other}
											className={`flex h-7 items-center justify-center rounded ${
												has
													? "bg-purple-500/15 text-purple-300"
													: id === other
														? "bg-zinc-800/50 text-zinc-600"
														: "text-zinc-600"
											}`}
										>
											{has ? "1" : "·"}
										</span>
									);
								})}
							</Fragment>
						))}
					</div>
					<p className="mt-3 text-xs text-zinc-500">
						Edge checks are O(1) — but most cells are wasted on this sparse
						graph.
					</p>
				</div>
			</div>
		</DemoSection>
	);
}
