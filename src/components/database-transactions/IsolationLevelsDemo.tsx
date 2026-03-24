import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

type MatrixMode = "ansi" | "postgres";
type CellState = "possible" | "not_possible" | "not_in_pg";

const ANOMALIES_BASE = [
	{ id: "dirty", name: "Dirty Read" },
	{ id: "nonrepeatable", name: "Non-Repeatable Read" },
	{ id: "phantom", name: "Phantom Read" },
] as const;

const ANOMALIES_PG = [
	...ANOMALIES_BASE,
	{ id: "serialization", name: "Serialization Anomaly" },
] as const;

const LEVELS = [
	{ id: "ru", name: "Read Uncommitted" },
	{ id: "rc", name: "Read Committed" },
	{ id: "rr", name: "Repeatable Read" },
	{ id: "sz", name: "Serializable" },
] as const;

const MATRIX: Record<MatrixMode, Record<string, Record<string, CellState>>> = {
	ansi: {
		ru: {
			dirty: "possible",
			nonrepeatable: "possible",
			phantom: "possible",
		},
		rc: {
			dirty: "not_possible",
			nonrepeatable: "possible",
			phantom: "possible",
		},
		rr: {
			dirty: "not_possible",
			nonrepeatable: "not_possible",
			phantom: "possible",
		},
		sz: {
			dirty: "not_possible",
			nonrepeatable: "not_possible",
			phantom: "not_possible",
		},
	},
	postgres: {
		ru: {
			dirty: "not_in_pg",
			nonrepeatable: "possible",
			phantom: "possible",
			serialization: "possible",
		}, // PG treats RU as RC
		rc: {
			dirty: "not_possible",
			nonrepeatable: "possible",
			phantom: "possible",
			serialization: "possible",
		}, // Default
		rr: {
			dirty: "not_possible",
			nonrepeatable: "not_possible",
			phantom: "not_in_pg",
			serialization: "possible",
		}, // Snapshot Isolation
		sz: {
			dirty: "not_possible",
			nonrepeatable: "not_possible",
			phantom: "not_possible",
			serialization: "not_possible",
		}, // True SSI
	},
};

const EXPLANATIONS: Record<MatrixMode, Record<string, string>> = {
	ansi: {
		ru: "The weakest level. Transactions can read uncommitted data from other transactions.",
		rc: "A transaction only sees committed data. However, if it reads the same row twice, another transaction might have committed changes in between.",
		rr: "Ensures that if you read a row twice, it won't change. But it doesn't protect against new rows (phantoms) appearing if someone inserts data matching your query.",
		sz: "The strictest level. Transactions behave strictly as if they executed one right after another.",
	},
	postgres: {
		ru: "In PostgreSQL, Read Uncommitted behaves identically to Read Committed. Dirty reads are simply impossible due to its MVCC architecture.",
		rc: "The default level. Each query sees a snapshot of data committed before the query began. A new snapshot is taken for each SQL statement.",
		rr: "PostgreSQL uses 'Snapshot Isolation'. A transaction sees a snapshot taken at its start. This detects conflicts at commit time — if two transactions modify the same row, one gets a 'could not serialize access' error and must retry.",
		sz: "PostgreSQL adds Serializable Snapshot Isolation (SSI) to catch complex anomalies like Write Skew that Snapshot Isolation alone misses.",
	},
};

export function IsolationLevelsDemo() {
	const [mode, setMode] = useState<MatrixMode>("postgres");
	const [hoveredLevel, setHoveredLevel] = useState<string | null>("rc");

	const activeLevel = hoveredLevel || "rc";
	const anomalies = mode === "postgres" ? ANOMALIES_PG : ANOMALIES_BASE;

	return (
		<div className="flex flex-col gap-6">
			{/* Header / Toggle */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-zinc-900/40 p-3 rounded-lg border border-zinc-800">
				<div className="text-sm text-zinc-400 mb-2 sm:mb-0">
					Select the database engine specification to view:
				</div>
				<div className="bg-zinc-950 p-1 rounded-md border border-zinc-800 flex gap-1 relative">
					<button
						type="button"
						onClick={() => setMode("ansi")}
						className={clsx(
							"relative px-4 py-1.5 rounded text-xs font-semibold transition-colors",
							mode === "ansi"
								? "text-white"
								: "text-zinc-500 hover:text-zinc-300",
						)}
					>
						{mode === "ansi" && (
							<motion.div
								layoutId="active-mode-bg"
								className="absolute inset-0 bg-violet-600 rounded drop-shadow-md"
								initial={false}
								transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
							/>
						)}
						<span className="relative z-10">ANSI SQL Standard</span>
					</button>
					<button
						type="button"
						onClick={() => setMode("postgres")}
						className={clsx(
							"relative px-4 py-1.5 rounded text-xs font-semibold transition-colors",
							mode === "postgres"
								? "text-white"
								: "text-zinc-500 hover:text-zinc-300",
						)}
					>
						{mode === "postgres" && (
							<motion.div
								layoutId="active-mode-bg"
								className="absolute inset-0 bg-violet-600 rounded drop-shadow-md"
								initial={false}
								transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
							/>
						)}
						<span className="relative z-10">PostgreSQL</span>
					</button>
				</div>
			</div>

			{/* Table and Info */}
			<div className="flex flex-col lg:flex-row gap-6">
				{/* Matrix Grid */}
				<div className="w-full lg:w-2/3 bg-zinc-900 overflow-x-auto rounded-lg border border-zinc-800">
					<table className="w-full text-left text-sm whitespace-nowrap">
						<thead className="bg-zinc-950 border-b border-zinc-800 text-xs uppercase text-zinc-500">
							<tr>
								<th className="px-4 py-3 font-semibold">Isolation Level</th>
								{anomalies.map((a) => (
									<th key={a.id} className="px-4 py-3 text-center">
										{a.name}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{LEVELS.map((level) => {
								const isHovered = activeLevel === level.id;
								return (
									<tr
										key={level.id}
										onMouseEnter={() => setHoveredLevel(level.id)}
										onMouseLeave={() => setHoveredLevel(null)}
										className={clsx(
											"border-b border-zinc-800/50 last:border-0 transition-colors cursor-default",
											isHovered ? "bg-violet-500/10" : "hover:bg-zinc-800/30",
										)}
									>
										<td
											className={clsx(
												"px-4 py-4 font-medium",
												isHovered ? "text-violet-300" : "text-zinc-300",
											)}
										>
											{level.name}
											{mode === "postgres" && level.id === "rc" && (
												<span className="ml-2 text-[10px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded border border-teal-500/30">
													DEFAULT
												</span>
											)}
										</td>
										{anomalies.map((a) => {
											const state = MATRIX[mode][level.id][a.id];
											return (
												<td key={a.id} className="px-4 py-4 text-center">
													{state === "not_possible" && (
														<span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/25">
															Not Possible
														</span>
													)}
													{state === "possible" && (
														<span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded bg-green-500/15 text-green-400 border border-green-500/25">
															Possible
														</span>
													)}
													{state === "not_in_pg" && (
														<span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/25">
															Allowed, but not in PG
														</span>
													)}
												</td>
											);
										})}
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>

				{/* Explanation Card */}
				<div className="w-full lg:w-1/3 bg-zinc-800/40 rounded-lg p-5 border border-zinc-700 relative overflow-hidden">
					<AnimatePresence mode="wait">
						<motion.div
							key={activeLevel + mode}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							transition={{ duration: 0.2 }}
						>
							<h4 className="text-lg font-bold text-violet-300 mb-2">
								{LEVELS.find((l) => l.id === activeLevel)?.name}
							</h4>
							<div className="text-xs uppercase text-zinc-500 mb-4 tracking-wider font-semibold">
								{mode === "ansi" ? "ANSI Theory" : "PostgreSQL Reality"}
							</div>
							<p className="text-sm text-zinc-300 leading-relaxed">
								{EXPLANATIONS[mode][activeLevel]}
							</p>
						</motion.div>
					</AnimatePresence>
					<div className="absolute top-0 right-0 -mr-8 -mt-8 text-violet-500/10 w-32 h-32">
						<svg viewBox="0 0 24 24" fill="currentColor">
							<title>Info</title>
							<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
						</svg>
					</div>
				</div>
			</div>
		</div>
	);
}
