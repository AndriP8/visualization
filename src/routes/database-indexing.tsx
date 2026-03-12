import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { BTreeExplorerDemo } from "../components/database-indexing/BTreeExplorerDemo";
import { IndexTypesDemo } from "../components/database-indexing/IndexTypesDemo";
import { ScanVsIndexDemo } from "../components/database-indexing/ScanVsIndexDemo";
import { WhenNotToIndexDemo } from "../components/database-indexing/WhenNotToIndexDemo";

export const Route = createFileRoute("/database-indexing")({
	component: DatabaseIndexingPage,
});

function DatabaseIndexingPage() {
	return (
		<div className="max-w-5xl mx-auto space-y-8">
			{/* Header */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
			>
				<h2 className="text-3xl font-bold mb-2">
					🗄️{" "}
					<span className="bg-linear-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
						Database Indexing
					</span>
				</h2>
				<p className="text-zinc-400 text-lg mb-2">
					How B-Tree indexes make queries fast — and when they make things
					worse.
				</p>
				<div className="text-sm text-zinc-500 p-4 rounded-lg bg-zinc-800/30 border border-zinc-800 space-y-2">
					<p>
						<strong className="text-zinc-300">The problem:</strong> A database
						table with millions of rows is just a file on disk. Without an
						index, every query must scan every row —{" "}
						<strong className="text-red-400">O(n)</strong>. With a{" "}
						<strong className="text-teal-400">B-Tree index</strong>, the
						database can navigate a balanced tree to find any value in{" "}
						<strong className="text-teal-400">O(log n)</strong> comparisons.
					</p>
					<p>
						<strong className="text-zinc-300">Why B-Trees?</strong> They're
						optimized for disk I/O — each node maps to a disk page, keeping the
						number of reads minimal. A B-Tree of order 100 on 1 million rows
						needs only 3 levels: log₁₀₀(1,000,000) ≈ 3.
					</p>
					<p className="text-zinc-500">
						Used by PostgreSQL, MySQL (InnoDB), SQLite, MongoDB, and most
						production databases as the default index structure.
					</p>
				</div>
			</motion.div>

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
