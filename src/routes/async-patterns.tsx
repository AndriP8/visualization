import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { AsyncAwaitDemo } from "../components/async-patterns/AsyncAwaitDemo";
import { CombinatorsDemo } from "../components/async-patterns/CombinatorsDemo";
import { ErrorHandlingDemo } from "../components/async-patterns/ErrorHandlingDemo";
import { RaceConditionsDemo } from "../components/async-patterns/RaceConditionsDemo";
import { DemoSection } from "../components/shared/DemoSection";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/async-patterns")({
	component: AsyncPatternsPage,
});

function AsyncPatternsPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-8">
			<PageHeader
				topic={{ label: "JavaScript Internals", color: "emerald" }}
				title="Async Patterns & Promises"
				subtitle="How async/await, Promise combinators, race conditions, and error handling actually work under the hood."
				gradient={{ from: "emerald-400", via: "cyan-400", to: "blue-400" }}
				explanation={{
					content: (
						<div className="text-sm text-zinc-500 space-y-2">
							<p>
								<strong className="text-zinc-300">async/await</strong> is
								syntactic sugar over Promises. Every{" "}
								<code className="text-emerald-400">await</code> suspends the
								current async function and schedules its continuation as a{" "}
								<strong className="text-cyan-400">microtask</strong> — it never
								blocks the thread.
							</p>
							<p>
								Promise <strong className="text-zinc-300">combinators</strong> (
								<code className="text-cyan-400">all</code>,{" "}
								<code className="text-cyan-400">race</code>,{" "}
								<code className="text-cyan-400">allSettled</code>,{" "}
								<code className="text-cyan-400">any</code>) differ in how they
								handle partial failures and which result wins — choosing the
								right one prevents subtle bugs.
							</p>
							<p>
								<strong className="text-zinc-300">Race conditions</strong> occur
								when multiple in-flight requests can resolve in any order. Fix
								them with{" "}
								<code className="text-amber-400">AbortController</code> or a
								request ID guard.
							</p>
						</div>
					),
				}}
			/>

			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.2, duration: 0.4 }}
				className="space-y-8"
			>
				<DemoSection
					title="Demo 1: async/await Internals"
					description="Step through how async functions suspend, yield, and resume via the microtask queue."
				>
					<AsyncAwaitDemo />
				</DemoSection>

				<DemoSection
					title="Demo 2: Promise Combinators"
					description="Configure 3 promises with delays and success/failure, then run each combinator to see which result wins."
				>
					<CombinatorsDemo />
				</DemoSection>

				<DemoSection
					title="Demo 3: Race Conditions"
					description="Simulate search requests arriving out of order and compare three fix strategies side by side."
				>
					<RaceConditionsDemo />
				</DemoSection>

				<DemoSection
					title="Demo 4: Error Handling & Retry"
					description="Inject errors at any pipeline stage to see propagation, plus simulate exponential backoff retries."
				>
					<ErrorHandlingDemo />
				</DemoSection>
			</motion.div>
		</div>
	);
}
