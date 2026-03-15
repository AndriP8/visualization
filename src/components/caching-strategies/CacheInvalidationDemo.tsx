import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { match } from "ts-pattern";
import { ShikiCode } from "../shared/ShikiCode";

type Strategy =
	| "cache-aside"
	| "write-through"
	| "write-behind"
	| "read-through";
type OperationType = "read" | "write";
type FlowNodeId = "app" | "cache" | "db";

interface FlowStep {
	from: FlowNodeId;
	to: FlowNodeId;
	label: string;
	color: string;
	dashed?: boolean;
	delay?: boolean;
}

interface StrategyDef {
	id: Strategy;
	name: string;
	tagline: string;
	color: string;
	tradeoffs: { pro: string[]; con: string[] };
	readSteps: FlowStep[];
	readHitSteps: FlowStep[];
	writeSteps: FlowStep[];
	writeRisk?: string;
}

const STRATEGIES: StrategyDef[] = [
	{
		id: "cache-aside",
		name: "Cache-Aside",
		tagline: "Lazy loading — App manages the cache manually",
		color: "violet",
		writeRisk: "⚠️ Risk: race condition can write stale data to cache",
		tradeoffs: {
			pro: ["Resilient to cache failure", "Only caches what's used"],
			con: ["Cache miss = 3 hops", "Race condition on concurrent read/write"],
		},
		readSteps: [
			{ from: "app", to: "cache", label: "1. GET key?", color: "violet" },
			{ from: "cache", to: "app", label: "2. MISS", color: "orange" },
			{ from: "app", to: "db", label: "3. SELECT", color: "violet" },
			{ from: "db", to: "app", label: "4. Row data", color: "cyan" },
			{ from: "app", to: "cache", label: "5. SET key (TTL)", color: "green" },
		],
		readHitSteps: [
			{ from: "app", to: "cache", label: "1. GET key?", color: "violet" },
			{ from: "cache", to: "app", label: "2. HIT ✓", color: "green" },
		],
		writeSteps: [
			{ from: "app", to: "db", label: "1. UPDATE row", color: "violet" },
			{
				from: "app",
				to: "cache",
				label: "2. DEL key (invalidate)",
				color: "orange",
			},
		],
	},
	{
		id: "write-through",
		name: "Write-Through",
		tagline: "Every write goes to cache AND DB synchronously",
		color: "cyan",
		tradeoffs: {
			pro: ["Cache always consistent after writes", "No stale data risk"],
			con: ["Write latency doubled", "Caches un-read data"],
		},
		readSteps: [
			{ from: "app", to: "cache", label: "1. GET key?", color: "cyan" },
			{
				from: "cache",
				to: "app",
				label: "2. MISS (on first read)",
				color: "orange",
			},
			{ from: "app", to: "db", label: "3. SELECT", color: "cyan" },
			{ from: "db", to: "app", label: "4. Row data", color: "green" },
		],
		readHitSteps: [
			{ from: "app", to: "cache", label: "1. GET key?", color: "cyan" },
			{
				from: "cache",
				to: "app",
				label: "2. HIT ✓ (after write)",
				color: "green",
			},
		],
		writeSteps: [
			{ from: "app", to: "cache", label: "1. SET key (sync)", color: "cyan" },
			{ from: "app", to: "db", label: "2. UPDATE (sync)", color: "cyan" },
			{ from: "db", to: "app", label: "3. ACK", color: "green" },
		],
	},
	{
		id: "write-behind",
		name: "Write-Behind",
		tagline: "Write to cache fast; async flush to DB later",
		color: "amber",
		writeRisk: "⚠️ Risk: cache crash before flush = data loss",
		tradeoffs: {
			pro: ["Fastest write latency", "Reduces DB write load"],
			con: ["Data loss if cache crashes", "Complex consistency"],
		},
		readSteps: [
			{ from: "app", to: "cache", label: "1. GET key?", color: "amber" },
			{ from: "cache", to: "app", label: "2. HIT ✓", color: "green" },
		],
		readHitSteps: [
			{ from: "app", to: "cache", label: "1. GET key?", color: "amber" },
			{ from: "cache", to: "app", label: "2. HIT ✓", color: "green" },
		],
		writeSteps: [
			{
				from: "app",
				to: "cache",
				label: "1. SET key (instant)",
				color: "amber",
			},
			{ from: "cache", to: "app", label: "2. ACK immediately", color: "green" },
			{
				from: "cache",
				to: "db",
				label: "3. Async batch flush (later…)",
				color: "zinc",
				dashed: true,
				delay: true,
			},
		],
	},
	{
		id: "read-through",
		name: "Read-Through",
		tagline: "App only talks to cache; cache fetches from DB on miss",
		color: "rose",
		tradeoffs: {
			pro: ["Simple app code", "Auto-populates cache"],
			con: ["Cache is single point of failure", "1st request always slower"],
		},
		readSteps: [
			{ from: "app", to: "cache", label: "1. GET key?", color: "rose" },
			{ from: "cache", to: "db", label: "2. MISS → fetch DB", color: "rose" },
			{ from: "db", to: "cache", label: "3. Row data", color: "cyan" },
			{ from: "cache", to: "app", label: "4. Return + store", color: "green" },
		],
		readHitSteps: [
			{ from: "app", to: "cache", label: "1. GET key?", color: "rose" },
			{ from: "cache", to: "app", label: "2. HIT ✓", color: "green" },
		],
		writeSteps: [
			{
				from: "app",
				to: "db",
				label: "1. Writes go direct to DB",
				color: "rose",
			},
			{ from: "db", to: "app", label: "2. ACK", color: "green" },
		],
	},
];

const colorMap: Record<string, string> = {
	violet: "#a78bfa",
	cyan: "#67e8f9",
	amber: "#fbbf24",
	rose: "#fb7185",
	green: "#4ade80",
	orange: "#fb923c",
	zinc: "#71717a",
};

const buttonColorClasses: Record<string, { active: string; inactive: string }> =
	{
		violet: {
			active: "bg-violet-500/15 text-violet-300 border-violet-500/40",
			inactive:
				"bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600",
		},
		cyan: {
			active: "bg-cyan-500/15 text-cyan-300 border-cyan-500/40",
			inactive:
				"bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600",
		},
		amber: {
			active: "bg-amber-500/15 text-amber-300 border-amber-500/40",
			inactive:
				"bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600",
		},
		rose: {
			active: "bg-rose-500/15 text-rose-300 border-rose-500/40",
			inactive:
				"bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600",
		},
	};

type StepState = "past" | "current" | "future";

function getStepState(idx: number, active: number): StepState {
	return match({ idx, active })
		.when(
			({ idx, active }) => idx < active,
			() => "past" as const,
		)
		.when(
			({ idx, active }) => idx === active,
			() => "current" as const,
		)
		.otherwise(() => "future" as const);
}

function getNodeAnimation(
	currentStep: FlowStep | undefined,
	nodeId: FlowNodeId,
) {
	return match(currentStep)
		.when(
			(step): step is FlowStep =>
				step !== undefined && (step.from === nodeId || step.to === nodeId),
			(step) => ({
				borderColor: colorMap[step.color],
				backgroundColor: `${colorMap[step.color]}15`,
			}),
		)
		.otherwise(() => ({
			borderColor: "#3f3f46",
			backgroundColor: "#27272a99",
		}));
}

function getStepAnimation(state: StepState) {
	return match(state)
		.with("past", () => ({ opacity: 0.4, y: 0 }))
		.with("current", () => ({ opacity: 1, y: 0 }))
		.with("future", () => ({ opacity: 0.15, y: 0 }))
		.exhaustive();
}

function getBorderColor(step: FlowStep, state: StepState): string {
	return match(state)
		.with("past", "current", () => colorMap[step.color])
		.with("future", () => "#3f3f46")
		.exhaustive();
}

function getStepBackgroundColor(
	step: FlowStep,
	state: StepState,
): string | undefined {
	return match(state)
		.with("current", () => `${colorMap[step.color]}15`)
		.with("past", "future", () => undefined)
		.exhaustive();
}

function FlowDiagram({ steps, active }: { steps: FlowStep[]; active: number }) {
	const nodes: { id: FlowNodeId; label: string; icon: string }[] = [
		{ id: "app", label: "App Server", icon: "📦" },
		{ id: "cache", label: "Cache (Redis)", icon: "⚡" },
		{ id: "db", label: "Database", icon: "🗄️" },
	];

	const nodePos: Record<FlowNodeId, number> = { app: 0, cache: 1, db: 2 };

	return (
		<div className="space-y-4">
			{/* Node row */}
			<div className="grid grid-cols-3 gap-3">
				{nodes.map((n) => {
					const currentStep = steps[active];
					const animation = getNodeAnimation(currentStep, n.id);

					return (
						<motion.div
							key={n.id}
							animate={animation}
							transition={{ duration: 0.3 }}
							className="flex flex-col items-center gap-1.5 p-3 rounded-xl border"
						>
							<span className="text-xl">{n.icon}</span>
							<span className="text-xs text-zinc-400 font-medium">
								{n.label}
							</span>
						</motion.div>
					);
				})}
			</div>

			{/* Steps */}
			<div className="space-y-1.5">
				{steps.map((step, idx) => {
					const from = nodePos[step.from];
					const to = nodePos[step.to];
					const isLeft = from < to;
					const state = getStepState(idx, active);
					const animation = getStepAnimation(state);

					return (
						<motion.div
							key={`${step.from}-${step.to}-${step.label}-${idx}`}
							initial={{ opacity: 0, y: 6 }}
							animate={animation}
							transition={{ duration: 0.3 }}
							className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
							style={{ color: colorMap[step.color] }}
						>
							<span className="text-xs font-mono w-4 text-zinc-600">
								{idx + 1}.
							</span>
							<div
								className={`flex-1 h-px ${step.dashed ? "border-t border-dashed" : "border-t"}`}
								style={{
									borderColor: getBorderColor(step, state),
									marginLeft: isLeft
										? `${(Math.min(from, to) * 33.3).toFixed(0)}%`
										: undefined,
								}}
							/>
							<span
								className={`text-xs font-medium px-2 py-0.5 rounded-full ${
									state === "current" ? "ring-1" : ""
								}`}
								style={
									{
										backgroundColor: getStepBackgroundColor(step, state),
										...(state === "current" && {
											"--tw-ring-color": colorMap[step.color],
										}),
									} as React.CSSProperties
								}
							>
								{step.label}
							</span>
							{step.delay && state === "current" && (
								<motion.span
									animate={{ opacity: [1, 0.3, 1] }}
									transition={{
										repeat: Number.POSITIVE_INFINITY,
										duration: 1.5,
									}}
									className="text-xs text-zinc-500"
								>
									⏳
								</motion.span>
							)}
						</motion.div>
					);
				})}
			</div>
		</div>
	);
}

type OperationState = { operation: OperationType; cacheHit: boolean };

function getCurrentSteps(
	strategy: StrategyDef,
	state: OperationState,
): FlowStep[] {
	return match(state)
		.with({ operation: "read", cacheHit: true }, () => strategy.readHitSteps)
		.with({ operation: "read", cacheHit: false }, () => strategy.readSteps)
		.with({ operation: "write" }, () => strategy.writeSteps)
		.exhaustive();
}

export function CacheInvalidationDemo() {
	const [selected, setSelected] = useState<Strategy>("cache-aside");
	const [operation, setOperation] = useState<OperationType>("read");
	const [cacheHit, setCacheHit] = useState(false);
	const [activeStep, setActiveStep] = useState(-1);
	const [running, setRunning] = useState(false);
	const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

	const strategy = STRATEGIES.find((s) => s.id === selected) ?? STRATEGIES[0];
	const currentSteps = getCurrentSteps(strategy, { operation, cacheHit });

	const clearTimeouts = useCallback(() => {
		for (const t of timeoutsRef.current) clearTimeout(t);
		timeoutsRef.current = [];
	}, []);

	const getStepDelay = useCallback(
		(): number =>
			match({ operation, selected })
				.with({ operation: "write", selected: "write-behind" }, () => 900)
				.otherwise(() => 650),
		[operation, selected],
	);

	const runFlow = useCallback(() => {
		if (running) return;
		clearTimeouts();
		setActiveStep(-1);
		setRunning(true);

		const stepDelay = getStepDelay();

		currentSteps.forEach((_, idx) => {
			const t = setTimeout(
				() => {
					setActiveStep(idx);
					if (idx === currentSteps.length - 1) {
						const done = setTimeout(() => setRunning(false), 800);
						timeoutsRef.current.push(done);
					}
				},
				idx * stepDelay + 100,
			);
			timeoutsRef.current.push(t);
		});
	}, [running, clearTimeouts, currentSteps, getStepDelay]);

	const reset = useCallback(() => {
		clearTimeouts();
		setActiveStep(-1);
		setRunning(false);
	}, [clearTimeouts]);

	useEffect(() => {
		reset();
	}, [reset]);

	useEffect(() => () => clearTimeouts(), [clearTimeouts]);

	return (
		<div className="space-y-6">
			{/* Strategy tabs */}
			<div className="flex flex-wrap gap-2">
				{STRATEGIES.map((s) => {
					const colors = buttonColorClasses[s.color];
					const className = match(selected === s.id)
						.with(true, () => colors.active)
						.with(false, () => colors.inactive)
						.exhaustive();

					return (
						<button
							key={s.id}
							type="button"
							onClick={() => setSelected(s.id)}
							className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${className}`}
						>
							{s.name}
						</button>
					);
				})}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Left: controls + diagram */}
				<div className="space-y-4">
					<div>
						<p className="text-sm text-zinc-400 mb-1">{strategy.tagline}</p>
						{strategy.writeRisk && (
							<p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-1">
								{strategy.writeRisk}
							</p>
						)}
					</div>

					{/* Operation & cache state toggles */}
					<div className="flex flex-wrap gap-3">
						<div className="flex rounded-lg overflow-hidden border border-zinc-700">
							{(["read", "write"] as OperationType[]).map((op) => {
								const className = match(operation === op)
									.with(true, () => "bg-violet-600 text-white")
									.with(
										false,
										() => "bg-zinc-800 text-zinc-400 hover:text-white",
									)
									.exhaustive();

								const label = match(op)
									.with("read", () => "📖 Read" as const)
									.with("write", () => "✏️ Write" as const)
									.exhaustive();

								return (
									<button
										key={op}
										type="button"
										onClick={() => setOperation(op)}
										className={`px-4 py-1.5 text-sm font-medium transition-colors ${className}`}
									>
										{label}
									</button>
								);
							})}
						</div>
						{operation === "read" && (
							<button
								type="button"
								onClick={() => setCacheHit((h) => !h)}
								className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-all ${match(
									cacheHit,
								)
									.with(
										true,
										() => "bg-green-500/15 text-green-400 border-green-500/30",
									)
									.with(
										false,
										() =>
											"bg-orange-500/10 text-orange-400 border-orange-500/30",
									)
									.exhaustive()}`}
							>
								{match(cacheHit)
									.with(true, () => "🔥 Cache Hit")
									.with(false, () => "❄️ Cache Miss")
									.exhaustive()}
							</button>
						)}
					</div>

					<FlowDiagram steps={currentSteps} active={activeStep} />

					<button
						type="button"
						onClick={running ? reset : runFlow}
						className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors ${match(
							running,
						)
							.with(true, () => "bg-zinc-700 text-zinc-300")
							.with(false, () => "bg-violet-600 hover:bg-violet-500 text-white")
							.exhaustive()}`}
					>
						{match({ running, hasPlayed: activeStep >= 0 })
							.with({ running: true }, () => "⏹ Stop")
							.with({ running: false, hasPlayed: true }, () => "↺ Replay")
							.with(
								{ running: false, hasPlayed: false },
								() => "▶ Animate Flow",
							)
							.exhaustive()}
					</button>
				</div>

				{/* Right: trade-offs */}
				<div className="space-y-4">
					<h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
						Trade-offs
					</h4>
					<div className="space-y-3">
						<div>
							<p className="text-xs text-green-400 font-semibold mb-1.5 uppercase tracking-wide">
								✓ Pros
							</p>
							<ul className="space-y-1.5">
								{strategy.tradeoffs.pro.map((p) => (
									<li
										key={p}
										className="text-sm text-zinc-300 flex items-start gap-2"
									>
										<span className="text-green-500 mt-0.5">+</span>
										{p}
									</li>
								))}
							</ul>
						</div>
						<div>
							<p className="text-xs text-red-400 font-semibold mb-1.5 uppercase tracking-wide">
								✗ Cons
							</p>
							<ul className="space-y-1.5">
								{strategy.tradeoffs.con.map((c) => (
									<li
										key={c}
										className="text-sm text-zinc-300 flex items-start gap-2"
									>
										<span className="text-red-500 mt-0.5">−</span>
										{c}
									</li>
								))}
							</ul>
						</div>
					</div>

					<div className="mt-4 p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 space-y-2">
						<p className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">
							When to use
						</p>
						{match(selected)
							.with("cache-aside", () => (
								<div className="space-y-2">
									<p className="text-sm text-zinc-400">
										Best default strategy. Use for read-heavy workloads where
										cache availability is not 100% guaranteed. Common with Redis
										+ most web backends.
									</p>
									<div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
										<strong>Race condition:</strong> Thread A reads DB (miss) →
										Thread B updates DB + invalidates cache → Thread A writes
										stale value to cache. Fix: use versioning or Compare-And-Set
										(CAS).
									</div>
								</div>
							))
							.with("write-through", () => (
								<p className="text-sm text-zinc-400">
									Use when read consistency is critical and write volume is
									moderate. Good for user profile data, session stores.
								</p>
							))
							.with("write-behind", () => (
								<p className="text-sm text-zinc-400">
									Use for high write-throughput systems where slight data loss
									is acceptable (analytics counters, view counts). Never use for
									financial data.
								</p>
							))
							.with("read-through", () => (
								<div className="space-y-2">
									<p className="text-sm text-zinc-400">
										App code doesn't need to know whether it's hitting cache or
										DB. The cache layer handles fetching on miss.
									</p>
									<ShikiCode
										language="javascript"
										code={`// Using cache-manager (Node.js)
const cache = await caching('memory', {
  ttl: 600, // 10 min
});

// Auto-populates on miss
const user = await cache.wrap(
  'user:123',
  async () => db.getUser(123)
);`}
										showLineNumbers={false}
										className="text-xs"
									/>
									<p className="text-xs text-zinc-500">
										Libraries:{" "}
										<code className="text-violet-300">cache-manager</code>,{" "}
										<code className="text-violet-300">keyv</code>, or{" "}
										<code className="text-violet-300">node-cache</code> with
										custom wrapper.
									</p>
								</div>
							))
							.exhaustive()}
					</div>
				</div>
			</div>
		</div>
	);
}
