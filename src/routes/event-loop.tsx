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
				subtitle="JavaScript has one call stack and one thread — it can only run one piece of code at a time. The event loop is the scheduling mechanism that coordinates when asynchronous callbacks get their turn to execute on that single thread."
				gradient={{ from: "emerald-400", to: "cyan-400" }}
				explanation={{
					content: (
						<div className="text-sm text-zinc-300 space-y-2">
							<p>
								JavaScript runs on a{" "}
								<span className="text-emerald-400 font-medium">
									single thread
								</span>{" "}
								with one call stack — it can execute only one piece of code at a
								time. Asynchronous operations (timers, network requests, DOM
								events) are delegated to{" "}
								<span className="text-cyan-400 font-medium">Web APIs</span>{" "}
								outside the main thread, but their callbacks must still run on
								that single thread.
							</p>
							<p>
								The{" "}
								<span className="text-emerald-400 font-medium">event loop</span>{" "}
								is the scheduler that coordinates this. It follows a strict
								priority order: finish all synchronous code, drain the{" "}
								<span className="text-cyan-400 font-medium">
									microtask queue
								</span>{" "}
								(Promise callbacks, queueMicrotask), then process one{" "}
								<span className="text-orange-400 font-medium">macrotask</span>{" "}
								(setTimeout, I/O callbacks), then repeat. This priority ordering
								is why <code>Promise.then</code> always runs before{" "}
								<code>setTimeout</code>, even when both are ready.
							</p>
							<p className="text-zinc-400">
								The demos below let you step through the call stack, run a full
								event loop simulation with interleaved micro/macrotasks, and see
								where requestAnimationFrame fits in the cycle.
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
