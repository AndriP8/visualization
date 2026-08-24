import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { KeyPropDemo } from "../components/reconciliation/KeyPropDemo";
import { PhasesDemo } from "../components/reconciliation/PhasesDemo";
import { TreeDiffDemo } from "../components/reconciliation/TreeDiffDemo";
import { TypeChangeDemo } from "../components/reconciliation/TypeChangeDemo";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/reconciliation")({
	component: ReconciliationPage,
});

function ReconciliationPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-8">
			<PageHeader
				topic={{ label: "React", color: "cyan" }}
				title="Reconciliation"
				subtitle="Comparing two arbitrary trees is O(n³) — far too slow for UI updates that need to happen in milliseconds. React's reconciliation algorithm reduces this to O(n) by making two practical assumptions about how UIs change."
				gradient={{ from: "cyan-400", to: "blue-400" }}
				explanation={{
					content: (
						<div className="text-sm text-zinc-300 space-y-2">
							<p>
								When state changes, React re-runs your component to produce a
								new element tree, then diffs it against the previous tree to
								find the minimum DOM mutations. The general tree diff algorithm
								requires{" "}
								<span className="text-cyan-400 font-medium">
									O(n³) comparisons
								</span>{" "}
								— for 1,000 elements, that is one billion operations. This is
								unusable for 60fps rendering.
							</p>
							<p>
								React solves this with two heuristics:{" "}
								<span className="text-cyan-400 font-medium">(1)</span> elements
								of different types produce entirely different subtrees (so skip
								deep comparison), and{" "}
								<span className="text-cyan-400 font-medium">(2)</span>{" "}
								<code>key</code> props identify which children are stable across
								renders. These assumptions reduce the diff to{" "}
								<span className="text-cyan-400 font-medium">O(n)</span>. The
								trade-off: React occasionally destroys and recreates more DOM
								than strictly necessary when these assumptions are wrong.
							</p>
							<p className="text-zinc-400">
								The demos below visualize the tree diff algorithm, the
								render-commit phases, key-based list reordering, and what
								happens when element types change.
							</p>
						</div>
					),
				}}
			/>

			{/* Demos */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.2, duration: 0.4 }}
				className="space-y-8"
			>
				<TreeDiffDemo />
				<PhasesDemo />
				<KeyPropDemo />
				<TypeChangeDemo />
			</motion.div>
		</div>
	);
}
