import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { DemoSection } from "../shared/DemoSection";

interface ListNode {
	id: number;
	value: string;
}

export function SinglyLinkedDemo() {
	const nextId = useRef(1);
	const [nodes, setNodes] = useState<ListNode[]>([
		{ id: nextId.current++, value: "A" },
		{ id: nextId.current++, value: "B" },
		{ id: nextId.current++, value: "C" },
	]);
	const [inputVal, setInputVal] = useState("X");
	const [traverseIdx, setTraverseIdx] = useState<number | null>(null);
	const [animating, setAnimating] = useState(false);
	const [lastOp, setLastOp] = useState<string>("");

	function insertHead() {
		if (!inputVal.trim() || animating) return;
		setLastOp(`insertHead("${inputVal}")`);
		setNodes((prev) => [{ id: nextId.current++, value: inputVal }, ...prev]);
	}

	function insertTail() {
		if (!inputVal.trim() || animating) return;
		const val = inputVal;
		setLastOp(`insertTail("${val}")`);
		// animate traversal to tail
		setAnimating(true);
		let i = 0;
		const len = nodes.length;
		const tick = () => {
			setTraverseIdx(i);
			i++;
			if (i < len) setTimeout(tick, 300);
			else {
				setTimeout(() => {
					setNodes((prev) => [...prev, { id: nextId.current++, value: val }]);
					setTraverseIdx(null);
					setAnimating(false);
				}, 300);
			}
		};
		tick();
	}

	function insertMid() {
		if (!inputVal.trim() || animating || nodes.length < 2) return;
		const val = inputVal;
		const mid = Math.floor(nodes.length / 2);
		setLastOp(`insertAt(${mid}, "${val}")`);
		setAnimating(true);
		let i = 0;
		const tick = () => {
			setTraverseIdx(i);
			i++;
			if (i < mid) setTimeout(tick, 300);
			else {
				setTimeout(() => {
					setNodes((prev) => {
						const next = [...prev];
						next.splice(mid, 0, { id: nextId.current++, value: val });
						return next;
					});
					setTraverseIdx(null);
					setAnimating(false);
				}, 300);
			}
		};
		tick();
	}

	function deleteHead() {
		if (nodes.length === 0 || animating) return;
		setLastOp("deleteHead()");
		setNodes((prev) => prev.slice(1));
	}

	function deleteTail() {
		if (nodes.length === 0 || animating) return;
		setLastOp("deleteTail()");
		setAnimating(true);
		let i = 0;
		const len = nodes.length;
		const tick = () => {
			setTraverseIdx(i);
			i++;
			if (i < len - 1) setTimeout(tick, 300);
			else {
				setTimeout(() => {
					setNodes((prev) => prev.slice(0, -1));
					setTraverseIdx(null);
					setAnimating(false);
				}, 300);
			}
		};
		tick();
	}

	function reset() {
		setNodes([
			{ id: nextId.current++, value: "A" },
			{ id: nextId.current++, value: "B" },
			{ id: nextId.current++, value: "C" },
		]);
		setTraverseIdx(null);
		setAnimating(false);
		setLastOp("");
	}

	return (
		<DemoSection
			title="Demo 2: Singly Linked List Operations"
			description="Each node holds data and a next pointer. Insert at head is O(1). Insert at tail is O(1) with a cached tail pointer, O(n) without. Delete at tail and mid-list ops are O(n)."
		>
			<div className="space-y-5">
				{/* Controls */}
				<div className="flex flex-wrap gap-2 items-center">
					<input
						type="text"
						value={inputVal}
						onChange={(e) => setInputVal(e.target.value)}
						maxLength={3}
						placeholder="Val…"
						className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 w-24"
					/>
					{[
						{ label: "Insert Head", fn: insertHead, color: "green" },
						{ label: "Insert Mid", fn: insertMid, color: "amber" },
						{ label: "Insert Tail", fn: insertTail, color: "amber" },
						{ label: "Delete Head", fn: deleteHead, color: "red" },
						{ label: "Delete Tail", fn: deleteTail, color: "red" },
					].map(({ label, fn, color }) => (
						<button
							key={label}
							type="button"
							onClick={fn}
							disabled={animating}
							className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${
								color === "green"
									? "bg-green-600/20 text-green-300 border-green-500/30 hover:bg-green-600/30"
									: color === "amber"
										? "bg-amber-600/20 text-amber-300 border-amber-500/30 hover:bg-amber-600/30"
										: "bg-red-600/20 text-red-300 border-red-500/30 hover:bg-red-600/30"
							}`}
						>
							{label}
						</button>
					))}
					<button
						type="button"
						onClick={reset}
						className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-700/40 text-zinc-300 border border-zinc-600/30 hover:bg-zinc-700/60 transition-colors"
					>
						Reset
					</button>
				</div>

				{/* List visualization */}
				<div className="flex items-center gap-2 flex-wrap py-4">
					<span className="text-xs text-zinc-500 font-mono">head →</span>
					<AnimatePresence>
						{nodes.map((node, idx) => (
							<motion.div
								key={node.id}
								initial={{ opacity: 0, scale: 0.7 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.5 }}
								className="flex items-center gap-1.5"
							>
								{/* Node box */}
								<div
									className={`relative flex rounded-lg border overflow-hidden transition-all duration-200 ${
										traverseIdx === idx
											? "border-amber-400/70 shadow-lg shadow-amber-500/10"
											: "border-zinc-600/60"
									}`}
								>
									{/* Data cell */}
									<div
										className={`w-10 h-10 flex items-center justify-center text-sm font-bold border-r transition-colors ${
											traverseIdx === idx
												? "bg-amber-500/20 border-amber-500/30 text-amber-300"
												: "bg-zinc-700/50 border-zinc-600/40 text-zinc-200"
										}`}
									>
										{node.value}
									</div>
									{/* Next pointer cell */}
									<div
										className={`w-8 h-10 flex items-center justify-center text-xs font-mono transition-colors ${
											traverseIdx === idx
												? "bg-amber-500/10 text-amber-400"
												: "bg-zinc-800/50 text-zinc-600"
										}`}
									>
										→
									</div>
								</div>
								{idx < nodes.length - 1 && (
									<span
										className={`text-sm transition-colors ${
											traverseIdx === idx ? "text-amber-400" : "text-zinc-600"
										}`}
									>
										⟶
									</span>
								)}
							</motion.div>
						))}
					</AnimatePresence>
					<span className="text-xs text-zinc-600 font-mono">null</span>
				</div>

				{animating && lastOp.startsWith("insertTail") && (
					<div className="text-xs text-zinc-500 italic">
						Animating without a tail pointer — traversal is O(n). With a cached
						tail pointer, this would be O(1).
					</div>
				)}

				{/* Node structure legend */}
				<div className="flex items-center gap-3 text-xs text-zinc-500">
					<span>Node =</span>
					<div className="flex rounded border border-zinc-600/60 overflow-hidden">
						<div className="px-3 py-1.5 bg-zinc-700/50 border-r border-zinc-600/40 text-zinc-300">
							data
						</div>
						<div className="px-3 py-1.5 bg-zinc-800/50 text-zinc-500">
							*next
						</div>
					</div>
					{lastOp && (
						<span className="ml-auto font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
							{lastOp}
						</span>
					)}
				</div>

				<div className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-700/50 text-xs text-zinc-400">
					<strong className="text-zinc-300">Complexity:</strong> Insert/delete
					at head <span className="text-green-300">O(1)</span> — just update
					head pointer. Insert at tail{" "}
					<span className="text-amber-300">O(1)</span> with a cached tail
					pointer (most implementations), but{" "}
					<span className="text-red-300">O(n)</span> without one. Delete at tail
					is always <span className="text-red-300">O(n)</span> — you must reach
					the second-to-last node to re-wire it. Insert/delete at middle{" "}
					<span className="text-red-300">O(n)</span> — must traverse to
					position. No random access: to reach node i, start from head and
					follow n pointers.
				</div>
			</div>
		</DemoSection>
	);
}
