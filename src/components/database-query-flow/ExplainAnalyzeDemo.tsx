import { motion } from "motion/react";
import { useState } from "react";

// Mock EXPLAIN ANALYZE data
const EXPLAIN_NODES = [
	{
		id: "n1",
		type: "Hash Join",
		depth: 0,
		cost: "251.50..524.25",
		estRows: 200,
		actRows: 20000, // Massive discrepancy!
		time: "0.556..1.234",
		details: "Hash Cond: (orders.user_id = users.id)",
	},
	{
		id: "n2",
		type: "Seq Scan",
		relation: "orders",
		depth: 1,
		cost: "0.00..250.00",
		estRows: 20000,
		actRows: 20000,
		time: "0.012..0.854",
		details: "Filter: (status = 'completed')",
	},
	{
		id: "n3",
		type: "Hash",
		depth: 1,
		cost: "249.00..249.00",
		estRows: 200,
		actRows: 200,
		time: "0.450..0.450",
		details: "Buckets: 1024  Batches: 1  Memory Usage: 16kB",
	},
	{
		id: "n4",
		type: "Seq Scan",
		relation: "users",
		depth: 2,
		cost: "0.00..249.00",
		estRows: 200,
		actRows: 200,
		time: "0.008..0.334",
		details: "Filter: (age > 18)",
	},
];

export function ExplainAnalyzeDemo() {
	const [selectedNode, setSelectedNode] = useState<string>("n1");

	const node =
		EXPLAIN_NODES.find((n) => n.id === selectedNode) ?? EXPLAIN_NODES[0];
	const isBadEstimate = node.actRows > node.estRows * 10;

	return (
		<div className="space-y-6">
			<div className="bg-surface-primary border border-border-primary rounded-xl p-5 flex flex-col md:flex-row gap-6 items-center justify-between">
				<div>
					<h4 className="text-text-primary font-semibold flex items-center gap-2">
						<span>🕵️‍♂️</span> EXPLAIN ANALYZE Output
					</h4>
					<p className="text-sm text-text-tertiary mt-1 max-w-xl">
						The ultimate debugging tool. <code>EXPLAIN</code> shows the
						Planner's <em>Estimates</em>, while <code>EXPLAIN ANALYZE</code>{" "}
						runs the query and shows <em>Actual</em> execution times and row
						counts.
						<br />
						<span className="text-accent-orange-soft mt-2 inline-block">
							Notice the top node: The planner estimated 200 rows, but got
							20,000! Per-table stats are accurate — this is a join selectivity
							misestimate (e.g. correlated columns).
						</span>
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-100">
				{/* Text Viewer */}
				<div className="bg-surface-base border border-border-primary p-6 rounded-xl overflow-x-auto relative">
					<div className="absolute top-0 right-0 p-3 flex gap-2">
						<div className="w-3 h-3 rounded-full bg-red-500/50" />
						<div className="w-3 h-3 rounded-full bg-yellow-500/50" />
						<div className="w-3 h-3 rounded-full bg-green-500/50" />
					</div>

					<div className="font-mono text-sm leading-relaxed mt-4 whitespace-pre">
						{EXPLAIN_NODES.map((n) => {
							const isSelected = selectedNode === n.id;
							const indent = "\u00A0".repeat(n.depth * 2);
							const arrow = n.depth > 0 ? "->  " : "";
							const isBad = n.actRows > n.estRows * 10;

							return (
								<button
									type="button"
									key={n.id}
									onMouseEnter={() => setSelectedNode(n.id)}
									onClick={() => setSelectedNode(n.id)}
									className={`
										w-full text-left cursor-pointer rounded -mx-2 px-2 py-1 transition-colors
										${isSelected ? "bg-surface-secondary" : "hover:bg-surface-secondary/50"}
									`}
								>
									<div>
										<span>
											{indent}
											{arrow}
										</span>
										<span className="font-bold text-accent-violet">
											{n.type}
										</span>
										{n.relation && (
											<>
												<span className="text-text-tertiary"> on </span>
												<span className="text-accent-cyan">{n.relation}</span>
											</>
										)}
										<span className="text-text-muted">{"  (cost="}</span>
										<span className="text-accent-emerald-soft/70">
											{n.cost}
										</span>
										<span className="text-text-muted">{" rows="}</span>
										<span className="text-accent-emerald-soft">
											{n.estRows}
										</span>
										<span className="text-text-muted">{") (actual time="}</span>
										<span className="text-accent-emerald-soft/70">
											{n.time}
										</span>
										<span className="text-text-muted">{" rows="}</span>
										<span
											className={
												isBad
													? "text-accent-orange-soft font-bold underline decoration-orange-500/50 underline-offset-2"
													: "text-accent-emerald-soft"
											}
										>
											{n.actRows}
										</span>
										<span className="text-text-muted">{" loops=1)"}</span>
									</div>
									{n.details && (
										<div className="text-text-muted text-xs mt-0.5">
											{indent}
											{"    "}
											{n.details}
										</div>
									)}
								</button>
							);
						})}
					</div>
				</div>

				{/* Node Inspector */}
				<div className="bg-surface-primary border border-border-primary p-6 rounded-xl flex flex-col gap-4">
					<div>
						<h4 className="text-text-primary font-semibold">Node Inspector</h4>
						<p className="text-xs text-text-tertiary mt-0.5">
							Hover a node to inspect its planner estimates vs. actual
							execution.
						</p>
					</div>

					<div className="bg-surface-base border border-border-secondary rounded-xl p-5 shadow-2xl relative overflow-hidden">
						<div
							className={`absolute top-0 left-0 w-full h-1 ${isBadEstimate ? "bg-orange-500" : "bg-emerald-500"}`}
						/>

						<div className="flex justify-between items-start mb-4 border-b border-border-primary pb-4">
							<div>
								<h5 className="font-bold text-lg text-text-primary">
									{node.type}
								</h5>
								{node.relation && (
									<div className="text-sm font-mono text-accent-cyan-soft">
										{node.relation}
									</div>
								)}
							</div>
							<div className="text-right">
								<div className="text-[10px] text-text-muted uppercase tracking-wider">
									Node Cost
								</div>
								<div className="text-sm font-mono text-accent-emerald-soft/80">
									{node.cost.split("..")[1]}
								</div>
							</div>
						</div>

						<div className="space-y-5">
							<div>
								<div className="flex justify-between text-xs mb-1">
									<span className="text-text-tertiary">
										Estimated Rows (Planner)
									</span>
									<span className="font-mono text-text-secondary">
										{node.estRows.toLocaleString()}
									</span>
								</div>
								<div className="w-full h-2 bg-surface-secondary rounded-full overflow-hidden">
									<div
										className="h-full bg-emerald-500 transition-all duration-200"
										style={{
											width: `${Math.min(100, (node.estRows / Math.max(node.estRows, node.actRows)) * 100)}%`,
										}}
									/>
								</div>
							</div>

							<div>
								<div className="flex justify-between text-xs mb-1">
									<span
										className={
											isBadEstimate
												? "text-accent-orange-soft font-medium flex items-center gap-1"
												: "text-text-tertiary"
										}
									>
										{isBadEstimate && "⚠️"} Actual Rows (Executor)
									</span>
									<span
										className={`font-mono ${isBadEstimate ? "text-accent-orange-soft font-bold" : "text-text-secondary"}`}
									>
										{node.actRows.toLocaleString()}
									</span>
								</div>
								<div className="w-full h-2 bg-surface-secondary rounded-full overflow-hidden">
									<div
										className={`h-full transition-all duration-200 ${isBadEstimate ? "bg-orange-500" : "bg-emerald-500"}`}
										style={{
											width: `${Math.min(100, (node.actRows / Math.max(node.estRows, node.actRows)) * 100)}%`,
										}}
									/>
								</div>
							</div>

							{isBadEstimate && (
								<motion.div
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									className="bg-orange-500/10 border border-orange-500/20 rounded p-3 text-xs text-accent-orange-soft/90 leading-relaxed"
								>
									<strong>Bad Estimate Detected!</strong> The planner expected{" "}
									{node.estRows} rows but received {node.actRows}. This causes
									bad query plans (e.g. picking Hash Join vs Nested Loop). Fix:
									Run <code>ANALYZE users; ANALYZE orders;</code> and consider{" "}
									<code>CREATE STATISTICS</code> for correlated columns.
								</motion.div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
