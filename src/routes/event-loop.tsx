import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { CallStackDemo } from "../components/event-loop/CallStackDemo";
import { EventLoopSimDemo } from "../components/event-loop/EventLoopSimDemo";
import { MicroMacroDemo } from "../components/event-loop/MicroMacroDemo";
import { RAFDemo } from "../components/event-loop/RAFDemo";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/event-loop")({
	component: EventLoopPage,
});

function EventLoopPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-8">
			<PageHeader
				topic={{ label: "JavaScript Internals", color: "emerald" }}
				title="Event Loop"
				subtitle="How JavaScript handles asynchronous code with a single thread."
				gradient={{ from: "emerald-400", to: "cyan-400" }}
				explanation={{
					content: (
						<div className="text-sm text-text-muted space-y-2">
							<p>
								<strong className="text-text-secondary">
									The key insight:
								</strong>{" "}
								JavaScript is{" "}
								<strong className="text-accent-emerald-soft">
									single-threaded
								</strong>{" "}
								— it has one call stack and can only do one thing at a time. So
								how does it handle timers, network requests, and user events
								without blocking?
							</p>
							<p>
								The answer is the{" "}
								<strong className="text-accent-cyan-soft">Event Loop</strong> —
								a coordination mechanism that checks: if the call stack is
								empty, drain <em>all</em>{" "}
								<strong className="text-accent-cyan-soft">microtasks</strong>{" "}
								(Promise.then, queueMicrotask), then pick <em>one</em>{" "}
								<strong className="text-accent-orange-soft">macrotask</strong>{" "}
								(setTimeout, I/O), then repeat.
							</p>
							<p className="text-text-muted">
								<strong className="text-text-secondary">Web APIs</strong>{" "}
								(setTimeout, fetch, DOM events) delegate work outside the main
								thread. When they're done, their callbacks are queued — never
								interrupting currently running code. The Event Loop decides{" "}
								<em>when</em> each callback actually runs.
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
				<CallStackDemo />
				<EventLoopSimDemo />
				<MicroMacroDemo />
				<RAFDemo />
			</motion.div>
		</div>
	);
}
