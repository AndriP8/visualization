import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ShikiCode } from "../shared/ShikiCode";

interface Resource {
	id: string;
	label: string;
	size: number; // relative size (1-5)
	color: string;
	bgColor: string;
}

const RESOURCES: Resource[] = [
	{
		id: "html",
		label: "HTML",
		size: 1,
		color: "text-blue-300",
		bgColor: "bg-blue-500",
	},
	{
		id: "css",
		label: "CSS",
		size: 2,
		color: "text-orange-300",
		bgColor: "bg-orange-500",
	},
	{
		id: "img1",
		label: "img1",
		size: 1,
		color: "text-emerald-300",
		bgColor: "bg-emerald-500",
	},
	{
		id: "img2",
		label: "img2",
		size: 1,
		color: "text-violet-300",
		bgColor: "bg-violet-500",
	},
	{
		id: "img3",
		label: "img3",
		size: 1,
		color: "text-rose-300",
		bgColor: "bg-rose-500",
	},
	{
		id: "img4",
		label: "img4",
		size: 1,
		color: "text-amber-300",
		bgColor: "bg-amber-500",
	},
];

type Mode = "single" | "parallel";

interface WaterfallBar {
	id: string;
	label: string;
	start: number; // seconds
	duration: number; // seconds
	color: string;
	blocked?: boolean;
}

function buildWaterfall(mode: Mode, slowDelay: number): WaterfallBar[] {
	// CSS is the slow resource (index 1)
	const cssDuration = 1 + slowDelay;

	if (mode === "single") {
		// Sequential on one connection
		const durations = [0.6, cssDuration, 0.5, 0.5, 0.5, 0.5];
		const bars: WaterfallBar[] = [];
		let t = 0;
		for (let i = 0; i < RESOURCES.length; i++) {
			bars.push({
				id: RESOURCES[i].id,
				label: RESOURCES[i].label,
				start: t,
				duration: durations[i],
				color: RESOURCES[i].bgColor,
				blocked: i > 1, // all resources after CSS are blocked until CSS finishes
			});
			t += durations[i];
		}
		return bars;
	}

	// Parallel (6 connections) - all start at same time
	const durations = [0.6, cssDuration, 0.5, 0.5, 0.5, 0.5];
	return RESOURCES.map((r, i) => ({
		id: r.id,
		label: r.label,
		start: 0,
		duration: durations[i],
		color: r.bgColor,
		blocked: false,
	}));
}

export function HeadOfLineDemo() {
	const [mode, setMode] = useState<Mode>("single");
	const [slowDelay, setSlowDelay] = useState(2); // extra seconds for CSS
	const [animating, setAnimating] = useState(false);
	const [progress, setProgress] = useState(0); // 0-1 timeline progress
	const animFrameRef = useRef<number | null>(null);
	const startTimeRef = useRef<number>(0);

	const waterfall = buildWaterfall(mode, slowDelay);
	const totalTime = Math.max(...waterfall.map((b) => b.start + b.duration));

	const startAnimation = useCallback(() => {
		setProgress(0);
		setAnimating(true);
		startTimeRef.current = performance.now();

		const ANIM_DURATION = 3000; // ms

		const tick = (now: number) => {
			const elapsed = now - startTimeRef.current;
			const p = Math.min(elapsed / ANIM_DURATION, 1);
			setProgress(p);
			if (p < 1) {
				animFrameRef.current = requestAnimationFrame(tick);
			} else {
				setAnimating(false);
			}
		};
		animFrameRef.current = requestAnimationFrame(tick);
	}, []);

	const stopAnimation = useCallback(() => {
		if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
		setAnimating(false);
		setProgress(0);
	}, []);

	useEffect(() => {
		return () => {
			if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
		};
	}, []);

	// Recompute on mode/delay change
	// biome-ignore lint/correctness/useExhaustiveDependencies: <To reset animation when mode or delay changes>
	useEffect(() => {
		stopAnimation();
	}, [mode, slowDelay, stopAnimation]);

	const currentTime = progress * totalTime;

	return (
		<div className="space-y-6">
			{/* Controls */}
			<div className="flex flex-wrap items-center gap-4">
				<div className="flex gap-2">
					{(["single", "parallel"] as Mode[]).map((m) => (
						<button
							key={m}
							type="button"
							onClick={() => setMode(m)}
							className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
								mode === m
									? "bg-orange-500/15 text-orange-300 border-orange-500/40"
									: "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600"
							}`}
						>
							{m === "single"
								? "Single Connection"
								: "6 Connections (browser default)"}
						</button>
					))}
				</div>

				<div className="flex items-center gap-3">
					<span className="text-xs text-zinc-400">CSS delay:</span>
					<input
						type="range"
						min={0}
						max={4}
						step={0.5}
						value={slowDelay}
						onChange={(e) => setSlowDelay(Number(e.target.value))}
						className="w-28 accent-orange-400"
					/>
					<span className="text-xs text-orange-300 font-mono w-10">
						+{slowDelay}s
					</span>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Waterfall */}
				<div className="space-y-3">
					<div className="rounded-xl bg-zinc-900 border border-zinc-700 p-4 space-y-3">
						<div className="flex items-center justify-between">
							<span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
								Waterfall Timeline
							</span>
							<span className="text-xs text-zinc-500 font-mono">
								total: {totalTime.toFixed(1)}s
							</span>
						</div>

						{/* Timeline grid */}
						<div className="space-y-2">
							{waterfall.map((bar) => {
								const startPct = (bar.start / totalTime) * 100;
								const widthPct = (bar.duration / totalTime) * 100;
								const endTime = bar.start + bar.duration;
								const isCompleted = currentTime >= endTime;
								const isInProgress =
									currentTime >= bar.start && currentTime < endTime;
								const progressInBar = isInProgress
									? ((currentTime - bar.start) / bar.duration) * 100
									: 0;

								return (
									<div key={bar.id} className="flex items-center gap-2">
										<span className="text-xs text-zinc-400 w-8 font-mono shrink-0">
											{bar.label}
										</span>
										<div className="flex-1 h-5 bg-zinc-800 rounded relative overflow-hidden">
											{/* Ghost bar (full extent) */}
											<div
												className={`absolute top-0 h-full rounded opacity-20 ${bar.color}`}
												style={{
													left: `${startPct}%`,
													width: `${widthPct}%`,
												}}
											/>
											{/* Active fill */}
											{animating || progress > 0 ? (
												<motion.div
													className={`absolute top-0 h-full rounded ${bar.color}`}
													style={{ left: `${startPct}%` }}
													animate={{
														width: isCompleted
															? `${widthPct}%`
															: isInProgress
																? `${(progressInBar / 100) * widthPct}%`
																: "0%",
													}}
													transition={{ duration: 0.05 }}
												/>
											) : null}
										</div>
										{mode === "single" &&
											bar.id !== "html" &&
											bar.id !== "css" && (
												<span className="text-xs text-red-400 w-14 shrink-0">
													{animating || progress > 0 ? "" : "blocked"}
												</span>
											)}
									</div>
								);
							})}
						</div>

						{/* Time indicator */}
						{(animating || progress > 0) && (
							<div className="relative h-1 bg-zinc-800 rounded-full mt-1">
								<motion.div
									className="absolute top-0 left-0 h-full bg-zinc-400 rounded-full"
									animate={{ width: `${progress * 100}%` }}
									transition={{ duration: 0.05 }}
								/>
							</div>
						)}

						{/* Summary */}
						<AnimatePresence>
							{progress >= 1 && (
								<motion.div
									initial={{ opacity: 0, y: 4 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0 }}
									className={`text-xs px-3 py-2 rounded-lg border ${
										mode === "single"
											? "bg-red-500/10 text-red-300 border-red-500/20"
											: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
									}`}
								>
									{mode === "single"
										? `Total: ${totalTime.toFixed(1)}s — CSS blocked all resources behind it`
										: `Total: ${(1 + slowDelay).toFixed(1)}s — 6 parallel connections, CSS runs independently`}
								</motion.div>
							)}
						</AnimatePresence>
					</div>

					<button
						type="button"
						onClick={animating ? stopAnimation : startAnimation}
						className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors ${
							animating
								? "bg-zinc-700 text-zinc-300"
								: "bg-violet-600 hover:bg-violet-500 text-white"
						}`}
					>
						{animating ? "Stop" : progress > 0 ? "Replay" : "Animate"}
					</button>
				</div>

				{/* Code + explanation */}
				<div className="space-y-4">
					<div className="space-y-2">
						<h4 className="text-sm font-semibold text-zinc-300">
							{mode === "single"
								? "HTTP/1.1 Head-of-Line Blocking"
								: "HTTP/1.1 Parallel Connections"}
						</h4>
						<p className="text-sm text-zinc-400">
							{mode === "single"
								? "On a single TCP connection, requests are serialized. A slow response blocks every request queued behind it — the CSS here holds up all images."
								: "Browsers open up to 6 parallel TCP connections per domain. This helps, but each connection still suffers from HOL blocking internally. HTTP/2 makes this workaround unnecessary."}
						</p>
					</div>

					<ShikiCode
						language="javascript"
						code={
							mode === "single"
								? `// HTTP/1.1 — one connection, strict ordering
// Request 1
GET /index.html  → 0.6s

// Request 2 (blocked on same connection)
GET /style.css   → ${(1 + slowDelay).toFixed(1)}s  ← slow!

// Requests 3-6 (all waiting for CSS)
GET /img1.jpg    → blocked until CSS done
GET /img2.jpg    → blocked
GET /img3.jpg    → blocked
GET /img4.jpg    → blocked

// Total: ${totalTime.toFixed(1)}s`
								: `// HTTP/1.1 — browser opens up to 6 connections
// All to the same domain (e.g., example.com)
// Connection 1 → HTML
// Connection 2 → CSS (slow!)
// Connection 3 → img1 (runs in parallel)
// Connection 4 → img2 (runs in parallel)
// Connection 5 → img3 (runs in parallel)
// Connection 6 → img4 (runs in parallel)

// Total: ${(1 + slowDelay).toFixed(1)}s (CSS runs independently)
// Cost: 6 TCP handshakes + 6 TLS negotiations`
						}
						showLineNumbers={false}
						className="text-xs"
					/>

					<div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700 space-y-2">
						<p className="text-xs font-semibold text-zinc-300">
							Common HTTP/1.1 workarounds
						</p>
						<ul className="text-xs text-zinc-400 space-y-1">
							<li className="flex gap-2">
								<span className="text-orange-400">•</span> Domain sharding
								(multiple hostnames to exceed the 6-connection limit)
							</li>
							<li className="flex gap-2">
								<span className="text-orange-400">•</span> CSS/JS concatenation
								(fewer requests)
							</li>
							<li className="flex gap-2">
								<span className="text-orange-400">•</span> CSS sprites (combine
								images)
							</li>
							<li className="flex gap-2">
								<span className="text-orange-400">•</span> Inline critical CSS
							</li>
						</ul>
						<p className="text-xs text-zinc-500 pt-1">
							All of these become anti-patterns under HTTP/2.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
