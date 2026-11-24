import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

const TABLE_SIZE = 8;

const CHAINING_LAYOUT = `buckets: (Entry | null)[]   // one head pointer per slot

interface Entry {
  key: string;
  value: unknown;
  next: Entry | null;       // collision chain
}`;

const OPEN_LAYOUT = `slots: (Entry | null)[]      // the array is the storage

interface Entry {
  key: string;
  value: unknown;           // no next pointer
}`;

const VARIANTS = [
	{
		name: "Separate chaining",
		detail:
			"Each slot points to a list of colliding entries. The table can hold more entries than slots.",
	},
	{
		name: "Open addressing",
		detail:
			"Every entry stays in the array; a collision probes forward until a free slot appears. The table must stay under capacity.",
	},
	{
		name: "Adaptive",
		detail:
			"When one spot gets crowded, existing entries are relocated to keep every lookup short and predictable.",
	},
];

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

export function HashLayoutDemo() {
	const [inputKey, setInputKey] = useState("hello");
	const [inserted, setInserted] = useState<BucketEntry[]>([]);
	const [animating, setAnimating] = useState(false);
	const [lastIndex, setLastIndex] = useState<number | null>(null);

	const currentIndex = hashCode(inputKey);

	function handleInsert() {
		if (!inputKey.trim() || animating) return;
		// Capture key and slot at click time so the highlight matches the insert
		const key = inputKey;
		const target = hashCode(key);
		setAnimating(true);
		setLastIndex(target);
		setTimeout(() => {
			setInserted((prev) => {
				const existing = prev.find((e) => e.key === key);
				if (existing) return prev;
				return [...prev, { key, index: target }];
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
			title="Variants & memory layout"
			description="A hash table is an array plus a rule that turns a key into a slot number. The variants differ in what happens when two keys want the same slot. A slot can point to a chain of entries, or the entry itself can move to another slot. Type a key and watch its slot number appear."
		>
			<div className="space-y-6">
				<div className="grid gap-3 sm:grid-cols-3">
					{VARIANTS.map(({ name, detail }) => (
						<div
							key={name}
							className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2.5"
						>
							<p className="text-sm font-medium text-purple-300">{name}</p>
							<p className="mt-1 text-xs text-zinc-500">{detail}</p>
						</div>
					))}
				</div>

				<div className="grid gap-6 lg:grid-cols-2">
					<div>
						<p className="mb-3 text-sm font-medium text-zinc-200">
							Chaining · array of bucket heads
						</p>
						<ShikiCode
							code={CHAINING_LAYOUT}
							language="typescript"
							showLineNumbers={false}
						/>
						<p className="mt-3 text-xs text-zinc-500">
							The array is fixed; colliding entries live in separate nodes
							linked from each bucket. A lookup follows the hash to one bucket,
							then walks its chain.
						</p>
					</div>
					<div>
						<p className="mb-3 text-sm font-medium text-zinc-200">
							Open addressing · one flat array
						</p>
						<ShikiCode
							code={OPEN_LAYOUT}
							language="typescript"
							showLineNumbers={false}
						/>
						<p className="mt-3 text-xs text-zinc-500">
							Every entry occupies a slot in the same array. There are no chain
							pointers to chase, but the table can never hold more entries than
							it has slots.
						</p>
					</div>
				</div>

				<div className="space-y-4">
					<p className="text-sm font-medium text-zinc-200">
						Mapping a key to a slot
					</p>
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

					<div>
						<p className="text-xs text-zinc-500 mb-2">
							Bucket array (size {TABLE_SIZE})
						</p>
						<div className="grid grid-cols-8 gap-1">
							{buckets.map((bucket, idx) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: slot index is stable identity
								<div key={`slot-${idx}`} className="space-y-1">
									<div
										className={`h-8 rounded-md border text-xs flex items-center justify-center font-mono transition-all duration-300 ${
											animating && idx === lastIndex
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

					{inserted.length > 0 && (
						<div className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-700/50 text-xs text-zinc-400">
							<strong className="text-zinc-300">Key insight:</strong> Sum-modulo
							is intentionally weak — anagrams collide, and the small table
							forces many collisions (see the chaining demo). A good hash
							function distributes keys{" "}
							<span className="text-purple-300">uniformly</span> across all
							buckets; poor distribution creates{" "}
							<span className="text-purple-300">uneven bucket load</span> and
							O(n) worst-case lookups. Currently{" "}
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
			</div>
		</DemoSection>
	);
}
