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
				topic={{ label: "JavaScript Internals", color: "amber" }}
				title="Closure & Lexical Scope"
				subtitle="How JavaScript resolves variable names — and the bugs that emerge when closures aren't fully understood."
				gradient={{ from: "amber-400", to: "yellow-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								<span className="text-amber-300 font-medium">
									Lexical scope
								</span>{" "}
								means a function's accessible variables are determined by where
								it is written in source code, not where it is called. The engine
								builds a chain of scope objects at parse time — each function
								gets a reference to its enclosing scope, all the way up to the
								global scope.
							</p>
							<p>
								A <span className="text-yellow-300 font-medium">closure</span>{" "}
								is a function bundled with a live reference to its outer scope's
								environment record. The inner function does not copy the values
								— it holds a pointer to the environment object, keeping it alive
								even after the outer function returns. This is why a stale{" "}
								<code>useEffect</code> or <code>setTimeout</code> callback can
								read an old value: it captured the environment at creation time.
							</p>
							<p className="text-zinc-400">
								The demos below progress from scope chain lookup, to closure
								environments, to two real-world bugs — stale closures in React
								hooks and the classic for-loop var capture.
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
