import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { BTreeExplorerDemo } from "../components/database-indexing/BTreeExplorerDemo";
import { IndexTypesDemo } from "../components/database-indexing/IndexTypesDemo";
import { ScanVsIndexDemo } from "../components/database-indexing/ScanVsIndexDemo";
import { WhenNotToIndexDemo } from "../components/database-indexing/WhenNotToIndexDemo";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/database-indexing")({
	component: DatabaseIndexingPage,
});

function DatabaseIndexingPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-8">
			<PageHeader
				topic={{ label: "Database Internals", color: "violet" }}
				title="Database Indexing"
				subtitle="How B-Tree indexes make queries fast — and when they make things worse."
				gradient={{ from: "teal-400", to: "cyan-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								Without an index, every query performs a{" "}
								<span className="text-teal-300 font-medium">
									full table scan
								</span>{" "}
								— reading every row from disk. A{" "}
								<span className="text-cyan-300 font-medium">B-Tree index</span>{" "}
								organizes values in a self-balancing tree where each node maps
								to a disk page. With order 100, a B-Tree over one million rows
								needs only 3 levels — three disk reads instead of millions. The
								trade-off: indexes must be updated on every write, so adding too
								many indexes hurts INSERT/UPDATE throughput.
							</p>
							<p>
								B-Trees are the default index structure in PostgreSQL, MySQL
								(InnoDB), SQLite, and MongoDB because they support both equality
								lookups and range queries efficiently. Hash indexes are faster
								for exact matches but cannot serve range queries — choosing the
								wrong index type is a common performance mistake.
							</p>
							<p className="text-zinc-400">
								The demos below cover sequential scan vs index scan, B-Tree
								structure and traversal, index types (B-Tree, Hash, composite,
								partial), and when indexes hurt more than they help.
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
				<ScanVsIndexDemo />
				<BTreeExplorerDemo />
				<IndexTypesDemo />
				<WhenNotToIndexDemo />
			</motion.div>
		</div>
	);
}
