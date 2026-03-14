import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import type { Strategy } from "../components/rendering-strategies/constants";
import { SSRDeepDive } from "../components/rendering-strategies/SSRDeepDive";
import { TimelineComparisonDemo } from "../components/rendering-strategies/TimelineComparisonDemo";
import { TradeoffMatrixDemo } from "../components/rendering-strategies/TradeoffMatrixDemo";
import { UseCaseMatcherDemo } from "../components/rendering-strategies/UseCaseMatcherDemo";
import { WorkLocationDemo } from "../components/rendering-strategies/WorkLocationDemo";
import { DemoSection } from "../components/shared/DemoSection";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/rendering-strategies")({
	component: RenderingStrategiesPage,
});

function RenderingStrategiesPage() {
	const [eliminatedStrategies, setEliminatedStrategies] = useState<
		Set<Strategy>
	>(new Set());

	return (
		<div className="max-w-6xl mx-auto space-y-12 pb-20">
			<PageHeader
				topic={{ label: "Web Fundamentals", color: "violet" }}
				title="Rendering Strategies"
				subtitle="CSR, SSR, SSG, ISR, Streaming SSR — every developer claims to know these, but few can explain when HTML is generated, where, and when the page becomes interactive. Watch the differences play out in real time."
				gradient={{ from: "violet-400", via: "fuchsia-400", to: "cyan-400" }}
			/>

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
