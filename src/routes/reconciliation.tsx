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
				topic={{ label: "React Internals", color: "orange" }}
				title="Reconciliation"
				subtitle="How React decides what to update in the real DOM."
				gradient={{ from: "violet-400", to: "cyan-400" }}
				explanation={{
					content: (
						<div className="text-sm text-text-muted space-y-2">
							<p className="mb-1">
								<strong className="text-text-secondary">The core idea:</strong>{" "}
								<code className="text-accent-violet-soft">UI = f(state)</code>.
								When state changes, React re-runs your component functions to
								get a new tree, then
								<em> diffs</em> it against the previous tree to find the minimum
								set of DOM mutations.
							</p>
							<p>
								General tree diff is O(n³). React reduces it to{" "}
								<strong className="text-accent-cyan-soft">O(n)</strong> with two
								heuristics: elements of different types produce different trees,
								and <code className="text-accent-violet-soft">key</code> props
								hint which children are stable.
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
