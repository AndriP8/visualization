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
				topic={{ label: "JavaScript Internals", color: "amber" }}
				title="Memory & Garbage Collection"
				subtitle="How V8 allocates values on the stack and objects on the heap, traces live objects from GC roots, reclaims unreachable memory through mark-and-sweep, and why most React memory leaks are just a forgotten reference keeping an object alive."
				gradient={{ from: "amber-400", to: "yellow-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								Garbage collection never "looks for garbage" — it{" "}
								<span className="text-amber-300 font-medium">
									traces what is alive
								</span>{" "}
								starting from GC roots (global scope, stack frames, closures),
								marks every reachable object, and discards the rest. A memory
								leak is not a bug in the GC; it is an{" "}
								<span className="text-yellow-300 font-medium">
									unintended reference
								</span>{" "}
								keeping an object inside the reachable set — a forgotten event
								listener, a closure capturing a large object, or a global cache
								with no eviction policy.
							</p>
							<p>
								V8 applies the{" "}
								<span className="text-emerald-300 font-medium">
									generational hypothesis
								</span>
								: most objects die young. New Space (young gen) is collected
								cheaply and frequently; survivors promote to Old Space (old gen)
								where full mark-and-sweep runs rarely. Understanding this split
								explains why React component state that holds large arrays
								across re-renders can silently grow Old Space.
							</p>
							<p className="text-zinc-400">
								The demos below cover stack vs heap allocation, mark-and-sweep
								visualization, generational GC, and common React memory leak
								patterns.
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
