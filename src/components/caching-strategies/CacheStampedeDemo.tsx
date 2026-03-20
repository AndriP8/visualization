import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { match } from "ts-pattern";
import { ShikiCode } from "../shared/ShikiCode";

type Scenario = "stampede" | "early-expiry" | "single-flight";

interface RequestDot {
	id: number;
	x: number; // 0-1 normalized
	phase:
		| "approaching"
		| "hitting-cache"
		| "hitting-db"
		| "returning"
		| "waiting"
		| "resolved";
	color: string;
	delay: number;
}

const COLORS = [
	"#a78bfa",
	"#67e8f9",
	"#fbbf24",
	"#fb7185",
	"#4ade80",
	"#f472b6",
	"#38bdf8",
	"#fb923c",
	"#a3e635",
	"#e879f9",
	"#34d399",
	"#f87171",
	"#60a5fa",
	"#facc15",
	"#c084fc",
];

function generateDots(count: number): RequestDot[] {
	return Array.from({ length: count }, (_, i) => ({
		id: i,
		x: Math.random(),
		phase: "approaching" as const,
		color: COLORS[i % COLORS.length],
		delay: i * 30,
	}));
}

interface ScenarioDef {
	id: Scenario;
	label: string;
	icon: string;
	color: string;
	heading: string;
	description: string;
}

const SCENARIOS: ScenarioDef[] = [
	{
		id: "stampede",
		label: "The Problem",
		icon: "💥",
		color: "rose",
		heading: "Cache Stampede (Thundering Herd)",
		description:
			"A popular key expires. Hundreds of requests simultaneously miss the cache and all race to query the database — which immediately gets overwhelmed.",
	},
	{
		id: "early-expiry",
		label: "Fix 1: Early Expiry",
		icon: "⚡",
		color: "amber",
		heading: "Probabilistic Early Expiration",
		description:
			"Before the key fully expires, a few requests detect it's about to expire and proactively refresh it. By the time the TTL hits, the cache is already warm.",
	},
	{
		id: "single-flight",
		label: "Fix 2: Single-Flight",
		icon: "🔒",
		color: "green",
		heading: "Locking / Single-Flight",
		description:
			"When a key expires, only one request gets a mutex lock to query the database. All other requests queue up and wait, then all receive the same fresh value.",
	},
];

const DOT_COUNT = 15;
const REQUEST_LABEL = "×1000 real requests";

export function CacheStampedeDemo() {
	const [selected, setSelected] = useState<Scenario>("stampede");
	const [running, setRunning] = useState(false);
	const [phase, setPhase] = useState<
		"idle" | "miss" | "db-hit" | "overload" | "refresh" | "queue" | "resolve"
	>("idle");
	const [dbLoad, setDbLoad] = useState(0); // 0-100
	const [dots, setDots] = useState<RequestDot[]>([]);
	const [lockedDotId, setLockedDotId] = useState<number | null>(null);
	const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

	const clearTimeouts = useCallback(() => {
		for (const t of timeoutsRef.current) clearTimeout(t);
		timeoutsRef.current = [];
	}, []);

	const reset = useCallback(() => {
		clearTimeouts();
		setRunning(false);
		setPhase("idle");
		setDbLoad(0);
		setDots([]);
		setLockedDotId(null);
	}, [clearTimeouts]);

	const schedule = useCallback((fn: () => void, delay: number) => {
		const t = setTimeout(fn, delay);
		timeoutsRef.current.push(t);
	}, []);

	const runStampede = useCallback(() => {
		reset();
		setRunning(true);
		setDots(generateDots(DOT_COUNT));

		// Cache miss
		schedule(() => setPhase("miss"), 400);

		// All hit DB
		schedule(() => {
			setPhase("db-hit");
			let load = 0;
			const loadInterval = setInterval(() => {
				load += 12;
				setDbLoad(Math.min(load, 100));
				if (load >= 100) clearInterval(loadInterval);
			}, 80);
			timeoutsRef.current.push(
				loadInterval as unknown as ReturnType<typeof setTimeout>,
			);
		}, 1000);

		// Overload
		schedule(() => setPhase("overload"), 1900);

		// Done
		schedule(() => setRunning(false), 3200);
	}, [reset, schedule]);

	const runEarlyExpiry = useCallback(() => {
		reset();
		setRunning(true);
		const initialDots = generateDots(DOT_COUNT);
		setDots(initialDots);

		// A couple requests detect early expiry and refresh
		schedule(() => {
			setPhase("refresh");
			// Early refreshers get a special treatment indicated in render
		}, 400);

		schedule(() => {
			setPhase("resolve");
			setDbLoad(12); // minimal load
		}, 1200);

		schedule(() => setRunning(false), 2400);
	}, [reset, schedule]);

	const runSingleFlight = useCallback(() => {
		reset();
		setRunning(true);
		const initialDots = generateDots(DOT_COUNT);
		setDots(initialDots);
		setLockedDotId(0); // first dot gets the lock

		schedule(() => setPhase("miss"), 400);
		schedule(() => {
			setPhase("queue");
			setDbLoad(8); // only 1 request hits DB
		}, 900);
		schedule(() => {
			setPhase("resolve");
		}, 1900);
		schedule(() => setRunning(false), 2800);
	}, [reset, schedule]);

	const runScenario = useCallback(() => {
		match(selected)
			.with("stampede", () => runStampede())
			.with("early-expiry", () => runEarlyExpiry())
			.with("single-flight", () => runSingleFlight())
			.exhaustive();
	}, [selected, runStampede, runEarlyExpiry, runSingleFlight]);

	useEffect(() => {
		reset();
	}, [reset]);

	useEffect(() => () => clearTimeouts(), [clearTimeouts]);

	const scenario = SCENARIOS.find((s) => s.id === selected) ?? SCENARIOS[0];

	const dbLoadColor = match(dbLoad)
		.when(
			(load) => load >= 90,
			() => "bg-rose-500",
		)
		.when(
			(load) => load >= 60,
			() => "bg-amber-500",
		)
		.when(
			(load) => load >= 30,
			() => "bg-yellow-500",
		)
		.otherwise(() => "bg-green-500");

	return (
		<div className="space-y-6">
			{/* Tabs */}
			<div className="flex flex-wrap gap-2">
				{SCENARIOS.map((s) => {
					const className = match({
						isSelected: selected === s.id,
						color: s.color,
					})
						.with(
							{ isSelected: true, color: "rose" },
							() => "bg-rose-500/15 text-rose-300 border-rose-500/40",
						)
						.with(
							{ isSelected: true, color: "amber" },
							() => "bg-amber-500/15 text-amber-300 border-amber-500/40",
						)
						.with(
							{ isSelected: true, color: "green" },
							() => "bg-green-500/15 text-green-300 border-green-500/40",
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
							className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${className}`}
						>
							{s.icon} {s.label}
						</button>
					);
				})}
			</div>

			<div>
				<h4 className="text-base font-semibold text-white mb-1">
					{scenario.heading}
				</h4>
				<p className="text-sm text-zinc-400">{scenario.description}</p>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Animation canvas */}
				<div className="space-y-4">
					{/* Stage */}
					<div className="relative rounded-xl bg-zinc-900 border border-zinc-700 overflow-hidden h-64">
						{/* Labels */}
						<div className="absolute top-3 left-3 text-xs text-zinc-500 font-mono">
							Incoming requests{" "}
							{running && (
								<span className="text-zinc-400">({REQUEST_LABEL})</span>
							)}
						</div>

						{/* Cache bar */}
						<div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-28 h-10 rounded-lg border-2 border-dashed flex items-center justify-center text-xs font-semibold">
							{phase === "idle" ||
							(selected === "stampede" && phase === "miss") ? (
								<span className="text-orange-400 border-orange-500/40">
									❌ Cache Miss
								</span>
							) : phase === "refresh" ? (
								<span className="text-amber-300 border-amber-500/40">
									🔄 Refreshing…
								</span>
							) : (
								<span className="text-green-400 border-green-500/40">
									✅ Cache Warm
								</span>
							)}
						</div>

						{/* DB */}
						<div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
							<AnimatePresence>
								{phase === "overload" && (
									<motion.div
										initial={{ opacity: 0, y: -5 }}
										animate={{ opacity: 1, y: 0 }}
										className="text-rose-400 text-xs font-bold animate-pulse"
									>
										🔴 DB OVERLOADED!
									</motion.div>
								)}
							</AnimatePresence>
							<div className="px-4 py-2 rounded-lg bg-zinc-700 border border-zinc-600 text-xs text-zinc-300">
								🗄️ Database
							</div>
							{/* DB load bar */}
							<div className="w-28 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
								<motion.div
									className={`h-full rounded-full transition-colors duration-300 ${dbLoadColor}`}
									animate={{ width: `${dbLoad}%` }}
									transition={{ duration: 0.3 }}
								/>
							</div>
							<span className="text-xs text-zinc-500">DB load: {dbLoad}%</span>
						</div>

						{/* Request dots */}
						{dots.map((dot, i) => {
							const isLocked = dot.id === lockedDotId;
							const isEarlyRefresher =
								selected === "early-expiry" && dot.id < 2;
							const shouldGoToDb =
								selected === "stampede"
									? phase === "db-hit" || phase === "overload"
									: selected === "single-flight"
										? isLocked && (phase === "queue" || phase === "resolve")
										: isEarlyRefresher && phase === "refresh";
							const shouldResolve =
								phase === "resolve" &&
								(selected !== "single-flight" || isLocked);
							const isQueued =
								selected === "single-flight" &&
								!isLocked &&
								(phase === "queue" || phase === "resolve");

							// Position
							const xBase = (dot.x * 70 + 5) / 100; // 5%-75% of width
							const yApproach = 10 + (i % 3) * 12; // top area
							const yDb = 72;
							const yQueue = 45 + (i % 8) * 3;

							let yTarget = yApproach;
							if (shouldGoToDb) yTarget = yDb;
							else if (isQueued) yTarget = yQueue;
							else if (
								shouldResolve ||
								(selected === "early-expiry" &&
									phase === "resolve" &&
									!isEarlyRefresher)
							)
								yTarget = yApproach;

							return (
								<motion.div
									key={dot.id}
									className="absolute"
									style={{
										left: `${xBase * 100}%`,
										top: 0,
									}}
									animate={{
										top: `${yTarget}%`,
										opacity: shouldResolve ? 0 : 1,
									}}
									transition={{
										duration: 0.5,
										delay: isQueued ? 0 : dot.delay / 1000,
										type: "spring",
										stiffness: 200,
										damping: 20,
									}}
								>
									<div
										className="w-3 h-3 rounded-full shadow-lg"
										style={{
											backgroundColor: isLocked ? "#4ade80" : dot.color,
											boxShadow: isLocked
												? `0 0 8px #4ade80`
												: `0 0 6px ${dot.color}60`,
										}}
									/>
									{isLocked && phase === "queue" && (
										<motion.div
											animate={{ scale: [1, 1.5, 1] }}
											transition={{
												repeat: Number.POSITIVE_INFINITY,
												duration: 1,
											}}
											className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs"
										>
											🔐
										</motion.div>
									)}
								</motion.div>
							);
						})}
					</div>

					{/* Status */}
					<AnimatePresence mode="wait">
						<motion.div
							key={phase}
							initial={{ opacity: 0, y: 4 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0 }}
							className={`text-sm px-3 py-2 rounded-lg border ${
								phase === "overload"
									? "bg-rose-500/10 text-rose-300 border-rose-500/20"
									: phase === "resolve"
										? "bg-green-500/10 text-green-300 border-green-500/20"
										: phase === "queue"
											? "bg-amber-500/10 text-amber-300 border-amber-500/20"
											: "bg-zinc-800 text-zinc-400 border-zinc-700"
							}`}
						>
							{phase === "idle" && "Click Animate to start"}
							{phase === "miss" &&
								"⚠️ Popular cache key expired — all requests MISS"}
							{phase === "db-hit" &&
								selected === "stampede" &&
								"🔥 All requests flooding the DB simultaneously…"}
							{phase === "overload" &&
								"💥 Database overloaded! Queries timing out."}
							{phase === "refresh" &&
								"⚡ 2 requests detected near-expiry and proactively refreshed"}
							{phase === "resolve" &&
								selected === "early-expiry" &&
								"✅ Cache already warm when others arrived — minimal DB load"}
							{phase === "queue" &&
								"🔒 1 request holds the lock. Others wait in queue…"}
							{phase === "resolve" &&
								selected === "single-flight" &&
								"✅ Lock released — all queued requests receive the same fresh value"}
						</motion.div>
					</AnimatePresence>

					<button
						type="button"
						onClick={running ? reset : runScenario}
						className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors ${
							running
								? "bg-zinc-700 text-zinc-300"
								: "bg-violet-600 hover:bg-violet-500 text-white"
						}`}
					>
						{running ? "⏹ Stop" : phase !== "idle" ? "↺ Replay" : "▶ Animate"}
					</button>
				</div>

				{/* Explanation */}
				<div className="space-y-4">
					<h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
						Implementation Notes
					</h4>

					{selected === "stampede" && (
						<div className="space-y-3 text-sm text-zinc-400">
							<p>When a hot cache key expires under high traffic:</p>
							<ul className="space-y-2">
								<li className="flex gap-2">
									<span className="text-rose-400">1.</span>N concurrent requests
									all get a cache miss
								</li>
								<li className="flex gap-2">
									<span className="text-rose-400">2.</span>All independently
									query the DB
								</li>
								<li className="flex gap-2">
									<span className="text-rose-400">3.</span>DB gets N
									simultaneous identical queries
								</li>
								<li className="flex gap-2">
									<span className="text-rose-400">4.</span>DB latency spikes →
									timeout cascade
								</li>
							</ul>
							<div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
								⚠️ This can bring down your entire backend. Popular keys should
								never expire simultaneously.
							</div>
						</div>
					)}

					{selected === "early-expiry" && (
						<div className="space-y-3 text-sm text-zinc-400">
							<p>Add jitter + proactive refresh before TTL hits:</p>
							<ShikiCode
								language="javascript"
								code={`// XFetch algorithm (probabilistic early expiration)
const delta = timeToRecompute;
const beta = 1.0;  // aggressiveness factor
const timeUntilExpiry = expiry - Date.now();

if (timeUntilExpiry < delta * beta * Math.log(Math.random())) {
  await refreshCache();  // proactively refresh early!
}`}
								showLineNumbers={false}
								className="text-xs"
							/>
							<p className="text-xs">
								The{" "}
								<code className="text-amber-300">Math.log(Math.random())</code>{" "}
								introduces probabilistic spread — some requests refresh early at
								random times, preventing a thundering herd at the exact expiry
								moment. Based on the XFetch paper (Vattani et al., 2015).
							</p>
						</div>
					)}

					{selected === "single-flight" && (
						<div className="space-y-3 text-sm text-zinc-400">
							<p>Deduplicate in-flight requests with a pending promise map:</p>
							<ShikiCode
								language="javascript"
								code={`const pending = new Map();

async function getWithLock(key) {
  if (pending.has(key)) {
    // Wait for in-flight request
    return pending.get(key);
  }

  const promise = db.query(key);
  pending.set(key, promise);

  try {
    return await promise;
  } finally {
    pending.delete(key);
  }
}`}
								showLineNumbers={false}
								className="text-xs"
							/>
							<p className="text-xs">
								All concurrent requests for the same key share one Promise. Only
								the first caller hits the DB — others wait and receive the same
								result.
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
