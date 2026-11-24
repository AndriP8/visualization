import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";

export function ComparisonDemo() {
	const [stack, setStack] = useState(["A", "B", "C"]);
	const [queue, setQueue] = useState(["A", "B", "C"]);
	const [value, setValue] = useState("X");
	const [removed, setRemoved] = useState<string | null>(null);

	return (
		<DemoSection
			title="Stack vs. queue"
			description="Add the same item to each structure, then see which item comes out next."
		>
			<div className="space-y-5">
				<div className="flex flex-wrap items-center gap-2">
					<input
						aria-label="Value to add"
						value={value}
						maxLength={4}
						onChange={(event) => setValue(event.target.value)}
						className="w-24 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-600 focus:border-purple-500/60 focus:outline-none"
					/>
					<button
						type="button"
						onClick={() => {
							if (value.trim()) {
								setStack((items) => [...items, value.trim()]);
								setQueue((items) => [...items, value.trim()]);
							}
						}}
						className="rounded-lg border border-purple-500/30 bg-purple-600/20 px-3 py-1.5 text-sm text-purple-300 transition-colors hover:bg-purple-600/30"
					>
						Add to both
					</button>
					<button
						type="button"
						onClick={() => {
							if (value.trim()) setStack((items) => [...items, value.trim()]);
						}}
						className="rounded-lg border border-purple-500/30 bg-purple-600/20 px-3 py-1.5 text-sm text-purple-300 transition-colors hover:bg-purple-600/30"
					>
						Push stack
					</button>
					<button
						type="button"
						onClick={() => {
							if (value.trim()) setQueue((items) => [...items, value.trim()]);
						}}
						className="rounded-lg border border-cyan-500/30 bg-cyan-600/20 px-3 py-1.5 text-sm text-cyan-300 transition-colors hover:bg-cyan-600/30"
					>
						Enqueue
					</button>
					<button
						type="button"
						onClick={() => {
							setRemoved(`Popped ${stack[stack.length - 1]} from the stack`);
							setStack((items) => items.slice(0, -1));
						}}
						disabled={!stack.length}
						className="rounded-lg border border-amber-500/30 bg-amber-600/20 px-3 py-1.5 text-sm text-amber-300 transition-colors hover:bg-amber-600/30 disabled:opacity-50"
					>
						Pop stack
					</button>
					<button
						type="button"
						onClick={() => {
							setRemoved(`Dequeued ${queue[0]} from the queue`);
							setQueue((items) => items.slice(1));
						}}
						disabled={!queue.length}
						className="rounded-lg border border-cyan-500/30 bg-cyan-600/20 px-3 py-1.5 text-sm text-cyan-300 transition-colors hover:bg-cyan-600/30 disabled:opacity-50"
					>
						Dequeue
					</button>
					<button
						type="button"
						onClick={() => {
							setStack([]);
							setQueue([]);
							setRemoved(null);
						}}
						className="rounded-lg border border-zinc-600/40 bg-zinc-700/30 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-700/60"
					>
						Clear
					</button>
				</div>
				{removed && (
					<output aria-live="polite" className="block text-sm text-amber-300">
						{removed}
					</output>
				)}
				<div className="grid gap-5 md:grid-cols-2">
					<div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
						<p className="mb-3 text-sm font-medium text-zinc-200">
							Stack · LIFO
						</p>
						<p className="mb-2 text-xs text-zinc-500">
							top → next item removed
						</p>
						<div className="flex min-h-16 flex-col-reverse items-start gap-2">
							{stack.length ? (
								<AnimatePresence>
									{stack.map((item, index) => (
										<motion.span
											// biome-ignore lint/suspicious/noArrayIndexKey: these value chips have no per-item state
											key={`${item}-${index}`}
											initial={{ opacity: 0, scale: 0.8 }}
											animate={{ opacity: 1, scale: 1 }}
											exit={{ opacity: 0, scale: 0.6 }}
											className={`rounded-md border px-3 py-2 font-mono text-sm ${index === stack.length - 1 ? "border-amber-500/40 bg-amber-500/15 text-amber-200" : "border-purple-500/30 bg-purple-500/10 text-purple-200"}`}
										>
											{item}
										</motion.span>
									))}
								</AnimatePresence>
							) : (
								<span className="text-sm text-zinc-600">Empty</span>
							)}
						</div>
						<p className="mt-3 text-xs text-zinc-500">
							Operations are O(1) with a linked list or a dynamic array
							(JavaScript's regular array, which grows when it fills up).
						</p>
					</div>
					<div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
						<p className="mb-3 text-sm font-medium text-zinc-200">
							Queue · FIFO
						</p>
						<p className="mb-2 text-xs text-zinc-500">
							front → next item removed
						</p>
						<div className="flex min-h-16 flex-wrap items-center gap-2">
							{queue.length ? (
								<AnimatePresence>
									{queue.map((item, index) => (
										<motion.span
											// biome-ignore lint/suspicious/noArrayIndexKey: these value chips have no per-item state
											key={`${item}-${index}`}
											initial={{ opacity: 0, scale: 0.8 }}
											animate={{ opacity: 1, scale: 1 }}
											exit={{ opacity: 0, scale: 0.6 }}
											className={`rounded-md border px-3 py-2 font-mono text-sm ${index === 0 ? "border-amber-500/40 bg-amber-500/15 text-amber-200" : "border-purple-500/30 bg-purple-500/10 text-purple-200"}`}
										>
											{item}
										</motion.span>
									))}
								</AnimatePresence>
							) : (
								<span className="text-sm text-zinc-600">Empty</span>
							)}
						</div>
						<p className="mt-3 text-xs text-zinc-500">
							Operations are O(1) with a linked list or circular buffer.
						</p>
					</div>
				</div>
			</div>
		</DemoSection>
	);
}
