import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ComparisonDemo } from "../components/linked-lists/ComparisonDemo";
import { DoublyLinkedDemo } from "../components/linked-lists/DoublyLinkedDemo";
import { SinglyLinkedDemo } from "../components/linked-lists/SinglyLinkedDemo";
import { UseCasesDemo } from "../components/linked-lists/UseCasesDemo";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/linked-lists")({
	component: LinkedListsPage,
});

function LinkedListsPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-8">
			<PageHeader
				topic={{ label: "Data Structures", color: "purple" }}
				title="Linked Lists"
				subtitle="Arrays store elements in contiguous memory — O(1) index access, but O(n) insertions and deletions because elements must shift. Linked lists flip this: O(1) insert/delete at a known position, at the cost of O(n) traversal for random access."
				gradient={{ from: "purple-400", to: "indigo-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								Each <span className="text-purple-300 font-medium">node</span>{" "}
								stores a value and a pointer to the next node — no contiguous
								memory required. A{" "}
								<span className="text-indigo-300 font-medium">
									doubly linked list
								</span>{" "}
								adds a prev pointer, enabling O(1) deletion when you already
								hold a reference to the node. The real trade-off is cache
								locality: array elements sit next to each other in memory,
								making sequential reads fast; linked list nodes can be scattered
								across the heap, causing cache misses on every traversal.
							</p>
							<p>
								Linked lists underpin many higher-level structures — LRU caches
								(hash map + doubly linked list), browser history stacks, OS
								process queues, and the bucket chains inside hash tables
								themselves. Knowing when pointer-based structure beats
								contiguous memory is a recurring systems design question.
							</p>
							<p className="text-zinc-400">
								The demos below cover singly linked lists, doubly linked lists,
								array vs linked list performance comparison, and real-world use
								cases.
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
				<ComparisonDemo />
				<SinglyLinkedDemo />
				<DoublyLinkedDemo />
				<UseCasesDemo />
			</motion.div>
		</div>
	);
}
