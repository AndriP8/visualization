import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ChainingDemo } from "../components/hash-tables/ChainingDemo";
import { HashFunctionDemo } from "../components/hash-tables/HashFunctionDemo";
import { OpenAddressingDemo } from "../components/hash-tables/OpenAddressingDemo";
import { PerformanceDemo } from "../components/hash-tables/PerformanceDemo";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/hash-tables")({
	component: HashTablesPage,
});

function HashTablesPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-8">
			<PageHeader
				topic={{ label: "Data Structures", color: "purple" }}
				title="Hash Tables"
				subtitle="Arrays require O(n) linear search, or O(log n) binary search only when sorted. Hash tables map keys directly to array positions via a hash function, achieving O(1) average-case lookup, insert, and delete — the fastest possible for key-value access."
				gradient={{ from: "purple-400", to: "pink-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								A{" "}
								<span className="text-purple-300 font-medium">
									hash function
								</span>{" "}
								converts any key into an integer index — the key is never stored
								in order, just mapped directly to a bucket. The trade-off is{" "}
								<span className="text-pink-300 font-medium">collisions</span>:
								two different keys can produce the same index, degrading O(1) to
								O(n) in the worst case. Collision resolution strategies
								(chaining vs open addressing) and the{" "}
								<span className="text-purple-300 font-medium">load factor</span>{" "}
								α = n/m determine when to resize and how much performance
								degrades.
							</p>
							<p>
								Most languages implement hash tables as their default map/dict —
								JavaScript objects, Python dicts, Java HashMaps — because the
								average-case performance is unbeatable for key-value workloads.
								Understanding the internals matters when debugging performance
								cliffs or choosing between hash indexes and B-Tree indexes in
								databases.
							</p>
							<p className="text-zinc-400">
								The demos below walk through hash function design, chaining and
								open addressing collision resolution, and how load factor
								affects performance.
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
				<HashFunctionDemo />
				<ChainingDemo />
				<OpenAddressingDemo />
				<PerformanceDemo />
			</motion.div>
		</div>
	);
}
