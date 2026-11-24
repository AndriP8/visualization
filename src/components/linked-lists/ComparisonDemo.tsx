import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { match } from "ts-pattern";
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
			"The array has to slide every item right. The linked list only changes the head pointer, which is the address of the first node.",
	},
	"insert-mid": {
		label: "Insert at middle",
		arrayComplexity: "O(n)",
		arrayColor: "text-red-300",
		listComplexity: "O(n)",
		listColor: "text-amber-300",
		description:
			"Both must walk to the middle first. The array then slides items right. The list changes two links. In practice the array is often faster here because its items sit next to each other in memory, so the CPU moves them in big blocks.",
	},
	"delete-mid": {
		label: "Delete at middle",
		arrayComplexity: "O(n)",
		arrayColor: "text-red-300",
		listComplexity: "O(n)",
		listColor: "text-amber-300",
		description:
			"The array slides the remaining items left. The linked list changes one link: the node before the deleted node now points past it.",
	},
	access: {
		label: "Random access",
		arrayComplexity: "O(1)",
		arrayColor: "text-green-300",
		listComplexity: "O(n)",
		listColor: "text-red-300",
		description:
			"The array jumps straight to item i with one calculation. The linked list walks from the head, one node at a time. That walk is called a traversal.",
	},
};

const ITEMS = ["A", "B", "C", "D", "E"];
const NEW_ITEM = "New";
const MID = Math.floor(ITEMS.length / 2);

const cellBase =
	"w-10 h-10 rounded border flex items-center justify-center text-sm font-bold transition-colors duration-300";

const idleTone = "bg-zinc-700/50 border-zinc-600/60 text-zinc-300";

export function ComparisonDemo() {
	const [activeOp, setActiveOp] = useState<Op>("insert-head");
	const [animStep, setAnimStep] = useState(-1);
	const [running, setRunning] = useState(false);
	const [arrayItems, setArrayItems] = useState<string[]>(ITEMS);
	const [listItems, setListItems] = useState<string[]>(ITEMS);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const info = OPS[activeOp];

	useEffect(() => {
		return () => {
			if (timerRef.current !== null) clearInterval(timerRef.current);
		};
	}, []);

	function resetItems() {
		setArrayItems(ITEMS);
		setListItems(ITEMS);
	}

	function runAnimation() {
		if (running) return;
		resetItems();
		setRunning(true);
		setAnimStep(0);
		let s = 0;
		const maxSteps = activeOp === "access" ? 4 : 3;
		timerRef.current = setInterval(() => {
			s++;
			// The list inserts at the head in one step, before the array is done sliding.
			if (activeOp === "insert-head" && s === 1) {
				setListItems([NEW_ITEM, ...ITEMS]);
			}
			if (s === 2) {
				if (activeOp === "insert-head") {
					setArrayItems([NEW_ITEM, ...ITEMS].slice(0, ITEMS.length));
				}
				if (activeOp === "insert-mid") {
					const arrayWithNew = [...ITEMS];
					arrayWithNew.splice(MID, 0, NEW_ITEM);
					setArrayItems(arrayWithNew.slice(0, ITEMS.length));
					const listWithNew = [...ITEMS];
					listWithNew.splice(MID, 0, NEW_ITEM);
					setListItems(listWithNew);
				}
				if (activeOp === "delete-mid") {
					setArrayItems(ITEMS.filter((_, i) => i !== MID));
					setListItems(ITEMS.filter((_, i) => i !== MID));
				}
			}
			if (s >= maxSteps) {
				if (timerRef.current !== null) clearInterval(timerRef.current);
				timerRef.current = null;
				setRunning(false);
			}
			setAnimStep(s);
		}, 500);
	}

	function arrayCellState(
		value: string,
	): "idle" | "shifting" | "target" | "new" {
		if (animStep < 0) return "idle";
		if (activeOp === "access")
			return value === "D" && animStep >= 1 ? "target" : "idle";
		if (activeOp === "insert-head") {
			if (animStep >= 2 && value === NEW_ITEM) return "new";
			if (animStep >= 1) return "shifting";
		}
		if (activeOp === "insert-mid") {
			if (animStep >= 2 && value === NEW_ITEM) return "new";
			if (animStep >= 1 && ITEMS.indexOf(value) >= MID) return "shifting";
		}
		if (activeOp === "delete-mid") {
			if (animStep >= 1 && value === ITEMS[MID]) return "target";
			if (animStep >= 1 && ITEMS.indexOf(value) > MID) return "shifting";
		}
		return "idle";
	}

	function listNodeState(
		value: string,
	): "idle" | "traversing" | "target" | "new" {
		if (animStep < 0) return "idle";
		const idx = ITEMS.indexOf(value);
		if (activeOp === "insert-head") {
			if (animStep >= 1 && value === NEW_ITEM) return "new";
			return "idle";
		}
		if (activeOp === "insert-mid" || activeOp === "delete-mid") {
			if (animStep >= 1 && idx >= 0 && idx < MID) return "traversing";
			if (animStep === 1 && activeOp === "delete-mid" && idx === MID)
				return "target";
			if (animStep >= 2 && activeOp === "insert-mid" && value === NEW_ITEM)
				return "new";
			return "idle";
		}
		if (idx >= 0 && idx <= Math.min(animStep, 3))
			return idx === 3 ? "target" : "traversing";
		return "idle";
	}

	function arrayTone(state: "idle" | "shifting" | "target" | "new") {
		return match(state)
			.with("new", () => "bg-green-500/25 border-green-400/60 text-green-300")
			.with(
				"shifting",
				() => "bg-amber-500/15 border-amber-400/40 text-amber-300",
			)
			.with("target", () => "bg-red-500/20 border-red-400/50 text-red-300")
			.otherwise(() => idleTone);
	}

	function listTone(state: "idle" | "traversing" | "target" | "new") {
		return match(state)
			.with("new", () => "bg-green-500/25 border-green-400/60 text-green-300")
			.with(
				"traversing",
				() => "bg-amber-500/20 border-amber-400/50 text-amber-300",
			)
			.with("target", () =>
				activeOp === "delete-mid"
					? "bg-red-500/20 border-red-400/50 text-red-300"
					: "bg-green-500/25 border-green-400/60 text-green-300",
			)
			.otherwise(() => idleTone);
	}

	return (
		<DemoSection
			title="Operations & memory layout"
			description="Compare one operation at a time and watch where the work goes. The array slides items to make room. The linked list changes a few links instead."
		>
			<div className="space-y-5">
				{/* Op selector */}
				<div className="flex flex-wrap gap-2">
					{(Object.entries(OPS) as [Op, OpInfo][]).map(([op, opInfo]) => (
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
								resetItems();
							}}
							className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
								activeOp === op
									? "bg-indigo-600/30 text-indigo-300 border-indigo-500/50"
									: "bg-zinc-800/40 text-zinc-400 border-zinc-700/50 hover:bg-zinc-800/70"
							}`}
						>
							{opInfo.label}
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
							Items sit side by side — the start address plus the index times
							the item size gives any item's address
						</div>
						<div className="flex gap-1">
							<AnimatePresence initial={false}>
								{arrayItems.map((item) => {
									const state = arrayCellState(item);
									return (
										<motion.div
											key={item}
											layout
											initial={{ opacity: 0, scale: 0.6 }}
											animate={{
												opacity: 1,
												scale:
													state === "new" ? 1.1 : state === "target" ? 0.9 : 1,
											}}
											exit={{ opacity: 0, scale: 0.6 }}
											className={`${cellBase} ${arrayTone(state)}`}
										>
											{item}
										</motion.div>
									);
								})}
							</AnimatePresence>
						</div>
						<div className="flex gap-1 mt-1">
							{arrayItems.map((_, idx) => (
								<div
									// biome-ignore lint/suspicious/noArrayIndexKey: static 5-cell row, index is stable identity
									key={idx}
									className="w-10 text-center text-xs text-zinc-600"
								>
									{idx}
								</div>
							))}
						</div>
						{(activeOp === "insert-head" || activeOp === "insert-mid") &&
							animStep >= 2 && (
								<p className="mt-2 text-xs text-amber-300/80">
									E falls off the end of this fixed view — a real array would
									grow to make room.
								</p>
							)}
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
							Separate nodes — scattered in memory
						</div>
						<div className="flex items-center gap-1 flex-wrap">
							<AnimatePresence initial={false}>
								{listItems.map((item, idx) => {
									const state = listNodeState(item);
									return (
										<motion.div
											key={item}
											layout
											initial={{ opacity: 0, scale: 0.6 }}
											animate={{ opacity: 1, scale: 1 }}
											exit={{ opacity: 0, scale: 0.6 }}
											className="flex items-center gap-1"
										>
											<div className={`${cellBase} ${listTone(state)}`}>
												{item}
											</div>
											{idx < listItems.length - 1 && (
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
									);
								})}
							</AnimatePresence>
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
					<strong className="text-amber-300">
						Why arrays often win anyway:
					</strong>{" "}
					Array items sit next to each other in memory. The CPU fetches a whole
					block at once, so reading several items costs one trip to memory. A
					linked list can scatter its nodes anywhere, so each step to a new node
					can cost another trip. This is called cache locality, and it is why a
					plain array scan often beats a linked list even when the book math
					says they are equal.
				</div>
			</div>
		</DemoSection>
	);
}
