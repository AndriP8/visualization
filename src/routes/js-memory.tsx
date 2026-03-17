import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { GenerationalGCDemo } from "../components/js-memory/GenerationalGCDemo";
import { MarkAndSweepDemo } from "../components/js-memory/MarkAndSweepDemo";
import { MemoryLeakPatternsDemo } from "../components/js-memory/MemoryLeakPatternsDemo";
import { StackHeapExplorerDemo } from "../components/js-memory/StackHeapExplorerDemo";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/js-memory")({
	component: JsMemoryPage,
});

function JsMemoryPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-12 pb-20">
			<PageHeader
				topic={{ label: "JavaScript Internals", color: "emerald" }}
				title="Memory & Garbage Collection"
				subtitle="How V8 allocates values on the stack and objects on the heap, traces live objects from GC roots, reclaims unreachable memory through mark-and-sweep, and why most React memory leaks are just a forgotten reference keeping an object alive."
				gradient={{ from: "emerald-400", via: "violet-400", to: "cyan-400" }}
				explanation={{
					content: (
						<div className="text-sm text-zinc-500 space-y-2">
							<p>
								<strong className="text-zinc-300">The key insight: </strong>
								Garbage collection never "looks for garbage" — it{" "}
								<strong className="text-emerald-400">
									traces what is alive
								</strong>{" "}
								starting from GC roots, marks everything reachable, then
								discards the rest. A memory leak is simply an{" "}
								<strong className="text-violet-400">
									unintended reference
								</strong>{" "}
								that keeps an object inside the reachable set.
							</p>
							<p className="text-zinc-500">
								V8 uses a{" "}
								<strong className="text-zinc-300">
									generational hypothesis
								</strong>
								: most objects die young. Separating short-lived and long-lived
								objects lets the engine collect young space cheaply and
								frequently, while expensive full GCs on old space are rare.
							</p>
						</div>
					),
				}}
			/>

			{/* Demo sections */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.4, duration: 0.4 }}
				className="space-y-16"
			>
				<StackHeapExplorerDemo />
				<MarkAndSweepDemo />
				<GenerationalGCDemo />
				<MemoryLeakPatternsDemo />
			</motion.div>
		</div>
	);
}
