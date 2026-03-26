import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ACIDPropertiesDemo } from "../components/database-transactions/ACIDPropertiesDemo";
import { AnomaliesSimulatorDemo } from "../components/database-transactions/AnomaliesSimulatorDemo";
import { IsolationLevelsDemo } from "../components/database-transactions/IsolationLevelsDemo";
import { MVCCAndLockingVisualizerDemo } from "../components/database-transactions/MVCCAndLockingVisualizerDemo";
import { DemoSection } from "../components/shared/DemoSection";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/database-transactions")({
	component: DatabaseTransactionsPage,
});

function DatabaseTransactionsPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-8">
			<PageHeader
				topic={{ label: "Database Internals", color: "violet" }}
				title="Database Transactions & Isolation"
				subtitle="Understand ACID, Concurrency Anomalies, and how MVCC prevents data corruption."
				gradient={{ from: "violet-400", to: "indigo-400" }}
				explanation={{
					content: (
						<div className="text-sm text-zinc-500 space-y-2">
							<p>
								<strong className="text-zinc-300">The problem:</strong> When
								multiple users read and write to a database at the same time,
								their queries can interleave and step on each other's toes,
								leading to things like{" "}
								<strong className="text-red-400">Lost Updates</strong> or{" "}
								<strong className="text-red-400">Phantom Reads</strong>.
							</p>
							<p>
								<strong className="text-zinc-300">The solution:</strong>{" "}
								Databases use{" "}
								<strong className="text-violet-400">Transactions</strong> (ACID)
								and{" "}
								<strong className="text-violet-400">Isolation Levels</strong> to
								provide concurrency control. Modern databases like PostgreSQL
								use{" "}
								<strong className="text-violet-400">
									MVCC (Multi-Version Concurrency Control)
								</strong>{" "}
								to give each transaction a consistent snapshot of the data
								without blocking readers when someone is writing.
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
				className="space-y-8 pb-12"
			>
				<DemoSection
					title="The ACID Properties"
					description="The four theoretical pillars that guarantee database transactions are processed reliably."
				>
					<ACIDPropertiesDemo />
				</DemoSection>
				<DemoSection
					title="Transaction Anomalies Simulator"
					description="Interactive timeline showing exactly how concurrent transactions step on each other's toes when isolation is too weak."
				>
					<AnomaliesSimulatorDemo />
				</DemoSection>
				<DemoSection
					title="Isolation Levels Comparison"
					description="How different levels protect against concurrency anomalies. Notice how the ANSI SQL Standard compares to real-world PostgreSQL."
				>
					<IsolationLevelsDemo />
				</DemoSection>
				<DemoSection
					title="MVCC & Under-The-Hood Locking"
					description="How databases physically prevent transactions from corrupting data. Choose a concurrency control method to see how it handles contention."
				>
					<MVCCAndLockingVisualizerDemo />
				</DemoSection>
			</motion.div>
		</div>
	);
}
