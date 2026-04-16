import { createFileRoute } from "@tanstack/react-router";
import { ComparisonDemo } from "../components/load-balancing/ComparisonDemo";
import { ConsistentHashingDemo } from "../components/load-balancing/ConsistentHashingDemo";
import { LeastConnectionsDemo } from "../components/load-balancing/LeastConnectionsDemo";
import { RoundRobinDemo } from "../components/load-balancing/RoundRobinDemo";
import { WeightedRoundRobinDemo } from "../components/load-balancing/WeightedRoundRobinDemo";
import { DemoSection } from "../components/shared/DemoSection";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/load-balancing")({
	component: LoadBalancingPage,
});

function LoadBalancingPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-12 pb-20">
			<PageHeader
				topic={{ label: "System Design", color: "amber" }}
				title="Load Balancing Strategies"
				subtitle="How distributed systems route requests across multiple servers to maximize throughput and reliability."
				gradient={{ from: "amber-400", via: "orange-400", to: "rose-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								All load balancing algorithms share one goal: distribute traffic
								across a server pool to avoid overloading any single instance.
								The differentiator is how each algorithm handles{" "}
								<span className="text-amber-300 font-medium">
									uneven request cost
								</span>
								. Round-robin treats all requests as equal — fair but blind to
								slow requests that hold connections. Least-connections routes to
								the server doing the least work, adapting to variable request
								duration.
							</p>
							<p>
								<span className="text-orange-300 font-medium">
									Consistent hashing
								</span>{" "}
								solves a different problem: when servers are added or removed, a
								naive hash remaps ~all keys, invalidating caches and causing
								thundering herd. A hash ring minimizes remapping to ~1/N of
								keys, making it the standard for stateful services like caches
								and sharded databases.
							</p>
							<p className="text-zinc-400">
								The demos below cover round-robin, least connections, weighted
								round-robin, consistent hashing, and a side-by-side strategy
								comparison.
							</p>
						</div>
					),
				}}
			/>
			<DemoSection
				title="Round-Robin Algorithm"
				description="Distributes requests sequentially across servers in rotation. Simple and fair, but treats all servers equally regardless of current load."
			>
				<RoundRobinDemo />
			</DemoSection>

			<DemoSection
				title="Least Connections Algorithm"
				description="Routes requests to the server with the fewest active connections. Handles variable request durations better than round-robin."
			>
				<LeastConnectionsDemo />
			</DemoSection>

			<DemoSection
				title="Weighted Round-Robin"
				description="Extends round-robin by assigning capacity weights to servers. Higher-capacity servers receive proportionally more requests."
			>
				<WeightedRoundRobinDemo />
			</DemoSection>

			<DemoSection
				title="Consistent Hashing"
				description="Maps requests to servers using a hash ring. Minimizes cache invalidation when servers are added or removed — only ~1/N keys need remapping."
			>
				<ConsistentHashingDemo />
			</DemoSection>

			<DemoSection
				title="Strategy Comparison"
				description="See all algorithms side-by-side handling the same traffic patterns. Compare metrics and understand trade-offs."
			>
				<ComparisonDemo />
			</DemoSection>
		</div>
	);
}
