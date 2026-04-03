import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

const STAGES = [
	{
		id: "sql",
		label: "SQL Query",
		icon: "📝",
		description: "The raw SQL string sent by the client application.",
		input: null,
		output: "SELECT * FROM users WHERE age > 18;",
	},
	{
		id: "parser",
		label: "Parser",
		icon: "🔍",
		description:
			"Checks SQL syntax and breaks it into recognizable tokens. Forms a raw 'Parse Tree'.",
		input: "Raw SQL String",
		output: "Parse Tree (AST)",
	},
	{
		id: "analyzer",
		label: "Analyzer / Rewriter",
		icon: "🧠",
		description:
			"Resolves raw identifiers to real catalog objects. Checks that tables/columns actually exist, resolves aliases (u.name → users.name), verifies column types match operators, and expands views into base tables.",
		input: "Parse Tree",
		output: "Query Tree (Semantically valid)",
	},
	{
		id: "planner",
		label: "Planner / Optimizer",
		icon: "📈",
		description:
			"Generates possible execution plans and uses table statistics to estimate costs, choosing the cheapest path.",
		input: "Query Tree",
		output: "Optimum Execution Plan",
	},
	{
		id: "executor",
		label: "Executor",
		icon: "⚙️",
		description:
			"Executes the chosen plan node-by-node (typically bottom-up). Fetches pages from memory or disk.",
		input: "Execution Plan Tree",
		output: "Data Rows (Tuples)",
	},
	{
		id: "result",
		label: "Result Set",
		icon: "📦",
		description: "The final formatted data sent back to the client.",
		input: "Data Rows",
		output: "Client Response",
	},
] as const;

export function PipelineOverviewDemo() {
	const [activeStage, setActiveStage] = useState<string | null>(null);

	return (
		<div className="flex flex-col gap-8">
			{/* Pipeline Visualizer */}
			<div className="relative flex flex-col items-center">
				<div className="absolute top-0 bottom-0 left-1/2 w-1 bg-surface-secondary -translate-x-1/2 z-0" />

				{STAGES.map((stage, index) => {
					const isActive = activeStage === stage.id;
					const isLast = index === STAGES.length - 1;

					return (
						<div
							key={stage.id}
							className="relative z-10 w-full flex flex-col items-center mb-6 last:mb-0"
						>
							<button
								type="button"
								onClick={() => setActiveStage(isActive ? null : stage.id)}
								className={`
									flex items-center gap-4 px-6 py-4 rounded-2xl border-2 transition-all duration-300 w-full max-w-md
									${
										isActive
											? "bg-violet-500/10 border-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.3)]"
											: "bg-surface-primary border-border-secondary hover:border-text-muted hover:bg-surface-secondary"
									}
								`}
							>
								<div
									className={`text-3xl transition-transform duration-300 ${isActive ? "scale-125" : ""}`}
								>
									{stage.icon}
								</div>
								<div className="flex-1 text-left">
									<h4
										className={`font-bold text-lg ${isActive ? "text-accent-violet" : "text-text-primary"}`}
									>
										{stage.label}
									</h4>
								</div>
								<div
									className={`text-text-muted transition-transform duration-300 ${isActive ? "rotate-180" : ""}`}
								>
									▼
								</div>
							</button>

							<AnimatePresence>
								{isActive && (
									<motion.div
										initial={{ opacity: 0, height: 0, y: -10 }}
										animate={{ opacity: 1, height: "auto", y: 0 }}
										exit={{ opacity: 0, height: 0, y: -10 }}
										className="w-full max-w-md overflow-hidden mt-2"
									>
										<div className="p-5 rounded-2xl bg-surface-primary border border-border-primary space-y-4 shadow-lg">
											<p className="text-text-secondary text-sm leading-relaxed">
												{stage.description}
											</p>

											<div className="grid grid-cols-2 gap-4 pt-4 border-t border-border-primary/50">
												{stage.input && (
													<div>
														<span className="text-xs text-text-muted uppercase font-semibold">
															Input
														</span>
														<div className="text-sm font-mono text-accent-cyan-soft mt-1 bg-surface-base p-2 rounded-md border border-border-primary/50">
															{stage.input}
														</div>
													</div>
												)}
												{stage.output && (
													<div className={!stage.input ? "col-span-2" : ""}>
														<span className="text-xs text-text-muted uppercase font-semibold">
															Output
														</span>
														<div className="text-sm font-mono text-accent-green-soft mt-1 bg-surface-base p-2 rounded-md border border-border-primary/50">
															{stage.output}
														</div>
													</div>
												)}
											</div>
										</div>
									</motion.div>
								)}
							</AnimatePresence>

							{/* Connection Arrow (Except for last item) */}
							{!isLast && (
								<div className="h-8 w-1 flex flex-col justify-center items-center my-1 relative">
									{/* Animated dot moving down the line */}
									<motion.div
										className="absolute w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.8)]"
										animate={{
											y: [-16, 16],
											opacity: [0, 1, 0],
										}}
										transition={{
											duration: 1.5,
											repeat: Number.POSITIVE_INFINITY,
											ease: "linear",
											delay: index * 0.3, // Staggered flow effect
										}}
									/>
									<div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-8 border-transparent border-t-zinc-600 mt-6" />
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
