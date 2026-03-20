import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

type Algorithm = "round-robin" | "least-connections" | "consistent-hashing";

interface Server {
	id: number;
	name: string;
	activeConnections: number;
	totalProcessed: number;
}

interface Scenario {
	name: string;
	description: string;
	requestPattern: "uniform" | "variable" | "burst" | "cache-aware";
}

const SCENARIOS: Scenario[] = [
	{
		name: "Uniform Traffic",
		description: "All requests have equal duration (~1s)",
		requestPattern: "uniform",
	},
	{
		name: "Variable Durations",
		description: "Requests range from 500ms to 3s",
		requestPattern: "variable",
	},
	{
		name: "Traffic Burst",
		description: "20 requests sent simultaneously",
		requestPattern: "burst",
	},
	{
		name: "Cache-Aware Keys",
		description: "Repeated keys benefit from sticky routing",
		requestPattern: "cache-aware",
	},
];

interface AlgorithmState {
	servers: Server[];
	currentIndex: number;
	requestCount: number;
	cacheHits: number;
	keyToServerMap: Map<string, number>;
}

function simpleHash(str: string, serverCount: number): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
	}
	return Math.abs(hash) % serverCount;
}

export function ComparisonDemo() {
	const [selectedScenario, setSelectedScenario] = useState<Scenario>(
		SCENARIOS[0],
	);
	const [running, setRunning] = useState(false);
	const timeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
	const [states, setStates] = useState<Record<Algorithm, AlgorithmState>>({
		"round-robin": {
			servers: Array.from({ length: 4 }, (_, i) => ({
				id: i,
				name: `S${i + 1}`,
				activeConnections: 0,
				totalProcessed: 0,
			})),
			currentIndex: 0,
			requestCount: 0,
			cacheHits: 0,
			keyToServerMap: new Map(),
		},
		"least-connections": {
			servers: Array.from({ length: 4 }, (_, i) => ({
				id: i,
				name: `S${i + 1}`,
				activeConnections: 0,
				totalProcessed: 0,
			})),
			currentIndex: 0,
			requestCount: 0,
			cacheHits: 0,
			keyToServerMap: new Map(),
		},
		"consistent-hashing": {
			servers: Array.from({ length: 4 }, (_, i) => ({
				id: i,
				name: `S${i + 1}`,
				activeConnections: 0,
				totalProcessed: 0,
			})),
			currentIndex: 0,
			requestCount: 0,
			cacheHits: 0,
			keyToServerMap: new Map(),
		},
	});

	const getRequestDuration = (pattern: string): number => {
		switch (pattern) {
			case "uniform":
				return 1000;
			case "variable":
				return 500 + Math.random() * 2500;
			case "burst":
				return 1000 + Math.random() * 1000;
			case "cache-aware":
				return 1000;
			default:
				return 1000;
		}
	};

	const getRequestKey = (
		pattern: string,
		requestNum: number,
	): string | undefined => {
		if (pattern === "cache-aware") {
			const keys = ["user-1", "user-2", "user-3", "user-1", "user-2", "user-1"];
			return keys[requestNum % keys.length];
		}
		return undefined;
	};

	const processRequest = (
		algorithm: Algorithm,
		duration: number,
		key?: string,
	) => {
		setStates((prev) => {
			const state = { ...prev[algorithm] };
			let targetServerId: number;

			switch (algorithm) {
				case "round-robin": {
					targetServerId = state.currentIndex;
					state.currentIndex = (state.currentIndex + 1) % state.servers.length;
					break;
				}
				case "least-connections": {
					const leastLoaded = state.servers.reduce((min, s) =>
						s.activeConnections < min.activeConnections ? s : min,
					);
					targetServerId = leastLoaded.id;
					break;
				}
				case "consistent-hashing": {
					if (key) {
						targetServerId = simpleHash(key, state.servers.length);
						if (state.keyToServerMap.has(key)) {
							if (state.keyToServerMap.get(key) === targetServerId) {
								state.cacheHits++;
							}
						}
						state.keyToServerMap.set(key, targetServerId);
					} else {
						targetServerId = 0;
					}
					break;
				}
				default:
					targetServerId = 0;
			}

			state.servers[targetServerId].activeConnections++;
			state.requestCount++;

			const timeout = setTimeout(() => {
				setStates((prevStates) => {
					const newState = { ...prevStates[algorithm] };
					newState.servers[targetServerId].activeConnections--;
					newState.servers[targetServerId].totalProcessed++;
					return { ...prevStates, [algorithm]: newState };
				});
				timeoutsRef.current.delete(timeout);
			}, duration);

			timeoutsRef.current.add(timeout);

			return { ...prev, [algorithm]: state };
		});
	};

	const runScenario = async () => {
		setRunning(true);
		reset();

		const pattern = selectedScenario.requestPattern;
		const requestCount = pattern === "burst" ? 20 : 12;
		const delay = pattern === "burst" ? 50 : 400;

		for (let i = 0; i < requestCount; i++) {
			const duration = getRequestDuration(pattern);
			const key = getRequestKey(pattern, i);

			processRequest("round-robin", duration, key);
			processRequest("least-connections", duration, key);
			processRequest("consistent-hashing", duration, key);

			await new Promise((resolve) => setTimeout(resolve, delay));
		}

		const timeout = setTimeout(() => setRunning(false), 5000);
		timeoutsRef.current.add(timeout);
	};

	const reset = () => {
		setStates({
			"round-robin": {
				servers: Array.from({ length: 4 }, (_, i) => ({
					id: i,
					name: `S${i + 1}`,
					activeConnections: 0,
					totalProcessed: 0,
				})),
				currentIndex: 0,
				requestCount: 0,
				cacheHits: 0,
				keyToServerMap: new Map(),
			},
			"least-connections": {
				servers: Array.from({ length: 4 }, (_, i) => ({
					id: i,
					name: `S${i + 1}`,
					activeConnections: 0,
					totalProcessed: 0,
				})),
				currentIndex: 0,
				requestCount: 0,
				cacheHits: 0,
				keyToServerMap: new Map(),
			},
			"consistent-hashing": {
				servers: Array.from({ length: 4 }, (_, i) => ({
					id: i,
					name: `S${i + 1}`,
					activeConnections: 0,
					totalProcessed: 0,
				})),
				currentIndex: 0,
				requestCount: 0,
				cacheHits: 0,
				keyToServerMap: new Map(),
			},
		});
	};

	useEffect(() => {
		return () => {
			for (const timeout of timeoutsRef.current) {
				clearTimeout(timeout);
			}
			timeoutsRef.current.clear();
		};
	}, []);

	const calculateVariance = (servers: Server[]): number => {
		const mean =
			servers.reduce((sum, s) => sum + s.totalProcessed, 0) / servers.length;
		const variance =
			servers.reduce((sum, s) => sum + (s.totalProcessed - mean) ** 2, 0) /
			servers.length;
		return Math.sqrt(variance);
	};

	return (
		<div className="space-y-8">
			{/* Scenario Selection */}
			<div className="space-y-4">
				<div className="flex flex-wrap gap-3">
					{SCENARIOS.map((scenario) => (
						<button
							key={scenario.name}
							type="button"
							onClick={() => setSelectedScenario(scenario)}
							disabled={running}
							className={`px-4 py-2 rounded-lg font-medium transition-colors ${
								selectedScenario.name === scenario.name
									? "bg-indigo-600 text-white"
									: "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
							} disabled:opacity-50 disabled:cursor-not-allowed`}
						>
							{scenario.name}
						</button>
					))}
				</div>
				<p className="text-sm text-zinc-400">{selectedScenario.description}</p>
			</div>

			{/* Controls */}
			<div className="flex gap-3">
				<button
					type="button"
					onClick={runScenario}
					disabled={running}
					className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
				>
					{running ? "Running..." : "Run Scenario"}
				</button>
				<button
					type="button"
					onClick={reset}
					disabled={running}
					className="px-4 py-3 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
				>
					Reset
				</button>
			</div>

			{/* Split-Screen Comparison */}
			<div className="grid md:grid-cols-3 gap-6">
				{(
					["round-robin", "least-connections", "consistent-hashing"] as const
				).map((algorithm) => {
					const state = states[algorithm];
					const maxProcessed = Math.max(
						...state.servers.map((s) => s.totalProcessed),
						1,
					);
					const variance = calculateVariance(state.servers);

					const algorithmConfig: Record<
						Algorithm,
						{ title: string; color: string; bgColor: string }
					> = {
						"round-robin": {
							title: "Round-Robin",
							color: "violet",
							bgColor: "bg-violet-500/20",
						},
						"least-connections": {
							title: "Least Connections",
							color: "cyan",
							bgColor: "bg-cyan-500/20",
						},
						"consistent-hashing": {
							title: "Consistent Hashing",
							color: "amber",
							bgColor: "bg-amber-500/20",
						},
					};

					const config = algorithmConfig[algorithm];

					return (
						<div
							key={algorithm}
							className="bg-zinc-900 border border-zinc-800 rounded-xl p-6"
						>
							<h3 className="font-semibold text-white mb-4">{config.title}</h3>

							{/* Servers */}
							<div className="space-y-3 mb-6">
								{state.servers.map((server) => (
									<div key={server.id} className="space-y-2">
										<div className="flex justify-between text-sm">
											<span className="text-zinc-400">{server.name}</span>
											<span className="text-white font-mono">
												{server.totalProcessed}
											</span>
										</div>
										<div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
											<motion.div
												className={`h-full ${config.bgColor.replace("/20", "")}`}
												initial={{ width: 0 }}
												animate={{
													width: `${(server.totalProcessed / maxProcessed) * 100}%`,
												}}
												transition={{ duration: 0.3 }}
											/>
										</div>
										<div className="flex justify-between text-xs text-zinc-500">
											<span>Active: {server.activeConnections}</span>
										</div>
									</div>
								))}
							</div>

							{/* Metrics */}
							<div
								className={`${config.bgColor} border border-${config.color}-500/30 rounded-lg p-4 space-y-2`}
							>
								<div className="flex justify-between text-sm">
									<span className="text-zinc-400">Total Requests:</span>
									<span className="text-white font-mono">
										{state.requestCount}
									</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-zinc-400">Variance:</span>
									<span className="text-white font-mono">
										{variance.toFixed(2)}
									</span>
								</div>
								{algorithm === "consistent-hashing" &&
									selectedScenario.requestPattern === "cache-aware" && (
										<div className="flex justify-between text-sm">
											<span className="text-zinc-400">Cache Hits:</span>
											<span className="text-emerald-400 font-mono">
												{state.cacheHits}
											</span>
										</div>
									)}
							</div>
						</div>
					);
				})}
			</div>

			{/* Trade-off Matrix */}
			<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
				<h3 className="font-semibold text-white mb-4">
					Algorithm Trade-offs Matrix
				</h3>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-zinc-800">
								<th className="text-left py-3 px-4 text-zinc-400 font-medium">
									Algorithm
								</th>
								<th className="text-center py-3 px-4 text-zinc-400 font-medium">
									Simplicity
								</th>
								<th className="text-center py-3 px-4 text-zinc-400 font-medium">
									Load Awareness
								</th>
								<th className="text-center py-3 px-4 text-zinc-400 font-medium">
									Cache Affinity
								</th>
								<th className="text-center py-3 px-4 text-zinc-400 font-medium">
									Failover
								</th>
							</tr>
						</thead>
						<tbody>
							<tr className="border-b border-zinc-800">
								<td className="py-3 px-4 text-white">Round-Robin</td>
								<td className="text-center py-3 px-4">⭐⭐⭐</td>
								<td className="text-center py-3 px-4">❌</td>
								<td className="text-center py-3 px-4">❌</td>
								<td className="text-center py-3 px-4">⭐⭐</td>
							</tr>
							<tr className="border-b border-zinc-800">
								<td className="py-3 px-4 text-white">Least Connections</td>
								<td className="text-center py-3 px-4">⭐⭐</td>
								<td className="text-center py-3 px-4">⭐⭐⭐</td>
								<td className="text-center py-3 px-4">❌</td>
								<td className="text-center py-3 px-4">⭐⭐⭐</td>
							</tr>
							<tr className="border-b border-zinc-800">
								<td className="py-3 px-4 text-white">Weighted Round-Robin</td>
								<td className="text-center py-3 px-4">⭐⭐</td>
								<td className="text-center py-3 px-4">⭐⭐</td>
								<td className="text-center py-3 px-4">❌</td>
								<td className="text-center py-3 px-4">⭐⭐</td>
							</tr>
							<tr>
								<td className="py-3 px-4 text-white">Consistent Hashing</td>
								<td className="text-center py-3 px-4">⭐</td>
								<td className="text-center py-3 px-4">❌</td>
								<td className="text-center py-3 px-4">⭐⭐⭐</td>
								<td className="text-center py-3 px-4">⭐⭐⭐</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>

			{/* Decision Tree */}
			<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
				<h3 className="font-semibold text-white mb-4 flex items-center gap-2">
					<span>🌳</span>
					Decision Tree: Which Algorithm to Use?
				</h3>
				<div className="space-y-3 text-sm">
					<div className="flex items-start gap-3">
						<div className="text-emerald-400 font-bold min-w-[20px]">→</div>
						<div>
							<span className="font-medium text-white">
								Need cache affinity (sticky sessions)?
							</span>
							<span className="text-zinc-400 ml-2">→ Consistent Hashing</span>
						</div>
					</div>
					<div className="flex items-start gap-3">
						<div className="text-cyan-400 font-bold min-w-[20px]">→</div>
						<div>
							<span className="font-medium text-white">
								Variable request durations?
							</span>
							<span className="text-zinc-400 ml-2">→ Least Connections</span>
						</div>
					</div>
					<div className="flex items-start gap-3">
						<div className="text-rose-400 font-bold min-w-[20px]">→</div>
						<div>
							<span className="font-medium text-white">
								Heterogeneous server capacities?
							</span>
							<span className="text-zinc-400 ml-2">→ Weighted Round-Robin</span>
						</div>
					</div>
					<div className="flex items-start gap-3">
						<div className="text-violet-400 font-bold min-w-[20px]">→</div>
						<div>
							<span className="font-medium text-white">
								Simple, stateless APIs?
							</span>
							<span className="text-zinc-400 ml-2">→ Round-Robin</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
