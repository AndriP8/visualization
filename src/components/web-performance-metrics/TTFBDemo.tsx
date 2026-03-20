import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ShikiCode } from "../shared/ShikiCode";

type Scenario = "cold-start" | "warm-cache" | "optimized-origin";
type Phase =
	| "idle"
	| "dns"
	| "tcp"
	| "tls"
	| "server"
	| "db-query"
	| "first-byte"
	| "done";

interface LayerTiming {
	name: string;
	duration: number;
	phase: Phase;
}

interface ScenarioConfig {
	id: Scenario;
	label: string;
	description: string;
	ttfbTime: number;
	layers: LayerTiming[];
}

const SCENARIOS: ScenarioConfig[] = [
	{
		id: "cold-start",
		label: "Cold Start",
		description: "Serverless cold start + slow database query",
		ttfbTime: 2100,
		layers: [
			{ name: "DNS Lookup", duration: 150, phase: "dns" },
			{ name: "TCP Handshake", duration: 100, phase: "tcp" },
			{ name: "TLS Negotiation", duration: 150, phase: "tls" },
			{ name: "Server Cold Start", duration: 800, phase: "server" },
			{ name: "Database Query", duration: 900, phase: "db-query" },
		],
	},
	{
		id: "warm-cache",
		label: "Warm Cache",
		description: "CDN edge cache hit, bypasses origin entirely",
		ttfbTime: 45,
		layers: [
			{ name: "DNS Lookup (cached)", duration: 5, phase: "dns" },
			{ name: "TCP (persistent)", duration: 10, phase: "tcp" },
			{ name: "CDN Edge Hit", duration: 30, phase: "server" },
		],
	},
	{
		id: "optimized-origin",
		label: "Optimized Origin",
		description: "Connection pooling + indexed database",
		ttfbTime: 250,
		layers: [
			{ name: "DNS Lookup", duration: 20, phase: "dns" },
			{ name: "TCP (pooled)", duration: 30, phase: "tcp" },
			{ name: "TLS (resumed)", duration: 20, phase: "tls" },
			{ name: "Server Processing", duration: 80, phase: "server" },
			{ name: "DB Query (indexed)", duration: 100, phase: "db-query" },
		],
	},
];

const getThresholdColor = (value: number): string => {
	if (value <= 800) return "text-green-400";
	if (value <= 1800) return "text-yellow-400";
	return "text-rose-400";
};

export default function TTFBDemo() {
	const [selected, setSelected] = useState<Scenario>("cold-start");
	const [running, setRunning] = useState(false);
	const [phase, setPhase] = useState<Phase>("idle");
	const [ttfbTime, setTtfbTime] = useState(0);
	const [currentLayer, setCurrentLayer] = useState<number>(-1);
	const [accumulatedTime, setAccumulatedTime] = useState(0);
	const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

	const clearTimeouts = useCallback(() => {
		for (const t of timeoutsRef.current) clearTimeout(t);
		timeoutsRef.current = [];
	}, []);

	const schedule = useCallback((fn: () => void, delay: number) => {
		const t = setTimeout(fn, delay);
		timeoutsRef.current.push(t);
	}, []);

	const reset = useCallback(() => {
		clearTimeouts();
		setPhase("idle");
		setTtfbTime(0);
		setCurrentLayer(-1);
		setAccumulatedTime(0);
		setRunning(false);
	}, [clearTimeouts]);

	const runScenario = useCallback(() => {
		const scenario = SCENARIOS.find((s) => s.id === selected);
		if (!scenario) return;

		reset();
		setRunning(true);

		let cumulativeDelay = 0;
		let cumulativeTime = 0;

		for (let i = 0; i < scenario.layers.length; i++) {
			const layer = scenario.layers[i];
			const layerDelay = cumulativeDelay;

			schedule(() => {
				setPhase(layer.phase);
				setCurrentLayer(i);
			}, layerDelay);

			cumulativeDelay += layer.duration;
			cumulativeTime += layer.duration;

			schedule(() => {
				setAccumulatedTime(cumulativeTime);
			}, cumulativeDelay);
		}

		schedule(() => {
			setPhase("first-byte");
			setTtfbTime(scenario.ttfbTime);
			setCurrentLayer(-1);
		}, cumulativeDelay + 200);

		schedule(() => {
			setPhase("done");
			setRunning(false);
		}, cumulativeDelay + 800);
	}, [selected, reset, schedule]);

	useEffect(() => {
		return () => clearTimeouts();
	}, [clearTimeouts]);

	const currentScenario = SCENARIOS.find((s) => s.id === selected);

	return (
		<div className="space-y-6">
			{/* Scenario tabs */}
			<div className="flex gap-3 flex-wrap">
				{SCENARIOS.map((scenario) => {
					const isSelected = selected === scenario.id;
					return (
						<button
							key={scenario.id}
							type="button"
							onClick={() => {
								reset();
								setSelected(scenario.id);
							}}
							className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
								isSelected
									? "bg-violet-500/20 text-violet-300 border-violet-500/30"
									: "bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-300"
							}`}
						>
							{scenario.label}
						</button>
					);
				})}
			</div>

			{/* Description */}
			{currentScenario && (
				<p className="text-sm text-zinc-400">{currentScenario.description}</p>
			)}

			{/* Control button */}
			<button
				type="button"
				onClick={running ? reset : runScenario}
				disabled={running}
				className="px-6 py-2 rounded-lg bg-violet-500 text-white font-semibold hover:bg-violet-600 disabled:opacity-50 transition-all"
			>
				{running ? "Running..." : "Run Scenario"}
			</button>

			{/* Visualization */}
			<div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-6">
				{/* Layer stack */}
				<div className="space-y-3">
					<h4 className="text-sm font-semibold text-zinc-400">
						Request Journey
					</h4>
					<div
						className="flex flex-col items-center space-y-3 py-6"
						style={{ maxWidth: "400px", margin: "0 auto" }}
					>
						{/* Browser (starting point) */}
						<div className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-center">
							<div className="text-sm font-semibold text-white">Browser</div>
							<div className="text-xs text-zinc-500 mt-1">
								Request initiated
							</div>
						</div>

						{/* Layers */}
						{currentScenario?.layers.map((layer, idx) => {
							const isActive = currentLayer === idx;
							const isPassed = currentLayer > idx;

							return (
								<div key={`${layer.name}-${idx}`} className="w-full relative">
									{/* Connection line */}
									<div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-3 -mt-3 bg-zinc-700" />

									{/* Traveling ball */}
									<AnimatePresence>
										{isActive && (
											<motion.div
												initial={{ y: -30, opacity: 0 }}
												animate={{ y: 0, opacity: 1 }}
												exit={{ y: 30, opacity: 0 }}
												transition={{ duration: 0.3 }}
												className="absolute left-1/2 -translate-x-1/2 -top-6 w-4 h-4 rounded-full bg-amber-400 shadow-lg shadow-amber-400/50 z-10"
											/>
										)}
									</AnimatePresence>

									{/* Layer box */}
									<motion.div
										animate={{
											borderColor: isActive
												? "rgb(251 191 36)"
												: isPassed
													? "rgb(34 197 94 / 0.3)"
													: "rgb(63 63 70)",
											backgroundColor: isActive
												? "rgb(139 92 246 / 0.2)"
												: isPassed
													? "rgb(34 197 94 / 0.1)"
													: "rgb(24 24 27)",
										}}
										className="w-full px-4 py-3 border rounded-lg transition-all"
									>
										<div className="flex items-center justify-between">
											<div>
												<div className="text-sm font-semibold text-white">
													{layer.name}
												</div>
												<div className="text-xs text-zinc-500 mt-1">
													{layer.duration}ms
												</div>
											</div>
											{isPassed && (
												<motion.div
													initial={{ scale: 0 }}
													animate={{ scale: 1 }}
													className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs"
												>
													✓
												</motion.div>
											)}
											{isActive && (
												<motion.div
													animate={{ rotate: 360 }}
													transition={{
														duration: 1,
														repeat: Number.POSITIVE_INFINITY,
														ease: "linear",
													}}
													className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full"
												/>
											)}
										</div>
									</motion.div>
								</div>
							);
						})}

						{/* Final connection line */}
						{currentScenario && currentLayer >= 0 && (
							<div className="w-1 h-3 bg-zinc-700" />
						)}

						{/* First byte indicator */}
						<AnimatePresence>
							{(phase === "first-byte" || phase === "done") && (
								<motion.div
									initial={{ scale: 0, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									className="w-full px-4 py-3 bg-green-500/20 border border-green-500/30 rounded-lg text-center"
								>
									<div className="text-sm font-semibold text-green-400">
										First Byte Received! 🎉
									</div>
									<div className="text-xs text-green-300 mt-1">
										{ttfbTime}ms
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</div>

				{/* Accumulated time */}
				{accumulatedTime > 0 && phase !== "first-byte" && phase !== "done" && (
					<div className="text-center">
						<div className="text-2xl font-bold text-violet-400">
							{accumulatedTime}ms
						</div>
						<div className="text-xs text-zinc-500 mt-1">
							Accumulated latency
						</div>
					</div>
				)}

				{/* TTFB Score display */}
				{ttfbTime > 0 && (
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg"
					>
						<div>
							<div className="text-sm font-semibold text-zinc-300">
								Time to First Byte
							</div>
							<div className="text-xs text-zinc-500 mt-1">
								Total time from request to first response byte
							</div>
						</div>
						<div className="text-right">
							<div
								className={`text-3xl font-bold ${getThresholdColor(ttfbTime)}`}
							>
								{ttfbTime}ms
							</div>
							<div className="text-xs text-zinc-500 mt-1">
								{ttfbTime <= 800
									? "Good"
									: ttfbTime <= 1800
										? "Needs Improvement"
										: "Poor"}
							</div>
						</div>
					</motion.div>
				)}

				{/* Threshold guide */}
				<div className="flex gap-4 text-xs">
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 rounded-full bg-green-500" />
						<span className="text-zinc-400">Good: ≤800ms</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 rounded-full bg-yellow-500" />
						<span className="text-zinc-400">Needs Improvement: 800-1800ms</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 rounded-full bg-rose-500" />
						<span className="text-zinc-400">Poor: &gt;1800ms</span>
					</div>
				</div>
			</div>

			{/* Code examples */}
			<div className="grid md:grid-cols-2 gap-4">
				<div className="space-y-2">
					<h4 className="text-sm font-semibold text-zinc-400">Before (Slow)</h4>
					<ShikiCode
						language="javascript"
						code={`// Serverless cold start
export default async (req, res) => {
  // No connection pooling
  const db = await connectDB();

  // No indexes, full table scan
  const users = await db.query(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );

  res.json(users);
}`}
						className="text-xs"
					/>
				</div>
				<div className="space-y-2">
					<h4 className="text-sm font-semibold text-zinc-400">
						After (Optimized)
					</h4>
					<ShikiCode
						language="javascript"
						code={`// Connection pool (persistent)
const pool = createPool({ max: 10 });

// CDN caching at edge
app.use(compression());
app.use(staticCache({
  maxAge: 31536000
}));

// Database optimization
// CREATE INDEX idx_user_email
// ON users(email);

const users = await pool.query(
  'SELECT * FROM users WHERE email = ?',
  [email]
);`}
						className="text-xs"
					/>
				</div>
			</div>
		</div>
	);
}
