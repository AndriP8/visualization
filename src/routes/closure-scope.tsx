import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ClosureSnapshotDemo } from "../components/closure-scope/ClosureSnapshotDemo";
import { ForLoopBugDemo } from "../components/closure-scope/ForLoopBugDemo";
import { LexicalScopeExplorerDemo } from "../components/closure-scope/LexicalScopeExplorerDemo";
import { StaleClosureDemo } from "../components/closure-scope/StaleClosureDemo";

export const Route = createFileRoute("/closure-scope")({
	component: ClosureScopePage,
});

function ClosureScopePage() {
	return (
		<div className="max-w-5xl mx-auto space-y-8">
			{/* Header */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
			>
				<h2 className="text-3xl font-bold mb-2">
					🔍{" "}
					<span className="bg-linear-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
						Closure & Lexical Scope
					</span>
				</h2>
				<p className="text-zinc-400 text-lg mb-2">
					How JavaScript resolves variable names — and the bugs that emerge when
					closures aren't fully understood.
				</p>
				<div className="text-sm text-zinc-500 p-4 rounded-lg bg-zinc-800/30 border border-zinc-800 space-y-2">
					<p>
						<strong className="text-zinc-300">Lexical scope</strong> means a
						function's accessible variables are determined by{" "}
						<strong className="text-violet-400">where it is written</strong> in
						source code, not where it is called. Inner functions can always read
						and write variables from their outer (enclosing) scopes.
					</p>
					<p>
						A <strong className="text-cyan-400">closure</strong> is the
						combination of a function and a reference to the{" "}
						<em>lexical environment</em> in which it was defined. The inner
						function doesn't copy the values — it holds a{" "}
						<strong className="text-cyan-400">live reference</strong> to the
						outer scope's environment record, keeping it alive even after the
						outer function has returned.
					</p>
					<p className="text-zinc-600">
						The demos below progress from the basic scope chain lookup, to
						closure environments, to two real-world bugs you'll encounter in
						production React and plain JavaScript code.
					</p>
				</div>
			</motion.div>

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
