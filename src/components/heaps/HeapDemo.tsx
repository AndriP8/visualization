import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { match } from "ts-pattern";
import { heapifySteps, insertSteps, removeSteps } from "./heap";

const INITIAL = [2, 5, 8, 9, 7, 12];
const SCRAMBLED = [9, 4, 7, 1, 6, 2];

type Tone = "amber" | "emerald" | "cyan";

interface Frame {
	heap: number[];
	ids: number[];
	highlight: number[];
	tone: Tone;
	message: string;
}

function nodeClass(index: number, highlight: number[], tone: Tone) {
	return match({
		highlighted: highlight.includes(index),
		tone,
		root: index === 0,
	})
		.with(
			{ highlighted: true, tone: "amber" },
			() => "border-amber-500/60 bg-amber-500/20 text-amber-200",
		)
		.with(
			{ highlighted: true, tone: "emerald" },
			() => "border-emerald-500/60 bg-emerald-500/20 text-emerald-200",
		)
		.with(
			{ highlighted: true, tone: "cyan" },
			() => "border-cyan-500/60 bg-cyan-500/20 text-cyan-200",
		)
		.with(
			{ root: true },
			() => "border-violet-500/40 bg-violet-500/15 text-violet-200",
		)
		.otherwise(() => "border-zinc-700 bg-zinc-800/60 text-zinc-200");
}

export function HeapDemo() {
	const [heap, setHeap] = useState(INITIAL);
	const [ids, setIds] = useState(() => INITIAL.map((_, index) => index));
	const [highlight, setHighlight] = useState<number[]>([]);
	const [tone, setTone] = useState<Tone>("cyan");
	const [message, setMessage] = useState("");
	const [playing, setPlaying] = useState(false);
	const [value, setValue] = useState("4");
	const nextId = useRef(INITIAL.length);
	const timer = useRef<number | null>(null);

	useEffect(
		() => () => {
			if (timer.current !== null) clearTimeout(timer.current);
		},
		[],
	);

	function playFrames(frames: Frame[]) {
		if (timer.current !== null) clearTimeout(timer.current);
		setPlaying(true);
		let index = 0;
		const step = () => {
			const frame = frames[index];
			if (!frame) {
				setPlaying(false);
				return;
			}
			setHeap(frame.heap);
			setIds(frame.ids);
			setHighlight(frame.highlight);
			setTone(frame.tone);
			setMessage(frame.message);
			index += 1;
			timer.current = window.setTimeout(step, index === 1 ? 900 : 600);
		};
		step();
	}

	function insert() {
		const n = Number(value);
		if (!Number.isInteger(n) || playing) return;
		const { swaps } = insertSteps(heap, n);
		const newId = nextId.current;
		nextId.current += 1;
		let working = [...heap, n];
		let workingIds = [...ids, newId];
		const frames: Frame[] = [
			{
				heap: working,
				ids: workingIds,
				highlight: [working.length - 1],
				tone: "cyan",
				message:
					heap.length === 0
						? `${n} lands at the root.`
						: swaps.length > 0
							? `${n} starts at the next free slot, index ${working.length - 1}.`
							: `${n} is not smaller than its parent — it stays at index ${working.length - 1}.`,
			},
		];
		for (const { a, b } of swaps) {
			const childValue = working[a];
			const parentValue = working[b];
			working = [...working];
			workingIds = [...workingIds];
			[working[a], working[b]] = [working[b], working[a]];
			[workingIds[a], workingIds[b]] = [workingIds[b], workingIds[a]];
			frames.push({
				heap: working,
				ids: workingIds,
				highlight: [a, b],
				tone: "amber",
				message: `${childValue} is smaller than its parent ${parentValue} — swap up.`,
			});
		}
		if (swaps.length > 0) {
			const settled = swaps[swaps.length - 1].b;
			frames.push({
				heap: working,
				ids: workingIds,
				highlight: [],
				tone: "cyan",
				message: `${n} settled at index ${settled}. The rule holds again.`,
			});
		}
		playFrames(frames);
	}

	function removeMin() {
		if (heap.length === 0 || playing) return;
		const { removed, swaps } = removeSteps(heap);
		if (removed === null) return;
		const frames: Frame[] = [
			{
				heap,
				ids,
				highlight: [0],
				tone: "emerald",
				message: `${removed} at the root is the smallest — remove it.`,
			},
		];
		if (heap.length === 1) {
			frames.push({
				heap: [],
				ids: [],
				highlight: [],
				tone: "emerald",
				message: `Removed ${removed}. The heap is now empty.`,
			});
			playFrames(frames);
			return;
		}
		const lastValue = heap[heap.length - 1];
		const afterMove = [...heap.slice(0, -1)];
		afterMove[0] = lastValue;
		const afterMoveIds = [...ids.slice(0, -1)];
		afterMoveIds[0] = ids[ids.length - 1];
		frames.push({
			heap: afterMove,
			ids: afterMoveIds,
			highlight: [0],
			tone: "cyan",
			message: `The last value, ${lastValue}, moves to the root to fill the gap.`,
		});
		let working = afterMove;
		let workingIds = afterMoveIds;
		for (const { a, b } of swaps) {
			const parentValue = working[a];
			const childValue = working[b];
			working = [...working];
			workingIds = [...workingIds];
			[working[a], working[b]] = [working[b], working[a]];
			[workingIds[a], workingIds[b]] = [workingIds[b], workingIds[a]];
			frames.push({
				heap: working,
				ids: workingIds,
				highlight: [a, b],
				tone: "amber",
				message: `${parentValue} is bigger than its smaller child ${childValue} — swap down.`,
			});
		}
		if (swaps.length === 0) {
			frames.push({
				heap: afterMove,
				ids: afterMoveIds,
				highlight: [0],
				tone: "cyan",
				message: `${lastValue} is already smaller than its children — it stays at the root.`,
			});
		}
		frames.push({
			heap: working,
			ids: workingIds,
			highlight: [],
			tone: "emerald",
			message: `Removed ${removed}. The root now holds ${working[0]}.`,
		});
		playFrames(frames);
	}

	function scrambleAndHeapify() {
		if (playing) return;
		const working = [...SCRAMBLED];
		const workingIds = SCRAMBLED.map(() => {
			const id = nextId.current;
			nextId.current += 1;
			return id;
		});
		const { steps } = heapifySteps(SCRAMBLED);
		const firstParent = steps.length > 0 ? steps[0].parent : 0;
		const frames: Frame[] = [
			{
				heap: working,
				ids: workingIds,
				highlight: [],
				tone: "cyan",
				message: `Scrambled. Heapify sifts each parent down, starting from the last parent (index ${firstParent}) back to the root.`,
			},
		];
		for (const { parent, swaps } of steps) {
			frames.push({
				heap: [...working],
				ids: [...workingIds],
				highlight: [parent],
				tone: "cyan",
				message: `Check the parent at index ${parent} (value ${working[parent]}).`,
			});
			for (const { a, b } of swaps) {
				const parentValue = working[a];
				const childValue = working[b];
				[working[a], working[b]] = [working[b], working[a]];
				[workingIds[a], workingIds[b]] = [workingIds[b], workingIds[a]];
				frames.push({
					heap: [...working],
					ids: [...workingIds],
					highlight: [a, b],
					tone: "amber",
					message: `${childValue} is smaller than its parent ${parentValue} — swap down.`,
				});
			}
			if (swaps.length === 0) {
				frames.push({
					heap: [...working],
					ids: [...workingIds],
					highlight: [parent],
					tone: "cyan",
					message: `Value ${working[parent]} already beats its children — nothing to move.`,
				});
			}
		}
		frames.push({
			heap: [...working],
			ids: [...workingIds],
			highlight: [],
			tone: "cyan",
			message: `Done. The root now holds ${working[0]} and every parent beats its children.`,
		});
		playFrames(frames);
	}

	function reset() {
		if (timer.current !== null) clearTimeout(timer.current);
		setPlaying(false);
		setHeap(INITIAL);
		setIds(INITIAL.map((_, index) => index));
		setHighlight([]);
		setMessage("");
	}

	const levels: number[][] = [];
	for (let index = 0; index < heap.length; index++) {
		const level = Math.floor(Math.log2(index + 1));
		while (levels.length <= level) levels.push([]);
		levels[level].push(index);
	}

	return (
		<div className="space-y-5">
			<div className="flex flex-wrap items-center gap-2">
				<input
					aria-label="Value to insert"
					type="number"
					value={value}
					onChange={(event) => setValue(event.target.value)}
					className="w-24 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200"
				/>
				<button
					type="button"
					disabled={playing}
					onClick={insert}
					className="rounded-lg border border-violet-500/30 bg-violet-600/20 px-3 py-1.5 text-sm text-violet-300 disabled:opacity-50"
				>
					Insert
				</button>
				<button
					type="button"
					disabled={playing || heap.length === 0}
					onClick={removeMin}
					className="rounded-lg border border-rose-500/30 bg-rose-600/20 px-3 py-1.5 text-sm text-rose-300 disabled:opacity-50"
				>
					Remove min
				</button>
				<button
					type="button"
					disabled={playing}
					onClick={scrambleAndHeapify}
					className="rounded-lg border border-cyan-500/30 bg-cyan-600/20 px-3 py-1.5 text-sm text-cyan-300 disabled:opacity-50"
				>
					Scramble &amp; heapify
				</button>
				<button
					type="button"
					onClick={reset}
					className="rounded-lg border border-zinc-600/40 bg-zinc-700/30 px-3 py-1.5 text-sm text-zinc-300"
				>
					Reset
				</button>
			</div>
			<p className="text-xs text-zinc-500">
				<span className="text-cyan-300">Heapify</span> rebuilds the heap from a
				scrambled array: it sifts every parent down, starting from the last
				parent and moving back to the root. One pass costs O(n) — less work than
				inserting the n values one by one.
			</p>
			{message && (
				<output aria-live="polite" className="block text-sm text-zinc-300">
					{message}
				</output>
			)}
			<div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
				<p className="mb-3 text-xs text-zinc-500">
					Heap array — tree levels read left to right
				</p>
				<div className="flex flex-wrap gap-2">
					<AnimatePresence initial={false}>
						{heap.map((item, index) => (
							<motion.span
								key={ids[index]}
								layout
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, scale: 0.6 }}
								transition={{ duration: 0.35 }}
								className={`rounded-md border px-3 py-2 font-mono text-sm ${nodeClass(index, highlight, tone)}`}
							>
								{item}
								<span className="ml-2 text-xs text-zinc-600">[{index}]</span>
							</motion.span>
						))}
					</AnimatePresence>
					{heap.length === 0 && (
						<span className="text-sm text-zinc-600">Empty heap</span>
					)}
				</div>
			</div>
			<div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
				<p className="mb-3 text-xs text-zinc-500">
					The same heap as a tree — each level is one slice of the array
				</p>
				{heap.length === 0 ? (
					<p className="text-sm text-zinc-600">Empty heap</p>
				) : (
					<div className="overflow-x-auto">
						<div className="flex min-w-max flex-col items-center gap-4 py-2 md:gap-6">
							{levels.map((row) => (
								<div
									key={`level-${row[0]}`}
									className="flex justify-center gap-3 md:gap-6"
								>
									{row.map((index) => (
										<motion.span
											key={ids[index]}
											layout
											layoutId={`heap-node-${ids[index]}`}
											initial={{ opacity: 0, scale: 0.5 }}
											animate={{ opacity: 1, scale: 1 }}
											transition={{ duration: 0.35 }}
											className={`flex h-12 w-12 items-center justify-center rounded-full border font-mono text-sm ${nodeClass(index, highlight, tone)}`}
										>
											{heap[index]}
										</motion.span>
									))}
								</div>
							))}
						</div>
					</div>
				)}
			</div>
			<p className="text-sm text-zinc-400">
				Next priority:{" "}
				<span className="font-mono text-violet-300">{heap[0] ?? "—"}</span>
			</p>
		</div>
	);
}
