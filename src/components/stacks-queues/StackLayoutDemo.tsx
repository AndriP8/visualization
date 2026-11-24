import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";

const START = ["A", "B", "C"];
const INITIAL_CAPACITY = 6;

const chipBase =
	"flex h-10 min-w-10 items-center justify-center rounded-md border px-2 font-mono text-sm";

export function StackLayoutDemo() {
	const [items, setItems] = useState<string[]>(START);
	const [capacity, setCapacity] = useState(INITIAL_CAPACITY);
	const [message, setMessage] = useState<string | null>(null);

	const head = items[items.length - 1] ?? "null";

	function push() {
		const value = String.fromCharCode(65 + items.length);
		const grew = items.length === capacity;
		const nextCapacity = grew ? capacity * 2 : capacity;

		setItems((current) => [...current, value]);
		if (grew) setCapacity(nextCapacity);
		setMessage(
			`Push ${value} — array: write slot ${items.length}, top = ${items.length}. Linked list: a new node points at ${head}, then head moves to it.${grew ? ` The array was full, so it grew to ${nextCapacity} slots by copying everything into a bigger block.` : ""}`,
		);
	}

	function pop() {
		const value = items[items.length - 1];
		const newHead = items[items.length - 2] ?? "null";
		setItems((current) => current.slice(0, -1));
		setMessage(
			`Pop ${value} — array: clear slot ${items.length - 1}, top = ${items.length - 2}. Linked list: head moves to ${newHead}.`,
		);
	}

	function reset() {
		setItems(START);
		setCapacity(INITIAL_CAPACITY);
		setMessage(null);
	}

	return (
		<DemoSection
			title="Variants & memory layout"
			description="The same push and pop can live in two different layouts. Both panels hold the same items — only how they are stored differs."
		>
			<div className="space-y-5">
				<div className="flex flex-wrap items-center gap-2">
					<button
						type="button"
						onClick={push}
						className="rounded-lg border border-purple-500/30 bg-purple-600/20 px-3 py-1.5 text-sm text-purple-300 transition-colors hover:bg-purple-600/30"
					>
						Push
					</button>
					<button
						type="button"
						onClick={pop}
						disabled={!items.length}
						className="rounded-lg border border-amber-500/30 bg-amber-600/20 px-3 py-1.5 text-sm text-amber-300 transition-colors hover:bg-amber-600/30 disabled:opacity-50"
					>
						Pop
					</button>
					<button
						type="button"
						onClick={reset}
						className="rounded-lg border border-zinc-600/40 bg-zinc-700/30 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-700/60"
					>
						Reset
					</button>
				</div>
				{message && (
					<output aria-live="polite" className="block text-sm text-amber-300">
						{message}
					</output>
				)}
				<div className="grid gap-5 md:grid-cols-2">
					<div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
						<p className="mb-1 text-sm font-medium text-zinc-200">
							Stack stored as an array
						</p>
						<p className="mb-3 text-xs text-zinc-500">
							One contiguous block · top marks the next pop
						</p>
						<div className="flex flex-wrap gap-1.5">
							{Array.from({ length: capacity }, (_, index) => {
								const value = items[index];
								const isTop = index === items.length - 1;
								return (
									<div
										// biome-ignore lint/suspicious/noArrayIndexKey: slots are fixed positions; the index is the identity
										key={index}
										className={`${chipBase} ${
											value
												? isTop
													? "border-amber-500/40 bg-amber-500/15 text-amber-200"
													: "border-purple-500/30 bg-purple-500/10 text-purple-200"
												: "border-zinc-800 text-zinc-700"
										}`}
									>
										{value ?? "·"}
									</div>
								);
							})}
						</div>
						<p className="mt-2 font-mono text-xs text-zinc-500">
							top = {items.length - 1}
						</p>
						<p className="mt-3 text-xs text-zinc-500">
							Push writes the next slot; pop clears the top one. Sitting next to
							each other is fast for the CPU, but a full block must grow: a real
							array allocates a bigger block and copies everything over.
						</p>
					</div>
					<div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
						<p className="mb-1 text-sm font-medium text-zinc-200">
							Stack stored as a linked list
						</p>
						<p className="mb-3 text-xs text-zinc-500">
							One small node per item · head is the top
						</p>
						<div className="flex min-h-10 flex-wrap items-center gap-2">
							<span className="text-xs text-zinc-500">head →</span>
							{items.length ? (
								<AnimatePresence>
									{[...items].reverse().map((value, index) => (
										<motion.span
											key={value}
											initial={{ opacity: 0, scale: 0.8 }}
											animate={{ opacity: 1, scale: 1 }}
											exit={{ opacity: 0, scale: 0.6 }}
											className={`${chipBase} ${
												index === 0
													? "border-amber-500/40 bg-amber-500/15 text-amber-200"
													: "border-purple-500/30 bg-purple-500/10 text-purple-200"
											}`}
										>
											{value}
										</motion.span>
									))}
								</AnimatePresence>
							) : (
								<span className="text-sm text-zinc-600">Empty</span>
							)}
							{items.length > 0 && (
								<span className="text-xs text-zinc-500">→ null</span>
							)}
						</div>
						<p className="mt-2 font-mono text-xs text-zinc-500">
							head = {head}
						</p>
						<p className="mt-3 text-xs text-zinc-500">
							Push creates one node and moves head; pop moves head to the next
							node. No fixed size, but each node carries a link and lives
							wherever memory has room.
						</p>
					</div>
				</div>
				<p className="text-xs text-zinc-500">
					A queue has the same two choices: the circular array wraps a fixed
					block of slots, or a linked list keeps a front pointer and a back
					pointer.
				</p>
			</div>
		</DemoSection>
	);
}
