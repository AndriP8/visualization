import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";

const TABLE_SIZE = 8;

function hashCode(key: string): number {
	let sum = 0;
	for (let i = 0; i < key.length; i++) {
		sum += key.charCodeAt(i);
	}
	return sum % TABLE_SIZE;
}

interface BucketEntry {
	key: string;
	index: number;
}

export function HashFunctionDemo() {
	const [inputKey, setInputKey] = useState("hello");
	const [inserted, setInserted] = useState<BucketEntry[]>([]);
	const [animating, setAnimating] = useState(false);
	const [lastIndex, setLastIndex] = useState<number | null>(null);

	const currentIndex = hashCode(inputKey);

	function handleInsert() {
		if (!inputKey.trim() || animating) return;
		setAnimating(true);
		setLastIndex(currentIndex);
		setTimeout(() => {
			setInserted((prev) => {
				const existing = prev.find((e) => e.key === inputKey);
				if (existing) return prev;
				return [...prev, { key: inputKey, index: currentIndex }];
			});
			setAnimating(false);
		}, 600);
	}

	function handleReset() {
		setInserted([]);
		setLastIndex(null);
	}

	const buckets: string[][] = Array.from({ length: TABLE_SIZE }, () => []);
	for (const entry of inserted) {
		buckets[entry.index]?.push(entry.key);
	}

	const charSum = inputKey
		.split("")
		.map((c) => c.charCodeAt(0))
		.reduce((a, b) => a + b, 0);

	return (
		<DemoSection
			title="Demo 1: Hash Function Basics"
			description="Type a key and watch it get mapped to an array index via a simple sum-modulo hash function."
		>
			<div className="space-y-6">
				{/* Controls */}
				<div className="flex flex-wrap gap-3 items-center">
					<input
						type="text"
						value={inputKey}
						onChange={(e) => setInputKey(e.target.value)}
						placeholder="Enter a key…"
						className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500/60 w-40"
					/>
					<button
						type="button"
						onClick={handleInsert}
						disabled={!inputKey.trim() || animating}
						className="px-4 py-1.5 rounded-lg text-sm font-medium bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 transition-colors disabled:opacity-50"
					>
						Insert
					</button>
					<button
						type="button"
						onClick={handleReset}
						className="px-4 py-1.5 rounded-lg text-sm font-medium bg-zinc-700/40 text-zinc-300 border border-zinc-600/30 hover:bg-zinc-700/60 transition-colors"
					>
						Reset
					</button>
				</div>

				{/* Hash function trace */}
				{inputKey.trim() && (
					<motion.div
						key={inputKey}
						initial={{ opacity: 0, y: 6 }}
						animate={{ opacity: 1, y: 0 }}
						className="rounded-lg bg-zinc-800/50 border border-zinc-700/50 p-4 text-xs font-mono space-y-1"
					>
						<div className="text-zinc-400">
							hash(<span className="text-purple-300">"{inputKey}"</span>)
						</div>
						<div className="text-zinc-500">
							= sum of char codes:{" "}
							<span className="text-amber-300">
								{inputKey
									.split("")
									.map((c) => c.charCodeAt(0))
									.join(" + ")}
							</span>
							{" = "}
							<span className="text-amber-300">{charSum}</span>
						</div>
						<div className="text-zinc-500">
							= {charSum} % {TABLE_SIZE} ={" "}
							<span className="text-purple-300 font-bold">
								index {currentIndex}
							</span>
						</div>
					</motion.div>
				)}

				{/* Array visualization */}
				<div>
					<p className="text-xs text-zinc-500 mb-2">
						Hash table (size {TABLE_SIZE})
					</p>
					<div className="grid grid-cols-8 gap-1">
						{buckets.map((bucket, idx) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: slot index is stable identity
							<div key={`slot-${idx}`} className="space-y-1">
								<div
									className={`h-8 rounded-md border text-xs flex items-center justify-center font-mono transition-all duration-300 ${
										animating && idx === currentIndex
											? "bg-purple-500/30 border-purple-400/70 text-purple-300 scale-110"
											: lastIndex === idx && !animating
												? "bg-purple-500/20 border-purple-500/40 text-purple-300"
												: bucket.length > 0
													? "bg-zinc-700/60 border-zinc-600 text-zinc-300"
													: "bg-zinc-800/40 border-zinc-700/40 text-zinc-600"
									}`}
								>
									{idx}
								</div>
								<AnimatePresence>
									{bucket.map((k) => (
										<motion.div
											key={k}
											initial={{ opacity: 0, scale: 0.8 }}
											animate={{ opacity: 1, scale: 1 }}
											exit={{ opacity: 0, scale: 0.8 }}
											className="rounded px-1 py-0.5 bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs text-center truncate"
											title={k}
										>
											{k.length > 4 ? `${k.slice(0, 3)}…` : k}
										</motion.div>
									))}
								</AnimatePresence>
							</div>
						))}
					</div>
				</div>

				{/* Distribution bar */}
				{inserted.length > 0 && (
					<div className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-700/50 text-xs text-zinc-400">
						<strong className="text-zinc-300">Key insight:</strong> Sum-modulo
						is intentionally weak — anagrams collide, and the small table forces
						many collisions (handled in Demo 2). A good hash function
						distributes keys <span className="text-purple-300">uniformly</span>{" "}
						across all buckets; poor distribution creates{" "}
						<span className="text-purple-300">uneven bucket load</span> and O(n)
						worst-case lookups. Currently{" "}
						<span className="text-amber-300">{inserted.length}</span> key
						{inserted.length !== 1 ? "s" : ""} inserted across{" "}
						<span className="text-amber-300">
							{new Set(inserted.map((e) => e.index)).size}
						</span>{" "}
						unique bucket
						{new Set(inserted.map((e) => e.index)).size !== 1 ? "s" : ""}.
					</div>
				)}
			</div>
		</DemoSection>
	);
}
