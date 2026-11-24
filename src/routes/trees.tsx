import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { PageHeader } from "../components/shared/PageHeader";
import { BalanceDemo } from "../components/trees/BalanceDemo";
import { BstDemo } from "../components/trees/BstDemo";
import { RotationDemo } from "../components/trees/RotationDemo";
import { TraversalDemo } from "../components/trees/TraversalDemo";
import { TreeTradeOffDemo } from "../components/trees/TreeTradeOffDemo";
import { TreeUseCasesDemo } from "../components/trees/TreeUseCasesDemo";
import { TreeVariantsDemo } from "../components/trees/TreeVariantsDemo";

export const Route = createFileRoute("/trees")({ component: TreesPage });

function TreesPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-8">
			<PageHeader
				topic={{ label: "Data Structures", color: "purple" }}
				title="Trees"
				subtitle="A tree stores values in nodes, and each node points to the nodes below it. There is exactly one path from the top node to every other node. No node has two parents, and there are no loops."
				gradient={{ from: "purple-400", to: "fuchsia-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								Each node holds one value and a short list of children. A binary
								tree gives a node at most two children. A tree that allows any
								number of children is called an{" "}
								<span className="text-purple-300 font-medium">N-ary tree</span>,
								and that is the shape behind JSON documents, the DOM, and file
								systems. Nodes are allocated one at a time, so moving down the
								tree means following a stored address (a pointer) from one node
								to the next.
							</p>
							<p>
								An ordering rule is what makes the shape useful. In a{" "}
								<span className="text-purple-300 font-medium">
									binary search tree
								</span>
								, everything left of a node is smaller and everything right is
								larger, so a lookup follows one branch instead of checking every
								node. A balanced variant adds a height limit and repairs itself
								after inserts and deletes, so no branch turns into a long chain.
								A complete tree — every level full except possibly the last,
								which fills from left to right — can drop the child addresses
								entirely and pack its nodes into one flat array, because each
								child's position can be computed from its parent's index.
							</p>
							<p className="text-zinc-400">
								The demos begin with the variants and both memory layouts, then
								compare a lopsided tree with a balanced one and show the
								rotation that keeps a tree balanced. A playground shows insert,
								search, and delete as address edits. After that come the visit
								orders every tree query relies on, then file-system and JSON
								examples, and a closing comparison: when a tree answers the
								order questions a hash table cannot.
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
				<TreeVariantsDemo />
				<BalanceDemo />
				<RotationDemo />
				<BstDemo />
				<TraversalDemo />
				<TreeUseCasesDemo />
				<TreeTradeOffDemo />
			</motion.div>
		</div>
	);
}
