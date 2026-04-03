import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ShikiCode } from "../shared/ShikiCode";

type Scenario = "heavy-handler" | "debounced" | "optimistic-ui";
type Phase =
	| "idle"
	| "click-registered"
	| "handler-start"
	| "handler-executing"
	| "render-queued"
	| "paint"
	| "done";

interface ScenarioConfig {
	id: Scenario;
	label: string;
	description: string;
	inpTime: number;
	phases: { phase: Phase; delay: number; duration?: number }[];
}

const SCENARIOS: ScenarioConfig[] = [
	{
		id: "heavy-handler",
		label: "Heavy Handler",
		description: "500ms blocking JavaScript execution",
		inpTime: 520,
		phases: [
			{ phase: "click-registered", delay: 0 },
			{ phase: "handler-start", delay: 20 },
			{ phase: "handler-executing", delay: 40, duration: 500 },
			{ phase: "render-queued", delay: 540 },
			{ phase: "paint", delay: 560 },
			{ phase: "done", delay: 580 },
		],
	},
	{
		id: "debounced",
		label: "Debounced",
		description: "Work deferred to idle time with requestIdleCallback",
		inpTime: 80,
		phases: [
			{ phase: "click-registered", delay: 0 },
			{ phase: "handler-start", delay: 20 },
			{ phase: "render-queued", delay: 40 },
			{ phase: "paint", delay: 60 },
			{ phase: "done", delay: 80 },
		],
	},
	{
		id: "optimistic-ui",
		label: "Optimistic UI",
		description: "Immediate visual feedback before processing",
		inpTime: 20,
		phases: [
			{ phase: "click-registered", delay: 0 },
			{ phase: "paint", delay: 20 },
			{ phase: "done", delay: 40 },
		],
	},
];

const getThresholdColor = (value: number): string => {
	if (value <= 200) return "text-accent-green-soft";
	if (value <= 500) return "text-accent-yellow-soft";
	return "text-accent-rose-soft";
};

export default function INPDemo() {
	const [selected, setSelected] = useState<Scenario>("heavy-handler");
	const [running, setRunning] = useState(false);
	const [phase, setPhase] = useState<Phase>("idle");
	const [inpTime, setInpTime] = useState(0);
	const [clickPosition, setClickPosition] = useState<{
		x: number;
		y: number;
	} | null>(null);
	const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
	const buttonRef = useRef<HTMLButtonElement>(null);

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
		setInpTime(0);
		setClickPosition(null);
		setRunning(false);
	}, [clearTimeouts]);

	const runScenario = useCallback(() => {
		const scenario = SCENARIOS.find((s) => s.id === selected);
		if (!scenario) return;

		reset();
		setRunning(true);

		// Get button position for sparkle effect
		if (buttonRef.current) {
			const rect = buttonRef.current.getBoundingClientRect();
			setClickPosition({
				x: rect.left + rect.width / 2,
				y: rect.top + rect.height / 2,
			});
		}

		for (const { phase: p, delay } of scenario.phases) {
			schedule(() => {
				setPhase(p);
				if (p === "done") {
					setInpTime(scenario.inpTime);
				}
			}, delay);
		}

		schedule(
			() => {
				setRunning(false);
				setClickPosition(null);
			},
			scenario.phases[scenario.phases.length - 1].delay + 500,
		);
	}, [selected, reset, schedule]);

	useEffect(() => {
		return () => clearTimeouts();
	}, [clearTimeouts]);

	const currentScenario = SCENARIOS.find((s) => s.id === selected);
	const currentPhaseConfig = currentScenario?.phases.find(
		(p) => p.phase === phase,
	);

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
				{/* Interactive button */}
				<div className="space-y-3">
					<h4 className="text-sm font-semibold text-text-tertiary">
						User Interaction
					</h4>
					<div className="flex items-center justify-center py-12 relative">
						<button
							ref={buttonRef}
							type="button"
							onClick={runScenario}
							disabled={running}
							className="relative px-8 py-4 rounded-lg bg-blue-500 text-text-primary font-bold text-lg hover:bg-blue-600 disabled:opacity-50 transition-all"
						>
							Click Me!
						</button>

						{/* Click sparkle effect */}
						<AnimatePresence>
							{clickPosition && phase === "click-registered" && (
								<motion.div
									initial={{ scale: 0, opacity: 1 }}
									animate={{ scale: 3, opacity: 0 }}
									exit={{ opacity: 0 }}
									className="absolute w-8 h-8 rounded-full border-4 border-amber-400"
									style={{
										left: clickPosition.x - 16,
										top: clickPosition.y - 16,
									}}
								/>
							)}
						</AnimatePresence>

						{/* Visual feedback for optimistic UI */}
						{selected === "optimistic-ui" &&
							(phase === "click-registered" || phase === "paint") && (
								<motion.div
									initial={{ scale: 0 }}
									animate={{ scale: 1 }}
									className="absolute -right-4 -top-4 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-text-primary text-xl"
								>
									✓
								</motion.div>
							)}
					</div>
				</div>

				{/* Event timeline */}
				<div className="space-y-3">
					<h4 className="text-sm font-semibold text-text-tertiary">
						Event Timeline
					</h4>
					<div className="space-y-2">
						{/* Click registered */}
						<div className="flex items-center gap-3">
							<div
								className={`w-32 text-xs font-mono ${phase === "click-registered" ? "text-accent-violet-soft" : "text-text-muted"}`}
							>
								Click
							</div>
							<div className="flex-1 h-2 bg-surface-secondary rounded-full overflow-hidden">
								{phase === "click-registered" && (
									<motion.div
										initial={{ width: 0 }}
										animate={{ width: "100%" }}
										transition={{ duration: 0.3 }}
										className="h-full bg-violet-500"
									/>
								)}
							</div>
						</div>

						{/* Handler execution */}
						<div className="flex items-center gap-3">
							<div
								className={`w-32 text-xs font-mono ${phase === "handler-start" || phase === "handler-executing" ? "text-accent-amber-soft" : "text-text-muted"}`}
							>
								Handler
							</div>
							<div className="flex-1 h-8 bg-surface-secondary rounded overflow-hidden relative">
								{(phase === "handler-start" ||
									phase === "handler-executing") && (
									<>
										<motion.div
											initial={{ width: 0 }}
											animate={{ width: "100%" }}
											transition={{
												duration: (currentPhaseConfig?.duration || 50) / 1000,
											}}
											className="h-full bg-amber-500"
										/>
										{currentPhaseConfig?.duration &&
											currentPhaseConfig.duration > 200 && (
												<div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-text-primary">
													{currentPhaseConfig.duration}ms (Blocking!)
												</div>
											)}
									</>
								)}
							</div>
						</div>

						{/* Render */}
						<div className="flex items-center gap-3">
							<div
								className={`w-32 text-xs font-mono ${phase === "render-queued" ? "text-accent-cyan-soft" : "text-text-muted"}`}
							>
								Render
							</div>
							<div className="flex-1 h-2 bg-surface-secondary rounded-full overflow-hidden">
								{phase === "render-queued" && (
									<motion.div
										initial={{ width: 0 }}
										animate={{ width: "100%" }}
										transition={{ duration: 0.2 }}
										className="h-full bg-cyan-500"
									/>
								)}
							</div>
						</div>

						{/* Paint */}
						<div className="flex items-center gap-3">
							<div
								className={`w-32 text-xs font-mono ${phase === "paint" || phase === "done" ? "text-accent-green-soft" : "text-text-muted"}`}
							>
								Paint
							</div>
							<div className="flex-1 h-2 bg-surface-secondary rounded-full overflow-hidden">
								{(phase === "paint" || phase === "done") && (
									<motion.div
										initial={{ width: 0 }}
										animate={{ width: "100%" }}
										transition={{ duration: 0.2 }}
										className="h-full bg-green-500"
									/>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Frame drops indicator */}
				{phase === "handler-executing" &&
					currentPhaseConfig?.duration &&
					currentPhaseConfig.duration > 200 && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: [0, 1, 0, 1, 0, 1] }}
							transition={{ duration: 0.6, repeat: 2 }}
							className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-lg text-sm text-accent-rose"
						>
							⚠️ Frame drops detected! Main thread blocked.
						</motion.div>
					)}

				{/* INP Score display */}
				{inpTime > 0 && (
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						className="flex items-center justify-between p-4 bg-surface-secondary rounded-lg"
					>
						<div>
							<div className="text-sm font-semibold text-text-secondary">
								Interaction to Next Paint
							</div>
							<div className="text-xs text-text-muted mt-1">
								Time from click to visual feedback
							</div>
						</div>
						<div className="text-right">
							<div
								className={`text-3xl font-bold ${getThresholdColor(inpTime)}`}
							>
								{inpTime}ms
							</div>
							<div className="text-xs text-text-muted mt-1">
								{inpTime <= 200
									? "Good"
									: inpTime <= 500
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
						<span className="text-text-tertiary">Good: ≤200ms</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 rounded-full bg-yellow-500" />
						<span className="text-text-tertiary">
							Needs Improvement: 200-500ms
						</span>
					</div>
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 rounded-full bg-rose-500" />
						<span className="text-text-tertiary">Poor: &gt;500ms</span>
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
						language="javascript"
						code={`button.onclick = () => {
  // Heavy computation blocks UI
  doExpensiveWork(); // 500ms!
  updateUI();
}

function doExpensiveWork() {
  for (let i = 0; i < 1000000; i++) {
    // Complex calculations
  }
}`}
						className="text-xs"
					/>
				</div>
				<div className="space-y-2">
					<h4 className="text-sm font-semibold text-text-tertiary">
						After (Optimized)
					</h4>
					<ShikiCode
						language="javascript"
						code={`button.onclick = () => {
  // Immediate UI feedback (optimistic)
  updateUI();

  // Defer expensive work
  requestIdleCallback(() => {
    doExpensiveWork();
  });
}

// Or use Web Workers
const worker = new Worker('worker.js');
button.onclick = () => {
  worker.postMessage(data);
  updateUI(); // immediate
};`}
						className="text-xs"
					/>
				</div>
			</div>
		</div>
	);
}
