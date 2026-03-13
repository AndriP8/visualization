import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";
import type { Strategy } from "../components/rendering-strategies/constants";
import { SSRDeepDive } from "../components/rendering-strategies/SSRDeepDive";
import { TimelineComparisonDemo } from "../components/rendering-strategies/TimelineComparisonDemo";
import { TradeoffMatrixDemo } from "../components/rendering-strategies/TradeoffMatrixDemo";
import { UseCaseMatcherDemo } from "../components/rendering-strategies/UseCaseMatcherDemo";
import { WorkLocationDemo } from "../components/rendering-strategies/WorkLocationDemo";
import { DemoSection } from "../components/shared/DemoSection";

export const Route = createFileRoute("/rendering-strategies")({
	component: RenderingStrategiesPage,
});

function RenderingStrategiesPage() {
	const [eliminatedStrategies, setEliminatedStrategies] = useState<
		Set<Strategy>
	>(new Set());

	return (
		<div className="max-w-7xl mx-auto space-y-12 pb-20">
			{/* Header */}
			<header className="mb-12">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-400 text-sm font-medium mb-4"
				>
					<span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
					Web Fundamentals
				</motion.div>
				<motion.h1
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
					className="text-4xl lg:text-5xl font-bold bg-linear-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent mb-4"
				>
					Rendering Strategies
				</motion.h1>
				<motion.p
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
					className="text-gray-400 text-lg max-w-3xl leading-relaxed"
				>
					CSR, SSR, SSG, ISR, Streaming SSR — every developer claims to know
					these, but few can explain{" "}
					<em className="text-zinc-300">when HTML is generated</em>,{" "}
					<em className="text-zinc-300">where</em>, and{" "}
					<em className="text-zinc-300">when the page becomes interactive</em>.
					Watch the differences play out in real time.
				</motion.p>
			</header>

			<div className="space-y-16">
				{/* Demo 1: Timeline Comparison */}
				<DemoSection
					title="1. Timeline Comparison"
					description="All 5 strategies side-by-side on a shared time axis. Click ▶ to animate request balls — each ball's speed reflects the relative performance of that strategy. Toggle 3G mode to exaggerate CSR's blank-screen gap."
				>
					<TimelineComparisonDemo eliminatedStrategies={eliminatedStrategies} />
				</DemoSection>

				{/* Demo 2: Where is the Work Done? */}
				<DemoSection
					title="2. Where is the Work Done?"
					description="Select a strategy to see which infrastructure layer generates the HTML, and what payload travels between Client, Edge/CDN, and Origin Server."
				>
					<WorkLocationDemo />
				</DemoSection>

				{/* Demo 3: Trade-off Matrix */}
				<DemoSection
					title="3. Trade-off Matrix"
					description="No strategy is universally best. Click any cell to understand exactly why that strategy rates well or poorly for that factor — with concrete examples, not vague generalities."
				>
					<TradeoffMatrixDemo />
				</DemoSection>

				{/* Demo 4: Use Case Matcher */}
				<DemoSection
					title="4. Use Case Matcher"
					description="Answer 4 yes/no questions about your project. Strategies that can't satisfy your requirements are eliminated — and dimmed on the Timeline above — until only the best fit remains."
				>
					<UseCaseMatcherDemo onEliminatedChange={setEliminatedStrategies} />
				</DemoSection>

				{/* Demo 5: SSR Deep Dive */}
				<SSRDeepDive />
			</div>
		</div>
	);
}
