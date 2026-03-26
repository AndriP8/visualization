import clsx from "clsx";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

type AnomalyType =
	| "dirty_read"
	| "non_repeatable_read"
	| "phantom_read"
	| "lost_update";

type Step = {
	tx: "T1" | "T2";
	action: string;
	query: string;
	dataState: Record<string, unknown>;
	isAnomalyPoint?: boolean;
	anomalyMessage?: string;
};

const SCENARIOS: Record<
	AnomalyType,
	{ title: string; desc: string; steps: Step[] }
> = {
	dirty_read: {
		title: "Dirty Read",
		desc: "A transaction reads data written by a concurrent uncommitted transaction.",
		steps: [
			{
				tx: "T1",
				action: "Starts transaction",
				query: "BEGIN;",
				dataState: { id: 1, age: 30 },
			},
			{
				tx: "T1",
				action: "Updates age to 31",
				query: "UPDATE users SET age=31 WHERE id=1;",
				dataState: { id: 1, age: 31 },
			},
			{
				tx: "T2",
				action: "Starts transaction",
				query: "BEGIN;",
				dataState: { id: 1, age: 31 },
			},
			{
				tx: "T2",
				action: "Reads row (reads uncommitted data!)",
				query: "SELECT age FROM users WHERE id=1;",
				dataState: { id: 1, age: 31 },
				isAnomalyPoint: true,
				anomalyMessage: "🚨 T2 read '31', but T1 hasn't committed yet!",
			},
			{
				tx: "T1",
				action: "Rolls back changes",
				query: "ROLLBACK;",
				dataState: { id: 1, age: 30 },
			},
			{
				tx: "T2",
				action: "Continues with invalid data",
				query: "-- T2 thinks age is 31...",
				dataState: { id: 1, age: 30 },
				isAnomalyPoint: true,
				anomalyMessage:
					"💥 T2 is working with data that formally never existed in the database.",
			},
		],
	},
	non_repeatable_read: {
		title: "Non-Repeatable Read",
		desc: "A transaction re-reads a row and finds that another committed transaction has modified it.",
		steps: [
			{
				tx: "T1",
				action: "Starts transaction",
				query: "BEGIN;",
				dataState: { id: 1, balance: 100 },
			},
			{
				tx: "T1",
				action: "Reads balance",
				query: "SELECT balance FROM acc WHERE id=1;",
				dataState: { id: 1, balance: 100 },
			},
			{
				tx: "T2",
				action: "Starts and updates balance",
				query: "BEGIN;\nUPDATE acc SET balance=150 WHERE id=1;",
				dataState: { id: 1, balance: 150 },
			},
			{
				tx: "T2",
				action: "Commits update",
				query: "COMMIT;",
				dataState: { id: 1, balance: 150 },
			},
			{
				tx: "T1",
				action: "Re-reads same row",
				query: "SELECT balance FROM acc WHERE id=1;",
				dataState: { id: 1, balance: 150 },
				isAnomalyPoint: true,
				anomalyMessage:
					"🚨 T1 read '100' earlier, but now read '150' in the exact same transaction!",
			},
		],
	},
	phantom_read: {
		title: "Phantom Read",
		desc: "A transaction re-executes a query returning a set of rows, and finds that a different transaction has inserted/deleted rows.",
		steps: [
			{
				tx: "T1",
				action: "Starts transaction",
				query: "BEGIN;",
				dataState: { rows: [{ id: 1, role: "admin" }] },
			},
			{
				tx: "T1",
				action: "Counts admins",
				query: "SELECT COUNT(*) FROM users WHERE role='admin';",
				dataState: { rows: [{ id: 1, role: "admin" }] },
			},
			{
				tx: "T2",
				action: "Inserts new admin",
				query: "BEGIN;\nINSERT INTO users (id, role) VALUES (2, 'admin');",
				dataState: {
					rows: [
						{ id: 1, role: "admin" },
						{ id: 2, role: "admin" },
					],
				},
			},
			{
				tx: "T2",
				action: "Commits insert",
				query: "COMMIT;",
				dataState: {
					rows: [
						{ id: 1, role: "admin" },
						{ id: 2, role: "admin" },
					],
				},
			},
			{
				tx: "T1",
				action: "Counts admins again",
				query: "SELECT COUNT(*) FROM users WHERE role='admin';",
				dataState: {
					rows: [
						{ id: 1, role: "admin" },
						{ id: 2, role: "admin" },
					],
				},
				isAnomalyPoint: true,
				anomalyMessage: "🚨 T1 suddenly sees 2 admins instead of 1!",
			},
		],
	},
	lost_update: {
		title: "Lost Update",
		desc: "Two transactions read the same row, calculate a new value, and write it back. One update overwrites the other.",
		steps: [
			{
				tx: "T1",
				action: "Starts & reads counter",
				query: "BEGIN;\nSELECT hits FROM stats WHERE id=1; -- gets 10",
				dataState: { hits: 10 },
			},
			{
				tx: "T2",
				action: "Starts & reads counter",
				query: "BEGIN;\nSELECT hits FROM stats WHERE id=1; -- gets 10",
				dataState: { hits: 10 },
			},
			{
				tx: "T1",
				action: "Increments counter (10+1)",
				query: "UPDATE stats SET hits=11 WHERE id=1;",
				dataState: { hits: 11 },
			},
			{
				tx: "T1",
				action: "Commits",
				query: "COMMIT;",
				dataState: { hits: 11 },
			},
			{
				tx: "T2",
				action: "Increments counter (10+1)",
				query: "UPDATE stats SET hits=11 WHERE id=1;",
				dataState: { hits: 11 },
				isAnomalyPoint: true,
				anomalyMessage:
					"🚨 T2 overwrote T1's update! The counter should have been 12.",
			},
			{
				tx: "T2",
				action: "Commits",
				query: "COMMIT;",
				dataState: { hits: 11 },
			},
		],
	},
};

export function AnomaliesSimulatorDemo() {
	const [selected, setSelected] = useState<AnomalyType>("lost_update");
	const [stepIndex, setStepIndex] = useState(-1);
	const [isPlaying, setIsPlaying] = useState(false);

	const scenario = SCENARIOS[selected];
	const maxSteps = scenario.steps.length;

	// Auto-play logic
	useEffect(() => {
		if (!isPlaying) return;
		if (stepIndex >= maxSteps - 1) {
			setIsPlaying(false);
			return;
		}

		const timer = setTimeout(() => {
			setStepIndex((s) => s + 1);
		}, 1500);

		return () => clearTimeout(timer);
	}, [isPlaying, stepIndex, maxSteps]);

	const reset = () => {
		setStepIndex(-1);
		setIsPlaying(false);
	};

	const currentDataState =
		stepIndex >= 0
			? scenario.steps[stepIndex].dataState
			: scenario.steps[0].dataState;

	return (
		<div className="flex flex-col md:flex-row gap-6">
			{/* Sidebar Selectors */}
			<div className="md:w-64 space-y-2">
				<h4 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-3">
					Select Anomaly
				</h4>
				{(Object.keys(SCENARIOS) as AnomalyType[]).map((key) => (
					<button
						key={key}
						type="button"
						onClick={() => {
							setSelected(key);
							reset();
						}}
						className={clsx(
							"w-full text-left px-4 py-3 rounded-lg text-sm transition-all border",
							selected === key
								? "bg-violet-500/10 border-violet-500/50 text-violet-300"
								: "bg-zinc-800/30 border-zinc-800/50 text-zinc-400 hover:bg-zinc-800",
						)}
					>
						<div className="font-semibold">{SCENARIOS[key].title}</div>
					</button>
				))}

				<div className="p-4 mt-4 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
					<p className="text-sm text-zinc-400">{scenario.desc}</p>
				</div>
			</div>

			{/* Timeline Player */}
			<div className="flex-1 border border-zinc-800 rounded-lg bg-zinc-900/30 p-5 flex flex-col">
				{/* State Header */}
				<div className="flex justify-between items-center mb-6">
					<div className="flex gap-2 bg-zinc-950 p-2 rounded border border-zinc-800">
						<span className="text-xs text-zinc-500">Database State:</span>
						<code className="text-xs text-teal-400 font-mono">
							{JSON.stringify(currentDataState)}
						</code>
					</div>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={reset}
							className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-xs transition-colors"
						>
							Reset
						</button>
						<button
							type="button"
							onClick={() => {
								if (stepIndex >= maxSteps - 1) reset();
								setIsPlaying(!isPlaying);
							}}
							className="px-4 py-1.5 rounded bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-colors w-20"
						>
							{isPlaying
								? "Pause"
								: stepIndex >= maxSteps - 1
									? "Replay"
									: "Play"}
						</button>
						<button
							type="button"
							onClick={() => setStepIndex((s) => Math.min(s + 1, maxSteps - 1))}
							disabled={stepIndex >= maxSteps - 1 || isPlaying}
							className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-xs transition-colors disabled:opacity-50"
						>
							Step &gt;
						</button>
					</div>
				</div>

				{/* Timeline Columns */}
				<div className="grid grid-cols-2 gap-4 flex-1 pb-6 pr-2">
					<div className="border-t-2 border-violet-500/50 pt-2">
						<h5 className="text-violet-400 font-bold mb-4">Transaction 1</h5>
						<div className="space-y-3 relative">
							{scenario.steps.map((step, i) => {
								if (step.tx !== "T1")
									return (
										<div
											key={`${step.tx}-${i}`}
											className="h-12 border-l border-zinc-700/30 ml-3"
										/>
									);
								return (
									<motion.div
										key={`${step.tx}-motion-${i}`}
										initial={{ opacity: 0, x: -10 }}
										animate={{
											opacity: i <= stepIndex ? 1 : 0.2,
											filter: i <= stepIndex ? "blur(0px)" : "blur(2px)",
										}}
										className={clsx(
											"p-3 rounded border",
											i === stepIndex
												? "bg-violet-900/30 border-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
												: "bg-zinc-900 border-zinc-800",
											i > stepIndex && "opacity-30 grayscale",
										)}
									>
										<div className="text-xs text-zinc-300 font-mono whitespace-pre-wrap">
											{step.query}
										</div>
										{step.isAnomalyPoint && i <= stepIndex && (
											<div className="mt-2 text-xs text-red-400 bg-red-500/10 p-2 rounded font-semibold">
												{step.anomalyMessage}
											</div>
										)}
									</motion.div>
								);
							})}
						</div>
					</div>

					<div className="border-t-2 border-cyan-500/50 pt-2">
						<h5 className="text-cyan-400 font-bold mb-4">Transaction 2</h5>
						<div className="space-y-3 relative">
							{scenario.steps.map((step, i) => {
								if (step.tx !== "T2")
									return (
										<div
											key={`${step.tx}-${i}`}
											className="h-12 border-l border-zinc-700/30 ml-3"
										/>
									);
								return (
									<motion.div
										key={`${step.tx}-motion-${i}`}
										initial={{ opacity: 0, x: 10 }}
										animate={{
											opacity: i <= stepIndex ? 1 : 0.2,
											filter: i <= stepIndex ? "blur(0px)" : "blur(2px)",
										}}
										className={clsx(
											"p-3 rounded border",
											i === stepIndex
												? "bg-cyan-900/30 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
												: "bg-zinc-900 border-zinc-800",
											i > stepIndex && "opacity-30 grayscale",
										)}
									>
										<div className="text-xs text-zinc-300 font-mono whitespace-pre-wrap">
											{step.query}
										</div>
										{step.isAnomalyPoint && i <= stepIndex && (
											<motion.div
												initial={{ scale: 0.9 }}
												animate={{ scale: 1 }}
												className="mt-2 text-xs text-red-400 bg-red-500/10 p-2 rounded font-semibold"
											>
												{step.anomalyMessage}
											</motion.div>
										)}
									</motion.div>
								);
							})}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
