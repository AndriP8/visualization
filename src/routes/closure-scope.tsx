import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ClosureSnapshotDemo } from "../components/closure-scope/ClosureSnapshotDemo";
import { ForLoopBugDemo } from "../components/closure-scope/ForLoopBugDemo";
import { LexicalScopeExplorerDemo } from "../components/closure-scope/LexicalScopeExplorerDemo";
import { StaleClosureDemo } from "../components/closure-scope/StaleClosureDemo";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/closure-scope")({
	component: ClosureScopePage,
});

function ClosureScopePage() {
	return (
		<div className="max-w-6xl mx-auto space-y-8">
			<PageHeader
				topic={{ label: "JavaScript Internals", color: "emerald" }}
				title="Closure & Lexical Scope"
				subtitle="How JavaScript resolves variable names — and the bugs that emerge when closures aren't fully understood."
				gradient={{ from: "violet-400", to: "cyan-400" }}
				explanation={{
					content: (
						<div className="text-sm text-text-muted space-y-2">
							<p>
								<strong className="text-text-secondary">Lexical scope</strong>{" "}
								means a function's accessible variables are determined by{" "}
								<strong className="text-accent-violet-soft">
									where it is written
								</strong>{" "}
								in source code, not where it is called. Inner functions can
								always read and write variables from their outer (enclosing)
								scopes.
							</p>
							<p>
								A <strong className="text-accent-cyan-soft">closure</strong> is
								the combination of a function and a reference to the{" "}
								<em>lexical environment</em> in which it was defined. The inner
								function doesn't copy the values — it holds a{" "}
								<strong className="text-accent-cyan-soft">
									live reference
								</strong>{" "}
								to the outer scope's environment record, keeping it alive even
								after the outer function has returned.
							</p>
							<p className="text-text-faint">
								The demos below progress from the basic scope chain lookup, to
								closure environments, to two real-world bugs you'll encounter in
								production React and plain JavaScript code.
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
				<LexicalScopeExplorerDemo />
				<ClosureSnapshotDemo />
				<StaleClosureDemo />
				<ForLoopBugDemo />
			</motion.div>
		</div>
	);
}
