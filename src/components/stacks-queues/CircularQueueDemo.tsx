import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

export function CircularQueueDemo() {
	const [ring, setRing] = useState<(string | null)[]>(Array(5).fill(null));
	const [value, setValue] = useState("N");
	const [head, setHead] = useState(0);
	const [count, setCount] = useState(0);
	const tail = (head + count) % ring.length;

	return (
		<DemoSection
			title="Circular queue"
			description="A fixed-size queue wraps around its array: head marks the dequeue position, tail the next free slot."
		>
			<div className="space-y-4">
				<div className="flex flex-wrap items-center gap-2">
					<input
						aria-label="Value to enqueue"
						value={value}
						maxLength={4}
						onChange={(event) => setValue(event.target.value)}
						className="w-24 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-600 focus:border-cyan-500/60 focus:outline-none"
					/>
					<button
						type="button"
						disabled={count === ring.length || !value.trim()}
						onClick={() => {
							const next = [...ring];
							next[(head + count) % ring.length] = value.trim();
							setRing(next);
							setCount(count + 1);
						}}
						className="rounded-lg border border-cyan-500/30 bg-cyan-600/20 px-3 py-1.5 text-sm text-cyan-300 transition-colors hover:bg-cyan-600/30 disabled:opacity-50"
					>
						Enqueue
					</button>
					<button
						type="button"
						disabled={!count}
						onClick={() => {
							const next = [...ring];
							next[head] = null;
							setRing(next);
							setHead((head + 1) % ring.length);
							setCount(count - 1);
						}}
						className="rounded-lg border border-amber-500/30 bg-amber-600/20 px-3 py-1.5 text-sm text-amber-300 transition-colors hover:bg-amber-600/30 disabled:opacity-50"
					>
						Dequeue
					</button>
					<button
						type="button"
						onClick={() => {
							setRing(Array(5).fill(null));
							setHead(0);
							setCount(0);
						}}
						className="rounded-lg border border-zinc-600/40 bg-zinc-700/30 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-700/60"
					>
						Reset
					</button>
					{count === ring.length && (
						<span className="text-xs text-amber-300">Buffer full</span>
					)}
					{!count && (
						<span className="text-xs text-zinc-500">Buffer empty</span>
					)}
				</div>
				<div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
					<p className="mb-3 text-sm font-medium text-zinc-200">
						5-slot circular buffer
					</p>
					<div className="flex gap-2">
						{ring.map((item, index) => (
							<div
								// biome-ignore lint/suspicious/noArrayIndexKey: circular buffer slots have fixed positions
								key={index}
								className={`min-w-12 rounded-md border px-2 py-2 text-center font-mono text-sm transition-all duration-300 ${index === head && count ? "border-amber-500/40 bg-amber-500/10 text-amber-200" : index === tail && count < ring.length ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200" : "border-zinc-700 bg-zinc-800/50 text-zinc-400"}`}
							>
								{item ?? "·"}
								<span className="block text-[10px] text-zinc-600">{index}</span>
							</div>
						))}
					</div>
					<p className="mt-3 text-xs text-zinc-500">
						Head {head} → dequeue · Tail {tail} → next enqueue · {count}/
						{ring.length} slots used
					</p>
				</div>
				<div className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-3 text-xs text-zinc-400">
					<strong className="text-zinc-300">Why wrap around:</strong> dequeuing
					from a plain array shifts every remaining element —{" "}
					<span className="text-red-300">O(n)</span>. A front index and a count
					into a fixed buffer keep both operations at{" "}
					<span className="text-green-300">O(1)</span>, at the cost of a hard
					capacity limit and manual resize when full.
				</div>
				<ShikiCode
					language="javascript"
					code={`ring[(head + count) % capacity] = value; // the % wraps back to slot 0`}
					showLineNumbers={false}
					className="text-xs"
				/>
			</div>
		</DemoSection>
	);
}
