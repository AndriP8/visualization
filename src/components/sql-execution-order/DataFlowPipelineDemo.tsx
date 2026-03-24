import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useState } from "react";

type Employee = {
	id: number;
	name: string;
	dept: string;
	salary: number;
	status: "active" | "inactive";
};

const RAW_DATA: Employee[] = [
	{
		id: 1,
		name: "Alice",
		dept: "Engineering",
		salary: 110000,
		status: "active",
	},
	{ id: 2, name: "Bob", dept: "Engineering", salary: 105000, status: "active" },
	{ id: 3, name: "Charlie", dept: "Sales", salary: 135000, status: "active" }, // High salary
	{
		id: 4,
		name: "Diana",
		dept: "Engineering",
		salary: 120000,
		status: "inactive",
	},
	{ id: 5, name: "Evan", dept: "Marketing", salary: 70000, status: "active" },
	{
		id: 6,
		name: "Fiona",
		dept: "Engineering",
		salary: 95000,
		status: "active",
	},
	{ id: 7, name: "George", dept: "Sales", salary: 140000, status: "active" }, // High salary
	{
		id: 8,
		name: "Hannah",
		dept: "Engineering",
		salary: 115000,
		status: "active",
	},
	{ id: 9, name: "Ian", dept: "Sales", salary: 82000, status: "inactive" },
	{ id: 10, name: "Jane", dept: "Marketing", salary: 72000, status: "active" },
	{
		id: 11,
		name: "Kevin",
		dept: "Engineering",
		salary: 108000,
		status: "active",
	},
	{ id: 12, name: "Liam", dept: "Sales", salary: 128000, status: "active" }, // High salary
	{ id: 13, name: "Mia", dept: "Sales", salary: 132000, status: "active" }, // High salary
	{
		id: 14,
		name: "Noah",
		dept: "Marketing",
		salary: 68000,
		status: "inactive",
	},
	{ id: 15, name: "Olivia", dept: "Sales", salary: 125000, status: "active" }, // High salary
	{
		id: 16,
		name: "Paul",
		dept: "Engineering",
		salary: 112000,
		status: "active",
	},
	{ id: 17, name: "Quinn", dept: "Marketing", salary: 75000, status: "active" },
	{
		id: 18,
		name: "Rachel",
		dept: "Marketing",
		salary: 71000,
		status: "active",
	},
];

const STEPS = [
	{
		id: 0,
		title: "FROM",
		desc: "Load raw 'employees' table",
		sqlClause: "FROM employees",
	},
	{
		id: 1,
		title: "WHERE",
		desc: "Filter: status = 'active'",
		sqlClause: "WHERE status = 'active'",
	},
	{
		id: 2,
		title: "GROUP BY",
		desc: "Group rows by department",
		sqlClause: "GROUP BY department",
	},
	{
		id: 3,
		title: "HAVING",
		desc: "Filter groups: COUNT(*) > 4 (i.e., 5+)",
		sqlClause: "HAVING COUNT(*) > 4",
	},
	{
		id: 4,
		title: "SELECT",
		desc: "Pick columns & compute aggregates",
		sqlClause:
			"SELECT department, COUNT(*) as total, AVG(salary) as avg_salary",
	},
	{
		id: 5,
		title: "ORDER BY",
		desc: "Sort by avg_salary DESC",
		sqlClause: "ORDER BY avg_salary DESC",
	},
	{
		id: 6,
		title: "LIMIT",
		desc: "Keep top 10",
		sqlClause: "LIMIT 10",
	},
];

export function DataFlowPipelineDemo() {
	const [step, setStep] = useState(0);

	// Derived Data Pipeline
	// Show all rows at step 0-1 (flat view), dim inactive at step 1, remove at step 2+
	const activeRows = RAW_DATA.filter((r) => r.status === "active");

	const departments = ["Engineering", "Sales", "Marketing"];
	const groups = departments.map((dept) => {
		const matchedRows =
			step >= 2 ? activeRows.filter((r) => r.dept === dept) : [];
		const count = matchedRows.length;
		const avg =
			count > 0 ? matchedRows.reduce((acc, r) => acc + r.salary, 0) / count : 0;
		return { dept, rows: matchedRows, count, avg };
	});

	// For step < 2, we just render rows flatly. For step >= 2, we render them in groups.
	const displayGroups = step >= 3 ? groups.filter((g) => g.count > 4) : groups;
	const orderedGroups =
		step >= 5
			? [...displayGroups].sort((a, b) => b.avg - a.avg)
			: displayGroups;
	const limitedGroups = step >= 6 ? orderedGroups.slice(0, 10) : orderedGroups;

	const isAggregated = step >= 4;

	return (
		<div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-xl font-mono text-sm flex flex-col min-h-150">
			{/* SQL Query Display with Highlighting */}
			<div className="bg-zinc-900 border-b border-zinc-800 p-4">
				<div className="max-w-3xl mx-auto">
					<div className="text-zinc-500 text-xs uppercase tracking-wider mb-3 font-semibold">
						SQL Query
					</div>
					<div className="bg-black/40 border border-zinc-800 rounded-lg p-4 space-y-1.5">
						{[
							{ id: "select", clause: STEPS[4].sqlClause, active: step === 4 },
							{ id: "from", clause: STEPS[0].sqlClause, active: step === 0 },
							{ id: "where", clause: STEPS[1].sqlClause, active: step === 1 },
							{ id: "groupby", clause: STEPS[2].sqlClause, active: step === 2 },
							{ id: "having", clause: STEPS[3].sqlClause, active: step === 3 },
							{ id: "orderby", clause: STEPS[5].sqlClause, active: step === 5 },
							{ id: "limit", clause: STEPS[6].sqlClause, active: step === 6 },
						].map((item) => (
							<motion.div
								key={item.id}
								initial={false}
								animate={{
									backgroundColor: item.active
										? "rgba(59, 130, 246, 0.15)"
										: "transparent",
									borderColor: item.active
										? "rgba(59, 130, 246, 0.4)"
										: "transparent",
								}}
								transition={{ duration: 0.3 }}
								className="px-3 py-1.5 rounded border"
							>
								<code
									className={`transition-colors ${
										item.active ? "text-blue-300" : "text-zinc-400"
									}`}
								>
									{item.clause}
								</code>
							</motion.div>
						))}
					</div>
				</div>
			</div>

			<div className="flex flex-col lg:flex-row flex-1">
				{/* Left side: Controls */}
				<div className="w-full lg:w-64 bg-zinc-900 border-b lg:border-b-0 lg:border-r border-zinc-800 p-4 flex flex-col gap-4 sticky top-0 z-20">
					<h3 className="text-zinc-400 font-semibold mb-2 uppercase text-xs tracking-wider">
						Execution Pipeline
					</h3>
					<div className="flex flex-col gap-2 relative">
						{/* Connecting line */}
						<div className="absolute left-2.75 top-6 bottom-4 w-px bg-zinc-800" />

						{STEPS.map((s, idx) => (
							<button
								key={s.id}
								type="button"
								onClick={() => setStep(idx)}
								className={`relative z-10 flex gap-3 text-left p-2 rounded-lg transition-colors group ${
									step === idx ? "bg-blue-500/10" : "hover:bg-zinc-800/50"
								}`}
							>
								<div
									className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${
										step >= idx
											? "bg-blue-500 text-white border-blue-500"
											: "bg-zinc-900 border-zinc-700 text-zinc-500 group-hover:border-zinc-500"
									}`}
								>
									{step > idx ? "✓" : idx + 1}
								</div>
								<div>
									<div
										className={`font-bold transition-colors ${step >= idx ? "text-blue-300" : "text-zinc-400"}`}
									>
										{s.title}
									</div>
									<div
										className={`text-xs transition-colors ${step === idx ? "text-zinc-300" : "text-zinc-500"}`}
									>
										{s.desc}
									</div>
								</div>
							</button>
						))}
					</div>
				</div>

				{/* Right side: Visualization */}
				<div className="flex-1 p-6 relative bg-zinc-950 overflow-y-auto overflow-x-hidden">
					<LayoutGroup>
						<div className="w-full max-w-2xl mx-auto flex flex-col gap-4">
							{/* Table Header conditionally showing columns */}
							<div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-zinc-800 text-xs font-semibold text-zinc-500">
								{isAggregated ? (
									<>
										<div className="col-span-4">department</div>
										<div className="col-span-4 text-center">COUNT(*)</div>
										<div className="col-span-4 text-right">AVG(salary)</div>
									</>
								) : (
									<>
										<div className="col-span-2">id</div>
										<div className="col-span-3">name</div>
										<div className="col-span-4">department</div>
										<div className="col-span-2 text-right">salary</div>
										<div className="col-span-1 text-right">status</div>
									</>
								)}
							</div>

							{/* Rendering logic based on step */}
							{step < 2 ? (
								<AnimatePresence>
									{RAW_DATA.map((row) => (
										<RawRow
											key={row.id}
											row={row}
											dim={step === 1 && row.status === "inactive"}
										/>
									))}
								</AnimatePresence>
							) : (
								<AnimatePresence mode="popLayout">
									{limitedGroups.map((group) => (
										<GroupedRow
											key={group.dept}
											group={group}
											isAggregated={isAggregated}
										/>
									))}
								</AnimatePresence>
							)}
						</div>
					</LayoutGroup>
				</div>
			</div>
		</div>
	);
}

function RawRow({ row, dim }: { row: Employee; dim: boolean }) {
	return (
		<motion.div
			layoutId={`row-${row.id}`}
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: dim ? 0.3 : 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.9 }}
			transition={{ duration: 0.4, type: "spring", bounce: 0.2 }}
			className={`grid grid-cols-12 gap-2 px-4 py-3 rounded-lg border bg-zinc-900 overflow-hidden ${
				row.status === "active" ? "border-emerald-500/20" : "border-rose-500/20"
			}`}
		>
			<div className="col-span-2 text-zinc-500">#{row.id}</div>
			<div className="col-span-3 font-semibold text-zinc-200">{row.name}</div>
			<div className="col-span-4 text-blue-300">{row.dept}</div>
			<div className="col-span-2 text-right text-emerald-300">
				${(row.salary / 1000).toFixed(0)}k
			</div>
			<div className="col-span-1 text-right">
				<span
					className={`w-2 h-2 rounded-full inline-block ${
						row.status === "active" ? "bg-emerald-500" : "bg-rose-500"
					}`}
					title={row.status}
				/>
			</div>
		</motion.div>
	);
}

function GroupedRow({
	group,
	isAggregated,
}: {
	group: { dept: string; rows: Employee[]; count: number; avg: number };
	isAggregated: boolean;
}) {
	return (
		<motion.div
			layout
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.9, height: 0 }}
			transition={{ duration: 0.5, type: "spring", bounce: 0.2 }}
			className="border border-purple-500/30 bg-purple-500/5 rounded-xl overflow-hidden flex flex-col"
		>
			{isAggregated ? (
				<motion.div
					layout
					className="grid grid-cols-12 gap-2 px-4 py-4 items-center"
				>
					<div className="col-span-4 font-bold text-blue-300 text-lg">
						{group.dept}
					</div>
					<div className="col-span-4 text-center text-purple-300 text-lg font-bold">
						{group.count}
					</div>
					<div className="col-span-4 text-right text-emerald-300 text-lg font-bold">
						${(group.avg / 1000).toFixed(1)}k
					</div>
				</motion.div>
			) : (
				<motion.div layout className="p-3">
					<div className="text-purple-300 font-bold mb-3 px-2 flex justify-between">
						<span>{group.dept} Group</span>
						<span className="text-xs font-normal opacity-70 border border-purple-500/30 px-2 py-0.5 rounded-full">
							COUNT: {group.count}
						</span>
					</div>
					<div className="flex flex-col gap-1.5">
						<AnimatePresence>
							{group.rows.map((row) => (
								<motion.div
									key={row.id}
									layoutId={`row-${row.id}`}
									className="grid grid-cols-12 gap-2 px-3 py-2 rounded-md bg-zinc-900 border border-zinc-800 text-xs"
								>
									<div className="col-span-2 text-zinc-500">#{row.id}</div>
									<div className="col-span-3 text-zinc-300">{row.name}</div>
									<div className="col-span-4 text-zinc-500 blur-[1px] opacity-30 select-none">
										{row.dept}
									</div>
									<div className="col-span-2 text-right text-emerald-300">
										${(row.salary / 1000).toFixed(0)}k
									</div>
									<div className="col-span-1 text-right text-emerald-500">
										✓
									</div>
								</motion.div>
							))}
						</AnimatePresence>
					</div>
				</motion.div>
			)}
		</motion.div>
	);
}
