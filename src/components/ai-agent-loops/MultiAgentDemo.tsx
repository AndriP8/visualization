import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { DemoSection } from "../shared/DemoSection";

type NodeStatus = "idle" | "active" | "done";

export function MultiAgentDemo() {
	const [step, setStep] = useState(0);

	useEffect(() => {
		if (step > 0 && step < 5) {
			const timer = setTimeout(() => setStep((s) => s + 1), 1500);
			return () => clearTimeout(timer);
		}
	}, [step]);

	return (
		<DemoSection
			title="Demo 4: Multi-Agent Systems (Supervisor-Worker)"
			description="Complex tasks can be broken down into subtasks and routed by a Supervisor agent to specialized Worker agents, rather than using one monolithic loop."
		>
			<div className="flex flex-col items-center gap-8">
				<div className="flex gap-4 mb-4">
					<button
						type="button"
						onClick={() => setStep(1)}
						disabled={step > 0 && step < 5}
						className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-md disabled:opacity-50 text-sm cursor-pointer"
					>
						{step === 5
							? "Restart Workflow"
							: step === 0
								? "Start Workflow"
								: "Processing..."}
					</button>
				</div>

				<div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-lg p-10 flex flex-col items-center">
					{/* SVG Connectors */}
					<svg
						className="absolute inset-0 w-full h-full pointer-events-none"
						style={{ zIndex: 0 }}
						aria-hidden="true"
					>
						<defs>
							<marker
								id="arrowhead"
								markerWidth="10"
								markerHeight="7"
								refX="9"
								refY="3.5"
								orient="auto"
							>
								<polygon points="0 0, 10 3.5, 0 7" fill="#52525b" />
							</marker>
							<marker
								id="arrowhead-active"
								markerWidth="10"
								markerHeight="7"
								refX="9"
								refY="3.5"
								orient="auto"
							>
								<polygon points="0 0, 10 3.5, 0 7" fill="#a78bfa" />
							</marker>
						</defs>

						{/* Supervisor to Researcher */}
						<motion.path
							d="M 320 80 Q 200 120 180 180"
							fill="none"
							stroke={step === 1 ? "#a78bfa" : "#3f3f46"}
							strokeWidth="2"
							markerEnd={
								step === 1 ? "url(#arrowhead-active)" : "url(#arrowhead)"
							}
						/>
						{/* Researcher to Supervisor */}
						<motion.path
							d="M 180 180 Q 200 140 320 80"
							fill="none"
							stroke={step === 2 ? "#a78bfa" : "transparent"}
							strokeWidth="2"
							markerEnd={step === 2 ? "url(#arrowhead-active)" : ""}
							strokeDasharray="4 4"
						/>

						{/* Supervisor to Coder */}
						<motion.path
							d="M 330 80 Q 460 120 480 180"
							fill="none"
							stroke={step === 3 ? "#a78bfa" : "#3f3f46"}
							strokeWidth="2"
							markerEnd={
								step === 3 ? "url(#arrowhead-active)" : "url(#arrowhead)"
							}
						/>
						{/* Coder to Supervisor */}
						<motion.path
							d="M 480 180 Q 460 140 330 80"
							fill="none"
							stroke={step === 4 ? "#a78bfa" : "transparent"}
							strokeWidth="2"
							markerEnd={step === 4 ? "url(#arrowhead-active)" : ""}
							strokeDasharray="4 4"
						/>
					</svg>

					{/* Nodes */}
					<div className="z-10 flex flex-col items-center w-full">
						<AgentNode
							title="Supervisor Agent"
							description="Decomposes task, routes to workers, aggregates results"
							status={
								step === 0
									? "idle"
									: step === 1 || step === 3
										? "idle"
										: "active"
							}
							color="violet"
						/>

						<div className="w-full flex justify-between px-10 mt-16">
							<AgentNode
								title="Researcher Agent"
								description="Search web, read docs"
								status={step === 1 ? "active" : step > 1 ? "done" : "idle"}
								color="blue"
							/>
							<AgentNode
								title="Coder Agent"
								description="Write code, run tests"
								status={step === 3 ? "active" : step > 3 ? "done" : "idle"}
								color="emerald"
							/>
						</div>
					</div>

					{/* Status Message */}
					<div className="h-10 mt-12 z-10">
						<AnimatePresence mode="wait">
							{step === 1 && (
								<StatusText
									key="1"
									text="Supervisor delegates research task to Researcher Agent..."
								/>
							)}
							{step === 2 && (
								<StatusText
									key="2"
									text="Researcher returns findings to Supervisor."
								/>
							)}
							{step === 3 && (
								<StatusText
									key="3"
									text="Supervisor delegates implementation to Coder Agent..."
								/>
							)}
							{step === 4 && (
								<StatusText
									key="4"
									text="Coder returns working code to Supervisor."
								/>
							)}
							{step === 5 && (
								<StatusText
									key="5"
									text="Supervisor returns final aggregated result to user."
									color="text-emerald-400"
								/>
							)}
						</AnimatePresence>
					</div>
				</div>
			</div>
		</DemoSection>
	);
}

function AgentNode({
	title,
	description,
	status,
	color,
}: {
	title: string;
	description: string;
	status: NodeStatus;
	color: "violet" | "blue" | "emerald";
}) {
	const colors = {
		violet: {
			active: "bg-violet-900 border-violet-500 text-violet-100",
			idle: "bg-zinc-800 border-zinc-700 text-zinc-300",
			done: "bg-violet-900/40 border-violet-700/50 text-violet-300",
		},
		blue: {
			active: "bg-blue-900 border-blue-500 text-blue-100",
			idle: "bg-zinc-800 border-zinc-700 text-zinc-300",
			done: "bg-blue-900/40 border-blue-700/50 text-blue-300",
		},
		emerald: {
			active: "bg-emerald-900 border-emerald-500 text-emerald-100",
			idle: "bg-zinc-800 border-zinc-700 text-zinc-300",
			done: "bg-emerald-900/40 border-emerald-700/50 text-emerald-300",
		},
	};

	return (
		<motion.div
			animate={
				status === "active"
					? { scale: [1, 1.05, 1], boxShadow: "0 0 20px rgba(0,0,0,0.5)" }
					: { scale: 1, boxShadow: "none" }
			}
			transition={{
				duration: status === "active" ? 1.5 : 0.3,
				repeat: status === "active" ? Infinity : 0,
			}}
			className={`w-48 p-4 rounded-xl border text-center shadow-lg transition-colors duration-500 ${colors[color][status]}`}
		>
			<h4 className="font-bold text-sm mb-2">{title}</h4>
			<p className="text-xs opacity-80">{description}</p>
		</motion.div>
	);
}

function StatusText({
	text,
	color = "text-zinc-300",
}: {
	text: string;
	color?: string;
}) {
	return (
		<motion.p
			initial={{ opacity: 0, y: 5 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -5 }}
			className={`text-sm font-medium ${color}`}
		>
			{text}
		</motion.p>
	);
}
