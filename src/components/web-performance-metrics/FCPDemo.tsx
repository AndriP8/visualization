import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ShikiCode } from "../shared/ShikiCode";

type Scenario = "render-blocking" | "critical-css" | "deferred-js";
type Phase =
	| "idle"
	| "dns"
	| "tcp"
	| "html-dl"
	| "css-dl"
	| "css-parse"
	| "fcp"
	| "done";

interface ResourceTiming {
	name: string;
	start: number;
	duration: number;
	color: string;
}

interface ScenarioConfig {
	id: Scenario;
	label: string;
	description: string;
	fcpTime: number;
	resources: ResourceTiming[];
}

const SCENARIOS: ScenarioConfig[] = [
	{
		id: "render-blocking",
		label: "Render-Blocking CSS",
		description: "Large CSS file blocks first paint",
		fcpTime: 2600,
		resources: [
			{ name: "HTML", start: 0, duration: 400, color: "bg-blue-500" },
			{
				name: "styles.css (300KB)",
				start: 400,
				duration: 1600,
				color: "bg-purple-500",
			},
			{ name: "Parse CSS", start: 2000, duration: 600, color: "bg-purple-400" },
			{ name: "app.js", start: 2600, duration: 800, color: "bg-yellow-500" },
		],
	},
	{
		id: "critical-css",
		label: "Critical CSS Inline",
		description: "Inline above-fold CSS, defer the rest",
		fcpTime: 900,
		resources: [
			{
				name: "HTML + Critical CSS",
				start: 0,
				duration: 600,
				color: "bg-blue-500",
			},
			{
				name: "Parse Inline CSS",
				start: 600,
				duration: 200,
				color: "bg-purple-400",
			},
			{
				name: "styles.css (deferred)",
				start: 800,
				duration: 1200,
				color: "bg-purple-300",
			},
			{
				name: "app.js (async)",
				start: 800,
				duration: 600,
				color: "bg-yellow-400",
			},
		],
	},
	{
		id: "deferred-js",
		label: "Deferred JS",
		description: "Async/defer prevents JS from blocking",
		fcpTime: 1150,
		resources: [
			{ name: "HTML", start: 0, duration: 400, color: "bg-blue-500" },
			{
				name: "critical.css",
				start: 400,
				duration: 600,
				color: "bg-purple-500",
			},
			{ name: "Parse CSS", start: 1000, duration: 150, color: "bg-purple-400" },
			{
				name: "app.js (defer)",
				start: 400,
				duration: 800,
				color: "bg-yellow-300",
			},
		],
	},
];

const getThresholdColor = (value: number): string => {
	if (value <= 1800) return "text-accent-green-soft";
	if (value <= 3000) return "text-accent-yellow-soft";
	return "text-accent-rose-soft";
};

export default function FCPDemo() {
	const [selected, setSelected] = useState<Scenario>("render-blocking");
	const [running, setRunning] = useState(false);
	const [phase, setPhase] = useState<Phase>("idle");
	const [fcpTime, setFcpTime] = useState(0);
	const [currentTime, setCurrentTime] = useState(0);
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
		setFcpTime(0);
		setCurrentTime(0);
		setRunning(false);
	}, [clearTimeouts]);

	const runScenario = useCallback(() => {
		const scenario = SCENARIOS.find((s) => s.id === selected);
		if (!scenario) return;

		reset();
		setRunning(true);

		// Animate current time
		const totalDuration = Math.max(
			...scenario.resources.map((r) => r.start + r.duration),
		);
		const steps = 30;

		for (let i = 0; i <= steps; i++) {
			schedule(() => {
				setCurrentTime((totalDuration / steps) * i);
			}, i * 100);
		}

		// Set FCP at the appropriate time
		const fcpDelay = (scenario.fcpTime / totalDuration) * steps * 100;
		schedule(() => {
			setPhase("fcp");
			setFcpTime(scenario.fcpTime);
		}, fcpDelay);

		schedule(
			() => {
				setPhase("done");
				setRunning(false);
			},
			steps * 100 + 500,
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
									? "bg-violet-500/20 text-accent-violet border-violet-500/30"
									: "bg-surface-secondary text-text-tertiary border-border-secondary hover:text-text-secondary"
							}`}
						>
							{scenario.label}
						</button>
					);
				})}
			</div>

			{/* Description */}
			{currentScenario && (
				<p className="text-sm text-text-tertiary">
					{currentScenario.description}
				</p>
			)}

			{/* Control button */}
			<button
				type="button"
				onClick={running ? reset : runScenario}
				disabled={running}
				className="px-6 py-2 rounded-lg bg-violet-500 text-text-primary font-semibold hover:bg-violet-600 disabled:opacity-50 transition-all"
			>
				{running ? "Running..." : "Run Scenario"}
			</button>

			{/* Visualization */}
			<div className="bg-surface-primary border border-border-primary rounded-lg p-6 space-y-6">
				{/* Network waterfall */}
				<div className="space-y-3">
					<h4 className="text-sm font-semibold text-text-tertiary">
						Network Waterfall
					</h4>
					<div className="space-y-2">
						{currentScenario?.resources.map((resource, idx) => {
							const totalDuration = Math.max(
								...currentScenario.resources.map((r) => r.start + r.duration),
							);
							const startPercent = (resource.start / totalDuration) * 100;
							const widthPercent = (resource.duration / totalDuration) * 100;
							const isActive =
								currentTime >= resource.start &&
								currentTime <= resource.start + resource.duration;
							const isComplete =
								currentTime > resource.start + resource.duration;

							return (
								<div
									key={`${resource.name}-${idx}`}
									className="flex items-center gap-3"
								>
									<div
										className="w-40 text-xs font-mono text-text-tertiary truncate"
										title={resource.name}
									>
										{resource.name}
									</div>
									<div className="flex-1 h-8 bg-surface-secondary rounded relative">
										<AnimatePresence>
											{(isActive || isComplete) && (
												<motion.div
													initial={{ width: 0 }}
													animate={{ width: `${widthPercent}%` }}
													className={`absolute h-full rounded ${resource.color} ${isActive ? "opacity-100" : "opacity-60"}`}
													style={{ left: `${startPercent}%` }}
												>
													<div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-text-primary">
														{resource.duration}ms
													</div>
												</motion.div>
											)}
										</AnimatePresence>
									</div>
								</div>
							);
						})}
					</div>

					{/* Time marker */}
					{running && (
						<div className="text-xs text-text-muted text-right">
							Current time: {Math.round(currentTime)}ms
						</div>
					)}
				</div>

				{/* Viewport paint visualization */}
				<div className="space-y-3">
					<h4 className="text-sm font-semibold text-text-tertiary">Viewport</h4>
					<div
						className="relative bg-white rounded-lg overflow-hidden"
						style={{ aspectRatio: "16/9", maxWidth: "600px" }}
					>
						<AnimatePresence>
							{phase === "idle" && (
								<div className="absolute inset-0 flex items-center justify-center text-text-tertiary text-sm">
									Waiting for content...
								</div>
							)}

							{(phase === "fcp" || phase === "done") && (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									className="absolute inset-0 p-6"
								>
									<motion.div
										initial={{ scale: 0.9 }}
										animate={{ scale: 1 }}
										transition={{ duration: 0.3 }}
									>
										<h1 className="text-2xl font-bold text-gray-900">
											First Content!
										</h1>
										<p className="text-gray-600 mt-2">
											This text marks the First Contentful Paint
										</p>
										<div className="mt-4 space-y-2">
											<div className="h-3 bg-gray-300 rounded w-full" />
											<div className="h-3 bg-gray-300 rounded w-4/5" />
											<div className="h-3 bg-gray-300 rounded w-3/5" />
										</div>
									</motion.div>

									{phase === "fcp" && (
										<motion.div
											initial={{ opacity: 0 }}
											animate={{ opacity: [0, 1, 0] }}
											transition={{ duration: 0.6, repeat: 2 }}
											className="absolute inset-0 border-4 border-green-400"
										/>
									)}
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</div>

				{/* FCP Score display */}
				{fcpTime > 0 && (
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						className="flex items-center justify-between p-4 bg-surface-secondary rounded-lg"
					>
						<div>
							<div className="text-sm font-semibold text-text-secondary">
								First Contentful Paint
							</div>
							<div className="text-xs text-text-muted mt-1">
								Time until first DOM content renders
							</div>
						</div>
						<div className="text-right">
							<div
								className={`text-3xl font-bold ${getThresholdColor(fcpTime)}`}
							>
								{fcpTime}ms
							</div>
							<div className="text-xs text-text-muted mt-1">
								{fcpTime <= 1800
									? "Good"
									: fcpTime <= 3000
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
						<span className="text-text-tertiary">Good: ≤1.8s</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 rounded-full bg-yellow-500" />
						<span className="text-text-tertiary">
							Needs Improvement: 1.8-3s
						</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 rounded-full bg-rose-500" />
						<span className="text-text-tertiary">Poor: &gt;3s</span>
					</div>
				</div>
			</div>

			{/* Code examples */}
			<div className="grid md:grid-cols-2 gap-4">
				<div className="space-y-2">
					<h4 className="text-sm font-semibold text-text-tertiary">
						Before (Blocking)
					</h4>
					<ShikiCode
						language="html"
						code={`<!DOCTYPE html>
<html>
<head>
  <!-- Blocks rendering -->
  <link rel="stylesheet" href="styles.css">
  <script src="app.js"></script>
</head>
<body>
  <h1>Content</h1>
</body>
</html>`}
						className="text-xs"
					/>
				</div>
				<div className="space-y-2">
					<h4 className="text-sm font-semibold text-text-tertiary">
						After (Optimized)
					</h4>
					<ShikiCode
						language="html"
						code={`<!DOCTYPE html>
<html>
<head>
  <!-- Inline critical CSS -->
  <style>
    /* Above-fold styles only */
    h1 { font-size: 2rem; }
  </style>

  <!-- Defer non-critical CSS -->
  <link rel="preload"
        href="styles.css"
        as="style"
        onload="this.rel='stylesheet'">

  <!-- Defer JavaScript -->
  <script src="app.js" defer></script>
</head>
<body>
  <h1>Content</h1>
</body>
</html>`}
						className="text-xs"
					/>
				</div>
			</div>
		</div>
	);
}
