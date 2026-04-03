import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { match } from "ts-pattern";

type Optimization = "sequential" | "parallel" | "graphql" | "prefetch";

interface Request {
	id: string;
	label: string;
	depth: number;
	startTime: number;
	duration: number;
	status: "pending" | "loading" | "complete";
	color: string;
}

interface OptimizationDef {
	id: Optimization;
	label: string;
	icon: string;
	depth: number;
	lcp: number; // Largest Contentful Paint in ms
	description: string;
}

const OPTIMIZATIONS: OptimizationDef[] = [
	{
		id: "sequential",
		label: "Sequential (Original)",
		icon: "🐌",
		depth: 3,
		lcp: 2400,
		description: "Each request waits for previous - slow waterfall",
	},
	{
		id: "parallel",
		label: "Parallel Requests",
		icon: "🚀",
		depth: 1,
		lcp: 800,
		description: "All requests fire at once - over-fetching",
	},
	{
		id: "graphql",
		label: "GraphQL Query",
		icon: "◈",
		depth: 1,
		lcp: 600,
		description: "Single query, exact data - optimal",
	},
	{
		id: "prefetch",
		label: "Prefetch on Hover",
		icon: "⚡",
		depth: 1,
		lcp: 200,
		description: "Speculative loading before click",
	},
];

const REQUEST_CONFIGS: Record<Optimization, Omit<Request, "status">[]> = {
	sequential: [
		{
			id: "user",
			label: "/user",
			depth: 0,
			startTime: 0,
			duration: 600,
			color: "#fb7185",
		},
		{
			id: "posts",
			label: "/user/posts",
			depth: 1,
			startTime: 600,
			duration: 600,
			color: "#fbbf24",
		},
		{
			id: "comments",
			label: "/post/:id/comments",
			depth: 2,
			startTime: 1200,
			duration: 600,
			color: "#60a5fa",
		},
	],
	parallel: [
		{
			id: "user",
			label: "/user",
			depth: 0,
			startTime: 0,
			duration: 600,
			color: "#fb7185",
		},
		{
			id: "posts",
			label: "/user/posts",
			depth: 0,
			startTime: 0,
			duration: 600,
			color: "#fbbf24",
		},
		{
			id: "comments",
			label: "/post/:id/comments",
			depth: 0,
			startTime: 0,
			duration: 600,
			color: "#60a5fa",
		},
		{
			id: "profile",
			label: "/user/profile",
			depth: 0,
			startTime: 0,
			duration: 600,
			color: "#a78bfa",
		},
	],
	graphql: [
		{
			id: "query",
			label: "POST /graphql",
			depth: 0,
			startTime: 0,
			duration: 600,
			color: "#22d3ee",
		},
	],
	prefetch: [
		{
			id: "prefetch",
			label: "Prefetched on hover",
			depth: 0,
			startTime: -400,
			duration: 400,
			color: "#34d399",
		},
		{
			id: "final",
			label: "Final request",
			depth: 0,
			startTime: 0,
			duration: 200,
			color: "#22d3ee",
		},
	],
};

export function WaterfallOptimizerDemo() {
	const [selected, setSelected] = useState<Optimization>("sequential");
	const [running, setRunning] = useState(false);
	const [requests, setRequests] = useState<Request[]>([]);
	const [currentTime, setCurrentTime] = useState(0);
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
		setRequests([]);
		setCurrentTime(0);
	}, [clearTimers]);

	const runAnimation = useCallback(() => {
		reset();
		setRunning(true);

		const config = REQUEST_CONFIGS[selected];
		const initialRequests: Request[] = config.map((r) => ({
			...r,
			status: "pending" as const,
		}));

		setRequests(initialRequests);

		// Time tracker
		const startTime = Date.now();
		const interval = setInterval(() => {
			setCurrentTime(Date.now() - startTime);
		}, 50);
		intervalsRef.current.push(interval);

		// Schedule request state changes
		config.forEach((req) => {
			const adjustedStart = Math.max(0, req.startTime);

			// Start loading
			const startTimeout = setTimeout(() => {
				setRequests((prev) =>
					prev.map((r) =>
						r.id === req.id ? { ...r, status: "loading" as const } : r,
					),
				);
			}, adjustedStart);
			timeoutsRef.current.push(startTimeout);

			// Complete
			const completeTimeout = setTimeout(() => {
				setRequests((prev) =>
					prev.map((r) =>
						r.id === req.id ? { ...r, status: "complete" as const } : r,
					),
				);
			}, adjustedStart + req.duration);
			timeoutsRef.current.push(completeTimeout);
		});

		// End animation
		const maxEndTime = Math.max(
			...config.map((r) => Math.max(0, r.startTime) + r.duration),
		);
		const endTimeout = setTimeout(() => {
			setRunning(false);
		}, maxEndTime + 200);
		timeoutsRef.current.push(endTimeout);
	}, [selected, reset]);

	// Reset animation when optimization changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: <need selected deps for reset the animation>
	useEffect(() => {
		reset();
	}, [selected, reset]);

	useEffect(() => () => clearTimers(), [clearTimers]);

	const optimization =
		OPTIMIZATIONS.find((o) => o.id === selected) ?? OPTIMIZATIONS[0];
	const timeScale = 3000; // 3s timeline

	return (
		<div className="space-y-6">
			{/* Optimization selector */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
				{OPTIMIZATIONS.map((opt) => {
					const isSelected = selected === opt.id;
					const lcpColor =
						opt.lcp <= 600 ? "green" : opt.lcp <= 1200 ? "amber" : "rose";
					const className = isSelected
						? "bg-violet-500/15 text-accent-violet border-violet-500/40"
						: "bg-surface-secondary text-text-tertiary border-border-secondary hover:border-border-tertiary";

					return (
						<button
							key={opt.id}
							type="button"
							onClick={() => setSelected(opt.id)}
							className={`px-4 py-3 rounded-lg text-sm font-semibold border transition-all ${className}`}
						>
							<div className="text-xl mb-1">{opt.icon}</div>
							<div className="mb-1">{opt.label}</div>
							<div
								className={`text-xs ${
									isSelected
										? match(lcpColor)
												.with("green", () => "text-accent-green")
												.with("amber", () => "text-accent-amber")
												.with("rose", () => "text-accent-rose")
												.exhaustive()
										: "text-text-faint"
								}`}
							>
								LCP: {opt.lcp}ms
							</div>
						</button>
					);
				})}
			</div>

			<p className="text-sm text-text-tertiary">{optimization.description}</p>

			{/* Metrics */}
			<div className="grid grid-cols-3 gap-3">
				<div className="bg-surface-primary border border-border-secondary rounded-lg p-4">
					<div className="text-xs text-text-muted mb-1">Waterfall Depth</div>
					<div className="text-3xl font-bold text-text-primary">
						{optimization.depth}
					</div>
				</div>
				<div className="bg-surface-primary border border-border-secondary rounded-lg p-4">
					<div className="text-xs text-text-muted mb-1">LCP (ms)</div>
					<div
						className={`text-3xl font-bold ${
							optimization.lcp <= 600
								? "text-accent-green-soft"
								: optimization.lcp <= 1200
									? "text-accent-amber-soft"
									: "text-accent-rose-soft"
						}`}
					>
						{optimization.lcp}
					</div>
				</div>
				<div className="bg-surface-primary border border-border-secondary rounded-lg p-4">
					<div className="text-xs text-text-muted mb-1">Requests</div>
					<div className="text-3xl font-bold text-text-primary">
						{requests.length}
					</div>
				</div>
			</div>

			{/* Waterfall visualization */}
			<div className="bg-surface-primary border border-border-secondary rounded-xl p-6">
				<div className="flex items-center justify-between mb-4">
					<div className="text-xs text-text-muted font-mono">
						Request Timeline
					</div>
					<div className="text-xs text-text-tertiary font-mono">
						{running ? `${currentTime}ms` : "Ready"}
					</div>
				</div>

				{/* Timeline */}
				<div className="relative h-64 bg-surface-secondary/50 rounded-lg p-4">
					{/* Time markers */}
					<div className="absolute top-0 left-0 right-0 flex justify-between px-4 text-xs text-text-faint font-mono">
						{selected === "prefetch" ? (
							<>
								<span>-400ms</span>
								<span>0ms</span>
								<span>200ms</span>
							</>
						) : (
							<>
								<span>0ms</span>
								<span>800ms</span>
								<span>1600ms</span>
								<span>2400ms</span>
							</>
						)}
					</div>

					{/* Current time indicator */}
					{running && (
						<motion.div
							className="absolute top-0 bottom-0 w-0.5 bg-violet-400 z-10"
							style={{
								left:
									selected === "prefetch"
										? `${((currentTime + 400) / 600) * 100}%`
										: `${(currentTime / timeScale) * 100}%`,
							}}
						>
							<div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-violet-400 rounded-full" />
						</motion.div>
					)}

					{/* Requests */}
					<div className="relative h-full pt-8">
						<div className="space-y-3">
							{requests.map((req) => {
								const timelineStart = selected === "prefetch" ? -400 : 0;
								const timelineEnd = selected === "prefetch" ? 200 : timeScale;
								const timelineRange = timelineEnd - timelineStart;

								const leftPercent =
									((req.startTime - timelineStart) / timelineRange) * 100;
								const widthPercent = (req.duration / timelineRange) * 100;

								return (
									<div key={req.id} className="relative h-10">
										<div
											className="absolute inset-y-0 flex items-center"
											style={{
												left: `${Math.max(0, leftPercent)}%`,
												width: `${widthPercent}%`,
											}}
										>
											<div className="relative w-full h-8 rounded overflow-hidden bg-surface-tertiary/50 border border-border-tertiary">
												<div className="absolute inset-0 flex items-center px-2 z-10">
													<span className="text-xs font-mono text-text-primary truncate">
														{req.label}
													</span>
												</div>

												<AnimatePresence>
													{req.status !== "pending" && (
														<motion.div
															initial={{ width: 0 }}
															animate={{
																width:
																	req.status === "complete" ? "100%" : "70%",
															}}
															transition={{ duration: req.duration / 1000 }}
															className="absolute inset-y-0 left-0"
															style={{
																backgroundColor: req.color,
																opacity: 0.7,
															}}
														/>
													)}
												</AnimatePresence>

												{req.status === "loading" && (
													<motion.div
														className="absolute inset-y-0 right-0 w-1 bg-white"
														animate={{ opacity: [1, 0.3, 1] }}
														transition={{
															duration: 0.6,
															repeat: Number.POSITIVE_INFINITY,
														}}
													/>
												)}
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>

				<button
					type="button"
					onClick={running ? reset : runAnimation}
					className={`mt-4 w-full py-2 rounded-lg text-sm font-semibold transition-colors ${
						running
							? "bg-surface-tertiary text-text-secondary"
							: "bg-violet-600 hover:bg-violet-500 text-text-primary"
					}`}
				>
					{running ? "⏹ Stop" : requests.length > 0 ? "↺ Replay" : "▶ Animate"}
				</button>
			</div>

			{/* Key insights */}
			<div className="bg-surface-secondary/30 border border-border-secondary rounded-lg p-5">
				<h4 className="text-sm font-semibold text-text-primary mb-3">
					Optimization Strategy
				</h4>
				<div className="space-y-2 text-sm text-text-tertiary">
					{selected === "sequential" && (
						<>
							<div className="flex gap-2">
								<span className="text-accent-rose-soft">•</span>
								<span>Depth-3 waterfall adds 1800ms latency</span>
							</div>
							<div className="flex gap-2">
								<span className="text-accent-rose-soft">•</span>
								<span>Each request blocks the next - poor LCP</span>
							</div>
						</>
					)}
					{selected === "parallel" && (
						<>
							<div className="flex gap-2">
								<span className="text-accent-amber-soft">•</span>
								<span>All requests fire at once - depth reduced to 1</span>
							</div>
							<div className="flex gap-2">
								<span className="text-accent-amber-soft">•</span>
								<span>
									Over-fetching trade-off for speed (extra /user/profile)
								</span>
							</div>
						</>
					)}
					{selected === "graphql" && (
						<>
							<div className="flex gap-2">
								<span className="text-accent-cyan-soft">•</span>
								<span>Single query fetches all related data</span>
							</div>
							<div className="flex gap-2">
								<span className="text-accent-cyan-soft">•</span>
								<span>Best of both worlds - fast + no over-fetching</span>
							</div>
						</>
					)}
					{selected === "prefetch" && (
						<>
							<div className="flex gap-2">
								<span className="text-accent-green-soft">•</span>
								<span>Starts loading 400ms before user clicks (on hover)</span>
							</div>
							<div className="flex gap-2">
								<span className="text-accent-green-soft">•</span>
								<span>Instant perceived load - data ready when needed</span>
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
