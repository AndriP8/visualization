import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { CacheInvalidationDemo } from "../components/caching-strategies/CacheInvalidationDemo";
import { CacheStampedeDemo } from "../components/caching-strategies/CacheStampedeDemo";
import { CachingLayerStackDemo } from "../components/caching-strategies/CachingLayerStackDemo";
import { HttpCacheHeadersDemo } from "../components/caching-strategies/HttpCacheHeadersDemo";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/caching-strategies")({
	component: CachingStrategiesPage,
});

function CachingStrategiesPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-8">
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

			{/* Demos */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.2, duration: 0.4 }}
				className="space-y-8"
			>
				<CachingLayerStackDemo />
				<CacheInvalidationDemo />
				<HttpCacheHeadersDemo />
				<CacheStampedeDemo />
			</motion.div>
		</div>
	);
}
