import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClosureInstance {
	id: number;
	count: number;
	sealed: boolean;
}

// ─── Code shown in the panel ─────────────────────────────────────────────────

const FACTORY_CODE = `function makeCounter() {
  let count = 0;          // lives in makeCounter's scope

  return function counter() {
    count += 1;           // captures 'count' from outer scope
    return count;
  };
}

const c1 = makeCounter(); // new closure: count = 0
const c2 = makeCounter(); // new closure: count = 0
const c3 = makeCounter(); // new closure: count = 0

c1(); // 1   ← only c1's count changes
c2(); // 1   ← independent from c1
c1(); // 2   ← c1 increments again`;

// Highlight lines explanation:
// Line 0  = function makeCounter() {
// Line 1  = let count = 0      ← captured variable
// Line 3  = return function counter() {
// Line 4  = count += 1;        ← live reference, not a copy

// ─── Component ───────────────────────────────────────────────────────────────

const COLORS = ["#8b5cf6", "#22d3ee", "#f59e0b"] as const;
type ColorTuple = typeof COLORS;
type ClosureColor = ColorTuple[number];

let nextId = 1;

export function ClosureSnapshotDemo() {
	const [instances, setInstances] = useState<ClosureInstance[]>([]);
	const [highlightLine, setHighlightLine] = useState(-1);
	const [capturePhase, setCapturePhase] = useState(false); // animate dotted border on count

	async function spawnCounter() {
		if (instances.length >= 3) return;

		// Animate: highlight "let count = 0" → capture
		setCapturePhase(true);
		setHighlightLine(1); // let count = 0
		await sleep(600);
		setHighlightLine(3); // return function counter()
		await sleep(600);
		setCapturePhase(false);
		setHighlightLine(-1);

		const id = nextId++;
		setInstances((prev) => [...prev, { id, count: 0, sealed: true }]);
	}

	function callCounter(id: number) {
		setHighlightLine(4); // count += 1
		setTimeout(() => setHighlightLine(-1), 600);
		setInstances((prev) =>
			prev.map((inst) =>
				inst.id === id ? { ...inst, count: inst.count + 1 } : inst,
			),
		);
	}

	function reset() {
		setInstances([]);
		setHighlightLine(-1);
		setCapturePhase(false);
		nextId = 1;
	}

	const colorOf = (idx: number): ClosureColor =>
		COLORS[idx % COLORS.length] as ClosureColor;

	return (
		<DemoSection
			title="Demo 2: Closure Snapshot Visualizer"
			description="Each call to makeCounter() creates a brand new, independent closure environment. The inner function holds a live reference — not a copy — to its own 'count'."
		>
			<div className="flex flex-col lg:flex-row gap-6">
				{/* Code panel */}
				<div className="lg:w-96 shrink-0 space-y-3">
					<p className="text-xs text-text-muted uppercase tracking-wider font-semibold">
						Factory Source
					</p>
					<div className="relative">
						<ShikiCode
							code={FACTORY_CODE}
							language="javascript"
							highlightLine={highlightLine}
						/>
						{/* Capture animation overlay on "let count = 0" line */}
						<AnimatePresence>
							{capturePhase && (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									className="absolute left-0 right-0 pointer-events-none"
									style={{ top: "2.4rem" /* line 1: let count = 0 */ }}
								>
									<motion.div
										animate={{
											borderColor: [
												"rgba(139,92,246,0)",
												"rgba(139,92,246,0.8)",
												"rgba(139,92,246,0.3)",
											],
										}}
										transition={{ repeat: 2, duration: 0.5 }}
										className="mx-3 rounded border-2 border-dashed px-1 h-6"
										style={{ borderColor: "rgba(139,92,246,0.6)" }}
									/>
								</motion.div>
							)}
						</AnimatePresence>
					</div>

					{/* Key insight box */}
					<div className="p-3 rounded-lg bg-surface-secondary/40 border border-border-secondary/40 text-xs text-text-muted space-y-1.5">
						<p>
							<strong className="text-accent-violet-soft">
								Definition time:
							</strong>{" "}
							when <code>makeCounter()</code> runs, a new{" "}
							<strong>environment record</strong> is created holding{" "}
							<code>count = 0</code>. The inner function gets a reference to
							that record — not a copy of the value.
						</p>
						<p>
							<strong className="text-accent-cyan-soft">Call time:</strong> each
							call to <code>counter()</code> reads and mutates{" "}
							<code>count</code> through that live reference. Other closures are
							unaffected because they each own a <em>different</em> environment
							record.
						</p>
					</div>
				</div>

				{/* Closure instances */}
				<div className="flex-1 min-w-0 space-y-4">
					<div className="flex items-center justify-between">
						<p className="text-xs text-text-muted uppercase tracking-wider font-semibold">
							Live Closure Environments
						</p>
						<div className="flex gap-2">
							<button
								type="button"
								onClick={spawnCounter}
								disabled={instances.length >= 3}
								className="px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-500/20 text-accent-violet border border-violet-500/30 hover:bg-violet-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
							>
								+ makeCounter()
							</button>
							{instances.length > 0 && (
								<button
									type="button"
									onClick={reset}
									className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-secondary text-text-tertiary border border-border-secondary hover:text-text-secondary transition-colors"
								>
									↺ Reset
								</button>
							)}
						</div>
					</div>

					{instances.length === 0 && (
						<div className="flex items-center justify-center h-40 rounded-xl border-2 border-dashed border-border-primary text-text-faint text-sm">
							Click "+ makeCounter()" to spawn a closure
						</div>
					)}

					<div className="flex flex-wrap gap-4">
						<AnimatePresence>
							{instances.map((inst, idx) => {
								const color = colorOf(idx);
								const label = `c${idx + 1}`;
								return (
									<motion.div
										key={inst.id}
										initial={{ opacity: 0, scale: 0.85 }}
										animate={{ opacity: 1, scale: 1 }}
										exit={{ opacity: 0, scale: 0.85 }}
										transition={{ type: "spring", stiffness: 260, damping: 20 }}
										className="rounded-xl border-2 p-4 min-w-44 space-y-3"
										style={{
											borderColor: `${color}55`,
											background: `${color}08`,
										}}
									>
										{/* Header */}
										<div
											className="text-xs font-bold flex items-center gap-1.5"
											style={{ color }}
										>
											<span
												className="w-2 h-2 rounded-full"
												style={{ background: color }}
											/>
											{label} closure
											<span
												className="ml-auto text-xs px-1.5 py-0.5 rounded"
												style={{
													color,
													background: `${color}22`,
													border: `1px solid ${color}44`,
												}}
											>
												🔒 sealed
											</span>
										</div>

										{/* Environment record */}
										<div
											className="rounded-lg p-3 font-mono text-xs space-y-1 border"
											style={{
												borderColor: `${color}30`,
												background: `${color}0a`,
											}}
										>
											<div className="text-text-muted text-[10px] uppercase tracking-wider mb-2">
												Environment Record
											</div>
											<div className="flex items-center justify-between">
												<span className="text-text-tertiary">count</span>
												<motion.span
													key={inst.count}
													initial={{ scale: 1.4, color }}
													animate={{ scale: 1, color: "#e4e4e7" }}
													transition={{ duration: 0.3 }}
													className="font-bold"
												>
													{inst.count}
												</motion.span>
											</div>
										</div>

										{/* Call button */}
										<button
											type="button"
											onClick={() => callCounter(inst.id)}
											className="w-full py-1.5 rounded-lg text-xs font-mono font-medium transition-colors"
											style={{
												border: `1px solid ${color}44`,
												color,
												background: `${color}14`,
											}}
										>
											{label}() → {inst.count + 1}
										</button>
									</motion.div>
								);
							})}
						</AnimatePresence>
					</div>

					{instances.length >= 3 && (
						<p className="text-xs text-text-faint">
							3 independent closures — each owns a separate{" "}
							<code className="font-mono">count</code>. Calling one never
							affects the others.
						</p>
					)}
				</div>
			</div>
		</DemoSection>
	);
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
