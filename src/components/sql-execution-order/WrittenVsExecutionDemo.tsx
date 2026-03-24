import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

type Clause = {
	id: string;
	clause: string;
	code: string;
	color: string;
	writtenOrder: number;
	executionOrder: number;
	explanation: string;
};

const CLAUSES: Clause[] = [
	{
		id: "select",
		clause: "SELECT",
		code: "SELECT department, COUNT(*) as total, AVG(salary) as avg_salary",
		color: "bg-blue-500/20 border-blue-500/30 text-blue-300",
		writtenOrder: 0,
		executionOrder: 4,
		explanation: "Step 5: Picks the final columns to return.",
	},
	{
		id: "from",
		clause: "FROM",
		code: "FROM employees",
		color: "bg-emerald-500/20 border-emerald-500/30 text-emerald-300",
		writtenOrder: 1,
		executionOrder: 0,
		explanation: "Step 1: Identifies the root dataset (table or tables).",
	},
	{
		id: "where",
		clause: "WHERE",
		code: "WHERE status = 'active'",
		color: "bg-amber-500/20 border-amber-500/30 text-amber-300",
		writtenOrder: 2,
		executionOrder: 1,
		explanation: "Step 2: Filters out individual rows before grouping.",
	},
	{
		id: "group-by",
		clause: "GROUP BY",
		code: "GROUP BY department",
		color: "bg-purple-500/20 border-purple-500/30 text-purple-300",
		writtenOrder: 3,
		executionOrder: 2,
		explanation: "Step 3: Buckets remaining rows into distinct groups.",
	},
	{
		id: "having",
		clause: "HAVING",
		code: "HAVING COUNT(*) > 4",
		color: "bg-rose-500/20 border-rose-500/30 text-rose-300",
		writtenOrder: 4,
		executionOrder: 3,
		explanation: "Step 4: Keeps only groups with more than 4 members (5+).",
	},
	{
		id: "order-by",
		clause: "ORDER BY",
		code: "ORDER BY avg_salary DESC",
		color: "bg-teal-500/20 border-teal-500/30 text-teal-300",
		writtenOrder: 5,
		executionOrder: 5,
		explanation: "Step 6: Sorts the final selected rows.",
	},
	{
		id: "limit",
		clause: "LIMIT",
		code: "LIMIT 10",
		color: "bg-zinc-500/20 border-zinc-500/30 text-zinc-300",
		writtenOrder: 6,
		executionOrder: 6,
		explanation: "Step 7: Truncates the total results returned.",
	},
];

export function WrittenVsExecutionDemo() {
	const [mode, setMode] = useState<"written" | "execution">("written");

	const displayedClauses = [...CLAUSES].sort((a, b) => {
		return mode === "written"
			? a.writtenOrder - b.writtenOrder
			: a.executionOrder - b.executionOrder;
	});

	return (
		<div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl font-mono text-sm relative">
			<div className="flex bg-zinc-950 p-2 border-b border-zinc-800 self-center">
				<div className="flex bg-zinc-900 rounded-lg p-1 relative w-full max-w-md mx-auto">
					<button
						type="button"
						className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-md transition-colors ${
							mode === "written"
								? "text-white"
								: "text-zinc-500 hover:text-zinc-300"
						}`}
						onClick={() => setMode("written")}
					>
						{mode === "written" && (
							<motion.span
								layoutId="writtenVsExecutionTab"
								className="absolute inset-0 bg-zinc-800 rounded-md border border-zinc-700/50 shadow-sm -z-10"
								transition={{ type: "spring", stiffness: 400, damping: 30 }}
							/>
						)}
						<span className="font-sans">📝</span> Written Syntax
					</button>
					<button
						type="button"
						className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-md transition-colors ${
							mode === "execution"
								? "text-white"
								: "text-zinc-500 hover:text-zinc-300"
						}`}
						onClick={() => setMode("execution")}
					>
						{mode === "execution" && (
							<motion.span
								layoutId="writtenVsExecutionTab"
								className="absolute inset-0 bg-zinc-800 rounded-md border border-zinc-700/50 shadow-sm -z-10"
								transition={{ type: "spring", stiffness: 400, damping: 30 }}
							/>
						)}
						<span className="font-sans">⚙️</span> Logical Execution
					</button>
				</div>
			</div>

			<div className="p-6">
				<div className="flex flex-col gap-3 min-h-100">
					<AnimatePresence mode="popLayout">
						{displayedClauses.map((clause) => (
							<motion.div
								key={clause.id}
								layout
								initial={{ opacity: 0, scale: 0.95 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.95 }}
								transition={{
									type: "spring",
									stiffness: 300,
									damping: 25,
									mass: 0.8,
								}}
								className={`px-4 py-3 rounded-lg border ${clause.color} relative overflow-hidden group`}
							>
								{/* Subtle animated background gradient */}
								<div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />

								<div className="flex sm:items-center sm:justify-between flex-col sm:flex-row gap-2 relative z-10">
									<div className="flex items-center gap-3">
										{mode === "execution" && (
											<span className="w-6 h-6 rounded-full bg-black/40 text-xs flex items-center justify-center font-bold">
												{clause.executionOrder + 1}
											</span>
										)}
										<span className="font-semibold tracking-wide">
											{clause.code}
										</span>
									</div>
									{mode === "execution" && (
										<span className="text-xs opacity-80 max-w-xs text-left sm:text-right italic">
											{clause.explanation}
										</span>
									)}
								</div>
							</motion.div>
						))}
					</AnimatePresence>
				</div>
			</div>
		</div>
	);
}
