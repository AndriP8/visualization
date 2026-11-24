import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { match } from "ts-pattern";
import { DemoSection } from "../shared/DemoSection";

const TABLE_SIZE = 6;

function hashKey(key: string, capacity: number): number {
	let h = 0;
	for (let i = 0; i < key.length; i++) {
		h = (h + key.charCodeAt(i)) % capacity;
	}
	return h;
}

type OpPhase =
	| { type: "idle" }
	| { type: "inserting"; bucket: number; key: string }
	| {
			type: "searching";
			bucket: number;
			key: string;
			step: number;
			found: boolean | null;
	  }
	| { type: "deleting"; bucket: number; key: string; found: boolean | null }
	| { type: "rehashing"; bucket: number; key: string };

export function ChainingDemo() {
	const [buckets, setBuckets] = useState<string[][]>(
		Array.from({ length: TABLE_SIZE }, () => []),
	);
	const [inputKey, setInputKey] = useState("cat");
	const [phase, setPhase] = useState<OpPhase>({ type: "idle" });
	const [message, setMessage] = useState("");

	function handleInsert() {
		if (!inputKey.trim() || phase.type !== "idle") return;
		const bucket = hashKey(inputKey, buckets.length);
		setPhase({ type: "inserting", bucket, key: inputKey });
		setTimeout(() => {
			setBuckets((prev) => {
				const next = prev.map((b) => [...b]);
				const slot = next[bucket];
				if (slot && !slot.includes(inputKey)) {
					slot.unshift(inputKey);
				}
				return next;
			});
			setPhase({ type: "idle" });
		}, 700);
	}

	function handleSearch() {
		if (!inputKey.trim() || phase.type !== "idle") return;
		const bucket = hashKey(inputKey, buckets.length);
		const chain = buckets[bucket] ?? [];
		let step = 0;

		function advance() {
			if (step < chain.length) {
				const isMatch = chain[step] === inputKey;
				// Show amber "examining" state first
				setPhase({
					type: "searching",
					bucket,
					key: inputKey,
					step,
					found: null,
				});
				if (isMatch) {
					// After a brief pause, flip to green "found" state
					setTimeout(() => {
						setPhase({
							type: "searching",
							bucket,
							key: inputKey,
							step,
							found: true,
						});
						setTimeout(() => setPhase({ type: "idle" }), 1200);
					}, 300);
					return;
				}
				step++;
				setTimeout(advance, 500);
			} else {
				setPhase({
					type: "searching",
					bucket,
					key: inputKey,
					step: chain.length,
					found: false,
				});
				setTimeout(() => setPhase({ type: "idle" }), 1200);
			}
		}
		advance();
	}

	function handleDelete() {
		if (!inputKey.trim() || phase.type !== "idle") return;
		const bucket = hashKey(inputKey, buckets.length);
		const found = (buckets[bucket] ?? []).includes(inputKey);
		if (!found) {
			setMessage(`"${inputKey}" is not in the table`);
			return;
		}
		setPhase({ type: "deleting", bucket, key: inputKey, found });
		setTimeout(() => {
			if (found) {
				setBuckets((prev) => {
					const next = prev.map((b) => [...b]);
					next[bucket] = (next[bucket] ?? []).filter((k) => k !== inputKey);
					return next;
				});
			}
			setPhase({ type: "idle" });
		}, 700);
	}

	function handleReset() {
		setBuckets(Array.from({ length: TABLE_SIZE }, () => []));
		setPhase({ type: "idle" });
		setMessage("");
	}

	function handleGrow() {
		if (phase.type !== "idle") return;
		const entries = buckets.flat();
		const newCapacity = buckets.length * 2;
		setBuckets(Array.from({ length: newCapacity }, () => []));
		if (entries.length === 0) {
			setMessage(`capacity doubled to ${newCapacity} — the table was empty`);
			return;
		}
		setMessage(
			`rehashing into ${newCapacity} buckets — the modulo changed, so each entry lands in a new bucket`,
		);
		stepRehash(entries, 0, newCapacity);
	}

	function stepRehash(entries: string[], i: number, capacity: number) {
		if (i >= entries.length) {
			setPhase({ type: "idle" });
			setMessage("rehash done — same keys, more buckets, short chains again");
			return;
		}
		const key = entries[i];
		const bucket = hashKey(key, capacity);
		setPhase({ type: "rehashing", bucket, key });
		setBuckets((prev) => {
			const next = prev.map((b) => [...b]);
			next[bucket] = [...(next[bucket] ?? []), key];
			return next;
		});
		setTimeout(() => stepRehash(entries, i + 1, capacity), 500);
	}

	function getNodeStyle(bucketIdx: number, nodeIdx: number): string {
		const base =
			"px-2 py-1 rounded border text-xs font-mono transition-all duration-200 ";
		const key = buckets[bucketIdx]?.[nodeIdx];
		const plain = `${base}bg-zinc-800/60 border-zinc-700/50 text-zinc-300`;

		return match(phase)
			.with({ type: "inserting", bucket: bucketIdx }, () =>
				// Highlight head (index 0) — prepend is O(1) and matches real implementations
				nodeIdx === 0
					? `${base}bg-purple-500/30 border-purple-400/70 text-purple-300`
					: plain,
			)
			.with({ type: "searching", bucket: bucketIdx }, (p) => {
				if (nodeIdx === p.step && p.found === null)
					return `${base}bg-amber-500/25 border-amber-400/60 text-amber-300 scale-105`;
				if (nodeIdx < p.step)
					return `${base}bg-zinc-700/30 border-zinc-600/30 text-zinc-500 opacity-50`;
				if (p.found === true && nodeIdx === p.step)
					return `${base}bg-green-500/25 border-green-400/60 text-green-300`;
				return plain;
			})
			.with({ type: "deleting", bucket: bucketIdx, found: true }, (p) =>
				key === p.key
					? `${base}bg-red-500/25 border-red-400/60 text-red-300 opacity-60`
					: plain,
			)
			.with({ type: "rehashing", bucket: bucketIdx }, (p) =>
				key === p.key
					? `${base}bg-purple-500/30 border-purple-400/70 text-purple-300`
					: plain,
			)
			.otherwise(() => plain);
	}

	const activeBucket =
		phase.type !== "idle" ? phase.bucket : hashKey(inputKey, buckets.length);

	const totalKeys = buckets.reduce((sum, b) => sum + b.length, 0);
	const maxChain = Math.max(...buckets.map((b) => b.length));

	return (
		<DemoSection
			title="Operations playground: chaining"
			description="Insert puts a new entry at the front of its slot's chain, which takes the same short work every time (O(1)). Search walks that chain one entry at a time. Delete takes one entry out and reconnects the chain. The chains are the real state of the table, so you can watch a collision turn one lookup into several comparisons."
		>
			<div className="space-y-5">
				{/* Controls */}
				<div className="flex flex-wrap gap-2 items-center">
					<input
						type="text"
						value={inputKey}
						onChange={(e) => setInputKey(e.target.value)}
						placeholder="Key…"
						className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500/60 w-36"
					/>
					{(["insert", "search", "delete"] as const).map((op) => (
						<button
							key={op}
							type="button"
							onClick={
								op === "insert"
									? handleInsert
									: op === "search"
										? handleSearch
										: handleDelete
							}
							disabled={phase.type !== "idle" || !inputKey.trim()}
							className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 capitalize ${
								op === "insert"
									? "bg-purple-600/20 text-purple-300 border-purple-500/30 hover:bg-purple-600/30"
									: op === "search"
										? "bg-amber-600/20 text-amber-300 border-amber-500/30 hover:bg-amber-600/30"
										: "bg-red-600/20 text-red-300 border-red-500/30 hover:bg-red-600/30"
							}`}
						>
							{op.charAt(0).toUpperCase() + op.slice(1)}
						</button>
					))}
					<button
						type="button"
						onClick={handleReset}
						className="px-3 py-1.5 rounded-lg text-sm font-medium bg-zinc-700/40 text-zinc-300 border border-zinc-600/30 hover:bg-zinc-700/60 transition-colors"
					>
						Reset
					</button>
					<button
						type="button"
						onClick={handleGrow}
						disabled={phase.type !== "idle"}
						className="px-3 py-1.5 rounded-lg text-sm font-medium bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-600/30 transition-colors disabled:opacity-50"
					>
						Grow &amp; rehash
					</button>
					{inputKey.trim() && (
						<span className="text-xs text-zinc-500 font-mono">
							→ bucket <span className="text-purple-300">{activeBucket}</span>
						</span>
					)}
				</div>

				<output aria-live="polite" className="block text-sm text-zinc-400">
					{message}
				</output>

				{/* Bucket visualization */}
				<div className="space-y-1.5">
					{buckets.map((chain, idx) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: bucket index is stable identity
						<div key={`bucket-${idx}`} className="flex items-center gap-2">
							{/* Bucket index */}
							<div
								className={`w-8 h-8 rounded-md border flex items-center justify-center text-xs font-mono shrink-0 transition-all duration-300 ${
									phase.type !== "idle" && phase.bucket === idx
										? "bg-purple-500/25 border-purple-400/60 text-purple-300"
										: "bg-zinc-800/50 border-zinc-700/50 text-zinc-500"
								}`}
							>
								{idx}
							</div>

							{/* Connector */}
							<div className="w-4 h-px bg-zinc-700" />

							{/* Chain */}
							<div className="flex items-center gap-1 flex-wrap">
								{chain.length === 0 ? (
									<span className="text-xs text-zinc-600 italic">empty</span>
								) : (
									<AnimatePresence>
										{chain.map((key, nodeIdx) => (
											<motion.div
												key={key}
												initial={{ opacity: 0, scale: 0.8 }}
												animate={{ opacity: 1, scale: 1 }}
												exit={{ opacity: 0, scale: 0.6 }}
												className="flex items-center gap-1"
											>
												<div className={getNodeStyle(idx, nodeIdx)}>{key}</div>
												{nodeIdx < chain.length - 1 && (
													<span className="text-zinc-600 text-xs">→</span>
												)}
											</motion.div>
										))}
									</AnimatePresence>
								)}
							</div>
						</div>
					))}
				</div>

				{/* Stats */}
				{totalKeys / buckets.length >= 0.75 && phase.type === "idle" && (
					<p className="text-xs text-amber-300">
						Load factor high — the chains are getting long. Grow &amp; rehash to
						spread the same keys across more buckets.
					</p>
				)}
				<div className="grid grid-cols-3 gap-2 text-xs">
					{[
						{ label: "Keys", value: totalKeys, color: "text-purple-300" },
						{
							label: "Load factor α",
							value: (totalKeys / buckets.length).toFixed(2),
							color: "text-amber-300",
						},
						{ label: "Longest chain", value: maxChain, color: "text-red-300" },
					].map(({ label, value, color }) => (
						<div
							key={label}
							className="rounded-lg bg-zinc-800/40 border border-zinc-700/50 p-2 text-center"
						>
							<div className={`font-mono font-bold text-lg ${color}`}>
								{value}
							</div>
							<div className="text-zinc-500">{label}</div>
						</div>
					))}
				</div>

				<div className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-700/50 text-xs text-zinc-400">
					<strong className="text-zinc-300">Complexity:</strong> Insert{" "}
					<span className="text-green-300">O(1)</span> (prepend to head) ·
					Search/Delete <span className="text-green-300">O(1)</span> avg,{" "}
					<span className="text-red-300">O(n)</span> worst (all keys in one
					chain). Chaining tolerates α ≥ 1; typical implementations resize
					around α = 0.75 as a practical threshold — rehashing spreads the same
					keys across more buckets, so chains stay short and each lookup stays
					cheap. Java's <span className="text-purple-300">HashMap</span>{" "}
					converts chains to red-black trees — a self-balancing search tree —
					past length 8, bounding worst case to O(log n).
				</div>
			</div>
		</DemoSection>
	);
}
