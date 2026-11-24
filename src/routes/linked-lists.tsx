import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ComparisonDemo } from "../components/linked-lists/ComparisonDemo";
import { DoublyLinkedDemo } from "../components/linked-lists/DoublyLinkedDemo";
import { LinkedListUseCasesDemo } from "../components/linked-lists/LinkedListUseCasesDemo";
import { SinglyLinkedDemo } from "../components/linked-lists/SinglyLinkedDemo";
import { TraversalDemo } from "../components/linked-lists/TraversalDemo";
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
				subtitle="A linked list keeps its values in separate boxes. Each box also holds the address of the next box, so the boxes can sit anywhere in memory."
				gradient={{ from: "purple-400", to: "fuchsia-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								The structure is a chain of boxes called{" "}
								<span className="text-purple-300 font-medium">nodes</span>. Each
								node holds one value and one address. That address, often called
								a <span className="text-indigo-300 font-medium">pointer</span>,
								tells you where the next node is. A singly linked list keeps one
								address per node. A{" "}
								<span className="text-indigo-300 font-medium">
									doubly linked list
								</span>{" "}
								adds a second address that points back to the previous node.
							</p>
							<p>
								The rule that always holds is simple. You enter the chain at the
								front, called the head, and follow the addresses from there.
								Adding or removing a node is cheap when you already hold that
								node, because only the nearby addresses change. Finding a node
								means walking from the head one step at a time. That walk is
								called a traversal. An array keeps its items side by side, so
								jumping to item i is instant, but inserting an item slides
								everything after it. A linked list gives up that instant jump in
								exchange for cheap edits.
							</p>
							<p className="text-zinc-400">
								The demos cover the array and list trade-off, singly and doubly
								linked operations, the problems a list solves, and real-world
								use cases.
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
				<TraversalDemo />
				<LinkedListUseCasesDemo />
			</motion.div>
		</div>
	);
}
