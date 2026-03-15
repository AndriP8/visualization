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
				topic={{ label: "System Design", color: "amber" }}
				title="Caching Strategies & Layers"
				subtitle="Caching is the single highest-leverage optimization in fullstack systems. Explore how caching spans every layer from browser memory to disk, which invalidation strategy to pick, how HTTP headers control cache behavior, and what happens when caches fail under load."
				gradient={{ from: "amber-400", via: "orange-400", to: "rose-400" }}
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
