import { createFileRoute } from "@tanstack/react-router";
import { CacheInvalidationDemo } from "../components/caching-strategies/CacheInvalidationDemo";
import { CacheStampedeDemo } from "../components/caching-strategies/CacheStampedeDemo";
import { CachingLayerStackDemo } from "../components/caching-strategies/CachingLayerStackDemo";
import { HttpCacheHeadersDemo } from "../components/caching-strategies/HttpCacheHeadersDemo";
import { DemoSection } from "../components/shared/DemoSection";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/caching-strategies")({
	component: CachingStrategiesPage,
});

function CachingStrategiesPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-12 pb-20">
			<PageHeader
				topic={{ label: "System Design", color: "blue" }}
				title="Caching Strategies & Layers"
				subtitle="Every caching strategy makes a different trade-off between freshness, consistency, and latency. The right choice depends on how stale your data can afford to be and how expensive a cache miss is."
				gradient={{ from: "blue-400", to: "sky-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								Caching reduces latency and load by serving previously computed
								results. A request passes through{" "}
								<span className="text-blue-300 font-medium">
									multiple cache layers
								</span>{" "}
								— browser memory, CDN edge, application cache, database buffer —
								before hitting disk. Each layer has its own TTL, invalidation
								strategy, and failure mode.
							</p>
							<p>
								The strategies differ in{" "}
								<span className="text-amber-300 font-medium">
									when they write
								</span>{" "}
								(read-through vs write-through vs write-behind),{" "}
								<span className="text-orange-300 font-medium">
									how they invalidate
								</span>{" "}
								(TTL, event-driven, manual purge), and{" "}
								<span className="text-rose-300 font-medium">
									how they handle failure
								</span>{" "}
								— a cache stampede occurs when many keys expire simultaneously
								and all requests hit the database at once.
							</p>
							<p className="text-zinc-400">
								The demos below compare the layer stack, invalidation patterns,
								HTTP cache headers, and stampede prevention mechanisms.
							</p>
						</div>
					),
				}}
			/>

			<div className="space-y-16">
				<DemoSection
					title="1. The Caching Layer Stack"
					description="Every request passes through multiple cache layers before hitting the database. Toggle which layers are warm and watch the request ball reveal the latency impact of each miss."
				>
					<CachingLayerStackDemo />
				</DemoSection>

				<DemoSection
					title="2. Cache Invalidation Strategies"
					description="Cache invalidation is one of the hardest problems in distributed systems. Explore the four main patterns (Cache-Aside, Write-Through, Write-Behind, Read-Through) and the fundamental trade-offs between simplicity, consistency, and speed."
				>
					<CacheInvalidationDemo />
				</DemoSection>

				<DemoSection
					title="3. HTTP Cache Headers Visualizer"
					description="HTTP headers are the contract between your server and every cache in the path — browser, CDN, and proxies. See how each header directive changes the caching behavior end-to-end."
				>
					<HttpCacheHeadersDemo />
				</DemoSection>

				<DemoSection
					title="4. Cache Stampede (Thundering Herd)"
					description="When a popular cache key expires under high traffic, every concurrent request can simultaneously miss and flood the database. See both the failure mode and two production mitigations."
				>
					<CacheStampedeDemo />
				</DemoSection>
			</div>
		</div>
	);
}
