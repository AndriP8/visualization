import {
	ArrowDown,
	Bot,
	CheckCircle2,
	Clock,
	Code2,
	Database,
	GitBranch,
	Globe,
	Layers,
	Loader2,
	Pause,
	Play,
	RotateCcw,
	StepForward,
	Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { match } from "ts-pattern";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

type PatternMode = "plan" | "react";

interface PlanNode {
	id: string;
	title: string;
	role: string;
	icon: typeof Bot;
	description: string;
	latency: number;
	output: string;
	jsonSpec: string;
}

const PLAN_NODES: Record<string, PlanNode> = {
	planner: {
		id: "planner",
		title: "1. Planner Agent",
		role: "Decomposition & Dependency Mapping",
		icon: Bot,
		description:
			"LLM breaks the goal into independent subtasks and maps dependencies.",
		latency: 160,
		output:
			"Plan formulated: Dispatch [search_competitor] and [query_catalog] in parallel. Await both before [synthesize_report].",
		jsonSpec: JSON.stringify(
			{
				plan_id: "plan_892f",
				goal: "Compare competitor pricing vs internal tier catalog",
				tasks: [
					{
						id: "task_web",
						tool: "web_search",
						params: { query: "Acme Corp 2026 pricing tiers" },
						dependencies: [],
					},
					{
						id: "task_db",
						tool: "query_database",
						params: { table: "internal_pricing_v2" },
						dependencies: [],
					},
					{
						id: "task_synth",
						tool: "synthesizer_llm",
						dependencies: ["task_web", "task_db"],
					},
				],
			},
			null,
			2,
		),
	},
	branchA: {
		id: "branchA",
		title: "2a. Web Search Tool",
		role: "Parallel Branch A",
		icon: Globe,
		description:
			"Searches live web for competitor public pricing tiers and add-ons.",
		latency: 320,
		output:
			"Acme Corp: Starter ($29/mo), Pro ($99/mo), Enterprise (Custom Quote).",
		jsonSpec: JSON.stringify(
			{
				tool: "web_search",
				query: "Acme Corp 2026 pricing tiers",
				result: {
					competitor: "Acme Corp",
					tiers: [
						{ name: "Starter", price: "$29/mo", seats: 5 },
						{ name: "Pro", price: "$99/mo", seats: 20 },
						{ name: "Enterprise", price: "Custom", seats: "Unlimited" },
					],
				},
			},
			null,
			2,
		),
	},
	branchB: {
		id: "branchB",
		title: "2b. Catalog DB Query",
		role: "Parallel Branch B",
		icon: Database,
		description:
			"Fetches internal pricing model and discount margins from database.",
		latency: 280,
		output:
			"Internal Catalog: Team ($25/mo), Scale ($85/mo), Custom ($250/mo floor).",
		jsonSpec: JSON.stringify(
			{
				tool: "query_database",
				table: "internal_pricing_v2",
				result: {
					internal_tiers: [
						{ name: "Team", price: "$25/mo", margin: "38%" },
						{ name: "Scale", price: "$85/mo", margin: "45%" },
						{ name: "Custom", price: "$250/mo", margin: "52%" },
					],
				},
			},
			null,
			2,
		),
	},
	synthesizer: {
		id: "synthesizer",
		title: "3. Synthesis / Reducer",
		role: "Join & Final Generation",
		icon: Layers,
		description:
			"Receives concurrent observations and synthesizes competitive analysis.",
		latency: 180,
		output:
			"Synthesis complete: Our Team tier is $4/mo cheaper than Acme Starter, and Scale is $14/mo cheaper than Acme Pro with 45% margin.",
		jsonSpec: JSON.stringify(
			{
				status: "complete",
				summary: "Internal pricing is 14% more competitive across mid-market.",
				recommendation: "Highlight $14/mo savings on Scale tier landing page.",
				total_wall_clock_ms: 660,
			},
			null,
			2,
		),
	},
};

const REACT_STEPS = [
	{
		step: 1,
		type: "LLM Turn 1",
		detail: "Thought: I need competitor pricing. Action: web_search(...)",
		latency: 160,
	},
	{
		step: 2,
		type: "Observation 1",
		detail: "Acme Corp: Starter ($29/mo), Pro ($99/mo)",
		latency: 320,
	},
	{
		step: 3,
		type: "LLM Turn 2",
		detail: "Thought: Now query internal DB. Action: query_database(...)",
		latency: 160,
	},
	{
		step: 4,
		type: "Observation 2",
		detail: "Internal Catalog: Team ($25/mo), Scale ($85/mo)",
		latency: 280,
	},
	{
		step: 5,
		type: "LLM Turn 3",
		detail: "Thought: Synthesize both observations into final answer.",
		latency: 180,
	},
];

export function PlanExecuteDemo() {
	const [pattern, setPattern] = useState<PatternMode>("plan");
	const [step, setStep] = useState(0);
	const [isPlaying, setIsPlaying] = useState(false);
	const [selectedNode, setSelectedNode] = useState<string>("planner");

	const maxSteps = pattern === "plan" ? 4 : 5;

	useEffect(() => {
		if (!isPlaying) return;
		const interval = window.setInterval(() => {
			setStep((curr) => {
				if (curr >= maxSteps) {
					setIsPlaying(false);
					return curr;
				}
				const next = curr + 1;
				if (pattern === "plan") {
					if (next === 1) setSelectedNode("planner");
					else if (next === 2) setSelectedNode("branchA");
					else if (next === 3) setSelectedNode("synthesizer");
				}
				return next;
			});
		}, 1400);
		return () => window.clearInterval(interval);
	}, [isPlaying, maxSteps, pattern]);

	const handlePatternChange = (newPattern: PatternMode) => {
		setPattern(newPattern);
		setStep(0);
		setIsPlaying(false);
		setSelectedNode(newPattern === "plan" ? "planner" : "react_0");
	};

	const handleReset = () => {
		setStep(0);
		setIsPlaying(false);
		setSelectedNode(pattern === "plan" ? "planner" : "react_0");
	};

	const handleStepForward = () => {
		if (step < maxSteps) {
			const next = step + 1;
			setStep(next);
			if (pattern === "plan") {
				if (next === 1) setSelectedNode("planner");
				else if (next === 2) setSelectedNode("branchA");
				else if (next === 3) setSelectedNode("synthesizer");
			}
		}
	};

	// Plan node states
	const plannerState = step >= 1 ? (step === 1 ? "running" : "done") : "idle";
	const branchesState = step >= 2 ? (step === 2 ? "running" : "done") : "idle";
	const synthState = step >= 3 ? (step === 3 ? "running" : "done") : "idle";

	return (
		<DemoSection
			title="Demo 3: Plan-and-Execute (DAG Decomposition)"
			description="Planning transforms the loop shape: instead of deciding only the immediate next action sequentially, the agent builds a dependency graph upfront to execute independent tasks in parallel."
		>
			<div className="space-y-6">
				{/* Top Controls: Pattern Switcher & Simulator Bar */}
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex rounded-lg border border-zinc-800 bg-zinc-950 p-1">
						<button
							type="button"
							onClick={() => handlePatternChange("plan")}
							className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-medium transition-all ${
								pattern === "plan"
									? "bg-emerald-500/15 text-emerald-300 shadow-sm border border-emerald-500/30"
									: "text-zinc-400 hover:text-zinc-200"
							}`}
						>
							<GitBranch className="h-3.5 w-3.5" />
							Plan-and-Execute (DAG)
						</button>
						<button
							type="button"
							onClick={() => handlePatternChange("react")}
							className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-medium transition-all ${
								pattern === "react"
									? "bg-cyan-500/15 text-cyan-300 shadow-sm border border-cyan-500/30"
									: "text-zinc-400 hover:text-zinc-200"
							}`}
						>
							<ArrowDown className="h-3.5 w-3.5" />
							ReAct (Serial Step-by-Step)
						</button>
					</div>

					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => setIsPlaying(!isPlaying)}
							disabled={step === maxSteps && !isPlaying}
							className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:opacity-40"
						>
							{isPlaying ? (
								<>
									<Pause className="h-3.5 w-3.5" /> Pause
								</>
							) : (
								<>
									<Play className="h-3.5 w-3.5" />
									{step === 0 ? "Simulate" : "Resume"}
								</>
							)}
						</button>
						<button
							type="button"
							onClick={handleStepForward}
							disabled={step === maxSteps || isPlaying}
							className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-500 disabled:opacity-40"
						>
							<StepForward className="h-3.5 w-3.5" /> Step
						</button>
						<button
							type="button"
							onClick={handleReset}
							className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:text-zinc-200 hover:border-zinc-700"
							title="Reset execution"
						>
							<RotateCcw className="h-3.5 w-3.5" />
						</button>
					</div>
				</div>

				{/* Visual Canvas & Inspector Layout */}
				<div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
					{/* Left / Center: Interactive Graph View */}
					<div className="lg:col-span-7 rounded-xl border border-zinc-800 bg-zinc-950 p-5 flex flex-col justify-between relative overflow-hidden min-h-[420px]">
						<div className="flex items-center justify-between mb-4">
							<div className="flex items-center gap-2">
								<span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
									{pattern === "plan"
										? "Execution Graph (Parallel DAG)"
										: "Serial ReAct Execution Stream"}
								</span>
							</div>
							<span className="font-mono text-xs text-zinc-500">
								Phase:{" "}
								<span className="text-zinc-300 font-semibold">
									{match({ pattern, step })
										.with({ step: 0 }, () => "Ready to run")
										.with(
											{ pattern: "plan", step: 1 },
											() => "Formulating Plan",
										)
										.with(
											{ pattern: "plan", step: 2 },
											() => "Parallel Dispatch (2 workers)",
										)
										.with({ pattern: "plan", step: 3 }, () => "Synthesizing")
										.with({ pattern: "plan", step: 4 }, () => "Task Complete")
										.otherwise(() => `Turn ${step} of ${maxSteps}`)}
								</span>
							</span>
						</div>

						{pattern === "plan" ? (
							/* Plan & Execute Branching DAG */
							<div className="flex flex-col items-center justify-between space-y-4 my-auto relative py-2">
								{/* Tier 1: Planner Node */}
								<DagNodeCard
									node={PLAN_NODES.planner}
									state={plannerState}
									isSelected={selectedNode === "planner"}
									onClick={() => setSelectedNode("planner")}
								/>

								{/* Connector Lines: Planner -> Branches */}
								<div className="w-full max-w-md flex justify-between px-16 relative -my-1 h-6">
									<div
										className={`w-1/2 border-r-2 transition-colors duration-500 ${
											step >= 2 ? "border-emerald-500" : "border-zinc-800"
										}`}
									/>
									<div
										className={`w-1/2 border-l-2 transition-colors duration-500 ${
											step >= 2 ? "border-emerald-500" : "border-zinc-800"
										}`}
									/>
								</div>

								{/* Tier 2: Parallel Branches */}
								<div className="grid grid-cols-2 gap-3 w-full max-w-xl">
									<DagNodeCard
										node={PLAN_NODES.branchA}
										state={branchesState}
										badge="Parallel (320ms)"
										isSelected={selectedNode === "branchA"}
										onClick={() => setSelectedNode("branchA")}
									/>
									<DagNodeCard
										node={PLAN_NODES.branchB}
										state={branchesState}
										badge="Parallel (280ms)"
										isSelected={selectedNode === "branchB"}
										onClick={() => setSelectedNode("branchB")}
									/>
								</div>

								{/* Connector Lines: Branches -> Synthesizer */}
								<div className="w-full max-w-md flex justify-between px-16 relative -my-1 h-6">
									<div
										className={`w-1/2 border-r-2 transition-colors duration-500 ${
											step >= 3 ? "border-emerald-500" : "border-zinc-800"
										}`}
									/>
									<div
										className={`w-1/2 border-l-2 transition-colors duration-500 ${
											step >= 3 ? "border-emerald-500" : "border-zinc-800"
										}`}
									/>
								</div>

								{/* Tier 3: Synthesizer */}
								<DagNodeCard
									node={PLAN_NODES.synthesizer}
									state={synthState}
									isSelected={selectedNode === "synthesizer"}
									onClick={() => setSelectedNode("synthesizer")}
								/>
							</div>
						) : (
							/* ReAct Linear Serial Waterfall */
							<div className="space-y-2.5 my-auto max-w-md mx-auto w-full py-1">
								{REACT_STEPS.map((s) => {
									const isCurrent = step === s.step;
									const isCompleted = step > s.step;
									return (
										<motion.div
											key={s.step}
											initial={{ opacity: 0, x: -10 }}
											animate={{
												opacity: isCompleted || isCurrent ? 1 : 0.35,
												scale: isCurrent ? 1.02 : 1,
											}}
											className={`rounded-lg border p-2.5 text-xs transition-all ${
												isCurrent
													? "border-cyan-500/60 bg-cyan-500/10 shadow-sm"
													: isCompleted
														? "border-zinc-800 bg-zinc-900/80 text-zinc-300"
														: "border-zinc-900 bg-zinc-950/40 text-zinc-600"
											}`}
										>
											<div className="flex items-center justify-between font-mono mb-1">
												<span
													className={`font-semibold ${
														isCurrent ? "text-cyan-300" : "text-zinc-400"
													}`}
												>
													{s.type}
												</span>
												<span className="text-[10px] text-zinc-500">
													{s.latency}ms (Serial)
												</span>
											</div>
											<div className="font-mono text-zinc-300">{s.detail}</div>
										</motion.div>
									);
								})}
							</div>
						)}

						<div className="mt-4 pt-3 border-t border-zinc-900 flex items-center justify-between text-xs text-zinc-500">
							<span className="flex items-center gap-1.5">
								<Zap className="h-3.5 w-3.5 text-emerald-400" />
								{pattern === "plan"
									? "Branches 2a & 2b execute concurrently in a single roundtrip phase"
									: "ReAct forces 5 roundtrips sequentially, accumulating context on every turn"}
							</span>
							<span className="text-[11px] text-zinc-600">
								Click any node to inspect payload
							</span>
						</div>
					</div>

					{/* Right: Inspector & Payload Viewer */}
					<div className="lg:col-span-5 flex flex-col space-y-3">
						<div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 flex-1 flex flex-col justify-between">
							<div>
								<div className="flex items-center justify-between mb-2">
									<span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
										<Code2 className="h-3.5 w-3.5 text-indigo-400" />
										Node Payload & Specification
									</span>
									<span className="text-[10px] text-zinc-500 font-mono">
										{pattern === "plan" ? selectedNode : "ReAct stream"}
									</span>
								</div>

								{pattern === "plan" && PLAN_NODES[selectedNode] ? (
									<div className="space-y-3">
										<div className="rounded-lg bg-zinc-900/80 border border-zinc-800/80 p-2.5">
											<div className="text-xs font-semibold text-zinc-200">
												{PLAN_NODES[selectedNode].title}
											</div>
											<div className="text-[11px] text-zinc-400 mt-0.5">
												{PLAN_NODES[selectedNode].description}
											</div>
										</div>

										<div>
											<div className="text-[10px] uppercase font-semibold text-zinc-500 mb-1">
												Runtime Payload / Contract
											</div>
											<div className="max-h-[190px] overflow-auto rounded-lg border border-zinc-800">
												<ShikiCode
													code={PLAN_NODES[selectedNode].jsonSpec}
													language="json"
													showLineNumbers={false}
												/>
											</div>
										</div>
									</div>
								) : (
									<div className="space-y-3">
										<div className="rounded-lg bg-zinc-900/80 border border-zinc-800/80 p-2.5">
											<div className="text-xs font-semibold text-zinc-200">
												Linear ReAct History
											</div>
											<div className="text-[11px] text-zinc-400 mt-0.5">
												Each step appends to conversation tokens; tool calls
												block next thought.
											</div>
										</div>
										<div className="max-h-[190px] overflow-auto rounded-lg border border-zinc-800">
											<ShikiCode
												code={REACT_STEPS.slice(0, Math.max(1, step))
													.map(
														(s) => `[${s.type}] (${s.latency}ms)\n${s.detail}`,
													)
													.join("\n\n")}
												language="text"
												showLineNumbers={false}
											/>
										</div>
									</div>
								)}
							</div>

							{/* Output preview */}
							{pattern === "plan" && PLAN_NODES[selectedNode] && (
								<div className="mt-3 pt-3 border-t border-zinc-900">
									<div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">
										Observation Output
									</div>
									<div className="text-xs text-zinc-300 font-mono bg-zinc-900/50 p-2 rounded border border-zinc-800/60">
										{PLAN_NODES[selectedNode].output}
									</div>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Latency Waterfall / Comparison Bar */}
				<div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3">
					<div className="flex items-center justify-between text-xs">
						<span className="font-semibold text-zinc-300 flex items-center gap-1.5">
							<Clock className="h-3.5 w-3.5 text-amber-400" />
							Wall-Clock Latency & Concurrency Comparison
						</span>
						<span className="font-mono text-emerald-400 font-medium">
							Plan-and-Execute is ~40% faster on multi-tool queries
						</span>
					</div>

					<div className="space-y-2">
						{/* Plan Bar */}
						<div>
							<div className="flex justify-between text-[11px] text-zinc-400 mb-1">
								<span>
									Plan-and-Execute (Parallel): 160ms + max(320, 280)ms + 180ms
								</span>
								<span className="font-mono font-semibold text-emerald-300">
									660 ms
								</span>
							</div>
							<div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden flex">
								<div
									className="bg-violet-500 h-full"
									style={{ width: "24%" }}
									title="Planner: 160ms"
								/>
								<div
									className="bg-emerald-500 h-full relative"
									style={{ width: "48%" }}
									title="Parallel Branches: 320ms (concurrent)"
								/>
								<div
									className="bg-cyan-500 h-full"
									style={{ width: "28%" }}
									title="Synthesizer: 180ms"
								/>
							</div>
						</div>

						{/* ReAct Bar */}
						<div>
							<div className="flex justify-between text-[11px] text-zinc-400 mb-1">
								<span>
									ReAct (Serial): 160ms + 320ms + 160ms + 280ms + 180ms
								</span>
								<span className="font-mono font-semibold text-rose-300">
									1,100 ms
								</span>
							</div>
							<div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden flex opacity-75">
								<div
									className="bg-violet-500 h-full"
									style={{ width: "15%" }}
								/>
								<div className="bg-amber-500 h-full" style={{ width: "29%" }} />
								<div
									className="bg-violet-500 h-full"
									style={{ width: "15%" }}
								/>
								<div className="bg-amber-500 h-full" style={{ width: "25%" }} />
								<div className="bg-cyan-500 h-full" style={{ width: "16%" }} />
							</div>
						</div>
					</div>

					{/* Latency Color Legend */}
					<div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 border-t border-zinc-900 text-[11px] text-zinc-400">
						<span className="flex items-center gap-1.5">
							<span className="h-2.5 w-2.5 rounded-sm bg-violet-500" />
							LLM Planning / Turn (160ms)
						</span>
						<span className="flex items-center gap-1.5">
							<span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
							Parallel Tool Execution (Concurrent max: 320ms)
						</span>
						<span className="flex items-center gap-1.5">
							<span className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
							Serial Tool Execution (Sequential IO: 320ms / 280ms)
						</span>
						<span className="flex items-center gap-1.5">
							<span className="h-2.5 w-2.5 rounded-sm bg-cyan-500" />
							Final Synthesis LLM (180ms)
						</span>
					</div>
				</div>

				{/* Key Metrics Grid */}
				<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
					<Metric
						label="Execution Model"
						value={pattern === "plan" ? "DAG Graph" : "Sequential Loop"}
					/>
					<Metric
						label="Max Concurrency"
						value={pattern === "plan" ? "2 Subtasks" : "1 (Serial)"}
					/>
					<Metric
						label="Plan Visibility"
						value={
							pattern === "plan" ? "Explicit Contract" : "Implicit (Drifting)"
						}
					/>
					<Metric
						label="Latency Efficiency"
						value={pattern === "plan" ? "660ms (-40%)" : "1,100ms (Baseline)"}
					/>
				</div>

				{/* Trade-off summary footer */}
				<div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3.5 text-xs text-zinc-400 leading-relaxed">
					<span className="font-semibold text-emerald-300">
						Architectural Trade-off:
					</span>{" "}
					<strong>Plan-and-Execute</strong> excels at deterministic,
					multi-source tasks where subqueries can be dispatched concurrently to
					minimize latency and keep worker prompts clean. Conversely,{" "}
					<strong>ReAct</strong> remains superior for open-ended, exploratory
					workflows where the next action strictly depends on unforeseen tool
					observations.
				</div>
			</div>
		</DemoSection>
	);
}

function DagNodeCard({
	node,
	state,
	badge,
	isSelected,
	onClick,
}: {
	node: PlanNode;
	state: "idle" | "running" | "done";
	badge?: string;
	isSelected: boolean;
	onClick: () => void;
}) {
	const Icon = node.icon;

	const borderStyle = match({ state, isSelected })
		.with(
			{ state: "running" },
			() =>
				"border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-500/10",
		)
		.with(
			{ state: "done", isSelected: true },
			() => "border-emerald-500/60 bg-zinc-900/90 ring-1 ring-emerald-500/30",
		)
		.with(
			{ state: "done" },
			() => "border-emerald-500/30 bg-zinc-900/60 text-zinc-200",
		)
		.with({ isSelected: true }, () => "border-zinc-600 bg-zinc-900")
		.otherwise(() => "border-zinc-800 bg-zinc-900/40 opacity-70");

	return (
		<button
			type="button"
			onClick={onClick}
			className={`w-full max-w-sm rounded-xl border p-3 text-left transition-all cursor-pointer ${borderStyle}`}
		>
			<div className="flex items-center justify-between mb-1.5">
				<div className="flex items-center gap-2">
					<div
						className={`p-1 rounded-md ${
							state === "running"
								? "bg-emerald-500/20 text-emerald-300"
								: state === "done"
									? "bg-zinc-800 text-emerald-400"
									: "bg-zinc-800 text-zinc-400"
						}`}
					>
						<Icon className="h-4 w-4" />
					</div>
					<div>
						<div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
							{node.title}
						</div>
						<div className="text-[10px] text-zinc-400">{node.role}</div>
					</div>
				</div>

				<div className="flex items-center gap-1.5">
					{badge && (
						<span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
							{badge}
						</span>
					)}
					{state === "running" && (
						<Loader2 className="h-3.5 w-3.5 text-emerald-400 animate-spin" />
					)}
					{state === "done" && (
						<CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
					)}
				</div>
			</div>
		</button>
	);
}

function Metric({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
			<div className="text-[10px] uppercase tracking-wider text-zinc-500">
				{label}
			</div>
			<div className="font-mono text-base font-semibold text-zinc-200 mt-0.5">
				{value}
			</div>
		</div>
	);
}
