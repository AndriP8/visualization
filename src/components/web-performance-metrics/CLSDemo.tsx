import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ShikiCode } from "../shared/ShikiCode";

type Scenario = "bad-layout" | "reserved-space" | "font-loading";
type Phase =
	| "idle"
	| "initial-render"
	| "ad-load"
	| "image-load"
	| "font-swap"
	| "stable";

interface ScenarioConfig {
	id: Scenario;
	label: string;
	description: string;
	clsScore: number;
	phases: { phase: Phase; delay: number; shift?: boolean }[];
}

const SCENARIOS: ScenarioConfig[] = [
	{
		id: "bad-layout",
		label: "Bad Layout",
		description: "Ad insertion + unsized image causes multiple shifts",
		clsScore: 0.42,
		phases: [
			{ phase: "initial-render", delay: 200 },
			{ phase: "ad-load", delay: 1000, shift: true },
			{ phase: "image-load", delay: 1800, shift: true },
			{ phase: "stable", delay: 2200 },
		],
	},
	{
		id: "reserved-space",
		label: "Reserved Space",
		description: "Aspect ratios + skeleton prevent shifts",
		clsScore: 0.02,
		phases: [
			{ phase: "initial-render", delay: 200 },
			{ phase: "ad-load", delay: 1000 },
			{ phase: "image-load", delay: 1800 },
			{ phase: "stable", delay: 2200 },
		],
	},
	{
		id: "font-loading",
		label: "Font Loading",
		description: "FOUT (Flash of Unstyled Text) causes reflow",
		clsScore: 0.15,
		phases: [
			{ phase: "initial-render", delay: 200 },
			{ phase: "font-swap", delay: 1200, shift: true },
			{ phase: "stable", delay: 1600 },
		],
	},
];

const getThresholdColor = (value: number): string => {
	if (value <= 0.1) return "text-green-400";
	if (value <= 0.25) return "text-yellow-400";
	return "text-rose-400";
};

export default function CLSDemo() {
	const [selected, setSelected] = useState<Scenario>("bad-layout");
	const [running, setRunning] = useState(false);
	const [phase, setPhase] = useState<Phase>("idle");
	const [clsScore, setClsScore] = useState(0);
	const [shifts, setShifts] = useState<number>(0);
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
		setClsScore(0);
		setShifts(0);
		setRunning(false);
	}, [clearTimeouts]);

	const runScenario = useCallback(() => {
		const scenario = SCENARIOS.find((s) => s.id === selected);
		if (!scenario) return;

		reset();
		setRunning(true);

		let currentShifts = 0;
		let currentCls = 0;

		for (const { phase: p, delay, shift } of scenario.phases) {
			schedule(() => {
				setPhase(p);
				if (shift) {
					currentShifts++;
					setShifts(currentShifts);
					// Simulate incremental CLS calculation
					currentCls =
						(scenario.clsScore /
							scenario.phases.filter((ph) => ph.shift).length) *
						currentShifts;
					setClsScore(Number(currentCls.toFixed(3)));
				}
			}, delay);
		}

		schedule(
			() => {
				setClsScore(scenario.clsScore);
				setRunning(false);
			},
			scenario.phases[scenario.phases.length - 1].delay,
		);
	}, [selected, reset, schedule]);

	useEffect(() => {
		return () => clearTimeouts();
	}, [clearTimeouts]);

	const currentScenario = SCENARIOS.find((s) => s.id === selected);
	const showBadLayout = selected === "bad-layout";
	const showReservedSpace = selected === "reserved-space";
	const showFontLoading = selected === "font-loading";

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
				{/* Article mockup */}
				<div className="space-y-3">
					<h4 className="text-sm font-semibold text-zinc-400">
						Article Layout
					</h4>
					<div
						className="relative bg-white rounded-lg overflow-hidden p-6"
						style={{ maxWidth: "600px" }}
					>
						{/* Header */}
						<div
							className={
								showFontLoading && phase === "initial-render"
									? "font-sans"
									: "font-serif"
							}
						>
							<motion.h1
								layout={showFontLoading}
								className={`text-2xl font-bold text-gray-900 ${
									phase === "font-swap"
										? "ring-2 ring-rose-400 ring-offset-2"
										: ""
								}`}
							>
								Understanding Web Performance
							</motion.h1>
						</div>

						<motion.p layout className="text-gray-600 mt-2 text-sm">
							Learn how to optimize your website for better user experience
						</motion.p>

						{/* Ad space */}
						<div className="mt-4">
							<AnimatePresence>
								{phase !== "idle" && phase !== "initial-render" && (
									<motion.div
										layout={showBadLayout}
										initial={
											showBadLayout ? { height: 0, opacity: 0 } : { opacity: 0 }
										}
										animate={
											showBadLayout
												? { height: 100, opacity: 1 }
												: { opacity: 1 }
										}
										className={`bg-gradient-to-r from-amber-200 to-orange-300 rounded border-2 border-amber-400 flex items-center justify-center font-bold text-gray-800 ${
											phase === "ad-load" && showBadLayout
												? "ring-2 ring-rose-400 ring-offset-2"
												: ""
										}`}
										style={showReservedSpace ? { height: "100px" } : undefined}
									>
										Advertisement
									</motion.div>
								)}
								{showReservedSpace && phase === "initial-render" && (
									<motion.div
										className="bg-gray-200 rounded animate-pulse"
										style={{ height: "100px" }}
									/>
								)}
							</AnimatePresence>
						</div>

						{/* Content */}
						<motion.div layout className="mt-4 space-y-2">
							<div className="h-3 bg-gray-300 rounded w-full" />
							<div className="h-3 bg-gray-300 rounded w-5/6" />
							<div className="h-3 bg-gray-300 rounded w-4/6" />
						</motion.div>

						{/* Image space */}
						<div className="mt-4">
							<AnimatePresence>
								{(phase === "image-load" || phase === "stable") && (
									<motion.div
										layout={showBadLayout}
										initial={
											showBadLayout ? { height: 0, opacity: 0 } : { opacity: 0 }
										}
										animate={
											showBadLayout
												? { height: 200, opacity: 1 }
												: { opacity: 1 }
										}
										className={`bg-gradient-to-br from-blue-400 to-purple-500 rounded flex items-center justify-center text-white font-bold ${
											phase === "image-load" && showBadLayout
												? "ring-2 ring-rose-400 ring-offset-2"
												: ""
										}`}
										style={
											showReservedSpace ? { aspectRatio: "16/9" } : undefined
										}
									>
										Article Image
									</motion.div>
								)}
								{showReservedSpace &&
									phase !== "idle" &&
									phase !== "image-load" &&
									phase !== "stable" && (
										<motion.div
											className="bg-gray-200 rounded animate-pulse"
											style={{ aspectRatio: "16/9" }}
										/>
									)}
							</AnimatePresence>
						</div>

						{/* More content */}
						<motion.div layout className="mt-4 space-y-2">
							<div className="h-3 bg-gray-300 rounded w-full" />
							<div className="h-3 bg-gray-300 rounded w-4/5" />
						</motion.div>
					</div>
				</div>

				{/* CLS Score display */}
				<div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
					<div>
						<div className="text-sm font-semibold text-zinc-300">
							Cumulative Layout Shift
						</div>
						<div className="text-xs text-zinc-500 mt-1">
							{shifts > 0
								? `${shifts} layout shift${shifts > 1 ? "s" : ""} detected`
								: "No shifts detected"}
						</div>
					</div>
					<div className="text-right">
						<div
							className={`text-3xl font-bold ${getThresholdColor(clsScore)}`}
						>
							{clsScore.toFixed(3)}
						</div>
						<div className="text-xs text-zinc-500 mt-1">
							{clsScore <= 0.1
								? "Good"
								: clsScore <= 0.25
									? "Needs Improvement"
									: "Poor"}
						</div>
					</div>
				</div>

				{/* Threshold guide */}
				<div className="flex gap-4 text-xs">
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 rounded-full bg-green-500" />
						<span className="text-zinc-400">Good: ≤0.1</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 rounded-full bg-yellow-500" />
						<span className="text-zinc-400">Needs Improvement: 0.1-0.25</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 rounded-full bg-rose-500" />
						<span className="text-zinc-400">Poor: &gt;0.25</span>
					</div>
				</div>
			</div>

			{/* Code examples */}
			<div className="grid md:grid-cols-2 gap-4">
				<div className="space-y-2">
					<h4 className="text-sm font-semibold text-zinc-400">
						Before (Causes Shifts)
					</h4>
					<ShikiCode
						language="css"
						code={`/* No dimensions = layout shift */
img {
  width: 100%;
}

/* Ad loads dynamically */
.ad-container {
  /* No reserved space */
}

/* Font loading causes FOUT */
@font-face {
  font-family: 'CustomFont';
  src: url('font.woff2');
  /* No font-display */
}`}
						className="text-xs"
					/>
				</div>
				<div className="space-y-2">
					<h4 className="text-sm font-semibold text-zinc-400">
						After (Prevents Shifts)
					</h4>
					<ShikiCode
						language="css"
						code={`/* Aspect ratio reserves space */
img {
  width: 100%;
  aspect-ratio: 16/9;
}

/* Reserve space for ad */
.ad-container {
  min-height: 100px;
}

/* Prevent FOUT with font-display */
@font-face {
  font-family: 'CustomFont';
  src: url('font.woff2');
  font-display: optional;
}`}
						className="text-xs"
					/>
				</div>
			</div>
		</div>
	);
}
