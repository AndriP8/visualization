import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { DemoSection } from "../components/shared/DemoSection";
import { PageHeader } from "../components/shared/PageHeader";
import { CallStackDemo } from "../components/stacks-queues/CallStackDemo";
import { CircularQueueDemo } from "../components/stacks-queues/CircularQueueDemo";
import { ComparisonDemo } from "../components/stacks-queues/ComparisonDemo";
import { DequeDemo } from "../components/stacks-queues/DequeDemo";
import { StackLayoutDemo } from "../components/stacks-queues/StackLayoutDemo";

export const Route = createFileRoute("/stacks-queues")({
	component: StacksQueuesPage,
});

function StacksQueuesPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-8">
			<PageHeader
				topic={{ label: "Data Structures", color: "purple" }}
				title="Stacks & Queues"
				subtitle="A stack is like a pile of plates. You add to the top and take from the top, so the most recent item comes out first. A queue is like a line at a counter. You join at the back and leave at the front, so the earliest item comes out first."
				gradient={{ from: "purple-400", to: "fuchsia-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								A stack adds and removes at the same end. You{" "}
								<span className="text-purple-300 font-medium">push</span> an
								item on top, and you{" "}
								<span className="text-purple-300 font-medium">pop</span> the top
								item off. The most recent item always comes out first, which is
								called last in, first out (
								<span className="text-purple-300 font-medium">LIFO</span>). A
								queue adds at the back and removes from the front. The earliest
								item always comes out first, which is called first in, first out
								(<span className="text-rose-300 font-medium">FIFO</span>). These
								rules only describe the order items come out. They say nothing
								about how the structure is stored.
							</p>
							<p>
								The restriction is the whole point. Undo history, function
								calls, and the graph walk that follows one branch to the end all
								need the most recent thing first. That graph walk is called
								depth-first search. Task scheduling, message buffering, and the
								graph walk that fans out one level at a time all need arrival
								order. That one is called breadth-first search. A{" "}
								<span className="text-purple-300 font-medium">
									circular queue
								</span>{" "}
								is the array-backed version of a queue. It keeps the front
								position and the number of items, and wraps them around a fixed
								block of slots (a circular buffer), so adding and removing never
								shifts the other items. That fixed size is the trade-off: the
								queue has a{" "}
								<span className="text-rose-300 font-medium">
									hard capacity limit
								</span>
								. A <span className="text-purple-300 font-medium">deque</span>{" "}
								(short for double-ended queue) allows adding and removing at
								both ends.
							</p>
							<p className="text-zinc-400">
								The demos start with the two ways a stack can be laid out in
								memory, then compare stack and queue order side by side, walk
								through a circular queue as it wraps around its array, exercise
								a deque at both ends, break the FIFO rule with a priority queue,
								and replay a script on the call stack.
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
				<StackLayoutDemo />
				<ComparisonDemo />
				<CircularQueueDemo />
				<DequeDemo />
				<DemoSection
					title="Beyond FIFO: the priority queue"
					description="One step past the queue: serving by importance instead of arrival order."
				>
					<p className="text-sm text-zinc-300">
						A queue always serves the{" "}
						<span className="text-rose-300 font-medium">earliest</span> item. A{" "}
						<span className="text-purple-300 font-medium">priority queue</span>{" "}
						serves the{" "}
						<span className="text-purple-300 font-medium">most important</span>{" "}
						item first, no matter when it arrived — hospital triage and
						operating system schedulers both work this way. It is built on a{" "}
						<span className="text-purple-300 font-medium">heap</span>, which
						keeps the highest-priority item at the top.{" "}
						<Link
							to="/heaps"
							className="text-purple-300 underline underline-offset-2 hover:text-purple-200"
						>
							See the Heaps page for how that works.
						</Link>
					</p>
				</DemoSection>
				<CallStackDemo />
			</motion.div>
		</div>
	);
}
