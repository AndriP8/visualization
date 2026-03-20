import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { ShikiCode } from "../shared/ShikiCode";
import { getNextRoundRobin } from "./load-balancing";

interface Server {
	id: number;
	name: string;
	healthy: boolean;
	requestCount: number;
}

interface Request {
	id: number;
	targetServerId: number;
}

export function RoundRobinDemo() {
	const [servers, setServers] = useState<Server[]>([
		{ id: 1, name: "Server 1", healthy: true, requestCount: 0 },
		{ id: 2, name: "Server 2", healthy: true, requestCount: 0 },
		{ id: 3, name: "Server 3", healthy: true, requestCount: 0 },
		{ id: 4, name: "Server 4", healthy: true, requestCount: 0 },
	]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [requests, setRequests] = useState<Request[]>([]);
	const batchTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
	const completionTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
	const serversRef = useRef(servers);
	serversRef.current = servers;
	const currentIndexRef = useRef(currentIndex);
	currentIndexRef.current = currentIndex;
	const requestIdRef = useRef(0);

	const sendRequest = useCallback(() => {
		const liveServers = serversRef.current;
		const result = getNextRoundRobin(liveServers, currentIndexRef.current);
		if (!result) return;

		const nextIndex = result.serverIndex;

		const id = requestIdRef.current++;
		const targetServer = liveServers[nextIndex];

		const newRequest: Request = {
			id,
			targetServerId: targetServer.id,
		};

		setRequests((prev) => [...prev, newRequest]);

		const timer = setTimeout(() => {
			setServers((prev) =>
				prev.map((s) =>
					s.id === targetServer.id
						? { ...s, requestCount: s.requestCount + 1 }
						: s,
				),
			);
			setRequests((prev) => prev.filter((r) => r.id !== id));
		}, 800);
		completionTimers.current.push(timer);

		currentIndexRef.current = result.nextIndex;
		setCurrentIndex(result.nextIndex);
	}, []);

	const sendBatchRequests = () => {
		for (const t of batchTimers.current) clearTimeout(t);
		batchTimers.current = [];
		setRequests([]);

		for (let i = 0; i < 10; i++) {
			const t = setTimeout(() => sendRequest(), i * 150);
			batchTimers.current.push(t);
		}
	};

	const toggleHealth = (serverId: number) => {
		setServers((prev) =>
			prev.map((s) => (s.id === serverId ? { ...s, healthy: !s.healthy } : s)),
		);
	};

	const reset = () => {
		for (const t of batchTimers.current) clearTimeout(t);
		for (const t of completionTimers.current) clearTimeout(t);
		batchTimers.current = [];
		completionTimers.current = [];
		setServers((prev) =>
			prev.map((s) => ({ ...s, requestCount: 0, healthy: true })),
		);
		currentIndexRef.current = 0;
		setCurrentIndex(0);
		requestIdRef.current = 0;
		setRequests([]);
	};

	return (
		<div className="space-y-8">
			{/* Controls */}
			<div className="flex flex-wrap gap-3">
				<button
					type="button"
					onClick={sendRequest}
					className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg font-medium transition-colors"
				>
					Send Request
				</button>
				<button
					type="button"
					onClick={sendBatchRequests}
					className="px-4 py-2 bg-violet-600/80 hover:bg-violet-700/80 rounded-lg font-medium transition-colors"
				>
					Send 10 Requests
				</button>
				<button
					type="button"
					onClick={reset}
					className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium transition-colors"
				>
					Reset
				</button>
			</div>

			{/* Visualization */}
			<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
					{servers.map((server, index) => {
						const isNext = index === currentIndex;
						const activeRequests = requests.filter(
							(r) => r.targetServerId === server.id,
						);

						return (
							<div key={server.id} className="relative">
								<motion.div
									className={`border-2 rounded-lg p-4 transition-all ${
										server.healthy
											? "border-emerald-500 bg-zinc-800"
											: "border-red-500 bg-zinc-800/50"
									} ${isNext && server.healthy ? "ring-2 ring-violet-400" : ""}`}
									animate={{
										scale: isNext && server.healthy ? 1.05 : 1,
									}}
								>
									<div className="flex items-center justify-between mb-3">
										<h4 className="font-semibold text-white">{server.name}</h4>
										<button
											type="button"
											onClick={() => toggleHealth(server.id)}
											className={`w-3 h-3 rounded-full transition-colors ${
												server.healthy ? "bg-emerald-400" : "bg-red-400"
											}`}
											title={
												server.healthy
													? "Click to mark unhealthy"
													: "Click to mark healthy"
											}
										/>
									</div>

									<div className="space-y-2 text-sm text-zinc-400">
										<div className="flex justify-between">
											<span>Requests:</span>
											<span className="text-white font-mono">
												{server.requestCount}
											</span>
										</div>
										<div className="flex justify-between">
											<span>Status:</span>
											<span
												className={
													server.healthy ? "text-emerald-400" : "text-red-400"
												}
											>
												{server.healthy ? "Healthy" : "Unhealthy"}
											</span>
										</div>
									</div>

									{isNext && server.healthy && (
										<div className="mt-3 pt-3 border-t border-zinc-700">
											<span className="text-xs text-violet-400 font-medium">
												← Next in rotation
											</span>
										</div>
									)}
								</motion.div>

								{/* Animated requests */}
								<AnimatePresence>
									{activeRequests.map((req) => (
										<motion.div
											key={req.id}
											className="absolute -top-8 left-1/2 -translate-x-1/2 w-8 h-8 bg-violet-500 rounded-full shadow-lg shadow-violet-500/50"
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

				{/* Next pointer indicator */}
				<div className="mt-6 pt-6 border-t border-zinc-800">
					<div className="flex items-center gap-2 text-sm text-zinc-400">
						<span className="font-medium text-violet-400">Current Index:</span>
						<span className="font-mono text-white">{currentIndex}</span>
						<span className="mx-2">→</span>
						<span>
							{servers[currentIndex]?.healthy
								? servers[currentIndex].name
								: "Skipping to next healthy server"}
						</span>
					</div>
				</div>
			</div>

			{/* Code Example */}
			<ShikiCode
				language="javascript"
				code={`class RoundRobinBalancer {
  constructor(servers) {
    this.servers = servers;
    this.current = 0;
  }

  getNext() {
    const server = this.servers[this.current];
    this.current = (this.current + 1) % this.servers.length;
    return server;
  }

  // With health checks
  getNextHealthy() {
    let attempts = 0;
    while (attempts < this.servers.length) {
      const server = this.servers[this.current];
      this.current = (this.current + 1) % this.servers.length;

      if (server.healthy) return server;
      attempts++;
    }
    throw new Error("No healthy servers available");
  }
}`}
				showLineNumbers={true}
				className="text-sm"
			/>

			{/* Insight Box */}
			<div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
				<div className="flex items-start gap-3">
					<div className="text-2xl">💡</div>
					<div>
						<h4 className="font-semibold text-amber-300 mb-1">Key Insight</h4>
						<p className="text-sm text-zinc-300">
							Simple and fair distribution, but ignores server load — all
							healthy servers are treated equally. A fast server and a slow
							server receive the same number of requests.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
