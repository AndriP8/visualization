import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { match } from "ts-pattern";
import { DemoSection } from "../shared/DemoSection";

const TABLE_SIZE = 10;

type ProbingStrategy = "linear" | "quadratic" | "double";

function h1(key: string): number {
	let h = 0;
	for (let i = 0; i < key.length; i++) {
		h = (h * 31 + key.charCodeAt(i)) % TABLE_SIZE;
	}
	return h;
}

// Steps coprime with 10, so every key's walk can reach all slots
const DOUBLE_HASH_STEPS = [1, 3, 7, 9];

function h2(key: string): number {
	let h = 0;
	for (let i = 0; i < key.length; i++) {
		h = (h * 31 + key.charCodeAt(i)) % DOUBLE_HASH_STEPS.length;
	}
	return DOUBLE_HASH_STEPS[h];
}

function probeSequence(key: string, strategy: ProbingStrategy): number[] {
	const base = h1(key);
	const seq: number[] = [];
	for (let i = 0; i < TABLE_SIZE; i++) {
		const idx = match(strategy)
			.with("linear", () => (base + i) % TABLE_SIZE)
			.with("quadratic", () => (base + i * i) % TABLE_SIZE)
			.with("double", () => (base + i * h2(key)) % TABLE_SIZE)
			.exhaustive();
		seq.push(idx);
	}
	return seq;
}

type SlotState = "empty" | "occupied" | "deleted";

interface Slot {
	key: string | null;
	state: SlotState;
}

export function OpenAddressingDemo() {
	const [table, setTable] = useState<Slot[]>(
		Array.from({ length: TABLE_SIZE }, () => ({ key: null, state: "empty" })),
	);
	const [strategy, setStrategy] = useState<ProbingStrategy>("linear");
	const [inputKey, setInputKey] = useState("apple");
	const [probeHighlight, setProbeHighlight] = useState<number[]>([]);
	const [foundSlot, setFoundSlot] = useState<number | null>(null);
	const [animating, setAnimating] = useState(false);
	const [lastOp, setLastOp] = useState<"insert" | "search" | "delete" | null>(
		null,
	);
	const [message, setMessage] = useState("");

	function animateProbe(
		seq: number[],
		finalIdx: number | null,
		op: "insert" | "search" | "delete",
	) {
		setAnimating(true);
		setFoundSlot(null);
		setLastOp(op);
		const targetStep =
			finalIdx === null ? seq.length - 1 : seq.indexOf(finalIdx);
		let i = 0;

		const tick = () => {
			setProbeHighlight(seq.slice(0, i + 1));
			if (finalIdx !== null && seq[i] === finalIdx) {
				setFoundSlot(finalIdx);
				setAnimating(false);
				setTimeout(() => {
					setProbeHighlight([]);
					setFoundSlot(null);
				}, 1500);
				return;
			}
			i++;
			if (i <= targetStep) {
				setTimeout(tick, 350);
			} else {
				// Reached end without finding — clear after a pause
				setAnimating(false);
				setTimeout(() => setProbeHighlight([]), 1000);
			}
		};
		tick();
	}

	function handleInsert() {
		if (!inputKey.trim() || animating) return;
		const seq = probeSequence(inputKey, strategy);
		const alreadyExists = seq.some(
			(idx) => table[idx]?.state === "occupied" && table[idx]?.key === inputKey,
		);
		if (alreadyExists) {
			setMessage(`"${inputKey}" is already in the table`);
			return;
		}
		const slot = seq.find((idx) => table[idx]?.state !== "occupied");
		if (slot === undefined) {
			setMessage("table full — no free slot in this walk pattern");
			return;
		}

		animateProbe(seq, slot, "insert");
		setTimeout(
			() => {
				setTable((prev) => {
					const next = [...prev];
					next[slot] = { key: inputKey, state: "occupied" };
					return next;
				});
			},
			seq.indexOf(slot) * 350 + 50,
		);
	}

	function handleSearch() {
		if (!inputKey.trim() || animating) return;
		const seq = probeSequence(inputKey, strategy);
		const foundIdx = seq.findIndex(
			(idx) => table[idx]?.state === "occupied" && table[idx]?.key === inputKey,
		);
		if (foundIdx >= 0) {
			setMessage(
				`Found "${inputKey}" at slot ${seq[foundIdx]} — ${foundIdx + 1} probe${foundIdx === 0 ? "" : "s"} checked`,
			);
			animateProbe(seq, seq[foundIdx], "search");
			return;
		}
		const emptyIdx = seq.findIndex((idx) => table[idx]?.state === "empty");
		if (emptyIdx >= 0) {
			setMessage(
				`"${inputKey}" not found — ${emptyIdx + 1} probe${emptyIdx === 0 ? "" : "s"} checked, stopped at the first empty slot`,
			);
			animateProbe(seq, seq[emptyIdx], "search");
			return;
		}
		setMessage(
			`"${inputKey}" not found — the walk checked every slot in its pattern`,
		);
		animateProbe(seq, null, "search");
	}

	function handleDelete() {
		if (!inputKey.trim() || animating) return;
		const seq = probeSequence(inputKey, strategy);
		const slot = seq.find(
			(idx) => table[idx]?.state === "occupied" && table[idx]?.key === inputKey,
		);
		if (slot === undefined) {
			setMessage(`"${inputKey}" is not in the table`);
			return;
		}

		animateProbe(seq, slot, "delete");
		setTimeout(
			() => {
				setTable((prev) => {
					const next = [...prev];
					next[slot] = { key: null, state: "deleted" };
					return next;
				});
			},
			seq.indexOf(slot) * 350 + 50,
		);
	}

	function handleReset() {
		setTable(
			Array.from({ length: TABLE_SIZE }, () => ({ key: null, state: "empty" })),
		);
		setProbeHighlight([]);
		setFoundSlot(null);
		setAnimating(false);
		setMessage("");
	}

	function slotClass(idx: number): string {
		const slot = table[idx] ?? { key: null, state: "empty" as const };
		const isProbed = probeHighlight.includes(idx);
		const isFound = foundSlot === idx;

		if (isFound) {
			return match(lastOp)
				.with(
					"insert",
					() => "bg-green-500/25 border-green-400/60 text-green-300",
				)
				.with(
					"search",
					() => "bg-amber-500/25 border-amber-400/60 text-amber-300",
				)
				.with("delete", () => "bg-red-500/25 border-red-400/60 text-red-300")
				.otherwise(() => "bg-zinc-800 border-zinc-600 text-zinc-300");
		}
		if (isProbed)
			return "bg-purple-500/20 border-purple-400/50 text-purple-300";
		if (slot.state === "occupied")
			return "bg-zinc-700/60 border-zinc-600/70 text-zinc-200";
		if (slot.state === "deleted")
			return "bg-zinc-800/30 border-zinc-700/30 text-zinc-600 line-through";
		return "bg-zinc-900/50 border-zinc-700/30 text-zinc-600";
	}

	const occupied = table.filter((s) => s.state === "occupied").length;
	const loadFactor = (occupied / TABLE_SIZE).toFixed(2);
	// Slots were placed with the current strategy's walk pattern, so switching
	// mid-fill would make existing keys unfindable
	const tableClear = table.every((s) => s.state === "empty");

	const strategyMeta: Record<
		ProbingStrategy,
		{ formula: string; tag: string }
	> = {
		linear: { formula: "h(k) + i", tag: "simple, clusters badly" },
		quadratic: { formula: "h(k) + i²", tag: "skips ahead, still clusters" },
		double: {
			formula: "h1(k) + i·h2(k)",
			tag: "best spread — step must share no factor with size",
		},
	};

	return (
		<DemoSection
			title="Operations playground: open addressing"
			description="With open addressing nothing leaves the array. When a slot is taken, the key steps forward by the strategy's amount until it finds a free slot. A search repeats the same steps. Delete leaves a marker called a tombstone, so a later search does not stop early at the empty space it left behind."
		>
			<div className="space-y-5">
				{/* Strategy toggle */}
				<div className="space-y-1.5">
					<div className="flex flex-wrap gap-2">
						{(["linear", "quadratic", "double"] as ProbingStrategy[]).map(
							(s) => {
								const { formula, tag } = strategyMeta[s];
								return (
									<button
										key={s}
										type="button"
										onClick={() => setStrategy(s)}
										disabled={!tableClear}
										className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors flex flex-col items-start gap-0.5 disabled:opacity-50 ${
											strategy === s
												? "bg-purple-600/30 text-purple-300 border-purple-500/50"
												: "bg-zinc-800/40 text-zinc-400 border-zinc-700/50 hover:bg-zinc-800/70"
										}`}
									>
										<span className="font-mono">{formula}</span>
										<span
											className={`text-[10px] font-normal ${strategy === s ? "text-purple-400" : "text-zinc-600"}`}
										>
											{tag}
										</span>
									</button>
								);
							},
						)}
					</div>
					{!tableClear && (
						<p className="text-xs text-amber-400/80">
							Reset to switch strategy — the current slots were placed using the
							old walk pattern, so they would be unfindable under a new one.
						</p>
					)}
				</div>

				{/* Input + ops */}
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
							disabled={animating || !inputKey.trim()}
							className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 ${
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
				</div>

				<output aria-live="polite" className="block text-sm text-zinc-400">
					{message}
				</output>

				{/* Table visualization */}
				<div>
					<div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
						{Array.from(table.entries()).map(([slotIdx, slot]) => (
							<div key={`slot-${slotIdx}`} className="space-y-0.5 text-center">
								<div className="text-xs text-zinc-600 font-mono">{slotIdx}</div>
								<AnimatePresence mode="wait">
									<motion.div
										key={`slot-${slotIdx}-${slot.state}-${slot.key ?? "empty"}`}
										initial={{ scale: 0.9 }}
										animate={{ scale: 1 }}
										className={`h-10 rounded-lg border flex items-center justify-center text-xs font-mono transition-all duration-200 ${slotClass(slotIdx)}`}
									>
										{slot.state === "occupied"
											? (slot.key?.length ?? 0) > 4
												? `${slot.key?.slice(0, 3)}…`
												: slot.key
											: slot.state === "deleted"
												? "✕"
												: "—"}
									</motion.div>
								</AnimatePresence>
								{probeHighlight.includes(slotIdx) && (
									<div className="text-xs text-purple-400 font-mono">
										#{probeHighlight.indexOf(slotIdx) + 1}
									</div>
								)}
							</div>
						))}
					</div>
					<p className="text-xs text-zinc-600 mt-1.5">
						Purple numbers = probe attempt order. Each key's home slot comes
						from a standard string hash — h = h·31 + char code — folded into a
						slot with % {TABLE_SIZE}.
					</p>
				</div>

				{/* Legend */}
				<div className="flex flex-wrap gap-3 text-xs text-zinc-500">
					{[
						{ color: "bg-zinc-700/60 border-zinc-600/70", label: "Occupied" },
						{
							color: "bg-purple-500/20 border-purple-400/50",
							label: "Probe path",
						},
						{
							color: "bg-zinc-800/30 border-zinc-700/30",
							label:
								"Deleted (✕ tombstone — search keeps walking past it; insert can reuse it)",
						},
					].map(({ color, label }) => (
						<div key={label} className="flex items-center gap-1.5">
							<div className={`w-3 h-3 rounded border shrink-0 ${color}`} />
							{label}
						</div>
					))}
				</div>

				<p className="text-xs text-zinc-600">
					Real tables periodically rebuild themselves to clear tombstones out.
				</p>

				<div className="grid grid-cols-2 gap-2 text-xs">
					<div className="rounded-lg bg-zinc-800/40 border border-zinc-700/50 p-2 text-center">
						<div className="font-mono font-bold text-lg text-purple-300">
							{occupied}/{TABLE_SIZE}
						</div>
						<div className="text-zinc-500">Slots filled</div>
					</div>
					<div className="rounded-lg bg-zinc-800/40 border border-zinc-700/50 p-2 text-center">
						<div
							className={`font-mono font-bold text-lg ${
								Number(loadFactor) > 0.7
									? "text-red-300"
									: Number(loadFactor) > 0.5
										? "text-amber-300"
										: "text-green-300"
							}`}
						>
							{loadFactor}
						</div>
						<div className="text-zinc-500">Load factor α</div>
					</div>
				</div>

				{/* Clustering insight */}
				<div className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-700/50 text-xs text-zinc-400 space-y-1.5">
					<p>
						<strong className="text-zinc-300">Clustering:</strong> Linear
						probing creates{" "}
						<span className="text-red-300">primary clusters</span> — long
						contiguous runs of occupied slots that grow with each collision,
						forcing later keys to probe further. Quadratic probing breaks up
						contiguous runs but causes{" "}
						<span className="text-amber-300">secondary clustering</span> — keys
						that hash to the same initial slot always follow the same probe
						sequence, so they still contend even when not adjacent. Double
						hashing eliminates both by computing a per-key step size, scattering
						probes unpredictably.
					</p>
					<p>
						Keep α &lt; 0.7 for open addressing — tighter than chaining because
						all keys compete for the same flat array; there's no overflow into a
						list.{" "}
						<span className="text-amber-400">
							Note: quadratic probing only guarantees visiting all slots when
							table size is prime and α &lt; 0.5. Size 10 is non-prime, so some
							slots may be unreachable. Double hashing has the same rule in
							reverse: its step h2(k) must share no factor with the table size.
							This demo always picks h2 from 1, 3, 7, or 9 — none share a factor
							with 10. Real tables get the same guarantee by using a prime size.
						</span>
					</p>
				</div>
			</div>
		</DemoSection>
	);
}
