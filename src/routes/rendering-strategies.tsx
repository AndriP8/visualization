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
				subtitle="CSR, SSR, SSG, ISR, and Streaming SSR differ on one axis: where and when HTML is generated. That single decision determines Time to First Byte, Time to Interactive, cache-ability, and infrastructure cost."
				gradient={{ from: "violet-400", via: "fuchsia-400", to: "cyan-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								All rendering strategies share the same goal — deliver a usable
								page to the user as fast as possible. The differentiator is{" "}
								<span className="text-violet-300 font-medium">
									where HTML is produced
								</span>
								: in the browser at runtime (CSR), on an origin server per
								request (SSR), at build time (SSG), incrementally after build
								(ISR), or streamed in chunks as data resolves (Streaming SSR).
								Moving work earlier in the timeline (build time vs request time)
								improves TTFB but reduces freshness.
							</p>
							<p>
								No strategy is universally optimal. SSG is unbeatable for static
								content but stale for personalized data.{" "}
								<span className="text-cyan-300 font-medium">SSR</span> is always
								fresh but adds server latency and cost. CSR maximizes
								infrastructure simplicity but produces blank screens on slow
								networks. Choosing correctly requires knowing your data
								freshness requirements, personalization needs, and latency
								budget.
							</p>
							<p className="text-zinc-400">
								The demos below cover timeline comparison, where work is done,
								trade-off matrix, use-case matcher, and an SSR deep dive.
							</p>
						</div>
					),
				}}
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
