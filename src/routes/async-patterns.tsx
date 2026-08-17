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
				topic={{ label: "JavaScript Internals", color: "amber" }}
				title="Async Patterns & Promises"
				subtitle="How async/await, Promise combinators, race conditions, and error handling actually work under the hood."
				gradient={{ from: "amber-400", to: "yellow-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								<span className="text-amber-300 font-medium">async/await</span>{" "}
								is syntactic sugar over Promises — every <code>await</code>{" "}
								suspends the async function and schedules its continuation as a{" "}
								<span className="text-yellow-300 font-medium">microtask</span>,
								never blocking the thread. The four Promise combinators (
								<code>all</code>, <code>race</code>, <code>allSettled</code>,{" "}
								<code>any</code>) differ in how they handle partial failures —
								choosing the wrong one is a common source of silent error
								swallowing or premature resolution.
							</p>
							<p>
								Race conditions emerge when multiple in-flight requests can
								resolve in any order and the last-response-wins assumption
								breaks. Fixing them requires explicit cancellation via{" "}
								<code>AbortController</code> or a request-ID guard — patterns
								that become second nature once you understand what async
								operations look like on the event loop.
							</p>
							<p className="text-zinc-400">
								The demos below cover async/await internals, Promise combinator
								behavior, race condition patterns and fixes, and error
								propagation with retry logic.
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
