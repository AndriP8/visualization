import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import type { Strategy } from "../components/rendering-strategies/constants";
import { SSRDeepDive } from "../components/rendering-strategies/SSRDeepDive";
import { TimelineComparisonDemo } from "../components/rendering-strategies/TimelineComparisonDemo";
import { TradeoffMatrixDemo } from "../components/rendering-strategies/TradeoffMatrixDemo";
import { UseCaseMatcherDemo } from "../components/rendering-strategies/UseCaseMatcherDemo";
import { WorkLocationDemo } from "../components/rendering-strategies/WorkLocationDemo";
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
				topic={{ label: "Web", color: "indigo" }}
				title="Rendering Strategies"
				subtitle="CSR, SSR, SSG, ISR, and Streaming SSR differ on one axis: where and when HTML is generated. That single decision determines Time to First Byte, Time to Interactive, cache-ability, and infrastructure cost."
				gradient={{ from: "indigo-400", to: "violet-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								All rendering strategies share the same goal — deliver a usable
								page to the user as fast as possible. The differentiator is{" "}
								<span className="text-indigo-300 font-medium">
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

			<div className="space-y-12">
				<TimelineComparisonDemo eliminatedStrategies={eliminatedStrategies} />
				<WorkLocationDemo />
				<TradeoffMatrixDemo />
				<UseCaseMatcherDemo onEliminatedChange={setEliminatedStrategies} />
				<SSRDeepDive />
			</div>
		</div>
	);
}
