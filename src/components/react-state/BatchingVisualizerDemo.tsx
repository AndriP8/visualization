import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { DemoSection } from "../shared/DemoSection";

// ─── Types ────────────────────────────────────────────────────────────────────

type ScenarioMode = "pre18" | "react18" | "flushsync";

interface FlashEvent {
	id: string;
	label: string;
	delay: number;
}

// ─── Flash sequences ──────────────────────────────────────────────────────────
// Pre-React 18: 3 separate setStates inside setTimeout → 3 individual renders
const PRE18_EVENTS: FlashEvent[][] = [
	[{ id: "pre18", label: "Render #1 (setState A)", delay: 0 }],
	[{ id: "pre18", label: "Render #2 (setState B)", delay: 700 }],
	[{ id: "pre18", label: "Render #3 (setState C)", delay: 1400 }],
];

// React 18: same 3 setStates are auto-batched → 1 combined render
const REACT18_EVENTS: FlashEvent[][] = [
	[{ id: "react18", label: "Batched Render (A + B + C)", delay: 0 }],
];

// flushSync: setState-A is wrapped in flushSync (immediate flush), then B + C are batched
const FLUSH_EVENTS: FlashEvent[][] = [
	[{ id: "flush", label: "flushSync render (setState A)", delay: 0 }],
	[{ id: "flush", label: "Batched render (B + C)", delay: 700 }],
];

// ─── Single panel ─────────────────────────────────────────────────────────────

interface PanelProps {
	mode: ScenarioMode;
	title: string;
	subtitle: string;
	tagColor: string;
	tagBg: string;
	description: string;
	flashSequence: FlashEvent[][];
}

const PANEL_COLORS: Record<
	ScenarioMode,
	{ border: string; flash: string; flashBg: string; flashText: string }
> = {
	pre18: {
		border: "#f97316",
		flash: "#f97316",
		flashBg: "#431407",
		flashText: "#fb923c",
	},
	react18: {
		border: "#22c55e",
		flash: "#22c55e",
		flashBg: "#052e16",
		flashText: "#4ade80",
	},
	flushsync: {
		border: "#a78bfa",
		flash: "#a78bfa",
		flashBg: "#1e1b4b",
		flashText: "#c4b5fd",
	},
};

function BatchPanel({
	mode,
	title,
	subtitle,
	tagColor,
	tagBg,
	description,
	flashSequence,
}: PanelProps) {
	const [isRunning, setIsRunning] = useState(false);
	const [currentFlash, setCurrentFlash] = useState<string | null>(null);
	const [renderCount, setRenderCount] = useState(0);
	const [log, setLog] = useState<string[]>([]);
	const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

	const colors = PANEL_COLORS[mode];

	const clearTimers = useCallback(() => {
		for (const t of timersRef.current) clearTimeout(t);
		timersRef.current = [];
	}, []);

	const trigger = useCallback(() => {
		if (isRunning) return;
		clearTimers();
		setIsRunning(true);
		setRenderCount(0);
		setLog([]);
		setCurrentFlash(null);

		let totalDelayEnd = 0;

		for (const group of flashSequence) {
			const { delay, label } = group[0];
			totalDelayEnd = Math.max(totalDelayEnd, delay + 600);

			const t1 = setTimeout(() => {
				setCurrentFlash(label);
				setRenderCount((c) => c + 1);
				setLog((prev) => [...prev, label]);
			}, delay);

			const t2 = setTimeout(() => {
				setCurrentFlash(null);
			}, delay + 500);

			timersRef.current.push(t1, t2);
		}

		const end = setTimeout(() => {
			setIsRunning(false);
		}, totalDelayEnd + 100);
		timersRef.current.push(end);
	}, [isRunning, flashSequence, clearTimers]);

	const reset = useCallback(() => {
		clearTimers();
		setIsRunning(false);
		setCurrentFlash(null);
		setRenderCount(0);
		setLog([]);
	}, [clearTimers]);

	const isFlashing = currentFlash !== null;

	return (
		<div className="flex-1 min-w-0 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 flex flex-col gap-3">
			{/* Header */}
			<div>
				<div className="flex items-center gap-2 mb-1">
					<span
						className="px-2 py-0.5 rounded-full text-xs font-semibold"
						style={{ color: tagColor, backgroundColor: tagBg }}
					>
						{subtitle}
					</span>
				</div>
				<h4 className="text-sm font-bold text-white">{title}</h4>
				<p className="text-xs text-zinc-500 mt-0.5">{description}</p>
			</div>

			{/* Component box */}
			<motion.div
				className="rounded-lg border-2 flex items-center justify-center h-16 font-mono text-xs font-semibold transition-all"
				animate={{
					borderColor: isFlashing ? colors.flash : "#3f3f46",
					backgroundColor: isFlashing ? colors.flashBg : "#18181b",
					color: isFlashing ? colors.flashText : "#71717a",
				}}
				transition={{ duration: 0.15 }}
			>
				{isFlashing ? (
					<motion.span
						key={currentFlash}
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						className="px-2 text-center"
					>
						🔄 {currentFlash}
					</motion.span>
				) : (
					<span className="text-zinc-600">{"<MyComponent />"}</span>
				)}
			</motion.div>

			{/* Render counter */}
			<div className="flex items-center justify-between text-xs">
				<span className="text-zinc-500">Renders triggered:</span>
				<motion.span
					key={renderCount}
					initial={{ scale: 1.4 }}
					animate={{ scale: 1 }}
					className="font-mono font-bold text-sm"
					style={{ color: renderCount > 0 ? colors.flash : "#52525b" }}
				>
					{renderCount}
				</motion.span>
			</div>

			{/* Log */}
			<div className="rounded-md bg-zinc-950/60 border border-zinc-800 p-2 min-h-13 text-xs font-mono space-y-0.5">
				<AnimatePresence>
					{log.length === 0 ? (
						<span className="text-zinc-700">—</span>
					) : (
						log.map((entry, i) => (
							<motion.div
								// biome-ignore lint/suspicious/noArrayIndexKey: log entries are append-only
								key={i}
								initial={{ opacity: 0, x: -6 }}
								animate={{ opacity: 1, x: 0 }}
								className="text-zinc-400"
							>
								{entry}
							</motion.div>
						))
					)}
				</AnimatePresence>
			</div>

			{/* Controls */}
			<div className="flex gap-2">
				<button
					type="button"
					onClick={trigger}
					disabled={isRunning}
					className="flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors disabled:opacity-40"
					style={{
						backgroundColor: `${colors.flash}22`,
						color: colors.flashText,
						border: `1px solid ${colors.flash}44`,
					}}
				>
					{isRunning ? "Running…" : "▶ Trigger"}
				</button>
				<button
					type="button"
					onClick={reset}
					className="px-3 py-1.5 rounded-md text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-zinc-300 transition-colors"
				>
					Reset
				</button>
			</div>
		</div>
	);
}

// ─── Main Demo ────────────────────────────────────────────────────────────────

export function BatchingVisualizerDemo() {
	return (
		<DemoSection
			title="Demo 2: React 18 Automatic Batching"
			description="In React 18, multiple setState calls inside setTimeout, fetch callbacks, or native event handlers are automatically batched into a single re-render. Before React 18, each call triggered its own render. flushSync is the escape hatch to force an immediate flush mid-batch."
		>
			<div className="flex flex-col lg:flex-row gap-4 mb-6">
				<BatchPanel
					mode="pre18"
					title="Pre-React 18"
					subtitle="React ≤ 17"
					tagColor="#fb923c"
					tagBg="#431407"
					description="3 setState calls inside setTimeout → 3 separate renders. No batching outside React event handlers."
					flashSequence={PRE18_EVENTS}
				/>
				<BatchPanel
					mode="react18"
					title="React 18 Auto-Batching"
					subtitle="React 18+"
					tagColor="#4ade80"
					tagBg="#052e16"
					description="Same 3 setState calls inside setTimeout → 1 batched render. Automatic batching works everywhere."
					flashSequence={REACT18_EVENTS}
				/>
				<BatchPanel
					mode="flushsync"
					title="flushSync Escape Hatch"
					subtitle="React 18 + flushSync"
					tagColor="#c4b5fd"
					tagBg="#1e1b4b"
					description="setState A is wrapped in flushSync() → immediate render. Then B + C are batched into a second render."
					flashSequence={FLUSH_EVENTS}
				/>
			</div>

			{/* Key insight */}
			<div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-xs text-zinc-400 space-y-1.5">
				<p>
					<span className="text-orange-400 font-semibold">Pre-React 18:</span>{" "}
					Batching only worked inside React synthetic event handlers. Async
					callbacks (setTimeout, fetch.then) each triggered their own render.
				</p>
				<p>
					<span className="text-green-400 font-semibold">React 18+:</span>{" "}
					Automatic batching applies everywhere. Multiple setState calls in any
					context are grouped into a single re-render at the end of the current
					microtask/task boundary.
				</p>
				<p>
					<span className="text-violet-400 font-semibold">flushSync:</span>{" "}
					<code className="text-violet-300/80">
						import {"{ flushSync }"} from "react"
					</code>{" "}
					— forces React to synchronously apply the queued updates before the
					call returns. Use sparingly; it can hurt performance.
				</p>
			</div>
		</DemoSection>
	);
}
