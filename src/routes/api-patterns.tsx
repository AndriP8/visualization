import { createFileRoute } from "@tanstack/react-router";
import { DecisionTreeDemo } from "../components/api-patterns/DecisionTreeDemo";
import { FetchingTradeoffsDemo } from "../components/api-patterns/FetchingTradeoffsDemo";
import { RealTimeStrategiesDemo } from "../components/api-patterns/RealTimeStrategiesDemo";
import { RequestPatternComparisonDemo } from "../components/api-patterns/RequestPatternComparisonDemo";
import { WaterfallOptimizerDemo } from "../components/api-patterns/WaterfallOptimizerDemo";
import { DemoSection } from "../components/shared/DemoSection";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/api-patterns")({
	component: ApiPatternsPage,
});

function ApiPatternsPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-12 pb-20">
			<PageHeader
				topic={{ label: "System Design", color: "blue" }}
				title="API Communication Patterns"
				subtitle="Visualize how REST, GraphQL, tRPC, WebSocket, and SSE handle data fetching, updates, and real-time communication"
				gradient={{ from: "blue-400", via: "cyan-400", to: "violet-400" }}
				explanation={{
					content: (
						<div className="space-y-3 text-sm text-zinc-300">
							<p>
								Different API patterns solve different problems. REST is simple
								and cache-friendly but can over-fetch. GraphQL gives precise
								control but adds complexity. WebSocket enables real-time
								bidirectional communication. SSE is simpler for server → client
								updates. Polling works when latency isn't critical.
							</p>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
								<div className="bg-zinc-900/50 rounded p-3 border border-zinc-700">
									<div className="text-xs text-zinc-500 mb-1">
										Best for CRUD
									</div>
									<div className="text-white font-semibold">REST</div>
								</div>
								<div className="bg-zinc-900/50 rounded p-3 border border-zinc-700">
									<div className="text-xs text-zinc-500 mb-1">
										Best for Flexibility
									</div>
									<div className="text-white font-semibold">GraphQL</div>
								</div>
								<div className="bg-zinc-900/50 rounded p-3 border border-zinc-700">
									<div className="text-xs text-zinc-500 mb-1">
										Best for Real-time
									</div>
									<div className="text-white font-semibold">WebSocket</div>
								</div>
							</div>
						</div>
					),
				}}
			/>

			<DemoSection
				title="1. Request Pattern Comparison"
				description="See how different API patterns fetch a user profile with posts, likes, and authors. Watch how sequential REST creates waterfalls, while GraphQL and tRPC fetch everything in one request."
			>
				<RequestPatternComparisonDemo />
			</DemoSection>

			<DemoSection
				title="2. Real-Time Update Strategies"
				description="Watch a live stock price dashboard using 5 different approaches. Compare bandwidth usage, latency, and network activity for each strategy over 60 seconds."
			>
				<RealTimeStrategiesDemo />
			</DemoSection>

			<DemoSection
				title="3. Over-fetching vs Under-fetching"
				description="Build a social media feed, then add an avatar feature. REST already has the data (but wasted bandwidth earlier). GraphQL needs a query update (but was efficient initially). See the trade-off in action."
			>
				<FetchingTradeoffsDemo />
			</DemoSection>

			<DemoSection
				title="4. API Request Waterfall Optimizer"
				description="Page loads with sequential API calls creating a 3-level waterfall (2.4s LCP). Watch how parallelization, GraphQL, and prefetching reduce this to 200ms."
			>
				<WaterfallOptimizerDemo />
			</DemoSection>

			<DemoSection
				title="5. WebSocket vs SSE Decision Tree"
				description="Answer 3 questions to find the right real-time pattern for your use case. Get architecture diagrams, code examples, and implementation guidance."
			>
				<DecisionTreeDemo />
			</DemoSection>

			{/* Key Takeaways */}
			<div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">
				<h3 className="text-lg font-semibold text-white mb-4">Key Takeaways</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-zinc-300">
					<div className="space-y-2">
						<div className="flex gap-2">
							<span className="text-rose-400 shrink-0">📦</span>
							<div>
								<strong className="text-white">REST:</strong> Good for CRUD,
								cache-friendly, but over-fetches. Waterfall risk with N+1
								queries.
							</div>
						</div>
						<div className="flex gap-2">
							<span className="text-cyan-400 shrink-0">◈</span>
							<div>
								<strong className="text-white">GraphQL:</strong> Solves
								over/under-fetching, single endpoint. Trade-off: backend
								complexity, no HTTP caching.
							</div>
						</div>
						<div className="flex gap-2">
							<span className="text-violet-400 shrink-0">⚡</span>
							<div>
								<strong className="text-white">tRPC:</strong> Perfect for
								TypeScript monorepos. Type-safe, no schema/codegen. Like REST
								but with full inference.
							</div>
						</div>
					</div>
					<div className="space-y-2">
						<div className="flex gap-2">
							<span className="text-green-400 shrink-0">⚡</span>
							<div>
								<strong className="text-white">WebSocket:</strong>{" "}
								Bidirectional, &lt;50ms latency. Use for chat, gaming,
								collaborative editing. Connection overhead.
							</div>
						</div>
						<div className="flex gap-2">
							<span className="text-cyan-400 shrink-0">📡</span>
							<div>
								<strong className="text-white">SSE:</strong> Simpler than
								WebSocket if unidirectional (server → client). Auto-reconnects.
								Perfect for logs, notifications.
							</div>
						</div>
						<div className="flex gap-2">
							<span className="text-amber-400 shrink-0">🔄</span>
							<div>
								<strong className="text-white">Polling:</strong> Acceptable if
								updates &lt;1/min. Simple, works everywhere. High bandwidth
								waste for frequent updates.
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
