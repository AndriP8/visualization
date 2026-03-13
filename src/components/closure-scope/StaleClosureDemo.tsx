import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

// ─── Code snippets ─────────────────────────────────────────────────────────

const BUGGY_CODE = `// ❌ Stale closure bug
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // This closure captures count = 0 at mount.
    // The interval callback NEVER sees later values
    // because React doesn't re-run this effect.
    const id = setInterval(() => {
      console.log(count); // always 0 — stale!
    }, 1000);
    return () => clearInterval(id);
  }, []); // <- empty deps: effect runs once

  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}`;

const FIXED_CODE = `// ✅ Fixed: count in dependency array
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Effect re-runs whenever count changes.
    // Each new effect creates a fresh closure
    // that captures the latest count value.
    const id = setInterval(() => {
      console.log(count); // always current ✓
    }, 1000);
    return () => clearInterval(id);
  }, [count]); // <- re-run when count changes

  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}`;

// ─── Panel component ────────────────────────────────────────────────────────

interface PanelProps {
	variant: "buggy" | "fixed";
}

function StaleClosurePanel({ variant }: PanelProps) {
	const isBuggy = variant === "buggy";
	const color = isBuggy ? "#ef4444" : "#22c55e";
	const label = isBuggy ? "❌ Buggy" : "✅ Fixed";

	// The "real" count that the button increments
	const [realCount, setRealCount] = useState(0);
	// The count that the interval closure "sees"
	const [intervalCount, setIntervalCount] = useState(0);
	const [running, setRunning] = useState(false);
	const [tick, setTick] = useState(0); // visual pulse on each interval fire
	const [effectReruns, setEffectReruns] = useState(0); // how many times effect ran

	// Track whether we've shown the flash for the latest tick
	const [flash, setFlash] = useState(false);
	const [effectRerunFlash, setEffectRerunFlash] = useState(false);

	// We simulate stale closure by keeping a ref that holds the closured value
	// Buggy: interval reads from a frozen ref (= value at mount)
	// Fixed: interval reads from a live ref (= latest value)
	const capturedAtMount = useRef(0); // frozen
	const liveRef = useRef(0); // always synced
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	// Keep liveRef up to date with realCount
	useEffect(() => {
		liveRef.current = realCount;
	}, [realCount]);

	function handleIncrement() {
		const next = realCount + 1;
		setRealCount(next);

		if (!isBuggy && running) {
			// Simulate the effect re-running: update what interval reads
			setIntervalCount(next);
			setEffectReruns((n) => n + 1);

			// Flash effect re-run indicator
			setEffectRerunFlash(true);
			setTimeout(() => setEffectRerunFlash(false), 600);
		}
	}

	function startInterval() {
		if (running) return;
		setRunning(true);
		capturedAtMount.current = realCount; // freeze the captured value

		if (isBuggy) {
			// For buggy version, immediately show the captured (stale) value
			setIntervalCount(realCount);
		} else {
			// For the fixed version, show initial effect run
			setEffectReruns(1);
			setIntervalCount(realCount);
		}

		intervalRef.current = setInterval(() => {
			setTick((t) => t + 1);
			setFlash(true);
			setTimeout(() => setFlash(false), 300);

			if (isBuggy) {
				// Stale: reads the frozen captured value
				setIntervalCount(capturedAtMount.current);
			} else {
				// Fixed: a fresh closure would read the latest count
				setIntervalCount(liveRef.current);
			}
		}, 1200);
	}

	function stop() {
		setRunning(false);
		if (intervalRef.current !== null) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
	}

	function reset() {
		stop();
		setRealCount(0);
		setIntervalCount(0);
		setTick(0);
		setEffectReruns(0);
		capturedAtMount.current = 0;
		liveRef.current = 0;
	}

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (intervalRef.current !== null) clearInterval(intervalRef.current);
		};
	}, []);

	const stale = isBuggy && running && intervalCount !== realCount;

	return (
		<div
			className="flex-1 min-w-0 rounded-xl border-2 p-5 space-y-4"
			style={{ borderColor: `${color}33`, background: `${color}07` }}
		>
			{/* Panel header */}
			<div
				className="text-sm font-bold flex items-center gap-2"
				style={{ color }}
			>
				<span
					className="w-2.5 h-2.5 rounded-full"
					style={{ background: color }}
				/>
				{label}
			</div>

			{/* Code */}
			<div className="relative overflow-x-auto">
				<ShikiCode
					code={isBuggy ? BUGGY_CODE : FIXED_CODE}
					language="typescript"
					highlightLine={
						running
							? isBuggy
								? 8 // const id = setInterval (buggy line)
								: 7 // same line in fixed
							: -1
					}
					showLineNumbers={false}
				/>

				{/* Effect re-run indicator for Fixed version */}
				<AnimatePresence>
					{!isBuggy && effectRerunFlash && (
						<motion.div
							initial={{ opacity: 0, y: -4, scale: 0.95 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: -4, scale: 0.95 }}
							className="absolute top-2 right-2 px-3 py-1.5 rounded-lg text-xs font-semibold border shadow-lg"
							style={{
								background: "#22c55e22",
								borderColor: "#22c55e66",
								color: "#22c55e",
							}}
						>
							⚡ Effect re-ran → new closure created
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* Live demo */}
			<div
				className="rounded-xl p-4 border space-y-3"
				style={{ borderColor: `${color}22`, background: `${color}08` }}
			>
				<p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
					Live Simulation
				</p>

				{/* Real count (button increments) */}
				<div className="flex items-center justify-between">
					<span className="text-xs text-zinc-400">
						State: <code className="font-mono">count</code>
					</span>
					<div className="flex items-center gap-3">
						<motion.span
							key={realCount}
							initial={{ scale: 1.3 }}
							animate={{ scale: 1 }}
							className="text-xl font-bold font-mono"
							style={{ color }}
						>
							{realCount}
						</motion.span>
						<button
							type="button"
							onClick={handleIncrement}
							className="px-3 py-1 rounded-lg text-xs font-medium border transition-colors"
							style={{
								borderColor: `${color}44`,
								color,
								background: `${color}14`,
							}}
						>
							+1
						</button>
					</div>
				</div>

				{/* Interval-read count */}
				<div className="flex items-center justify-between">
					<span className="text-xs text-zinc-400">
						Interval reads:{" "}
						<code className="font-mono">
							{isBuggy ? "stale count" : "fresh count"}
						</code>
					</span>
					<AnimatePresence mode="wait">
						<motion.span
							key={`${intervalCount}-${tick}`}
							initial={{ scale: 1.2 }}
							animate={{ scale: 1 }}
							className="text-xl font-bold font-mono"
							style={{ color: stale ? "#ef4444" : color }}
						>
							{tick === 0 ? "-" : intervalCount}
							{stale && " ⚠️"}
						</motion.span>
					</AnimatePresence>
				</div>

				{/* Interval pulse */}
				<div className="h-7 flex items-center justify-center">
					<AnimatePresence>
						{flash && (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className="text-xs font-mono text-center rounded px-2 py-1"
								style={{ background: `${color}20`, color }}
							>
								⏱ setInterval fired (tick #{tick})
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				{/* Effect re-run counter (Fixed only) */}
				{!isBuggy && running && (
					<motion.div
						initial={{ opacity: 0, y: 4 }}
						animate={{ opacity: 1, y: 0 }}
						className="text-xs rounded-lg p-3 border"
						style={{
							background: "#22c55e0a",
							borderColor: "#22c55e22",
						}}
					>
						<div className="flex items-center justify-between">
							<span className="text-zinc-400">Effect re-runs:</span>
							<motion.span
								key={effectReruns}
								initial={{ scale: 1.4 }}
								animate={{ scale: 1 }}
								className="text-green-400 font-mono font-bold"
							>
								{effectReruns}
							</motion.span>
						</div>
						<p className="text-zinc-600 mt-1.5 text-[11px]">
							Each re-run tears down the old interval and creates a{" "}
							<strong className="text-green-400">fresh closure</strong> that
							captures the latest <code className="font-mono">count</code>{" "}
							value.
						</p>
					</motion.div>
				)}

				{/* Stale warning */}
				{stale && (
					<motion.div
						initial={{ opacity: 0, y: 4 }}
						animate={{ opacity: 1, y: 0 }}
						className="text-xs p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300"
					>
						The interval callback captured{" "}
						<code>count = {capturedAtMount.current}</code> when the interval
						started. No matter how many times you click +1, it still reads{" "}
						<strong>{capturedAtMount.current}</strong> from its stale closure.
					</motion.div>
				)}

				{/* Controls */}
				<div className="flex gap-2 pt-1">
					<button
						type="button"
						onClick={startInterval}
						disabled={running}
						className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
						style={{
							border: `1px solid ${color}44`,
							color,
							background: `${color}14`,
						}}
					>
						▶ Start Interval
					</button>
					<button
						type="button"
						onClick={stop}
						disabled={!running}
						className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-zinc-300 transition-colors disabled:opacity-40"
					>
						⏹ Stop
					</button>
					<button
						type="button"
						onClick={reset}
						className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-zinc-300 transition-colors"
					>
						↺ Reset
					</button>
				</div>
			</div>
		</div>
	);
}

// ─── Main export ────────────────────────────────────────────────────────────

export function StaleClosureDemo() {
	return (
		<DemoSection
			title="Demo 3: The Stale Closure Bug (React useEffect)"
			description="When an effect captures state via closure but the dependency array doesn't list it, React never re-creates the closure — the callback always sees the value from when the effect first ran."
		>
			<div className="flex flex-col xl:flex-row gap-6">
				<StaleClosurePanel variant="buggy" />
				<StaleClosurePanel variant="fixed" />
			</div>

			{/* Key insight */}
			<div className="mt-6 p-4 rounded-lg bg-zinc-800/40 border border-zinc-700/40 text-xs text-zinc-500 space-y-2">
				<p>
					<strong className="text-zinc-300">Why does this happen?</strong> The{" "}
					<code className="font-mono">setInterval</code> callback is created
					once. It's a function that has a closure over the{" "}
					<code className="font-mono">count</code> variable{" "}
					<em>as it existed when the effect ran</em>. Because React only ran the
					effect once (empty deps), <code className="font-mono">count</code>{" "}
					there is forever <code className="font-mono">0</code>.
				</p>
				<p>
					<strong className="text-zinc-300">The fix:</strong> adding{" "}
					<code className="font-mono">count</code> to the dependency array
					forces React to tear down the old interval and create a{" "}
					<em>new closure</em> every time <code>count</code> changes. The new
					closure captures the fresh value.
				</p>
				<p className="text-zinc-600">
					<strong className="text-zinc-400">Deeper solution:</strong> use the
					functional updater form{" "}
					<code className="font-mono">setCount(c =&gt; c + 1)</code> inside the
					interval — then you don't need <code>count</code> in deps at all,
					because you're reading from the setter's implicit current-value
					argument instead of the closure.
				</p>
			</div>
		</DemoSection>
	);
}
