import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { DecisionTreeDemo } from "../components/api-patterns/DecisionTreeDemo";
import { FetchingTradeoffsDemo } from "../components/api-patterns/FetchingTradeoffsDemo";
import { RealTimeStrategiesDemo } from "../components/api-patterns/RealTimeStrategiesDemo";
import { RequestPatternComparisonDemo } from "../components/api-patterns/RequestPatternComparisonDemo";
import { WaterfallOptimizerDemo } from "../components/api-patterns/WaterfallOptimizerDemo";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/api-patterns")({
	component: ApiPatternsPage,
});

function ApiPatternsPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-8">
			<PageHeader
				topic={{ label: "System Design", color: "blue" }}
				title="API Communication Patterns"
				subtitle="REST, GraphQL, tRPC, WebSocket, SSE, and polling are not interchangeable — each pattern optimizes for a different combination of request shape, data freshness, and connection overhead. Choosing the wrong one wastes bandwidth or adds unnecessary latency."
				gradient={{ from: "blue-400", to: "sky-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								The core tension is between{" "}
								<span className="text-blue-300 font-medium">
									flexibility and efficiency
								</span>
								. REST is cache-friendly and simple but over-fetches when
								clients need only a subset of fields. GraphQL solves
								over/under-fetching with declarative queries but sacrifices HTTP
								caching and adds backend complexity.{" "}
								<span className="text-cyan-300 font-medium">tRPC</span> gives
								REST-like simplicity with full TypeScript inference — but only
								within a TypeScript monorepo.
							</p>
							<p>
								For real-time data, the choice depends on directionality and
								latency requirements. WebSocket is bidirectional and low-latency
								but requires persistent connections. SSE is simpler for
								unidirectional server-to-client streams and auto-reconnects.
								Polling is universal but wastes bandwidth when updates are
								infrequent.
							</p>
							<p className="text-zinc-400">
								The demos below cover request pattern comparison, real-time
								strategy trade-offs, over/under-fetching, API waterfall
								optimization, and a WebSocket vs SSE decision tree.
							</p>
						</div>
					),
				}}
			/>

			{/* Demos */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.2, duration: 0.4 }}
				className="space-y-8"
			>
				<RequestPatternComparisonDemo />
				<RealTimeStrategiesDemo />
				<FetchingTradeoffsDemo />
				<WaterfallOptimizerDemo />
				<DecisionTreeDemo />

				{/* Key Takeaways */}
				<div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
					<h3 className="text-lg font-semibold text-white mb-4">
						Key Takeaways
					</h3>
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
									WebSocket if unidirectional (server → client).
									Auto-reconnects. Perfect for logs, notifications.
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
			</motion.div>
		</div>
	);
}
