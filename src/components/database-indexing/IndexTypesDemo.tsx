import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DemoSection } from "../shared/DemoSection";

// ── Data ──────────────────────────────────────────────────────────────────────
interface DataRow {
	id: number;
	name: string;
	score: number;
}

const ROWS: DataRow[] = [
	{ id: 3, name: "Alice", score: 85 },
	{ id: 7, name: "Bob", score: 72 },
	{ id: 12, name: "Carol", score: 91 },
	{ id: 1, name: "David", score: 68 },
	{ id: 9, name: "Eve", score: 79 },
	{ id: 5, name: "Frank", score: 88 },
];

// Clustered: rows ARE stored in name order (index key = name)
const CLUSTERED_ROWS = [...ROWS].sort((a, b) => a.name.localeCompare(b.name));
// Non-clustered: data stays in insertion order; index is separate
const HEAP_ROWS = ROWS; // original insertion order
const TARGET_NAME = "Carol";

// Build non-clustered index (sorted by name, points to heap position)
interface IndexEntry {
	name: string;
	heapPos: number; // 0-indexed position in HEAP_ROWS
}
const NC_INDEX: IndexEntry[] = [...ROWS]
	.sort((a, b) => a.name.localeCompare(b.name))
	.map((r) => ({
		name: r.name,
		heapPos: HEAP_ROWS.findIndex((h) => h.id === r.id),
	}));

const TARGET_NC_IDX = NC_INDEX.findIndex((e) => e.name === TARGET_NAME);
const TARGET_HEAP_POS = NC_INDEX[TARGET_NC_IDX]?.heapPos ?? 0;
const TARGET_CLUSTERED_POS = CLUSTERED_ROWS.findIndex(
	(r) => r.name === TARGET_NAME,
);

// ── Sub-components ─────────────────────────────────────────────────────────────
type LookupPhase = "idle" | "index" | "data" | "done";

function ClusteredPanel({ phase }: { phase: LookupPhase }) {
	return (
		<div className="flex-1 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
			<div className="mb-3">
				<span className="text-sm font-semibold text-accent-violet">
					Clustered Index
				</span>
				<div className="text-xs text-text-muted mt-0.5">
					Data rows stored in key order — the index IS the data.
				</div>
			</div>

			{/* The data rows (ARE the index) */}
			<div className="mb-2 text-[10px] text-text-muted uppercase tracking-wider">
				Data (sorted by name = index order)
			</div>
			<div className="space-y-1">
				{CLUSTERED_ROWS.map((row, i) => {
					const isTarget = row.name === TARGET_NAME;
					const isActive =
						isTarget &&
						(phase === "index" || phase === "data" || phase === "done");
					return (
						<motion.div
							key={row.id}
							animate={{
								backgroundColor: isActive
									? "rgba(139,92,246,0.2)"
									: "rgba(39,39,42,0.4)",
								borderColor: isActive
									? "rgba(139,92,246,0.5)"
									: "rgba(63,63,70,0.3)",
							}}
							transition={{ duration: 0.3, delay: isActive ? i * 0.02 : 0 }}
							className="flex gap-3 px-2 py-1 rounded border text-xs font-mono"
						>
							<span className="w-4 text-text-faint">{i + 1}</span>
							<span className="w-14 text-text-secondary">{row.name}</span>
							<span className="w-6 text-text-muted">{row.score}</span>
							{isActive && (
								<motion.span
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									className="ml-auto text-accent-violet-soft text-[10px]"
								>
									✓ direct
								</motion.span>
							)}
						</motion.div>
					);
				})}
			</div>

			<AnimatePresence>
				{phase === "done" && (
					<motion.div
						initial={{ opacity: 0, y: 4 }}
						animate={{ opacity: 1, y: 0 }}
						className="mt-3 text-xs px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20 text-accent-violet"
					>
						✅ Leaf node <em>contains</em> the full data row — no extra I/O
						after tree traversal (position {TARGET_CLUSTERED_POS + 1}).
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

function NonClusteredPanel({ phase }: { phase: LookupPhase }) {
	return (
		<div className="flex-1 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
			<div className="mb-3">
				<span className="text-sm font-semibold text-accent-amber">
					Non-Clustered Index
				</span>
				<div className="text-xs text-text-muted mt-0.5">
					Separate index structure + pointer to heap row.
				</div>
			</div>

			{/* Index structure */}
			<div className="mb-2 text-[10px] text-text-muted uppercase tracking-wider">
				Index (sorted)
			</div>
			<div className="space-y-0.5 mb-3">
				{NC_INDEX.map((entry) => {
					const isTarget = entry.name === TARGET_NAME;
					const isActive =
						isTarget &&
						(phase === "index" || phase === "data" || phase === "done");
					return (
						<motion.div
							key={entry.name}
							animate={{
								backgroundColor: isActive
									? "rgba(245,158,11,0.2)"
									: "rgba(39,39,42,0.4)",
								borderColor: isActive
									? "rgba(245,158,11,0.5)"
									: "rgba(63,63,70,0.3)",
							}}
							transition={{ duration: 0.3 }}
							className="flex gap-2 px-2 py-0.5 rounded border text-xs font-mono items-center"
						>
							<span className="w-14 text-text-secondary">{entry.name}</span>
							<span className="text-text-faint">→ heap[{entry.heapPos}]</span>
							{isActive && (
								<motion.span
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									className="ml-auto text-accent-amber-soft text-[10px]"
								>
									found!
								</motion.span>
							)}
						</motion.div>
					);
				})}
			</div>

			{/* Arrow between index and heap */}
			<AnimatePresence>
				{phase === "data" || phase === "done" ? (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="flex justify-center my-1"
					>
						<div className="text-accent-amber-soft text-sm">
							↓ follow pointer
						</div>
					</motion.div>
				) : null}
			</AnimatePresence>

			{/* Heap (unsorted) */}
			<div className="mb-2 text-[10px] text-text-muted uppercase tracking-wider">
				Heap (insertion order)
			</div>
			<div className="space-y-0.5">
				{HEAP_ROWS.map((row, i) => {
					const isTarget = i === TARGET_HEAP_POS;
					const isHighlighted =
						isTarget && (phase === "data" || phase === "done");
					return (
						<motion.div
							key={row.id}
							animate={{
								backgroundColor: isHighlighted
									? "rgba(245,158,11,0.2)"
									: "rgba(39,39,42,0.3)",
								borderColor: isHighlighted
									? "rgba(245,158,11,0.5)"
									: "rgba(63,63,70,0.2)",
							}}
							transition={{ duration: 0.3 }}
							className="flex gap-3 px-2 py-0.5 rounded border text-xs font-mono"
						>
							<span className="w-4 text-text-faint">{i}</span>
							<span className="w-14 text-text-secondary">{row.name}</span>
							<span className="w-6 text-text-muted">{row.score}</span>
							{isHighlighted && (
								<motion.span
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									className="ml-auto text-accent-amber-soft text-[10px]"
								>
									✓ found
								</motion.span>
							)}
						</motion.div>
					);
				})}
			</div>

			<AnimatePresence>
				{phase === "done" && (
					<motion.div
						initial={{ opacity: 0, y: 4 }}
						animate={{ opacity: 1, y: 0 }}
						className="mt-3 text-xs px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-accent-amber"
					>
						⚠️ Leaf node has only a <em>pointer</em> — one extra I/O to fetch the
						actual row from heap position {TARGET_HEAP_POS}.
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

// ── Main component ─────────────────────────────────────────────────────────────
export function IndexTypesDemo() {
	const [phase, setPhase] = useState<LookupPhase>("idle");
	const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

	useEffect(
		() => () => {
			for (const t of timeoutRefs.current) clearTimeout(t);
		},
		[],
	);

	const runLookup = useCallback(() => {
		if (phase !== "idle") {
			for (const t of timeoutRefs.current) clearTimeout(t);
			timeoutRefs.current = [];
			setPhase("idle");
			return;
		}
		setPhase("index");
		timeoutRefs.current = [
			setTimeout(() => setPhase("data"), 800),
			setTimeout(() => setPhase("done"), 1400),
		];
	}, [phase]);

	return (
		<DemoSection
			title="Demo 3: Clustered vs. Non-Clustered Index"
			description={`Watch how looking up "${TARGET_NAME}" differs between index types. Clustered reads data directly; non-clustered needs an extra heap pointer dereference.`}
		>
			<div className="flex flex-wrap gap-2 mb-4">
				<button
					type="button"
					onClick={runLookup}
					className="px-4 py-1.5 rounded-lg text-sm font-medium bg-teal-600/20 text-accent-teal border border-teal-500/30 hover:bg-teal-600/30 transition-colors"
				>
					{phase === "idle" ? `▶ Lookup "${TARGET_NAME}"` : "↺ Reset"}
				</button>
			</div>

			<div className="flex flex-col sm:flex-row gap-4">
				<ClusteredPanel phase={phase} />
				<NonClusteredPanel phase={phase} />
			</div>

			<div className="mt-4 p-3 rounded-lg bg-surface-secondary/30 border border-border-secondary/50 text-xs text-text-tertiary space-y-1">
				<p>
					<strong className="text-accent-violet">Clustered:</strong> The B-Tree
					leaf pages <em>contain the actual data rows</em>, stored in index-key
					order. After tree traversal you already have the data — no extra I/O.
					Range scans (e.g.{" "}
					<code className="text-text-secondary">
						WHERE name BETWEEN 'A' AND 'E'
					</code>
					) are extremely fast because matching rows are physically adjacent.
				</p>
				<p>
					<strong className="text-accent-amber">Non-Clustered:</strong> The leaf
					pages store only the <em>search key + a pointer</em> (row ID or PK)
					back to the heap. Each match requires a second lookup to fetch the
					actual row. Range scans can cause many random I/Os — the "index scan +
					key lookup" anti-pattern.
				</p>
			</div>
		</DemoSection>
	);
}
