import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";

export function DequeDemo() {
	const [deque, setDeque] = useState(["B"]);
	const [value, setValue] = useState("Y");

	return (
		<DemoSection
			title="Deque"
			description="A double-ended queue supports insertion and removal at both ends."
		>
			<div className="space-y-4">
				<div className="flex flex-wrap items-center gap-2">
					<input
						aria-label="Value to add to deque"
						value={value}
						maxLength={4}
						onChange={(event) => setValue(event.target.value)}
						className="w-24 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-600 focus:border-purple-500/60 focus:outline-none"
					/>
					<button
						type="button"
						disabled={!value.trim()}
						onClick={() => setDeque((items) => [value.trim(), ...items])}
						className="rounded-lg border border-purple-500/30 bg-purple-600/20 px-3 py-1.5 text-sm text-purple-300 transition-colors hover:bg-purple-600/30 disabled:opacity-50"
					>
						Add front
					</button>
					<button
						type="button"
						disabled={!value.trim()}
						onClick={() => setDeque((items) => [...items, value.trim()])}
						className="rounded-lg border border-purple-500/30 bg-purple-600/20 px-3 py-1.5 text-sm text-purple-300 transition-colors hover:bg-purple-600/30 disabled:opacity-50"
					>
						Add back
					</button>
					<button
						type="button"
						disabled={!deque.length}
						onClick={() => setDeque((items) => items.slice(1))}
						className="rounded-lg border border-amber-500/30 bg-amber-600/20 px-3 py-1.5 text-sm text-amber-300 transition-colors hover:bg-amber-600/30 disabled:opacity-50"
					>
						Remove front
					</button>
					<button
						type="button"
						disabled={!deque.length}
						onClick={() => setDeque((items) => items.slice(0, -1))}
						className="rounded-lg border border-amber-500/30 bg-amber-600/20 px-3 py-1.5 text-sm text-amber-300 transition-colors hover:bg-amber-600/30 disabled:opacity-50"
					>
						Remove back
					</button>
					<button
						type="button"
						onClick={() => setDeque([])}
						className="rounded-lg border border-zinc-600/40 bg-zinc-700/30 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-700/60"
					>
						Clear
					</button>
				</div>
				<div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
					<p className="mb-2 text-xs text-zinc-500">
						left end = front · right end = back
					</p>
					<div className="flex min-h-10 flex-wrap items-center gap-2">
						<AnimatePresence>
							{deque.map((item, index) => (
								<motion.span
									// biome-ignore lint/suspicious/noArrayIndexKey: deque chips have no per-item state
									key={`${item}-${index}`}
									initial={{ opacity: 0, scale: 0.8 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.6 }}
									className={`rounded-md border px-3 py-2 font-mono text-sm ${index === 0 ? "border-amber-500/40 bg-amber-500/15 text-amber-200" : index === deque.length - 1 ? "border-purple-500/40 bg-purple-500/15 text-purple-200" : "border-purple-500/30 bg-purple-500/10 text-purple-200"}`}
								>
									{item}
								</motion.span>
							))}
						</AnimatePresence>
						{!deque.length && (
							<span className="text-sm text-zinc-600">Empty</span>
						)}
					</div>
				</div>
				<div className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-3 text-xs text-zinc-400">
					<strong className="text-zinc-300">Complexity:</strong> all four
					operations are <span className="text-green-300">O(1)</span> with a
					doubly linked list. JavaScript has no built-in deque —{" "}
					<span className="text-purple-300">unshift</span>/
					<span className="text-purple-300">shift</span> on arrays are{" "}
					<span className="text-red-300">O(n)</span>, so implementations use a
					circular buffer (the same idea as the circular queue demo above) or a
					linked list instead.
				</div>
			</div>
		</DemoSection>
	);
}
