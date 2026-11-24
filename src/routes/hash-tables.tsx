import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ChainingDemo } from "../components/hash-tables/ChainingDemo";
import { HashLayoutDemo } from "../components/hash-tables/HashLayoutDemo";
import { HashUseCasesDemo } from "../components/hash-tables/HashUseCasesDemo";
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
				subtitle="A hash table stores entries in an array. It computes a slot number from each key, so a lookup jumps straight to the right slot instead of searching through everything."
				gradient={{ from: "purple-400", to: "fuchsia-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								The storage is an array of slots. A rule called a{" "}
								<span className="text-purple-300 font-medium">
									hash function
								</span>{" "}
								turns any key into one slot number. The table never sorts its
								keys or compares all of them. Each slot holds one entry, or
								points to a short list of entries that all landed in the same
								place.
							</p>
							<p>
								Two different keys can produce the same slot number. That clash
								is called a{" "}
								<span className="text-rose-300 font-medium">collision</span>,
								and it is the only problem the table has to solve. One fix keeps
								a list of clashing entries attached to the slot, which is called
								chaining. The other moves the new entry to a later free slot and
								keeps everything inside the array, which is called open
								addressing. The load factor is the number of entries divided by
								the number of slots. It measures how full the table is. When it
								gets too high, the table is rebuilt larger so lookups stay
								cheap.
							</p>
							<p className="text-zinc-400">
								The demos start with the two memory layouts and the key-to-slot
								mapping. Then they show insert, search, and delete under both
								collision fixes, chart what a full table does to lookup cost,
								and finish with cache, DNS, duplicate filtering, and
								rate-limiting examples.
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
				<HashLayoutDemo />
				<ChainingDemo />
				<OpenAddressingDemo />
				<PerformanceDemo />
				<HashUseCasesDemo />
			</motion.div>
		</div>
	);
}
