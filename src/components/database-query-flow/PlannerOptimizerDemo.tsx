import { motion } from "motion/react";
import { useState } from "react";

type PlanNode = {
	type: string;
	cost: number;
	children?: PlanNode[];
	relation?: string;
};

type QueryPlan = {
	id: string;
	name: string;
	description: string;
	baseCost: number;
	indexCost: number; // Cost if index is available
	tree: PlanNode;
	indexTree: PlanNode; // Tree structure if index is available
};

const QUERY_PLANS: QueryPlan[] = [
	{
		id: "hash",
		name: "Hash Join",
		baseCost: 465,
		indexCost: 465, // Hash join doesn't benefit as much from index here
		description:
			"Builds a hash table from the smaller table, then probes it with rows from the larger table. Fast for large datasets but requires memory. O(n+m) complexity.",
		tree: {
			type: "Hash Join",
			cost: 465,
			children: [
				{ type: "Seq Scan", relation: "orders", cost: 250 }, // Outer/probe side (larger)
				{
					type: "Hash",
					cost: 215, // Hash build overhead on top of child scan
					children: [{ type: "Seq Scan", relation: "users", cost: 200 }], // Inner/build side (smaller)
				},
			],
		},
		indexTree: {
			type: "Hash Join",
			cost: 465,
			children: [
				{ type: "Seq Scan", relation: "orders", cost: 250 },
				{
					type: "Hash",
					cost: 215,
					children: [{ type: "Seq Scan", relation: "users", cost: 200 }],
				},
			],
		},
	},
	{
		id: "nested",
		name: "Nested Loop",
		baseCost: 20000,
		indexCost: 150, // Massive improvement with index
		description:
			"For each row in outer table, scan inner table for matches. Terrible without indexes (O(n×m)), but optimal with index on join key (O(n×log m)).",
		tree: {
			type: "Nested Loop",
			cost: 20000,
			children: [
				{ type: "Seq Scan", relation: "users", cost: 200 },
				{ type: "Seq Scan", relation: "orders", cost: 19800 }, // Full scan for every user
			],
		},
		indexTree: {
			type: "Nested Loop",
			cost: 150,
			children: [
				{ type: "Seq Scan", relation: "users", cost: 100 },
				{ type: "Index Scan", relation: "idx_orders_user_id", cost: 50 }, // Fast O(log N) lookup
			],
		},
	},
	{
		id: "merge",
		name: "Merge Join",
		baseCost: 1200,
		indexCost: 350, // Sorts can be skipped if index is already sorted
		description:
			"Requires both inputs sorted by join key. Scans both tables in parallel like a zipper. Best when data is already sorted or indexes exist. O(n+m) + sort cost.",
		tree: {
			type: "Merge Join",
			cost: 1200,
			children: [
				{
					type: "Sort",
					cost: 600,
					children: [{ type: "Seq Scan", relation: "users", cost: 200 }],
				},
				{
					type: "Sort",
					cost: 600,
					children: [{ type: "Seq Scan", relation: "orders", cost: 250 }],
				},
			],
		},
		indexTree: {
			type: "Merge Join",
			cost: 350,
			children: [
				{
					type: "Sort",
					cost: 300,
					children: [{ type: "Seq Scan", relation: "users", cost: 200 }],
				},
				{ type: "Index Scan", relation: "idx_orders_user_id", cost: 50 }, // Already sorted!
			],
		},
	},
];

function PlanTreeVisualizer({
	node,
	isOptimal,
}: {
	node: PlanNode;
	isOptimal: boolean;
}) {
	return (
		<div className="flex flex-col items-center">
			<motion.div
				layout
				className={`
					px-3 py-2 border rounded-lg shadow-sm whitespace-nowrap mb-4 relative flex flex-col items-center
					${
						isOptimal
							? "bg-emerald-500/20 border-emerald-500 text-emerald-200"
							: "bg-surface-secondary border-border-tertiary text-text-secondary"
					}
				`}
			>
				<span className="font-bold text-xs tracking-wide">{node.type}</span>
				{node.relation && (
					<span className="text-[10px] text-accent-cyan-soft font-mono mt-0.5">
						{node.relation}
					</span>
				)}
				<div
					className={`absolute -top-3 -right-3 text-[10px] font-mono px-1.5 py-0.5 rounded-full border ${
						isOptimal
							? "bg-emerald-950 border-emerald-500 text-accent-emerald-soft"
							: "bg-surface-primary border-text-muted text-text-tertiary"
					}`}
				>
					Cost: {node.cost}
				</div>
			</motion.div>

			{node.children && node.children.length > 0 && (
				<div className="flex flex-col items-center w-full">
					{/* Vertical drop from parent to horizontal bar */}
					<div
						className={`w-px h-4 ${isOptimal ? "bg-emerald-500/50" : "bg-surface-tertiary"}`}
					/>

					<div className="flex gap-6 relative w-full justify-center">
						{/* Horizontal connector — only when more than one child */}
						{node.children.length > 1 && (
							<div
								className={`absolute top-0 border-t ${isOptimal ? "border-emerald-500/50" : "border-border-tertiary"}`}
								style={{
									left: `calc(50% / ${node.children.length})`,
									right: `calc(50% / ${node.children.length})`,
								}}
							/>
						)}

						{node.children.map((child, idx) => (
							<div
								key={`${child.type}-${idx}`}
								className="flex flex-col items-center"
							>
								{/* Vertical drop from horizontal bar to child */}
								<div
									className={`w-px h-4 ${isOptimal ? "bg-emerald-500/50" : "bg-surface-tertiary"}`}
								/>
								<PlanTreeVisualizer node={child} isOptimal={isOptimal} />
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

export function PlannerOptimizerDemo() {
	const [hasIndexes, setHasIndexes] = useState(false);
	const [isOptimizing, setIsOptimizing] = useState(false);

	// Find optimal plan based on state
	const optimalPlanId = QUERY_PLANS.reduce((prev, curr) => {
		const prevCost = hasIndexes ? prev.indexCost : prev.baseCost;
		const currCost = hasIndexes ? curr.indexCost : curr.baseCost;
		return prevCost < currCost ? prev : curr;
	}).id;

	const handleToggleIndexes = () => {
		setIsOptimizing(true);
		setHasIndexes((prev) => !prev);
		setTimeout(() => setIsOptimizing(false), 800);
	};

	return (
		<div className="space-y-6">
			<div className="bg-surface-primary border border-border-primary rounded-xl p-5 flex flex-col md:flex-row gap-6 items-center justify-between">
				<div>
					<h4 className="text-text-primary font-semibold flex items-center gap-2">
						<span>📊</span> Index on{" "}
						<code className="font-mono text-accent-cyan-soft bg-cyan-500/10 px-1 rounded">
							orders.user_id
						</code>
					</h4>
					<p className="text-sm text-text-tertiary mt-1 max-w-lg">
						The optimizer picks the cheapest plan based on available indexes.
						Toggle to see how adding one index changes everything.
					</p>
				</div>

				<div className="flex items-center gap-3 bg-surface-base p-2 rounded-lg border border-border-primary">
					<span
						className={`text-sm ${!hasIndexes ? "text-text-primary font-medium" : "text-text-muted"}`}
					>
						No Index
					</span>
					<button
						type="button"
						onClick={handleToggleIndexes}
						className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-zinc-900 ${
							hasIndexes ? "bg-violet-500" : "bg-surface-tertiary"
						}`}
					>
						<span
							className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
								hasIndexes ? "translate-x-6" : "translate-x-1"
							}`}
						/>
					</button>
					<span
						className={`text-sm ${hasIndexes ? "text-accent-violet-soft font-medium" : "text-text-muted"}`}
					>
						Index Enabled
					</span>
				</div>
			</div>

			<p className="text-xs text-text-muted italic -mt-2">
				Cost = optimizer's estimated work units (lower = better). Not
				milliseconds — relative to each other.
			</p>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{QUERY_PLANS.map((plan) => {
					const totalCost = hasIndexes ? plan.indexCost : plan.baseCost;
					const isOptimal = plan.id === optimalPlanId && !isOptimizing;
					const treeToRender = hasIndexes ? plan.indexTree : plan.tree;

					return (
						<div
							key={plan.id}
							className={`
								relative rounded-xl border p-5 transition-all duration-500 min-h-75 flex flex-col
								${isOptimizing ? "opacity-50 scale-95" : "opacity-100 scale-100"}
								${
									isOptimal
										? "bg-emerald-500/5 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
										: "bg-surface-primary border-border-primary"
								}
							`}
						>
							<div className="flex justify-between items-start mb-6">
								<div className="flex-1 mr-4">
									<h5
										className={`font-semibold ${isOptimal ? "text-accent-emerald-soft" : "text-text-primary"}`}
									>
										{plan.name}
									</h5>
									<p className="text-xs text-text-muted mt-2 leading-relaxed">
										{plan.description}
									</p>
									<div className="text-xs text-text-muted mt-3">
										Total Est. Cost
									</div>
									<div
										className={`font-mono text-lg font-bold ${isOptimal ? "text-accent-emerald" : "text-text-secondary"}`}
									>
										{totalCost.toLocaleString()}
									</div>
								</div>

								{isOptimal && (
									<motion.div
										initial={{ scale: 0, rotate: -180 }}
										animate={{ scale: 1, rotate: 0 }}
										className="bg-emerald-500 text-text-primary text-[10px] uppercase font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg"
									>
										<span>Winner</span>
										<span>🏆</span>
									</motion.div>
								)}
							</div>

							<div className="flex-1 flex flex-col justify-end pb-8">
								<PlanTreeVisualizer node={treeToRender} isOptimal={isOptimal} />
								{plan.id === "nested" && hasIndexes && (
									<motion.div
										initial={{ opacity: 0, y: 6 }}
										animate={{ opacity: 1, y: 0 }}
										className="bg-emerald-950 border border-emerald-700 rounded-lg p-3 text-xs text-accent-emerald mt-3 space-y-1"
									>
										<div className="font-semibold">
											Index eliminates full table scan
										</div>
										<div className="font-mono">O(n × m) → O(n × log m)</div>
										<div className="text-accent-emerald-soft/70">
											Each user lookup = 1 B-Tree traversal instead of scanning
											all orders
										</div>
									</motion.div>
								)}
							</div>

							{isOptimal && (
								<motion.div
									layoutId="optimizer-highlight"
									className="absolute inset-0 border-2 border-emerald-500 rounded-xl pointer-events-none"
									initial={false}
									transition={{ type: "spring", stiffness: 300, damping: 30 }}
								/>
							)}
						</div>
					);
				})}
			</div>

			<div className="text-center text-sm text-text-muted">
				Query:{" "}
				<code className="text-accent-violet font-mono bg-violet-500/10 px-1 py-0.5 rounded">
					SELECT * FROM users u JOIN orders o ON u.id = o.user_id
				</code>
			</div>
		</div>
	);
}
