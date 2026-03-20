import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ShikiCode } from "../shared/ShikiCode";
import { getLeastConnected } from "./load-balancing";

interface Server {
	id: number;
	name: string;
	activeConnections: number;
	totalProcessed: number;
}

interface Connection {
	id: number;
	serverId: number;
	duration: number;
	startTime: number;
}

export function LeastConnectionsDemo() {
	const [servers, setServers] = useState<Server[]>([
		{ id: 1, name: "Server 1", activeConnections: 0, totalProcessed: 0 },
		{ id: 2, name: "Server 2", activeConnections: 0, totalProcessed: 0 },
		{ id: 3, name: "Server 3", activeConnections: 0, totalProcessed: 0 },
		{ id: 4, name: "Server 4", activeConnections: 0, totalProcessed: 0 },
	]);
	const [connections, setConnections] = useState<Connection[]>([]);
	const [longRequestMode, setLongRequestMode] = useState(false);
	const sessionRef = useRef(0);
	const serversRef = useRef(servers);
	serversRef.current = servers;
	const connectionsRef = useRef(connections);
	connectionsRef.current = connections;
	const connectionIdRef = useRef(0);
	const longRequestModeRef = useRef(longRequestMode);
	longRequestModeRef.current = longRequestMode;
	const batchTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

	useEffect(() => {
		const session = sessionRef.current;
		const interval = setInterval(() => {
			if (sessionRef.current !== session) return;
			const now = Date.now();
			const liveConnections = connectionsRef.current;
			const completedConnections = liveConnections.filter(
				(conn) => now - conn.startTime >= conn.duration,
			);

			if (completedConnections.length > 0) {
				setConnections((prev) =>
					prev.filter(
						(conn) => !completedConnections.some((c) => c.id === conn.id),
					),
				);

				setServers((prev) =>
					prev.map((server) => {
						const completed = completedConnections.filter(
							(c) => c.serverId === server.id,
						).length;
						if (completed > 0) {
							return {
								...server,
								activeConnections: server.activeConnections - completed,
								totalProcessed: server.totalProcessed + completed,
							};
						}
						return server;
					}),
				);
			}
		}, 100);

		return () => clearInterval(interval);
	}, []);

	const sendRequest = useCallback(() => {
		const liveServers = serversRef.current;
		const leastLoadedServer = getLeastConnected(liveServers);
		if (!leastLoadedServer) return;

		const duration = longRequestModeRef.current
			? 3000 + Math.random() * 2000
			: 1500 + Math.random() * 1000;

		const id = connectionIdRef.current++;

		const newConnection: Connection = {
			id,
			serverId: leastLoadedServer.id,
			duration,
			startTime: Date.now(),
		};

		setConnections((prev) => [...prev, newConnection]);

		setServers((prev) =>
			prev.map((s) =>
				s.id === leastLoadedServer.id
					? { ...s, activeConnections: s.activeConnections + 1 }
					: s,
			),
		);
	}, []);

	const sendBatchRequests = () => {
		for (const t of batchTimers.current) clearTimeout(t);
		batchTimers.current = [];

		for (let i = 0; i < 10; i++) {
			const t = setTimeout(() => sendRequest(), i * 200);
			batchTimers.current.push(t);
		}
	};

	const reset = () => {
		for (const t of batchTimers.current) clearTimeout(t);
		batchTimers.current = [];
		sessionRef.current += 1;
		connectionIdRef.current = 0;
		setConnections([]);
		setServers((prev) =>
			prev.map((s) => ({ ...s, activeConnections: 0, totalProcessed: 0 })),
		);
	};

	const maxConnections = Math.max(
		...servers.map((s) => s.activeConnections),
		1,
	);

	return (
		<div className="space-y-8">
			{/* Controls */}
			<div className="flex flex-wrap gap-3 items-center">
				<button
					type="button"
					onClick={sendRequest}
					className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-medium transition-colors"
				>
					Send Request
				</button>
				<button
					type="button"
					onClick={sendBatchRequests}
					className="px-4 py-2 bg-cyan-600/80 hover:bg-cyan-700/80 rounded-lg font-medium transition-colors"
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
				<label className="flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-lg cursor-pointer">
					<input
						type="checkbox"
						checked={longRequestMode}
						onChange={(e) => setLongRequestMode(e.target.checked)}
						className="w-4 h-4 rounded accent-cyan-500"
					/>
					<span className="text-sm font-medium">Long Request Mode</span>
				</label>
			</div>

			{/* Visualization */}
			<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
					{servers.map((server) => {
						const isLeastLoaded =
							server.activeConnections ===
							Math.min(...servers.map((s) => s.activeConnections));
						const serverConnections = connections.filter(
							(c) => c.serverId === server.id,
						);

						return (
							<motion.div
								key={server.id}
								className={`border-2 rounded-lg p-4 transition-all ${
									isLeastLoaded
										? "border-cyan-500 ring-2 ring-cyan-400/50"
										: "border-zinc-700"
								} bg-zinc-800`}
								animate={{
									scale: isLeastLoaded ? 1.05 : 1,
								}}
							>
								<h4 className="font-semibold text-white mb-4">{server.name}</h4>

								<div className="space-y-3">
									{/* Active Connections Bar */}
									<div>
										<div className="flex justify-between text-xs text-zinc-400 mb-1">
											<span>Active</span>
											<span className="font-mono text-white">
												{server.activeConnections}
											</span>
										</div>
										<div className="h-3 bg-zinc-900 rounded-full overflow-hidden">
											<motion.div
												className="h-full bg-cyan-400"
												initial={{ width: 0 }}
												animate={{
													width: `${(server.activeConnections / maxConnections) * 100}%`,
												}}
												transition={{ duration: 0.3 }}
											/>
										</div>
									</div>

									{/* Total Processed */}
									<div className="flex justify-between text-sm text-zinc-400">
										<span>Processed:</span>
										<span className="text-white font-mono">
											{server.totalProcessed}
										</span>
									</div>

									{/* Connection Pills */}
									<div className="min-h-10 space-y-1">
										<AnimatePresence>
											{serverConnections.slice(0, 3).map((conn) => {
												const elapsed = Date.now() - conn.startTime;
												const progress = Math.min(elapsed / conn.duration, 1);

												return (
													<motion.div
														key={conn.id}
														className="h-2 bg-cyan-500/30 rounded-full overflow-hidden"
														initial={{ opacity: 0, scale: 0.8 }}
														animate={{ opacity: 1, scale: 1 }}
														exit={{ opacity: 0, scale: 0.8 }}
													>
														<motion.div
															className="h-full bg-cyan-500"
															style={{ width: `${progress * 100}%` }}
														/>
													</motion.div>
												);
											})}
										</AnimatePresence>
									</div>
								</div>

								{isLeastLoaded && (
									<div className="mt-3 pt-3 border-t border-zinc-700">
										<span className="text-xs text-cyan-400 font-medium">
											← Least loaded
										</span>
									</div>
								)}
							</motion.div>
						);
					})}
				</div>

				{/* Stats Summary */}
				<div className="mt-6 pt-6 border-t border-zinc-800 grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
					{servers.map((server) => (
						<div key={server.id} className="text-center">
							<div className="text-zinc-400">{server.name}</div>
							<div className="text-2xl font-mono text-white mt-1">
								{server.activeConnections}
							</div>
							<div className="text-xs text-zinc-500">active connections</div>
						</div>
					))}
				</div>
			</div>

			{/* Code Example */}
			<ShikiCode
				language="javascript"
				code={`class LeastConnectionsBalancer {
  constructor(servers) {
    this.servers = servers;
  }

  getNext() {
    // Find server with minimum active connections
    return this.servers.reduce((min, server) =>
      server.activeConnections < min.activeConnections
        ? server
        : min
    );
  }

  handleRequest(request) {
    const server = this.getNext();
    server.activeConnections++;

    request.on("complete", () => {
      server.activeConnections--;
    });

    return server;
  }
}`}
				showLineNumbers={true}
				className="text-sm"
			/>

			{/* Comparison Callout */}
			<div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
				<h4 className="font-semibold text-white mb-3 flex items-center gap-2">
					<span>⚖️</span>
					Comparison: Round-Robin vs Least Connections
				</h4>
				<div className="grid md:grid-cols-2 gap-4 text-sm">
					<div>
						<div className="font-medium text-violet-400 mb-2">Round-Robin</div>
						<p className="text-zinc-400">
							With variable request durations, some servers may have many
							slow-running requests while others sit idle after quick requests.
						</p>
					</div>
					<div>
						<div className="font-medium text-cyan-400 mb-2">
							Least Connections
						</div>
						<p className="text-zinc-400">
							Automatically balances load by routing to less-busy servers.
							Handles variable durations gracefully.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
