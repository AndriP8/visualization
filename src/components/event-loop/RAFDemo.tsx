import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DemoSection } from "../shared/DemoSection";

interface LoopPhase {
	id: string;
	label: string;
	color: string;
	description: string;
}

const LOOP_PHASES: LoopPhase[] = [
	{
		id: "macrotask",
		label: "Macrotask",
		color: "#f97316",
		description:
			"One macrotask (e.g. setTimeout callback, click handler, script) is picked from the task queue and executed.",
	},
	{
		id: "microtasks",
		label: "Microtasks",
		color: "#22d3ee",
		description:
			"ALL microtasks are drained (Promise.then, queueMicrotask, MutationObserver). New microtasks added during this phase also run.",
	},
	{
		id: "raf",
		label: "rAF Callbacks",
		color: "#34d399",
		description:
			"requestAnimationFrame callbacks run here — after microtasks, before the browser renders. Only callbacks queued before this point run (not ones added during).",
	},
	{
		id: "render",
		label: "Style / Layout / Paint",
		color: "#ec4899",
		description:
			"The browser recalculates styles, performs layout (reflow), and paints pixels to the screen. This may be skipped if there are no visual changes.",
	},
];

function LoopDiagram({
	activePhase,
	hasRaf,
}: {
	activePhase: number;
	hasRaf: boolean;
}) {
	const phases = hasRaf
		? LOOP_PHASES
		: LOOP_PHASES.filter((p) => p.id !== "raf");
	const count = phases.length;
	const cx = 150;
	const cy = 130;
	const r = 90;

	return (
		<svg
			viewBox="0 0 300 270"
			className="w-full max-w-[320px] mx-auto"
			role="img"
			aria-label="Event loop cycle diagram"
		>
			<title>Event loop cycle diagram</title>
			{/* Loop arrow */}
			<circle
				cx={cx}
				cy={cy}
				r={r}
				fill="none"
				stroke="var(--svg-bg)"
				strokeWidth={2}
				strokeDasharray="6 3"
			/>

			{/* Direction arrow */}
			<motion.path
				d={`M ${cx + r - 5} ${cy - 15} L ${cx + r} ${cy - 5} L ${cx + r - 10} ${cy - 5}`}
				fill="none"
				stroke="var(--svg-text-muted)"
				strokeWidth={1.5}
				animate={{ opacity: [0.3, 1, 0.3] }}
				transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
			/>

			{/* Phase nodes */}
			{phases.map((phase, i) => {
				const displayIndex = hasRaf
					? i
					: LOOP_PHASES.findIndex((p) => p.id === phase.id);
				const isActive = displayIndex === activePhase;
				const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
				const x = cx + Math.cos(angle) * r;
				const y = cy + Math.sin(angle) * r;

				return (
					<motion.g key={phase.id}>
						<motion.circle
							cx={x}
							cy={y}
							r={isActive ? 28 : 22}
							fill={isActive ? `${phase.color}33` : "var(--svg-bg)"}
							stroke={phase.color}
							strokeWidth={isActive ? 2.5 : 1.5}
							animate={{
								scale: isActive ? [1, 1.08, 1] : 1,
								r: isActive ? 28 : 22,
							}}
							transition={
								isActive
									? {
											scale: {
												duration: 1.5,
												repeat: Number.POSITIVE_INFINITY,
											},
										}
									: {}
							}
						/>
						<text
							x={x}
							y={y + 1}
							textAnchor="middle"
							dominantBaseline="middle"
							fill={isActive ? phase.color : "var(--svg-text)"}
							fontSize={8}
							fontWeight={isActive ? "700" : "500"}
							fontFamily="system-ui"
						>
							{phase.label}
						</text>
					</motion.g>
				);
			})}

			{/* Center label */}
			<text
				x={cx}
				y={cy - 6}
				textAnchor="middle"
				fill="var(--svg-text-muted)"
				fontSize={10}
				fontFamily="system-ui"
			>
				Event
			</text>
			<text
				x={cx}
				y={cy + 8}
				textAnchor="middle"
				fill="var(--svg-text-muted)"
				fontSize={10}
				fontFamily="system-ui"
			>
				Loop
			</text>
		</svg>
	);
}

function AnimationComparison() {
	const setTimeoutRef = useRef<HTMLDivElement>(null);
	const rafRef = useRef<HTMLDivElement>(null);
	const [running, setRunning] = useState(false);
	const animationRef = useRef<number>(0);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
		undefined,
	);

	const startAnimation = useCallback(() => {
		setRunning(true);

		let stPos = 0;
		let rafPos = 0;
		const stEl = setTimeoutRef.current;
		const rafEl = rafRef.current;

		if (!stEl || !rafEl) return;

		stEl.style.transform = "translateX(0px)";
		rafEl.style.transform = "translateX(0px)";

		// setTimeout animation (often choppy at ~4ms intervals)
		const doSetTimeout = () => {
			stPos += 1.5;
			if (stPos > 260) stPos = 0;
			if (stEl) stEl.style.transform = `translateX(${stPos}px)`;
			timeoutRef.current = setTimeout(doSetTimeout, 0);
		};
		doSetTimeout();

		// rAF animation (smooth, synced to display)
		const doRaf = () => {
			rafPos += 1.5;
			if (rafPos > 260) rafPos = 0;
			if (rafEl) rafEl.style.transform = `translateX(${rafPos}px)`;
			animationRef.current = requestAnimationFrame(doRaf);
		};
		animationRef.current = requestAnimationFrame(doRaf);
	}, []);

	const stopAnimation = useCallback(() => {
		setRunning(false);
		if (timeoutRef.current) clearTimeout(timeoutRef.current);
		cancelAnimationFrame(animationRef.current);
	}, []);

	useEffect(() => {
		return () => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
			cancelAnimationFrame(animationRef.current);
		};
	}, []);

	return (
		<div className="space-y-4">
			<div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
				Animation Comparison
			</div>

			<div className="space-y-3">
				<div className="p-3 rounded-lg bg-surface-primary border border-border-primary">
					<div className="text-xs text-accent-orange-soft font-mono mb-2">
						setTimeout(fn, 0) — not synced to display
					</div>
					<div className="h-6 bg-surface-secondary/50 rounded relative overflow-hidden">
						<div
							ref={setTimeoutRef}
							className="absolute top-0.5 left-0 w-5 h-5 rounded bg-orange-500"
						/>
					</div>
				</div>

				<div className="p-3 rounded-lg bg-surface-primary border border-border-primary">
					<div className="text-xs text-accent-emerald-soft font-mono mb-2">
						requestAnimationFrame — synced to display refresh
					</div>
					<div className="h-6 bg-surface-secondary/50 rounded relative overflow-hidden">
						<div
							ref={rafRef}
							className="absolute top-0.5 left-0 w-5 h-5 rounded bg-emerald-500"
						/>
					</div>
				</div>
			</div>

			<button
				type="button"
				onClick={running ? stopAnimation : startAnimation}
				className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
					running
						? "bg-red-500/20 text-accent-red border-red-500/30 hover:bg-red-500/30"
						: "bg-emerald-500/20 text-accent-emerald border-emerald-500/30 hover:bg-emerald-500/30"
				}`}
			>
				{running ? "⏹ Stop" : "▶ Start Both"}
			</button>

			{running && (
				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="text-xs text-text-tertiary"
				>
					Watch closely — the{" "}
					<span className="text-accent-emerald-soft">rAF</span> ball moves
					smoothly while the{" "}
					<span className="text-accent-orange-soft">setTimeout</span> one may
					jitter, especially under load.
				</motion.p>
			)}
		</div>
	);
}

export function RAFDemo() {
	const [activePhase, setActivePhase] = useState(-1);
	const [hasRaf, setHasRaf] = useState(true);

	const currentPhaseData = activePhase >= 0 ? LOOP_PHASES[activePhase] : null;

	const nextPhase = () => {
		const maxPhase = hasRaf ? LOOP_PHASES.length - 1 : LOOP_PHASES.length - 1;
		if (activePhase < maxPhase) {
			let next = activePhase + 1;
			if (!hasRaf && LOOP_PHASES[next]?.id === "raf") next++;
			if (next <= maxPhase) setActivePhase(next);
		}
	};
	const prevPhase = () => {
		if (activePhase > -1) {
			let prev = activePhase - 1;
			if (!hasRaf && prev >= 0 && LOOP_PHASES[prev]?.id === "raf") prev--;
			setActivePhase(prev);
		}
	};
	const resetPhase = () => setActivePhase(-1);

	return (
		<DemoSection
			title="Demo 4: requestAnimationFrame & Rendering"
			description="See where rAF fits in the event loop cycle and why it's preferred over setTimeout for animations."
		>
			<div className="flex flex-col lg:flex-row gap-6">
				{/* Loop diagram */}
				<div className="lg:w-1/2">
					<div className="flex items-center justify-between mb-3">
						<div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
							Event Loop Cycle
						</div>
						<label className="flex items-center gap-2 cursor-pointer">
							<span className="text-xs text-text-tertiary">Show rAF</span>
							<button
								type="button"
								onClick={() => {
									setHasRaf(!hasRaf);
									setActivePhase(-1);
								}}
								className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
									hasRaf ? "bg-emerald-500" : "bg-surface-tertiary"
								}`}
							>
								<span
									className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
										hasRaf ? "translate-x-4.5" : "translate-x-0.5"
									}`}
								/>
							</button>
						</label>
					</div>
					<LoopDiagram activePhase={activePhase} hasRaf={hasRaf} />

					{/* Phase description */}
					{currentPhaseData && (
						<motion.div
							key={activePhase}
							initial={{ opacity: 0, y: 5 }}
							animate={{ opacity: 1, y: 0 }}
							className="mt-3 p-3 rounded-lg border text-sm"
							style={{
								borderColor: `${currentPhaseData.color}33`,
								backgroundColor: `${currentPhaseData.color}08`,
								color: currentPhaseData.color,
							}}
						>
							<strong>{currentPhaseData.label}:</strong>{" "}
							{currentPhaseData.description}
						</motion.div>
					)}

					{activePhase === -1 && (
						<p className="mt-3 text-sm text-text-muted text-center">
							Click <strong className="text-accent-emerald-soft">Start</strong>{" "}
							to step through the event loop cycle.
						</p>
					)}
				</div>

				{/* Animation comparison */}
				<div className="lg:w-1/2">
					<AnimationComparison />

					<div className="mt-5 p-3 rounded-lg bg-surface-secondary/30 border border-border-primary">
						<div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
							Why rAF over setTimeout?
						</div>
						<ul className="text-xs text-text-tertiary space-y-1.5">
							<li className="flex gap-2">
								<span className="text-accent-emerald-soft shrink-0">✓</span>
								<span>
									Synced to the display refresh rate (~60fps = 16.67ms)
								</span>
							</li>
							<li className="flex gap-2">
								<span className="text-accent-emerald-soft shrink-0">✓</span>
								<span>
									Automatically paused in background tabs (saves CPU/battery)
								</span>
							</li>
							<li className="flex gap-2">
								<span className="text-accent-emerald-soft shrink-0">✓</span>
								<span>Runs right before paint — no wasted frames</span>
							</li>
							<li className="flex gap-2">
								<span className="text-accent-red-soft shrink-0">✗</span>
								<span>
									setTimeout(fn, 0) minimum is ~4ms and not synced to refresh
								</span>
							</li>
						</ul>
					</div>
				</div>
			</div>

			{/* Controls */}
			<div className="flex items-center gap-3 mt-5">
				<button
					type="button"
					onClick={prevPhase}
					disabled={activePhase <= -1}
					className="px-4 py-2 rounded-lg text-sm font-medium bg-surface-secondary text-text-tertiary border border-border-secondary hover:text-text-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
				>
					← Back
				</button>
				<button
					type="button"
					onClick={nextPhase}
					disabled={activePhase >= LOOP_PHASES.length - 1}
					className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500/20 text-accent-emerald border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
				>
					{activePhase === -1 ? "▶ Start" : "Next →"}
				</button>
				<button
					type="button"
					onClick={resetPhase}
					className="px-4 py-2 rounded-lg text-sm font-medium bg-surface-secondary text-text-tertiary border border-border-secondary hover:text-text-secondary transition-colors"
				>
					↺ Reset
				</button>
			</div>
		</DemoSection>
	);
}
