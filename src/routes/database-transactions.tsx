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
				topic={{ label: "Database Internals", color: "emerald" }}
				title="Database Transactions & Isolation"
				subtitle="When concurrent transactions interleave without coordination, reads and writes can corrupt each other — producing lost updates, dirty reads, and phantom rows. Databases solve this with ACID guarantees and configurable isolation levels."
				gradient={{ from: "emerald-400", to: "teal-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								A{" "}
								<span className="text-emerald-300 font-medium">
									transaction
								</span>{" "}
								wraps multiple operations into an atomic unit — either all
								succeed or all roll back. ACID properties (Atomicity,
								Consistency, Isolation, Durability) define the guarantees
								databases provide, but full isolation is expensive. Most
								databases default to a weaker level that permits some anomalies
								in exchange for higher throughput.
							</p>
							<p>
								<span className="text-violet-300 font-medium">
									Isolation levels
								</span>{" "}
								(Read Uncommitted → Read Committed → Repeatable Read →
								Serializable) trade consistency for concurrency. Modern
								databases like PostgreSQL implement this with{" "}
								<span className="text-violet-300 font-medium">MVCC</span> —
								Multi-Version Concurrency Control — giving each transaction a
								consistent snapshot without blocking concurrent readers,
								avoiding the lock contention that plagued older implementations.
							</p>
							<p className="text-zinc-400">
								The demos below cover ACID properties, transaction anomaly
								simulation, isolation level comparison, and MVCC vs locking
								mechanisms.
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
					title="Demo 1: The ACID Properties"
					description="The four theoretical pillars that guarantee database transactions are processed reliably."
				>
					<ACIDPropertiesDemo />
				</DemoSection>
				<DemoSection
					title="Demo 2: Transaction Anomalies Simulator"
					description="Interactive timeline showing exactly how concurrent transactions step on each other's toes when isolation is too weak."
				>
					<AnomaliesSimulatorDemo />
				</DemoSection>
				<DemoSection
					title="Demo 3: Isolation Levels Comparison"
					description="How different levels protect against concurrency anomalies. Notice how the ANSI SQL Standard compares to real-world PostgreSQL."
				>
					<IsolationLevelsDemo />
				</DemoSection>
				<DemoSection
					title="Demo 4: MVCC & Under-The-Hood Locking"
					description="How databases physically prevent transactions from corrupting data. Choose a concurrency control method to see how it handles contention."
				>
					<MVCCAndLockingVisualizerDemo />
				</DemoSection>
			</motion.div>
		</div>
	);
}
