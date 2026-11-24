import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { HeapDemo } from "../components/heaps/HeapDemo";
import { PriorityQueueDemo } from "../components/heaps/PriorityQueueDemo";
import { DemoSection } from "../components/shared/DemoSection";
import { PageHeader } from "../components/shared/PageHeader";
import { ShikiCode } from "../components/shared/ShikiCode";

export const Route = createFileRoute("/heaps")({ component: HeapsPage });

const SIFT_UP = `function siftUp(heap: number[], start: number) {
  let i = start;
  while (i > 0) {
    const parent = Math.floor((i - 1) / 2);
    if (heap[parent] <= heap[i]) return;
    [heap[parent], heap[i]] = [heap[i], heap[parent]];
    i = parent;
  }
}`;

const COMPARISON = [
	{
		operation: "Read the minimum",
		sorted: "O(1) — it is slot 0",
		heap: "O(1) — it is the root",
	},
	{
		operation: "Insert",
		sorted: "O(n) — shift every later item over",
		heap: "O(log n) — a few swaps up one short path",
	},
	{
		operation: "Remove the minimum",
		sorted: "O(n) — shift everything forward",
		heap: "O(log n) — a few swaps down one short path",
	},
	{
		operation: "Everything in order?",
		sorted: "Yes — the array is fully sorted",
		heap: "No — only the top is guaranteed",
	},
];

const USE_CASES = [
	{
		title: "Process schedulers",
		body: "An operating system keeps the tasks that are ready to run in a priority queue. The most urgent task is always at the root, so picking the next task is one read instead of a search.",
	},
	{
		title: "Dijkstra's shortest path",
		body: "The classic shortest-path algorithm repeatedly needs the closest node it has not visited yet. A min-heap serves that node from the root, then repairs the tree with a few swaps.",
	},
	{
		title: "Top-K",
		body: "To keep the 10 biggest values out of a million, keep a small min-heap holding the current top 10. A new value only enters if it beats the smallest of the ten, so the heap never grows.",
	},
	{
		title: "Timers",
		body: "The browser and Node store pending timers in a heap ordered by expiry time. Whichever timer fires soonest sits at the root, no matter in which order the timers were created.",
	},
];

function HeapsPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-8">
			<PageHeader
				topic={{ label: "Data Structures", color: "violet" }}
				title="Heaps & Priority Queues"
				subtitle="A heap keeps the most important value at the top, ready to read at any moment. It is a compact way to build a priority queue, a waiting line where the most urgent item goes first instead of the earliest one."
				gradient={{ from: "violet-400", to: "cyan-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								A heap stores its values in a tree that is packed into a plain
								array. In a{" "}
								<span className="text-violet-300 font-medium">min-heap</span>{" "}
								the value at the top is the smallest one. In a{" "}
								<span className="text-violet-300 font-medium">max-heap</span> it
								is the largest one. One rule always holds: every parent compares
								as smaller (or larger) than both of its children. That rule does
								not sort the array. It only guarantees that the top value is the
								right one and that every path stays short.
							</p>
							<p>
								Reading the top value costs almost nothing, because it always
								sits in the first slot (O(1)). Adding or removing a value costs
								work that grows with the height of the tree, which is the
								logarithm of the number of values (O(log n)). For a million
								values that is about twenty steps. The trade-off is that a heap
								only keeps the top value in order. The second smallest is still
								easy: it must be one of the root's two children, so two checks
								find it. Any other value means scanning slots one by one,
								because nothing is sorted.
							</p>
							<p className="text-zinc-400">
								The demos run in order: a playground for inserting and removing
								values, a head-to-head with a sorted array, the sift-up loop
								behind every insert, and a triage queue that puts the priority
								queue to work.
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
					title="Min-heap operations"
					description="The root is always the smallest value. The array and the tree below show the same heap: insert bubbles a value up, remove-min pulls the root and sifts the last value down."
				>
					<div className="space-y-5">
						<div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-400">
							<p className="mb-2 font-medium text-zinc-200">
								Why an array can hold a tree
							</p>
							<p>
								The tree never stores addresses. Each node's family lives at
								fixed slots: the parent of slot{" "}
								<span className="font-mono text-cyan-300">i</span> is at{" "}
								<span className="font-mono text-cyan-300">
									floor((i - 1) / 2)
								</span>
								, and its children are at{" "}
								<span className="font-mono text-cyan-300">2i + 1</span> and{" "}
								<span className="font-mono text-cyan-300">2i + 2</span>. Every
								swap in the demos below is just two array writes.
							</p>
						</div>
						<HeapDemo />
					</div>
				</DemoSection>
				<DemoSection
					title="Why not a sorted array?"
					description="A sorted array also hands you the minimum instantly — it is slot 0. The difference shows up when the data changes: the heap pays a few swaps on one short path, the array pays a shift across everything."
				>
					<div className="space-y-4">
						<div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
							<table className="w-full text-sm">
								<thead>
									<tr className="text-left text-zinc-400">
										<th className="pb-2 font-medium">Operation</th>
										<th className="pb-2 font-medium">Sorted array</th>
										<th className="pb-2 font-medium">Min-heap</th>
									</tr>
								</thead>
								<tbody>
									{COMPARISON.map((row) => (
										<tr
											key={row.operation}
											className="border-t border-zinc-800"
										>
											<td className="py-2 pr-4 text-zinc-300">
												{row.operation}
											</td>
											<td className="py-2 pr-4 text-zinc-400">{row.sorted}</td>
											<td className="py-2 text-zinc-400">{row.heap}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						<p className="text-sm text-zinc-400">
							When the workload is many inserts and many min-reads between them
							— a scheduler, a timer list, Dijkstra's algorithm — the heap's
							short path wins. The honest trade-off runs the other way: the
							sorted array is fully ordered, the heap is not. If you need
							everything in order, you sort — and popping the root again and
							again is one way to do it.
						</p>
					</div>
				</DemoSection>
				<DemoSection
					title="The sift-up loop"
					description="Insert is one loop: compare with the parent slot, swap if smaller, climb. The loop runs at most once per tree level, which is where the O(log n) comes from."
				>
					<ShikiCode
						language="typescript"
						code={SIFT_UP}
						showLineNumbers={false}
					/>
				</DemoSection>
				<DemoSection
					title="A priority queue in action"
					description="An emergency room takes patients in any order but treats the most urgent one first. Severity is the heap key: 1 is the most urgent, so the smallest key sits at the root. The same shape runs schedulers, Dijkstra's algorithm, timers, and Top-K."
				>
					<div className="space-y-5">
						<PriorityQueueDemo />
						<div className="grid gap-4 md:grid-cols-2">
							{USE_CASES.map((useCase) => (
								<div
									key={useCase.title}
									className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4"
								>
									<p className="mb-2 font-medium text-violet-300">
										{useCase.title}
									</p>
									<p className="text-sm text-zinc-400">{useCase.body}</p>
								</div>
							))}
						</div>
					</div>
				</DemoSection>
			</motion.div>
		</div>
	);
}
