import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { match } from "ts-pattern";

interface CacheLayer {
	id: string;
	name: string;
	shortName: string;
	color: string;
	bgColor: string;
	borderColor: string;
	baseLatencyMs: number;
	description: string;
}

const LAYERS: CacheLayer[] = [
	{
		id: "browser-memory",
		name: "Browser Memory Cache",
		shortName: "Memory",
		color: "text-accent-violet",
		bgColor: "bg-violet-500/10",
		borderColor: "border-violet-500/30",
		baseLatencyMs: 1,
		description: "In-process RAM — fastest possible",
	},
	{
		id: "browser-disk",
		name: "Browser Disk Cache",
		shortName: "Disk Cache",
		color: "text-accent-cyan",
		bgColor: "bg-cyan-500/10",
		borderColor: "border-cyan-500/30",
		baseLatencyMs: 8,
		description: "Local filesystem cache",
	},
	{
		id: "cdn",
		name: "CDN / Edge Cache",
		shortName: "CDN",
		color: "text-sky-300",
		bgColor: "bg-sky-500/10",
		borderColor: "border-sky-500/30",
		baseLatencyMs: 20,
		description: "Nearest PoP — sub-region latency",
	},
	{
		id: "reverse-proxy",
		name: "Reverse Proxy Cache",
		shortName: "Nginx/Varnish",
		color: "text-accent-amber",
		bgColor: "bg-amber-500/10",
		borderColor: "border-amber-500/30",
		baseLatencyMs: 5,
		description: "In-datacenter proxy cache",
	},
	{
		id: "app-cache",
		name: "Application Cache",
		shortName: "Redis",
		color: "text-accent-rose",
		bgColor: "bg-rose-500/10",
		borderColor: "border-rose-500/30",
		baseLatencyMs: 3,
		description: "In-memory key-value store",
	},
	{
		id: "database",
		name: "Database → Disk",
		shortName: "Database",
		color: "text-text-secondary",
		bgColor: "bg-surface-tertiary/10",
		borderColor: "border-text-muted/30",
		baseLatencyMs: 120,
		description: "Persistent storage — always the slowest",
	},
];

type LayerStatus = "idle" | "hit" | "miss" | "active";

interface SimState {
	running: boolean;
	ballY: number; // 0-indexed layer the ball is at
	hitLayer: number | null;
	statuses: LayerStatus[];
	totalLatency: number;
	done: boolean;
}

const INITIAL_SIM: SimState = {
	running: false,
	ballY: -1,
	hitLayer: null,
	statuses: LAYERS.map(() => "idle"),
	totalLatency: 0,
	done: false,
};

const STEP_DELAY = 700; // ms per layer
const RETURN_DELAY = 300;

export function CachingLayerStackDemo() {
	const [warmLayers, setWarmLayers] = useState<boolean[]>([
		true,
		true,
		false,
		false,
		true,
		false,
	]);
	const [sim, setSim] = useState<SimState>(INITIAL_SIM);
	const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

	const clearTimeouts = useCallback(() => {
		for (const t of timeoutsRef.current) clearTimeout(t);
		timeoutsRef.current = [];
	}, []);

	const reset = useCallback(() => {
		clearTimeouts();
		setSim(INITIAL_SIM);
	}, [clearTimeouts]);

	const runSimulation = useCallback(() => {
		clearTimeouts();
		setSim({
			...INITIAL_SIM,
			running: true,
			statuses: LAYERS.map(() => "idle"),
		});

		let hitAt = -1;

		// Find which layer will hit - check all layers sequentially
		for (let i = 0; i < LAYERS.length; i++) {
			if (warmLayers[i] || i === LAYERS.length - 1) {
				hitAt = i;
				break;
			}
		}

		const schedule = (fn: () => void, delay: number) => {
			const t = setTimeout(fn, delay);
			timeoutsRef.current.push(t);
			return delay;
		};

		let elapsed = 0;
		let cumulativeLatency = 0;

		// Animate ball descending, marking misses
		for (let i = 0; i <= hitAt; i++) {
			const layerIdx = i;
			const isHit = layerIdx === hitAt;
			const layerLatency = LAYERS[layerIdx].baseLatencyMs;

			// Accumulate latency for all layers we pass through
			cumulativeLatency += layerLatency;

			const stepElapsed = elapsed;
			const currentLatency = cumulativeLatency;
			elapsed += STEP_DELAY;

			schedule(() => {
				setSim((prev) => {
					const newStatuses = [...prev.statuses] as LayerStatus[];
					newStatuses[layerIdx] = "active";
					if (layerIdx > 0) newStatuses[layerIdx - 1] = isHit ? "miss" : "miss";
					return {
						...prev,
						ballY: layerIdx,
						statuses: newStatuses,
						totalLatency: currentLatency,
					};
				});
			}, stepElapsed);

			schedule(() => {
				setSim((prev) => {
					const newStatuses = [...prev.statuses] as LayerStatus[];
					newStatuses[layerIdx] = isHit ? "hit" : "miss";
					return {
						...prev,
						hitLayer: isHit ? layerIdx : prev.hitLayer,
						statuses: newStatuses,
					};
				});
			}, stepElapsed + RETURN_DELAY);
		}

		// After settling: mark done
		schedule(() => {
			setSim((prev) => ({ ...prev, running: false, done: true }));
		}, elapsed + RETURN_DELAY);
	}, [warmLayers, clearTimeouts]);

	// Cleanup on unmount
	useEffect(() => () => clearTimeouts(), [clearTimeouts]);

	const toggleWarm = (idx: number) => {
		if (sim.running) return;
		if (idx === LAYERS.length - 1) return; // DB always "answers"
		setWarmLayers((prev) => {
			const next = [...prev];
			next[idx] = !next[idx];
			return next;
		});
		setSim(INITIAL_SIM);
	};

	return (
		<div className="space-y-6">
			{/* Controls */}
			<div className="flex flex-wrap items-center gap-4">
				<motion.button
					type="button"
					onClick={sim.running ? reset : runSimulation}
					whileTap={{ scale: 0.95 }}
					className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
						sim.running
							? "bg-surface-tertiary text-text-secondary hover:bg-surface-tertiary"
							: "bg-violet-600 hover:bg-violet-500 text-text-primary"
					}`}
				>
					{match({ running: sim.running, done: sim.done })
						.with({ running: true }, () => "⏹ Stop")
						.with({ running: false, done: true }, () => "↺ Replay")
						.with({ running: false, done: false }, () => "▶ Send Request")
						.exhaustive()}
				</motion.button>
				{sim.done && (
					<motion.div
						initial={{ opacity: 0, x: -10 }}
						animate={{ opacity: 1, x: 0 }}
						className="text-sm text-text-tertiary"
					>
						Total latency:{" "}
						<span className="font-semibold text-accent-amber">
							~{sim.totalLatency}ms
						</span>
					</motion.div>
				)}
			</div>

			{/* Layer stack */}
			<div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
				<div className="space-y-2 relative">
					{LAYERS.map((layer, idx) => {
						const status = sim.statuses[idx];
						const isWarm = warmLayers[idx];
						const isLast = idx === LAYERS.length - 1;
						const isBallHere = sim.ballY === idx && sim.running;

						return (
							<div key={layer.id} className="relative flex items-center gap-4">
								{/* Animated ball - stays fixed */}
								<div className="relative w-8 h-8 shrink-0 flex items-center justify-center z-10">
									{isBallHere && (
										<motion.div
											layoutId="request-ball"
											initial={{ scale: 0 }}
											animate={{ scale: 1 }}
											className="absolute w-6 h-6 rounded-full bg-white shadow-[0_0_12px_white] z-20"
										/>
									)}
									{!isBallHere && (
										<div className="w-2.5 h-2.5 rounded-full bg-surface-tertiary" />
									)}
								</div>

								{/* Card content - scales independently */}
								<motion.div
									animate={{
										opacity: status === "miss" ? 0.55 : 1,
										scale: status === "active" || status === "hit" ? 1.01 : 1,
									}}
									className={`flex-1 flex items-center gap-4 px-4 py-3 rounded-xl border transition-colors ${layer.bgColor} ${layer.borderColor} ${
										status === "hit" ? "ring-2 ring-green-500/40" : ""
									} ${status === "active" ? "ring-2 ring-white/20" : ""}`}
								>
									{/* Layer info */}
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2">
											<span className={`text-sm font-semibold ${layer.color}`}>
												{layer.name}
											</span>
											{/* HIT/MISS badge */}
											<AnimatePresence>
												{status === "hit" && (
													<motion.span
														key="hit"
														initial={{ opacity: 0, scale: 0.7 }}
														animate={{ opacity: 1, scale: 1 }}
														exit={{ opacity: 0 }}
														className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-500/20 text-accent-green-soft border border-green-500/30"
													>
														✓ HIT
													</motion.span>
												)}
												{status === "miss" && (
													<motion.span
														key="miss"
														initial={{ opacity: 0, scale: 0.7 }}
														animate={{ opacity: 1, scale: 1 }}
														exit={{ opacity: 0 }}
														className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-500/20 text-accent-orange-soft border border-orange-500/30"
													>
														✗ MISS
													</motion.span>
												)}
											</AnimatePresence>
										</div>
										<p className="text-xs text-text-muted mt-0.5">
											{layer.description}
										</p>
									</div>

									{/* Latency */}
									<div className="text-right shrink-0">
										<div className="text-xs text-text-muted">
											~{layer.baseLatencyMs}ms
										</div>
									</div>

									{/* Warm/Cold toggle (not for DB) */}
									{!isLast && (
										<button
											type="button"
											onClick={() => toggleWarm(idx)}
											disabled={sim.running}
											className={`shrink-0 w-16 py-1 rounded-full text-xs font-semibold border transition-all ${
												isWarm
													? "bg-green-500/15 text-accent-green-soft border-green-500/30 hover:bg-green-500/25"
													: "bg-surface-tertiary/50 text-text-muted border-border-tertiary hover:bg-surface-tertiary"
											} disabled:opacity-50 disabled:cursor-not-allowed`}
										>
											{isWarm ? "🔥 Warm" : "❄️ Cold"}
										</button>
									)}
									{isLast && (
										<span className="shrink-0 w-16 text-center text-xs text-text-faint italic">
											source
										</span>
									)}
								</motion.div>
							</div>
						);
					})}
				</div>

				{/* Explanation panel */}
				<div className="space-y-3">
					<h4 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider">
						How it works
					</h4>
					<div className="space-y-2.5 text-sm text-text-tertiary">
						<div className="flex gap-2.5">
							<span className="text-text-primary mt-0.5">→</span>
							<p>
								Toggle each layer between{" "}
								<span className="text-accent-green-soft font-medium">
									🔥 warm
								</span>{" "}
								(has cached data) and{" "}
								<span className="text-text-tertiary font-medium">❄️ cold</span>
								(cache empty or expired) before sending the request.
							</p>
						</div>
						<div className="flex gap-2.5">
							<span className="text-text-primary mt-0.5">→</span>
							<p>
								The request ball drops through each layer. A{" "}
								<span className="text-accent-green-soft font-medium">warm</span>{" "}
								layer returns data immediately (HIT). A{" "}
								<span className="text-accent-orange-soft font-medium">
									cold
								</span>{" "}
								layer passes through (MISS).
							</p>
						</div>
						<div className="flex gap-2.5">
							<span className="text-text-primary mt-0.5">→</span>
							<p>
								The cumulative latency grows with each miss — reaching the DB
								costs ~
								<span className="text-accent-amber font-medium">157ms+</span> vs
								~<span className="text-accent-green-soft font-medium">1ms</span>{" "}
								from memory.
							</p>
						</div>
					</div>
					<div className="mt-4 p-3 rounded-lg bg-surface-secondary/50 border border-border-secondary text-xs text-text-muted">
						<strong className="text-text-secondary">Key insight:</strong> The
						closer to the user the cache is, the faster the response. Browser
						memory cache is 5–100× faster than any network hop.
					</div>
				</div>
			</div>
		</div>
	);
}
