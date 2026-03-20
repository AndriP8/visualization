import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ShikiCode } from "../shared/ShikiCode";

type Scenario = "unoptimized" | "optimized" | "ssr";
type Phase = "idle" | "skeleton" | "text" | "small-img" | "lcp" | "done";

interface ScenarioConfig {
	id: Scenario;
	label: string;
	description: string;
	lcpTime: number;
	phases: { phase: Phase; delay: number }[];
}

const SCENARIOS: ScenarioConfig[] = [
	{
		id: "unoptimized",
		label: "Unoptimized",
		description: "Large hero image loads last, blocking LCP",
		lcpTime: 3800,
		phases: [
			{ phase: "skeleton", delay: 200 },
			{ phase: "text", delay: 800 },
			{ phase: "small-img", delay: 1600 },
			{ phase: "lcp", delay: 3800 },
			{ phase: "done", delay: 4000 },
		],
	},
	{
		id: "optimized",
		label: "Optimized",
		description: "Preload + priority hints load hero early",
		lcpTime: 1200,
		phases: [
			{ phase: "skeleton", delay: 200 },
			{ phase: "lcp", delay: 1200 },
			{ phase: "text", delay: 1400 },
			{ phase: "small-img", delay: 1600 },
			{ phase: "done", delay: 1800 },
		],
	},
	{
		id: "ssr",
		label: "SSR",
		description: "HTML contains LCP element, renders instantly",
		lcpTime: 800,
		phases: [
			{ phase: "text", delay: 400 },
			{ phase: "lcp", delay: 800 },
			{ phase: "small-img", delay: 1200 },
			{ phase: "done", delay: 1400 },
		],
	},
];

const getThresholdColor = (value: number): string => {
	if (value <= 2500)
		return "text-green-400 bg-green-500/20 border-green-500/30";
	if (value <= 4000)
		return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
	return "text-rose-400 bg-rose-500/20 border-rose-500/30";
};

export default function LCPDemo() {
	const [selected, setSelected] = useState<Scenario>("unoptimized");
	const [running, setRunning] = useState(false);
	const [phase, setPhase] = useState<Phase>("idle");
	const [lcpTime, setLcpTime] = useState(0);
	const [completedPhases, setCompletedPhases] = useState<Set<Phase>>(new Set());
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
		setLcpTime(0);
		setCompletedPhases(new Set());
		setRunning(false);
	}, [clearTimeouts]);

	const runScenario = useCallback(() => {
		const scenario = SCENARIOS.find((s) => s.id === selected);
		if (!scenario) return;

		reset();
		setRunning(true);

		for (const { phase: p, delay } of scenario.phases) {
			schedule(() => {
				setPhase(p);
				setCompletedPhases((prev) => new Set([...prev, p]));
				if (p === "lcp") {
					setLcpTime(scenario.lcpTime);
				}
			}, delay);
		}

		schedule(
			() => setRunning(false),
			scenario.phases[scenario.phases.length - 1].delay,
		);
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
				{/* Viewport mockup */}
				<div className="space-y-3">
					<h4 className="text-sm font-semibold text-zinc-400">
						Viewport Simulation
					</h4>
					<div
						className="relative bg-white rounded-lg overflow-hidden"
						style={{ aspectRatio: "16/9", maxWidth: "800px" }}
					>
						{/* Background */}
						<div className="absolute inset-0 bg-linear-to-br from-gray-100 to-gray-200" />

						{/* Content layers */}
						<AnimatePresence>
							{/* Skeleton — only element needing exit animation */}
							{phase === "skeleton" && (
								<motion.div
									key="skeleton"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									className="absolute inset-0 p-8 space-y-4"
								>
									<div className="h-8 bg-gray-300 rounded animate-pulse w-3/4" />
									<div className="h-4 bg-gray-300 rounded animate-pulse w-1/2" />
									<div className="h-64 bg-gray-300 rounded animate-pulse" />
								</motion.div>
							)}
						</AnimatePresence>

						{/* Text content */}
						{completedPhases.has("text") && (
							<motion.div
								key="text"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className="absolute top-8 left-8 z-10"
							>
								<h1 className="text-3xl font-bold text-gray-900">
									Welcome to Our Site
								</h1>
								<p className="text-gray-600 mt-2">
									Experience the future of web
								</p>
							</motion.div>
						)}

						{/* Small image (avatar) */}
						{completedPhases.has("small-img") && (
							<motion.div
								key="small-img"
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{ opacity: 1, scale: 1 }}
								className="absolute top-8 right-8 w-16 h-16 rounded-full bg-linear-to-br from-violet-400 to-purple-600 z-10"
							/>
						)}

						{/* LCP element (hero image) */}
						{completedPhases.has("lcp") && (
							<motion.div
								key="lcp"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className="absolute inset-0 top-24 bg-linear-to-br from-blue-500 via-purple-500 to-pink-500 border-4 border-amber-400"
							>
								<div className="absolute inset-0 flex items-center justify-center">
									<div className="text-white text-6xl font-bold drop-shadow-lg">
										HERO
									</div>
								</div>
								{phase === "lcp" && (
									<motion.div
										initial={{ scale: 1 }}
										animate={{ scale: 1.02 }}
										transition={{ repeat: 3, duration: 0.2 }}
										className="absolute inset-0 border-4 border-amber-400 rounded"
									/>
								)}
							</motion.div>
						)}
					</div>
				</div>

				{/* Timeline */}
				<div className="space-y-3">
					<h4 className="text-sm font-semibold text-zinc-400">Timeline</h4>
					<div className="relative h-16 bg-zinc-800 rounded-lg">
						{/* Time markers */}
						<div className="absolute inset-x-0 top-0 flex justify-between px-2 py-1 text-xs text-zinc-500">
							<span>0ms</span>
							<span>1000ms</span>
							<span>2000ms</span>
							<span>3000ms</span>
							<span>4000ms</span>
						</div>

						{/* Threshold markers */}
						<div className="absolute inset-0 flex items-center">
							{/* Good threshold: 2.5s */}
							<div
								className="absolute h-full border-l-2 border-green-500/30"
								style={{ left: "62.5%" }}
							>
								<div className="absolute -top-1 left-1 text-xs text-green-500">
									Good: 2.5s
								</div>
							</div>
							{/* Poor threshold: 4s */}
							<div
								className="absolute h-full border-l-2 border-rose-500/30"
								style={{ left: "100%" }}
							>
								<div className="absolute -top-1 right-1 text-xs text-rose-500">
									Poor: 4s
								</div>
							</div>
						</div>

						{/* LCP marker */}
						{lcpTime > 0 && (
							<motion.div
								initial={{ scaleX: 0 }}
								animate={{ scaleX: 1 }}
								className="absolute bottom-2 left-0 h-8 bg-violet-500 rounded-r"
								style={{ width: `${Math.min((lcpTime / 4000) * 100, 100)}%` }}
							>
								<div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-white">
									{lcpTime}ms
								</div>
							</motion.div>
						)}
					</div>
				</div>

				{/* Metric display */}
				{lcpTime > 0 && (
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						className="flex items-center justify-between p-4 rounded-lg border"
						style={{
							backgroundColor:
								lcpTime <= 2500
									? "rgb(34 197 94 / 0.1)"
									: lcpTime <= 4000
										? "rgb(234 179 8 / 0.1)"
										: "rgb(244 63 94 / 0.1)",
							borderColor:
								lcpTime <= 2500
									? "rgb(34 197 94 / 0.3)"
									: lcpTime <= 4000
										? "rgb(234 179 8 / 0.3)"
										: "rgb(244 63 94 / 0.3)",
						}}
					>
						<div>
							<div className="text-sm font-semibold text-zinc-300">
								Largest Contentful Paint
							</div>
							<div className="text-xs text-zinc-500 mt-1">
								Time until largest element renders
							</div>
						</div>
						<div
							className={`text-2xl font-bold ${getThresholdColor(lcpTime).split(" ")[0]}`}
						>
							{lcpTime}ms
						</div>
					</motion.div>
				)}
			</div>

			{/* Code examples */}
			<div className="grid md:grid-cols-2 gap-4">
				<div className="space-y-2">
					<h4 className="text-sm font-semibold text-zinc-400">
						Before (Unoptimized)
					</h4>
					<ShikiCode
						language="html"
						code={`<!-- No hints, browser discovers late -->
<img src="hero.jpg" alt="Hero" />

<!-- Render-blocking CSS -->
<link rel="stylesheet" href="styles.css">`}
						className="text-xs"
					/>
				</div>
				<div className="space-y-2">
					<h4 className="text-sm font-semibold text-zinc-400">
						After (Optimized)
					</h4>
					<ShikiCode
						language="html"
						code={`<!-- Preload critical image -->
<link rel="preload" as="image"
      href="hero.webp"
      fetchpriority="high">
<img src="hero.webp"
     fetchpriority="high"
     alt="Hero" />

<!-- Critical CSS inline -->
<style>/* critical CSS */</style>
<link rel="preload"
      href="styles.css"
      as="style"
      onload="this.rel='stylesheet'">`}
						className="text-xs"
					/>
				</div>
			</div>
		</div>
	);
}
