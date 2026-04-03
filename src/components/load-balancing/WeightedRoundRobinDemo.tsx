import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { ShikiCode } from "../shared/ShikiCode";
import { getNextWeightedRoundRobin } from "./load-balancing";

interface Server {
	id: number;
	name: string;
	weight: number;
	requestCount: number;
	capacity: string;
}

interface Request {
	id: number;
	targetServerId: number;
}

export function WeightedRoundRobinDemo() {
	const [servers, setServers] = useState<Server[]>([
		{ id: 1, name: "Server 1", weight: 1, requestCount: 0, capacity: "Small" },
		{
			id: 2,
			name: "Server 2",
			weight: 2,
			requestCount: 0,
			capacity: "Medium",
		},
		{ id: 3, name: "Server 3", weight: 3, requestCount: 0, capacity: "Large" },
		{
			id: 4,
			name: "Server 4",
			weight: 2,
			requestCount: 0,
			capacity: "Medium",
		},
	]);
	const [requests, setRequests] = useState<Request[]>([]);
	const [currentWeightIndex, setCurrentWeightIndex] = useState(0);
	const serversRef = useRef(servers);
	serversRef.current = servers;
	const currentWeightIndexRef = useRef(currentWeightIndex);
	currentWeightIndexRef.current = currentWeightIndex;
	const requestIdRef = useRef(0);
	const batchTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
	const completionTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

	const buildWeightedSequenceForDisplay = (): {
		serverId: number;
		key: string;
	}[] => {
		const sequence: { serverId: number; key: string }[] = [];
		for (const server of servers) {
			for (let i = 0; i < server.weight; i++) {
				sequence.push({ serverId: server.id, key: `${server.id}-${i}` });
			}
		}
		return sequence;
	};

	const sendRequest = useCallback(() => {
		const liveServers = serversRef.current;
		const result = getNextWeightedRoundRobin(
			liveServers,
			currentWeightIndexRef.current,
		);
		if (!result) return;

		const serverId = result.server.id;
		const id = requestIdRef.current++;

		const newRequest: Request = {
			id,
			targetServerId: serverId,
		};

		setRequests((prev) => [...prev, newRequest]);

		const timer = setTimeout(() => {
			setServers((prev) =>
				prev.map((s) =>
					s.id === serverId ? { ...s, requestCount: s.requestCount + 1 } : s,
				),
			);
			setRequests((prev) => prev.filter((r) => r.id !== id));
		}, 800);
		completionTimers.current.push(timer);

		currentWeightIndexRef.current = result.nextIndex;
		setCurrentWeightIndex(result.nextIndex);
	}, []);

	const sendBatchRequests = () => {
		for (const t of batchTimers.current) clearTimeout(t);
		batchTimers.current = [];

		for (let i = 0; i < 15; i++) {
			const t = setTimeout(() => sendRequest(), i * 150);
			batchTimers.current.push(t);
		}
	};

	const updateWeight = (serverId: number, delta: number) => {
		setServers((prev) =>
			prev.map((s) =>
				s.id === serverId
					? { ...s, weight: Math.max(1, Math.min(5, s.weight + delta)) }
					: s,
			),
		);
	};

	const reset = () => {
		for (const t of batchTimers.current) clearTimeout(t);
		for (const t of completionTimers.current) clearTimeout(t);
		batchTimers.current = [];
		completionTimers.current = [];
		setServers((prev) => prev.map((s) => ({ ...s, requestCount: 0 })));
		currentWeightIndexRef.current = 0;
		setCurrentWeightIndex(0);
		requestIdRef.current = 0;
		setRequests([]);
	};

	const totalWeight = servers.reduce((sum, s) => sum + s.weight, 0);
	const maxRequests = Math.max(...servers.map((s) => s.requestCount), 1);

	return (
		<div className="space-y-8">
			{/* Controls */}
			<div className="flex flex-wrap gap-3">
				<button
					type="button"
					onClick={sendRequest}
					className="px-4 py-2 bg-rose-600 hover:bg-rose-700 rounded-lg font-medium transition-colors"
				>
					Send Request
				</button>
				<button
					type="button"
					onClick={sendBatchRequests}
					className="px-4 py-2 bg-rose-600/80 hover:bg-rose-700/80 rounded-lg font-medium transition-colors"
				>
					Send 15 Requests
				</button>
				<button
					type="button"
					onClick={reset}
					className="px-4 py-2 bg-surface-tertiary hover:bg-surface-tertiary rounded-lg font-medium transition-colors"
				>
					Reset
				</button>
			</div>

			{/* Visualization */}
			<div className="bg-surface-primary border border-border-primary rounded-xl p-8">
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
					{servers.map((server) => {
						const activeRequests = requests.filter(
							(r) => r.targetServerId === server.id,
						);
						const expectedRatio = (server.weight / totalWeight) * 100;
						const actualRatio =
							servers.reduce((sum, s) => sum + s.requestCount, 0) > 0
								? (server.requestCount /
										servers.reduce((sum, s) => sum + s.requestCount, 0)) *
									100
								: 0;

						return (
							<div key={server.id} className="relative">
								<motion.div className="border-2 border-border-secondary rounded-lg p-4 bg-surface-secondary">
									<h4 className="font-semibold text-text-primary mb-3">
										{server.name}
									</h4>

									<div className="space-y-3">
										{/* Capacity/Weight Control */}
										<div>
											<div className="flex items-center justify-between mb-2">
												<span className="text-xs text-text-tertiary">
													Capacity Weight
												</span>
												<div className="flex items-center gap-1">
													<button
														type="button"
														onClick={() => updateWeight(server.id, -1)}
														disabled={server.weight <= 1}
														className="w-6 h-6 bg-surface-tertiary hover:bg-surface-tertiary disabled:opacity-30 disabled:cursor-not-allowed rounded text-sm font-bold"
													>
														−
													</button>
													<span className="w-8 text-center font-mono text-accent-rose-soft font-bold">
														{server.weight}
													</span>
													<button
														type="button"
														onClick={() => updateWeight(server.id, 1)}
														disabled={server.weight >= 5}
														className="w-6 h-6 bg-surface-tertiary hover:bg-surface-tertiary disabled:opacity-30 disabled:cursor-not-allowed rounded text-sm font-bold"
													>
														+
													</button>
												</div>
											</div>
											<div className="h-2 bg-surface-primary rounded-full overflow-hidden">
												<div
													className="h-full bg-rose-500"
													style={{ width: `${(server.weight / 5) * 100}%` }}
												/>
											</div>
										</div>

										{/* Request Count */}
										<div className="flex justify-between text-sm text-text-tertiary">
											<span>Requests:</span>
											<span className="text-text-primary font-mono">
												{server.requestCount}
											</span>
										</div>

										{/* Distribution Bar */}
										<div>
											<div className="flex justify-between text-xs text-text-muted mb-1">
												<span>Actual</span>
												<span>{actualRatio.toFixed(1)}%</span>
											</div>
											<div className="h-3 bg-surface-primary rounded-full overflow-hidden">
												<motion.div
													className="h-full bg-rose-400"
													initial={{ width: 0 }}
													animate={{
														width: `${(server.requestCount / maxRequests) * 100}%`,
													}}
													transition={{ duration: 0.3 }}
												/>
											</div>
										</div>

										{/* Expected Ratio */}
										<div className="text-xs text-text-muted">
											Expected: {expectedRatio.toFixed(1)}%
										</div>
									</div>
								</motion.div>

								{/* Animated requests */}
								<AnimatePresence>
									{activeRequests.map((req) => (
										<motion.div
											key={req.id}
											className="absolute -top-8 left-1/2 -translate-x-1/2 w-8 h-8 bg-rose-500 rounded-full shadow-lg shadow-rose-500/50"
											initial={{ y: -60, opacity: 0, scale: 0 }}
											animate={{ y: 0, opacity: 1, scale: 1 }}
											exit={{ opacity: 0, scale: 0.5 }}
											transition={{ duration: 0.6 }}
										/>
									))}
								</AnimatePresence>
							</div>
						);
					})}
				</div>

				{/* Weight Sequence Visualization */}
				<div className="mt-6 pt-6 border-t border-border-primary">
					<div className="text-sm text-text-tertiary mb-3">
						Request Distribution Sequence (Total Weight: {totalWeight}):
					</div>
					<div className="flex flex-wrap gap-2">
						{buildWeightedSequenceForDisplay().map((item, idx) => {
							const server = servers.find((s) => s.id === item.serverId);
							const isCurrent = idx === currentWeightIndex % totalWeight;

							return (
								<motion.div
									key={item.key}
									className={`px-3 py-1 rounded text-sm font-medium transition-all ${
										isCurrent
											? "bg-rose-500 text-text-primary ring-2 ring-rose-400"
											: "bg-surface-secondary text-text-tertiary"
									}`}
									animate={{
										scale: isCurrent ? 1.1 : 1,
									}}
								>
									{server?.name}
								</motion.div>
							);
						})}
					</div>
				</div>
			</div>

			{/* Code Example */}
			<ShikiCode
				language="javascript"
				code={`class WeightedRoundRobinBalancer {
  constructor(servers) {
    this.servers = servers; // [{ name, weight }, ...]
    this.currentIndex = 0;
    this.sequence = this.buildSequence();
  }

  buildSequence() {
    const sequence = [];
    for (const server of this.servers) {
      // Add server to sequence 'weight' times
      for (let i = 0; i < server.weight; i++) {
        sequence.push(server);
      }
    }
    return sequence;
  }

  getNext() {
    const server = this.sequence[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.sequence.length;
    return server;
  }
}

// Example usage:
const servers = [
  { name: "small-server", weight: 1 },
  { name: "medium-server", weight: 2 },
  { name: "large-server", weight: 3 }
];

const balancer = new WeightedRoundRobinBalancer(servers);
// Sequence: [small, medium, medium, large, large, large]
// 6 requests distributed as: 1:2:3 ratio
`}
				showLineNumbers={true}
				className="text-sm"
			/>

			{/* Use Case Callout */}
			<div className="bg-surface-primary border border-border-primary rounded-lg p-6">
				<h4 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
					<span>🎯</span>
					When to Use Weighted Round-Robin
				</h4>
				<div className="space-y-3 text-sm text-text-secondary">
					<p>
						<span className="font-medium text-accent-rose-soft">
							Ideal for:
						</span>{" "}
						Heterogeneous server capacities where you know the relative
						performance of each server ahead of time.
					</p>
					<p>
						<span className="font-medium text-accent-rose-soft">Example:</span>{" "}
						A cluster with mixed instance types (e.g., 2 large instances, 3
						medium instances, 1 small instance). Assign weights proportional to
						CPU/RAM capacity.
					</p>
					<p>
						<span className="font-medium text-accent-rose-soft">
							Trade-off:
						</span>{" "}
						Better than simple round-robin for heterogeneous clusters, but still
						doesn't adapt to real-time load like Least Connections.
					</p>
				</div>
			</div>
		</div>
	);
}
