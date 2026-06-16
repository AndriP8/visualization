import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { DemoSection } from "../shared/DemoSection";

type Op = "insert-head" | "insert-mid" | "delete-mid" | "access";

interface OpInfo {
	label: string;
	arrayComplexity: string;
	arrayColor: string;
	listComplexity: string;
	listColor: string;
	description: string;
}

const OPS: Record<Op, OpInfo> = {
	"insert-head": {
		label: "Insert at head",
		arrayComplexity: "O(n)",
		arrayColor: "text-red-300",
		listComplexity: "O(1)",
		listColor: "text-green-300",
		description:
			"Array must shift all elements right. Linked list just updates the head pointer. (Arrays can avoid this with a ring buffer / deque, which gives O(1) head insert.)",
	},
	"insert-mid": {
		label: "Insert at middle",
		arrayComplexity: "O(n)",
		arrayColor: "text-red-300",
		listComplexity: "O(n)",
		listColor: "text-amber-300",
		description:
			"Both are O(n), but arrays often win in practice: contiguous memory lets CPUs use SIMD memmove and prefetch cache lines, so the raw write cost is lower than it looks.",
	},
	"delete-mid": {
		label: "Delete at middle",
		arrayComplexity: "O(n)",
		arrayColor: "text-red-300",
		listComplexity: "O(n)",
		listColor: "text-amber-300",
		description:
			"Array shifts remaining elements left. Linked list just re-wires two pointers.",
	},
	access: {
		label: "Random access",
		arrayComplexity: "O(1)",
		arrayColor: "text-green-300",
		listComplexity: "O(n)",
		listColor: "text-red-300",
		description:
			"Array computes address = base + i·size instantly. Linked list must traverse from head to the i-th node.",
	},
};

const ITEMS = ["A", "B", "C", "D", "E"];

export function ComparisonDemo() {
	const [activeOp, setActiveOp] = useState<Op>("insert-head");
	const [animStep, setAnimStep] = useState(-1);
	const [running, setRunning] = useState(false);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const info = OPS[activeOp];

	useEffect(() => {
		return () => {
			if (timerRef.current !== null) clearInterval(timerRef.current);
		};
	}, []);

	function runAnimation() {
		if (running) return;
		setRunning(true);
		setAnimStep(0);
		let s = 0;
		const maxSteps = activeOp === "access" ? 4 : 3;
		timerRef.current = setInterval(() => {
			s++;
			if (s >= maxSteps) {
				if (timerRef.current !== null) clearInterval(timerRef.current);
				timerRef.current = null;
				setRunning(false);
			}
			setAnimStep(s);
		}, 500);
	}

	// Which array cells are "shifting" during animation
	function arrayCellState(idx: number): "idle" | "shifting" | "target" | "new" {
		if (animStep < 0) return "idle";
		if (activeOp === "insert-head") {
			if (animStep >= 1 && idx > 0) return "shifting";
			if (animStep >= 2 && idx === 0) return "new";
		}
		if (activeOp === "insert-mid") {
			const mid = Math.floor(ITEMS.length / 2);
			if (animStep >= 1 && idx > mid) return "shifting";
			if (animStep >= 2 && idx === mid) return "new";
		}
		if (activeOp === "delete-mid") {
			const mid = Math.floor(ITEMS.length / 2);
			if (animStep >= 1 && idx === mid) return "target";
			if (animStep >= 2 && idx > mid) return "shifting";
		}
		if (activeOp === "access") {
			if (idx === 3 && animStep >= 1) return "target";
		}
		return "idle";
	}

	function listNodeState(
		idx: number,
	): "idle" | "traversing" | "target" | "new" {
		if (animStep < 0) return "idle";
		if (activeOp === "insert-head") {
			if (animStep >= 1 && idx === 0) return "new";
		}
		if (activeOp === "insert-mid" || activeOp === "delete-mid") {
			const mid = Math.floor(ITEMS.length / 2);
			if (animStep >= 1 && idx < mid) return "traversing";
			if (animStep >= 2 && idx === mid)
				return activeOp === "insert-mid" ? "new" : "target";
		}
		if (activeOp === "access") {
			if (idx <= Math.min(animStep, 3))
				return idx === 3 ? "target" : "traversing";
		}
		return "idle";
	}

	const cellBase =
		"w-10 h-10 rounded border flex items-center justify-center text-sm font-bold transition-all duration-300";

	return (
		<DemoSection
			title="Demo 1: Array vs Linked List"
			description="Compare how each operation differs in memory layout and complexity between contiguous arrays and pointer-based linked lists."
		>
			<div className="space-y-5">
				{/* Op selector */}
				<div className="flex flex-wrap gap-2">
					{(Object.entries(OPS) as [Op, OpInfo][]).map(([op, info]) => (
						<button
							key={op}
							type="button"
							onClick={() => {
								if (timerRef.current !== null) {
									clearInterval(timerRef.current);
									timerRef.current = null;
								}
								setActiveOp(op);
								setAnimStep(-1);
								setRunning(false);
							}}
							className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
								activeOp === op
									? "bg-indigo-600/30 text-indigo-300 border-indigo-500/50"
									: "bg-zinc-800/40 text-zinc-400 border-zinc-700/50 hover:bg-zinc-800/70"
							}`}
						>
							{info.label}
						</button>
					))}
					<button
						type="button"
						onClick={runAnimation}
						disabled={running}
						className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition-colors disabled:opacity-50"
					>
						{running ? "Animating…" : "▶ Animate"}
					</button>
				</div>

				{/* Visualization */}
				<div className="grid md:grid-cols-2 gap-4">
					{/* Array */}
					<div className="rounded-xl border border-zinc-700/50 bg-zinc-800/30 p-4">
						<div className="flex items-center gap-2 mb-3">
							<span className="text-sm font-semibold text-zinc-200">Array</span>
							<span
								className={`text-xs px-2 py-0.5 rounded-full border font-mono ${
									info.arrayColor === "text-green-300"
										? "bg-green-500/10 border-green-500/20 text-green-300"
										: "bg-red-500/10 border-red-500/20 text-red-300"
								}`}
							>
								{info.arrayComplexity}
							</span>
						</div>
						<div className="text-xs text-zinc-500 mb-3">
							Contiguous memory — base + i·size
						</div>
						<div className="flex gap-1">
							{ITEMS.map((item, idx) => {
								const state = arrayCellState(idx);
								return (
									<motion.div
										key={item}
										animate={{
											x: state === "shifting" ? 10 : 0,
											scale:
												state === "new" ? 1.1 : state === "target" ? 0.9 : 1,
										}}
										className={`${cellBase} ${
											state === "new"
												? "bg-green-500/25 border-green-400/60 text-green-300"
												: state === "shifting"
													? "bg-amber-500/15 border-amber-400/40 text-amber-300"
													: state === "target"
														? "bg-red-500/20 border-red-400/50 text-red-300"
														: "bg-zinc-700/50 border-zinc-600/60 text-zinc-300"
										}`}
									>
										{item}
									</motion.div>
								);
							})}
						</div>
						<div className="flex gap-1 mt-1">
							{ITEMS.map((_, idx) => (
								<div
									// biome-ignore lint/suspicious/noArrayIndexKey: static ITEMS array, index is stable identity
									key={idx}
									className="w-10 text-center text-xs text-zinc-600"
								>
									{idx}
								</div>
							))}
						</div>
					</div>

					{/* Linked list */}
					<div className="rounded-xl border border-zinc-700/50 bg-zinc-800/30 p-4">
						<div className="flex items-center gap-2 mb-3">
							<span className="text-sm font-semibold text-zinc-200">
								Linked List
							</span>
							<span
								className={`text-xs px-2 py-0.5 rounded-full border font-mono ${
									info.listColor === "text-green-300"
										? "bg-green-500/10 border-green-500/20 text-green-300"
										: info.listColor === "text-amber-300"
											? "bg-amber-500/10 border-amber-500/20 text-amber-300"
											: "bg-red-500/10 border-red-500/20 text-red-300"
								}`}
							>
								{info.listComplexity}
							</span>
						</div>
						<div className="text-xs text-zinc-500 mb-3">
							Heap-allocated nodes — typically scattered in memory
						</div>
						<div className="flex items-center gap-1 flex-wrap">
							{ITEMS.map((item, idx) => {
								const state = listNodeState(idx);
								return (
									<AnimatePresence key={item}>
										<motion.div
											className="flex items-center gap-1"
											initial={{ opacity: 1 }}
											animate={{
												opacity:
													state === "target" && activeOp === "delete-mid"
														? 0.3
														: 1,
											}}
										>
											<div
												className={`${cellBase} ${
													state === "new"
														? "bg-green-500/25 border-green-400/60 text-green-300"
														: state === "traversing"
															? "bg-amber-500/20 border-amber-400/50 text-amber-300"
															: state === "target"
																? activeOp === "delete-mid"
																	? "bg-red-500/20 border-red-400/50 text-red-300"
																	: "bg-green-500/25 border-green-400/60 text-green-300"
																: "bg-zinc-700/50 border-zinc-600/60 text-zinc-300"
												}`}
											>
												{item}
											</div>
											{idx < ITEMS.length - 1 && (
												<span
													className={`text-xs transition-colors ${
														state === "traversing"
															? "text-amber-400"
															: "text-zinc-600"
													}`}
												>
													→
												</span>
											)}
										</motion.div>
									</AnimatePresence>
								);
							})}
							<span className="text-zinc-600 text-xs">→ null</span>
						</div>
					</div>
				</div>

				{/* Explanation */}
				<div className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-700/50 text-xs text-zinc-400">
					<strong className="text-zinc-300">{info.label}:</strong>{" "}
					{info.description}
				</div>

				<div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-zinc-400">
					<strong className="text-amber-300">Cache locality:</strong> Array
					elements sit next to each other in memory — a single cache line (64B)
					loads several elements at once. Linked list nodes can be scattered
					across the heap, causing a cache miss on every pointer dereference.
					This is why sequential array scans routinely outperform linked lists
					even when Big-O says they're equivalent.
				</div>
			</div>
		</DemoSection>
	);
}
