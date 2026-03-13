import { motion } from "motion/react";
import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import type { RenderingStrategy } from "./types";

interface LocationNode {
	id: string;
	label: string;
	description: string;
	icon: string;
}

const LOCATIONS: LocationNode[] = [
	{
		id: "client",
		label: "Client Browser",
		description: "User's device",
		icon: "💻",
	},
	{
		id: "cdn",
		label: "Edge/CDN",
		description: "Cached content globally",
		icon: "🌐",
	},
	{
		id: "server",
		label: "Origin Server",
		description: "Your backend",
		icon: "🖥️",
	},
];

interface StrategyFlow {
	strategy: RenderingStrategy;
	htmlSource: "client" | "cdn" | "server";
	requestPath: ("client" | "cdn" | "server")[];
	payload: string;
	color: string;
}

const STRATEGY_FLOWS: StrategyFlow[] = [
	{
		strategy: "CSR",
		htmlSource: "client",
		requestPath: ["client", "server", "client"],
		payload: "Empty HTML + JS bundle → Client renders",
		color: "#ef4444",
	},
	{
		strategy: "SSR",
		htmlSource: "server",
		requestPath: ["client", "server", "client"],
		payload: "Full HTML (server-rendered) + JS",
		color: "#3b82f6",
	},
	{
		strategy: "SSG",
		htmlSource: "cdn",
		requestPath: ["client", "cdn", "client"],
		payload: "Pre-built HTML (from CDN) + JS",
		color: "#10b981",
	},
	{
		strategy: "ISR",
		htmlSource: "cdn",
		requestPath: ["client", "cdn", "client"],
		payload: "Stale HTML (from CDN), revalidates async",
		color: "#06b6d4",
	},
	{
		strategy: "Streaming SSR",
		htmlSource: "server",
		requestPath: ["client", "server", "client"],
		payload: "HTML stream (progressive chunks) + JS",
		color: "#a855f7",
	},
];

export function WorkLocationDiagram() {
	const [selectedStrategy, setSelectedStrategy] =
		useState<RenderingStrategy>("CSR");

	const currentFlow = STRATEGY_FLOWS.find(
		(f) => f.strategy === selectedStrategy,
	);

	return (
		<DemoSection
			title="Where is the Work Done?"
			description="Understand where HTML generation happens and how the request flows through the architecture."
		>
			{/* Strategy Selector */}
			<div className="flex gap-2 mb-6 flex-wrap">
				{STRATEGY_FLOWS.map((flow) => (
					<button
						key={flow.strategy}
						type="button"
						onClick={() => setSelectedStrategy(flow.strategy)}
						className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
							selectedStrategy === flow.strategy
								? "text-white border-2"
								: "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-zinc-300"
						}`}
						style={
							selectedStrategy === flow.strategy
								? {
										backgroundColor: `${flow.color}22`,
										borderColor: flow.color,
									}
								: {}
						}
					>
						{flow.strategy}
					</button>
				))}
			</div>

			{/* Architecture Diagram */}
			<div className="relative">
				{/* Three Columns */}
				<div className="grid grid-cols-3 gap-8 mb-8">
					{LOCATIONS.map((location) => {
						const isHtmlSource = currentFlow?.htmlSource === location.id;

						return (
							<motion.div
								key={location.id}
								className={`relative p-6 rounded-xl border-2 transition-all ${
									isHtmlSource
										? "border-violet-500 bg-violet-500/10"
										: "border-zinc-700 bg-zinc-800/30"
								}`}
								animate={{
									scale: isHtmlSource ? 1.05 : 1,
								}}
								transition={{ duration: 0.3 }}
							>
								{/* Glow effect */}
								{isHtmlSource && (
									<motion.div
										className="absolute inset-0 rounded-xl blur-xl opacity-30"
										style={{ backgroundColor: currentFlow?.color }}
										animate={{ opacity: [0.2, 0.4, 0.2] }}
										transition={{
											duration: 2,
											repeat: Number.POSITIVE_INFINITY,
										}}
									/>
								)}

								<div className="relative text-center">
									<div className="text-4xl mb-2">{location.icon}</div>
									<h4 className="text-sm font-semibold text-white mb-1">
										{location.label}
									</h4>
									<p className="text-xs text-zinc-500">
										{location.description}
									</p>

									{isHtmlSource && (
										<motion.div
											initial={{ opacity: 0, y: -10 }}
											animate={{ opacity: 1, y: 0 }}
											className="mt-3 text-xs font-medium px-2 py-1 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30"
										>
											HTML Generated Here
										</motion.div>
									)}
								</div>
							</motion.div>
						);
					})}
				</div>

				{/* Flow Arrows */}
				<div className="relative h-20 mb-6">
					<svg className="w-full h-full" aria-label="Request flow diagram">
						{/* Request flow visualization */}
						{currentFlow?.requestPath.map((node, idx) => {
							if (idx === currentFlow.requestPath.length - 1) return null;
							const nextNode = currentFlow.requestPath[idx + 1];

							const startX = getNodePosition(node);
							const endX = getNodePosition(nextNode);
							const y = 40;

							return (
								<motion.g
									key={`${node}-${nextNode}-${
										// biome-ignore lint/suspicious/noArrayIndexKey: index used for animation timing
										idx
									}`}
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ delay: idx * 0.3 }}
								>
									{/* Arrow line */}
									<motion.line
										x1={startX}
										y1={y}
										x2={endX}
										y2={y}
										stroke={currentFlow.color}
										strokeWidth="3"
										strokeDasharray="5,5"
										initial={{ pathLength: 0 }}
										animate={{ pathLength: 1 }}
										transition={{ delay: idx * 0.3, duration: 0.5 }}
									/>
									{/* Arrow head */}
									<polygon
										points={`${endX - 6},${y - 5} ${endX},${y} ${endX - 6},${y + 5}`}
										fill={currentFlow.color}
									/>
								</motion.g>
							);
						})}
					</svg>
				</div>

				{/* Payload Description */}
				{currentFlow && (
					<motion.div
						key={selectedStrategy}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						className="p-4 rounded-lg border text-sm"
						style={{
							backgroundColor: `${currentFlow.color}11`,
							borderColor: `${currentFlow.color}44`,
						}}
					>
						<span
							className="font-semibold"
							style={{ color: currentFlow.color }}
						>
							{currentFlow.strategy}:
						</span>{" "}
						<span className="text-zinc-300">{currentFlow.payload}</span>
					</motion.div>
				)}
			</div>
		</DemoSection>
	);
}

// Helper to calculate horizontal position for each node
function getNodePosition(node: string): number {
	const positions = {
		client: 16.66, // 1/6 of width (center of first column)
		cdn: 50, // 3/6 of width (center of second column)
		server: 83.33, // 5/6 of width (center of third column)
	};
	return positions[node as keyof typeof positions];
}
