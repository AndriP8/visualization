import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { DemoSection } from "../shared/DemoSection";

interface DNode {
	id: number;
	value: string;
}

export function DoublyLinkedDemo() {
	const nodeId = useRef(100);
	const [nodes, setNodes] = useState<DNode[]>([
		{ id: nodeId.current++, value: "1" },
		{ id: nodeId.current++, value: "2" },
		{ id: nodeId.current++, value: "3" },
		{ id: nodeId.current++, value: "4" },
	]);
	const [direction, setDirection] = useState<"forward" | "backward">("forward");
	const [traverseIdx, setTraverseIdx] = useState<number | null>(null);
	const [animating, setAnimating] = useState(false);
	const [inputVal, setInputVal] = useState("X");

	function traverse() {
		if (animating) return;
		setAnimating(true);
		const indices =
			direction === "forward"
				? Array.from({ length: nodes.length }, (_, i) => i)
				: Array.from({ length: nodes.length }, (_, i) => nodes.length - 1 - i);
		let step = 0;
		const tick = () => {
			const stepIdx = indices[step];
			if (stepIdx !== undefined) setTraverseIdx(stepIdx);
			step++;
			if (step < indices.length) setTimeout(tick, 400);
			else {
				setTimeout(() => {
					setTraverseIdx(null);
					setAnimating(false);
				}, 500);
			}
		};
		tick();
	}

	function insertTail() {
		if (!inputVal.trim() || animating) return;
		setNodes((prev) => [...prev, { id: nodeId.current++, value: inputVal }]);
	}

	function deleteNode(idx: number) {
		if (animating) return;
		setNodes((prev) => prev.filter((_, i) => i !== idx));
	}

	function reset() {
		setNodes([
			{ id: nodeId.current++, value: "1" },
			{ id: nodeId.current++, value: "2" },
			{ id: nodeId.current++, value: "3" },
			{ id: nodeId.current++, value: "4" },
		]);
		setTraverseIdx(null);
		setAnimating(false);
	}

	return (
		<DemoSection
			title="Demo 3: Doubly Linked List"
			description="Each node has prev and next pointers. Bidirectional traversal and O(1) delete when you already have a reference to the node."
		>
			<div className="space-y-5">
				{/* Controls */}
				<div className="flex flex-wrap gap-2 items-center">
					<button
						type="button"
						onClick={() =>
							setDirection((d) => (d === "forward" ? "backward" : "forward"))
						}
						className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition-colors"
					>
						Direction: {direction === "forward" ? "→ Forward" : "← Backward"}
					</button>
					<button
						type="button"
						onClick={traverse}
						disabled={animating}
						className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 transition-colors disabled:opacity-50"
					>
						▶ Traverse
					</button>
					<input
						type="text"
						value={inputVal}
						onChange={(e) => setInputVal(e.target.value)}
						maxLength={3}
						className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 w-20"
					/>
					<button
						type="button"
						onClick={insertTail}
						disabled={animating}
						className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600/20 text-green-300 border border-green-500/30 hover:bg-green-600/30 transition-colors disabled:opacity-50"
					>
						Append
					</button>
					<button
						type="button"
						onClick={reset}
						className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-700/40 text-zinc-300 border border-zinc-600/30 hover:bg-zinc-700/60 transition-colors"
					>
						Reset
					</button>
				</div>

				{/* List visualization */}
				<div className="overflow-x-auto pb-2">
					<div className="flex items-center gap-1.5 min-w-max py-2">
						<span className="text-xs text-zinc-500 font-mono">null ←</span>
						<AnimatePresence>
							{nodes.map((node, idx) => (
								<motion.div
									key={node.id}
									initial={{ opacity: 0, scale: 0.7 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.5 }}
									className="flex items-center gap-1"
								>
									{/* Node */}
									<div
										className={`relative flex flex-col rounded-lg border overflow-hidden transition-all duration-200 group ${
											traverseIdx === idx
												? "border-purple-400/70 shadow-lg shadow-purple-500/10"
												: "border-zinc-600/60"
										}`}
									>
										{/* Prev pointer */}
										<div
											className={`px-2 py-0.5 text-xs font-mono text-center border-b transition-colors ${
												traverseIdx === idx
													? "bg-blue-500/15 border-blue-500/20 text-blue-400"
													: "bg-zinc-800/60 border-zinc-700/40 text-zinc-600"
											}`}
										>
											←prev
										</div>
										{/* Data */}
										<div
											className={`w-14 py-2 flex items-center justify-center text-sm font-bold transition-colors ${
												traverseIdx === idx
													? "bg-purple-500/20 text-purple-200"
													: "bg-zinc-700/50 text-zinc-200"
											}`}
										>
											{node.value}
											{/* Delete button on hover */}
											<button
												type="button"
												onClick={() => deleteNode(idx)}
												className="absolute top-0.5 right-0.5 w-4 h-4 text-xs opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-red-400"
											>
												×
											</button>
										</div>
										{/* Next pointer */}
										<div
											className={`px-2 py-0.5 text-xs font-mono text-center border-t transition-colors ${
												traverseIdx === idx
													? "bg-blue-500/15 border-blue-500/20 text-blue-400"
													: "bg-zinc-800/60 border-zinc-700/40 text-zinc-600"
											}`}
										>
											next→
										</div>
									</div>
									{/* Arrows between nodes */}
									{idx < nodes.length - 1 && (
										<div className="flex flex-col items-center gap-0.5 text-xs text-zinc-600">
											<span
												className={
													traverseIdx === idx && direction === "forward"
														? "text-purple-400"
														: ""
												}
											>
												→
											</span>
											<span
												className={
													traverseIdx === idx + 1 && direction === "backward"
														? "text-purple-400"
														: ""
												}
											>
												←
											</span>
										</div>
									)}
								</motion.div>
							))}
						</AnimatePresence>
						<span className="text-xs text-zinc-500 font-mono">→ null</span>
					</div>
				</div>

				{/* Memory overhead note */}
				<div className="grid grid-cols-2 gap-3 text-xs">
					<div className="rounded-lg bg-zinc-800/40 border border-zinc-700/50 p-3">
						<div className="text-zinc-400 font-medium mb-1">Singly linked</div>
						<div className="font-mono text-zinc-300">
							data + <span className="text-amber-300">1 pointer</span>
						</div>
						<div className="text-zinc-600 mt-1">
							8 + 8 = 16 bytes (64-bit ptr, no padding)
						</div>
					</div>
					<div className="rounded-lg bg-zinc-800/40 border border-zinc-700/50 p-3">
						<div className="text-zinc-400 font-medium mb-1">Doubly linked</div>
						<div className="font-mono text-zinc-300">
							data + <span className="text-purple-300">2 pointers</span>
						</div>
						<div className="text-zinc-600 mt-1">
							8 + 16 = 24 bytes — plus allocator overhead (often 16–32B extra
							per node in practice)
						</div>
					</div>
				</div>

				<div className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-700/50 text-xs text-zinc-400">
					<strong className="text-zinc-300">Key advantage:</strong> If you hold
					a reference to a node (e.g., from a hash map), deletion is{" "}
					<span className="text-green-300">O(1)</span> — just re-wire prev.next
					and next.prev. No traversal needed. This is why the{" "}
					<span className="text-purple-300">LRU cache</span> uses a doubly
					linked list + hash map: the map gives O(1) lookup to a node reference,
					and the list handles O(1) move-to-front and eviction.{" "}
					<span className="text-zinc-500">
						Hover any node and click × to see O(1) deletion in action.
					</span>
				</div>
			</div>
		</DemoSection>
	);
}
