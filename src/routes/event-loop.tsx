import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { CallStackDemo } from "../components/event-loop/CallStackDemo";
import { EventLoopSimDemo } from "../components/event-loop/EventLoopSimDemo";
import { MicroMacroDemo } from "../components/event-loop/MicroMacroDemo";
import { RAFDemo } from "../components/event-loop/RAFDemo";

export const Route = createFileRoute("/event-loop")({
	component: EventLoopPage,
});

function EventLoopPage() {
	return (
		<div className="max-w-5xl mx-auto space-y-8">
			{/* Header */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
			>
				<h2 className="text-3xl font-bold mb-2">
					🔄{" "}
					<span className="bg-linear-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
						Event Loop
					</span>
				</h2>
				<p className="text-zinc-400 text-lg mb-2">
					How JavaScript handles asynchronous code with a single thread.
				</p>
				<div className="text-sm text-zinc-500 p-4 rounded-lg bg-zinc-800/30 border border-zinc-800 space-y-2">
					<p>
						<strong className="text-zinc-300">The key insight:</strong>{" "}
						JavaScript is{" "}
						<strong className="text-emerald-400">single-threaded</strong> — it
						has one call stack and can only do one thing at a time. So how does
						it handle timers, network requests, and user events without
						blocking?
					</p>
					<p>
						The answer is the{" "}
						<strong className="text-cyan-400">Event Loop</strong> — a
						coordination mechanism that checks: if the call stack is empty,
						drain <em>all</em>{" "}
						<strong className="text-cyan-400">microtasks</strong> (Promise.then,
						queueMicrotask), then pick <em>one</em>{" "}
						<strong className="text-orange-400">macrotask</strong> (setTimeout,
						I/O), then repeat.
					</p>
					<p className="text-zinc-500">
						<strong className="text-zinc-300">Web APIs</strong> (setTimeout,
						fetch, DOM events) delegate work outside the main thread. When
						they're done, their callbacks are queued — never interrupting
						currently running code. The Event Loop decides <em>when</em> each
						callback actually runs.
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
				<CallStackDemo />
				<EventLoopSimDemo />
				<MicroMacroDemo />
				<RAFDemo />
			</motion.div>
		</div>
	);
}
