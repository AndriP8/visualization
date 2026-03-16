import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { match } from "ts-pattern";
import { ShikiCode } from "../shared/ShikiCode";

type Strategy =
	| "polling"
	| "long-polling"
	| "sse"
	| "websocket"
	| "graphql-sub";

interface NetworkActivity {
	id: number;
	timestamp: number;
	type: "request" | "response" | "push";
	bytes: number;
	strategy: Strategy;
}

interface StrategyDef {
	id: Strategy;
	label: string;
	icon: string;
	color: string;
	latency: string;
	bandwidth: string;
	complexity: string;
}

const STRATEGIES: StrategyDef[] = [
	{
		id: "polling",
		label: "Polling",
		icon: "🔄",
		color: "rose",
		latency: "5s avg",
		bandwidth: "High",
		complexity: "Simple",
	},
	{
		id: "long-polling",
		label: "Long Polling",
		icon: "⏳",
		color: "amber",
		latency: "1-2s avg",
		bandwidth: "Medium",
		complexity: "Medium",
	},
	{
		id: "sse",
		label: "Server-Sent Events",
		icon: "📡",
		color: "cyan",
		latency: "<100ms",
		bandwidth: "Low",
		complexity: "Simple",
	},
	{
		id: "websocket",
		label: "WebSocket",
		icon: "⚡",
		color: "green",
		latency: "<50ms",
		bandwidth: "Lowest",
		complexity: "Complex",
	},
	{
		id: "graphql-sub",
		label: "GraphQL Subs",
		icon: "◈",
		color: "violet",
		latency: "<50ms",
		bandwidth: "Low",
		complexity: "Medium",
	},
];

export function RealTimeStrategiesDemo() {
	const [selected, setSelected] = useState<Strategy>("polling");
	const [running, setRunning] = useState(false);
	const [activities, setActivities] = useState<NetworkActivity[]>([]);
	const [stockPrice, setStockPrice] = useState(100);
	const [totalBytes, setTotalBytes] = useState(0);
	const [elapsedTime, setElapsedTime] = useState(0);
	const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
	const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);

	const clearTimers = useCallback(() => {
		for (const t of timeoutsRef.current) clearTimeout(t);
		for (const i of intervalsRef.current) clearInterval(i);
		timeoutsRef.current = [];
		intervalsRef.current = [];
	}, []);

	const reset = useCallback(() => {
		clearTimers();
		setRunning(false);
		setActivities([]);
		setStockPrice(100);
		setTotalBytes(0);
		setElapsedTime(0);
	}, [clearTimers]);

	const addActivity = useCallback(
		(type: NetworkActivity["type"], bytes: number) => {
			const activity: NetworkActivity = {
				id: Date.now() + Math.random(),
				timestamp: Date.now(),
				type,
				bytes,
				strategy: selected,
			};
			setActivities((prev) => [...prev.slice(-20), activity]);
			setTotalBytes((prev) => prev + bytes);
		},
		[selected],
	);

	const updatePrice = useCallback(() => {
		setStockPrice((prev) => +(prev + (Math.random() - 0.5) * 5).toFixed(2));
	}, []);

	const runPolling = useCallback(() => {
		reset();
		setRunning(true);

		// Poll every 5 seconds
		const interval = setInterval(() => {
			addActivity("request", 0.5);
			const timeout = setTimeout(() => {
				addActivity("response", 2);
				updatePrice();
			}, 200);
			timeoutsRef.current.push(timeout);
		}, 5000);

		intervalsRef.current.push(interval);

		// Track elapsed time
		const timeInterval = setInterval(() => {
			setElapsedTime((prev) => prev + 1);
		}, 1000);
		intervalsRef.current.push(timeInterval);
	}, [reset, addActivity, updatePrice]);

	const runLongPolling = useCallback(() => {
		reset();
		setRunning(true);

		let iteration = 0;
		const poll = () => {
			if (iteration >= 20) return; // Stop after demo period
			addActivity("request", 0.5);

			// Server holds request for 1-2s then responds
			const delay = 1000 + Math.random() * 1000;
			const timeout = setTimeout(() => {
				addActivity("response", 2);
				updatePrice();
				iteration++;
				poll(); // Immediately reconnect
			}, delay);
			timeoutsRef.current.push(timeout);
		};

		poll();

		const timeInterval = setInterval(() => {
			setElapsedTime((prev) => prev + 1);
		}, 1000);
		intervalsRef.current.push(timeInterval);
	}, [reset, addActivity, updatePrice]);

	const runSSE = useCallback(() => {
		reset();
		setRunning(true);

		// Initial connection
		addActivity("request", 0.5);

		// Server pushes updates every 2-4s
		const interval = setInterval(
			() => {
				addActivity("push", 1.5);
				updatePrice();
			},
			2000 + Math.random() * 2000,
		);

		intervalsRef.current.push(interval);

		const timeInterval = setInterval(() => {
			setElapsedTime((prev) => prev + 1);
		}, 1000);
		intervalsRef.current.push(timeInterval);
	}, [reset, addActivity, updatePrice]);

	const runWebSocket = useCallback(() => {
		reset();
		setRunning(true);

		// Initial handshake
		addActivity("request", 0.3);
		const handshakeTimeout = setTimeout(
			() => addActivity("response", 0.3),
			100,
		);
		timeoutsRef.current.push(handshakeTimeout);

		// Server pushes updates
		const pushInterval = setInterval(
			() => {
				addActivity("push", 0.8);
				updatePrice();
			},
			1500 + Math.random() * 1000,
		);
		intervalsRef.current.push(pushInterval);

		// Client sends commands/messages (bidirectional)
		const clientInterval = setInterval(
			() => {
				addActivity("request", 0.4);
			},
			3000 + Math.random() * 2000,
		);
		intervalsRef.current.push(clientInterval);

		const timeInterval = setInterval(() => {
			setElapsedTime((prev) => prev + 1);
		}, 1000);
		intervalsRef.current.push(timeInterval);
	}, [reset, addActivity, updatePrice]);

	const runGraphQLSub = useCallback(() => {
		reset();
		setRunning(true);

		// Initial subscription
		addActivity("request", 0.8);
		setTimeout(() => addActivity("response", 0.5), 100);

		// Server pushes GraphQL payloads
		const interval = setInterval(
			() => {
				addActivity("push", 1.2);
				updatePrice();
			},
			1500 + Math.random() * 1500,
		);

		intervalsRef.current.push(interval);

		const timeInterval = setInterval(() => {
			setElapsedTime((prev) => prev + 1);
		}, 1000);
		intervalsRef.current.push(timeInterval);
	}, [reset, addActivity, updatePrice]);

	const runAnimation = useCallback(() => {
		match(selected)
			.with("polling", () => runPolling())
			.with("long-polling", () => runLongPolling())
			.with("sse", () => runSSE())
			.with("websocket", () => runWebSocket())
			.with("graphql-sub", () => runGraphQLSub())
			.exhaustive();
	}, [
		selected,
		runPolling,
		runLongPolling,
		runSSE,
		runWebSocket,
		runGraphQLSub,
	]);

	// Reset animation when strategy changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: <need selected deps for reset the animation>
	useEffect(() => {
		reset();
	}, [selected, reset]);

	useEffect(() => () => clearTimers(), [clearTimers]);

	const strategy = STRATEGIES.find((s) => s.id === selected) ?? STRATEGIES[0];

	return (
		<div className="space-y-6">
			{/* Strategy selector */}
			<div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
				{STRATEGIES.map((s) => {
					const isSelected = selected === s.id;
					const className = match({ isSelected, color: s.color })
						.with(
							{ isSelected: true, color: "rose" },
							() => "bg-rose-500/15 text-rose-300 border-rose-500/40",
						)
						.with(
							{ isSelected: true, color: "amber" },
							() => "bg-amber-500/15 text-amber-300 border-amber-500/40",
						)
						.with(
							{ isSelected: true, color: "cyan" },
							() => "bg-cyan-500/15 text-cyan-300 border-cyan-500/40",
						)
						.with(
							{ isSelected: true, color: "green" },
							() => "bg-green-500/15 text-green-300 border-green-500/40",
						)
						.with(
							{ isSelected: true, color: "violet" },
							() => "bg-violet-500/15 text-violet-300 border-violet-500/40",
						)
						.otherwise(
							() =>
								"bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600",
						);

					return (
						<button
							key={s.id}
							type="button"
							onClick={() => setSelected(s.id)}
							className={`px-3 py-2 rounded-lg text-sm font-semibold border transition-all ${className}`}
						>
							<div className="text-lg mb-1">{s.icon}</div>
							<div className="text-xs">{s.label}</div>
						</button>
					);
				})}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Live dashboard simulation */}
				<div className="space-y-4">
					{/* Stock price widget */}
					<div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">
						<div className="text-xs text-zinc-500 mb-2">ACME Stock Price</div>
						<div className="text-4xl font-bold text-white mb-4">
							${stockPrice}
						</div>
						<div className="h-24 bg-zinc-800 rounded flex items-end gap-1 px-2 overflow-hidden">
							{activities.slice(-20).map((act) => (
								<motion.div
									key={act.id}
									initial={{ height: 0 }}
									animate={{ height: `${20 + Math.random() * 80}%` }}
									className="w-2 bg-cyan-400 rounded-t"
								/>
							))}
						</div>
					</div>

					{/* Metrics */}
					<div className="grid grid-cols-3 gap-3">
						<div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3">
							<div className="text-xs text-zinc-500 mb-1">Latency</div>
							<div className="text-lg font-bold text-white">
								{strategy.latency}
							</div>
						</div>
						<div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3">
							<div className="text-xs text-zinc-500 mb-1">Bandwidth</div>
							<div className="text-lg font-bold text-white">
								{strategy.bandwidth}
							</div>
						</div>
						<div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3">
							<div className="text-xs text-zinc-500 mb-1">Time</div>
							<div className="text-lg font-bold text-white">{elapsedTime}s</div>
						</div>
					</div>

					{/* Network activity log */}
					<div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 h-64 overflow-y-auto">
						<div className="text-xs text-zinc-500 mb-3 font-mono">
							Network Activity ({totalBytes.toFixed(1)} KB total)
						</div>
						<div className="space-y-1">
							<AnimatePresence>
								{activities
									.slice(-15)
									.reverse()
									.map((act) => (
										<motion.div
											key={act.id}
											initial={{ opacity: 0, x: -10 }}
											animate={{ opacity: 1, x: 0 }}
											exit={{ opacity: 0 }}
											className="flex items-center gap-2 text-xs font-mono"
										>
											<span className="text-zinc-600">
												{new Date(act.timestamp).toLocaleTimeString()}
											</span>
											<span
												className={match(act.type)
													.with("request", () => "text-amber-400")
													.with("response", () => "text-cyan-400")
													.with("push", () => "text-green-400")
													.exhaustive()}
											>
												{match(act.type)
													.with("request", () => "→")
													.with("response", () => "←")
													.with("push", () => "↓")
													.exhaustive()}
											</span>
											<span className="text-zinc-400">{act.type}</span>
											<span className="text-zinc-600">{act.bytes}KB</span>
										</motion.div>
									))}
							</AnimatePresence>
						</div>
					</div>

					<button
						type="button"
						onClick={running ? reset : runAnimation}
						className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors ${
							running
								? "bg-zinc-700 text-zinc-300"
								: "bg-violet-600 hover:bg-violet-500 text-white"
						}`}
					>
						{running ? "⏹ Stop" : "▶ Start Monitoring"}
					</button>
				</div>

				{/* Implementation */}
				<div className="space-y-4">
					<h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
						Implementation
					</h4>

					{selected === "polling" && (
						<div className="space-y-3">
							<ShikiCode
								language="typescript"
								code={`// Client polls server every N seconds
setInterval(async () => {
  const res = await fetch('/api/stock-price');
  const data = await res.json();
  updateUI(data);
}, 5000);

// Pros: Simple, works everywhere
// Cons: Wastes bandwidth, slow updates (5s lag)`}
								showLineNumbers={false}
								className="text-xs"
							/>
							<div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
								⚠️ High bandwidth waste. Most polls return "no updates". Slow
								latency.
							</div>
						</div>
					)}

					{selected === "long-polling" && (
						<div className="space-y-3">
							<ShikiCode
								language="typescript"
								code={`// Server holds request until data available
async function longPoll() {
  const res = await fetch('/api/stock-price/subscribe');
  const data = await res.json();
  updateUI(data);
  longPoll(); // Immediately reconnect
}

// Server waits up to 30s before responding
// Responds immediately when data changes`}
								showLineNumbers={false}
								className="text-xs"
							/>
							<div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
								Better than polling but still uses HTTP overhead for each
								update.
							</div>
						</div>
					)}

					{selected === "sse" && (
						<div className="space-y-3">
							<ShikiCode
								language="typescript"
								code={`// Server pushes updates over single HTTP connection
const eventSource = new EventSource('/api/stock-price/stream');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  updateUI(data);
};

// Server sends data as it arrives:
// data: {"price": 102.5}\\n\\n
// Auto-reconnects on disconnect`}
								showLineNumbers={false}
								className="text-xs"
							/>
							<div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs">
								✓ Simpler than WebSocket. Perfect for server → client updates
								(logs, notifications).
							</div>
						</div>
					)}

					{selected === "websocket" && (
						<div className="space-y-3">
							<ShikiCode
								language="typescript"
								code={`// Full-duplex bidirectional communication
const ws = new WebSocket('ws://api.example.com/stock');

ws.onopen = () => {
  ws.send(JSON.stringify({ subscribe: 'ACME' }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  updateUI(data);
};

// Lowest latency, minimal overhead
// Use for: chat, gaming, collaborative editing`}
								showLineNumbers={false}
								className="text-xs"
							/>
							<div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-300 text-xs">
								✓ Lowest latency, most efficient. Use when &lt;1s latency
								required.
							</div>
						</div>
					)}

					{selected === "graphql-sub" && (
						<div className="space-y-3">
							<ShikiCode
								language="graphql"
								code={`# GraphQL subscription over WebSocket
subscription StockPrice($symbol: String!) {
  stockPriceUpdated(symbol: $symbol) {
    price
    change
    timestamp
  }
}

# Client (using urql/Apollo):
const [result] = useSubscription({
  query: StockPriceSubscription,
  variables: { symbol: 'ACME' }
});`}
								showLineNumbers={false}
								className="text-xs"
							/>
							<div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs">
								✓ WebSocket under the hood. GraphQL syntax for subscriptions.
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
