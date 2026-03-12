import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import type { TableRow } from "./types";

// ── Seed data ────────────────────────────────────────────────────────────────
const TABLE_DATA: TableRow[] = [
	{ id: 1, name: "Alice", age: 28, email: "alice@example.com" },
	{ id: 2, name: "Bob", age: 34, email: "bob@example.com" },
	{ id: 3, name: "Carol", age: 22, email: "carol@example.com" },
	{ id: 4, name: "David", age: 45, email: "david@example.com" },
	{ id: 5, name: "Eve", age: 31, email: "eve@example.com" },
	{ id: 6, name: "Frank", age: 27, email: "frank@example.com" },
	{ id: 7, name: "Grace", age: 39, email: "grace@example.com" },
	{ id: 8, name: "Hank", age: 52, email: "hank@example.com" },
	{ id: 9, name: "Iris", age: 24, email: "iris@example.com" },
	{ id: 10, name: "Jack", age: 36, email: "jack@example.com" },
	{ id: 11, name: "Karen", age: 41, email: "karen@example.com" },
	{ id: 12, name: "Leo", age: 29, email: "leo@example.com" },
	{ id: 13, name: "Mia", age: 33, email: "mia@example.com" },
	{ id: 14, name: "Nora", age: 26, email: "nora@example.com" },
	{ id: 15, name: "Oscar", age: 48, email: "oscar@example.com" },
	{ id: 16, name: "Pam", age: 37, email: "pam@example.com" },
	{ id: 17, name: "Quinn", age: 21, email: "quinn@example.com" },
	{ id: 18, name: "Rachel", age: 30, email: "rachel@example.com" },
	{ id: 19, name: "Steve", age: 44, email: "steve@example.com" },
	{ id: 20, name: "Tina", age: 25, email: "tina@example.com" },
];

// Sorted index mapping: name → row index (simulating a B-Tree leaf lookup)
const SORTED_NAMES = [...TABLE_DATA].sort((a, b) =>
	a.name.localeCompare(b.name),
);

// B-Tree path representation for a given target row index (0-indexed in TABLE_DATA)
// Returns [root range label, internal range label, leaf name]
function getBTreePath(targetIndex: number): [string, string, string] {
	const name = TABLE_DATA[targetIndex]?.name ?? "";
	const first = SORTED_NAMES[0]?.name ?? "";
	const mid = SORTED_NAMES[Math.floor(SORTED_NAMES.length / 2)]?.name ?? "Mia";
	const last = SORTED_NAMES[SORTED_NAMES.length - 1]?.name ?? "";
	const isFirstHalf = name.localeCompare(mid) < 0;
	const internalStart = isFirstHalf ? first : mid;
	const internalEnd = isFirstHalf
		? (SORTED_NAMES[Math.floor(SORTED_NAMES.length / 4)]?.name ?? mid)
		: last;
	return [`${first}…${last}`, `${internalStart}…${internalEnd}`, name];
}

// ── Sub-components ───────────────────────────────────────────────────────────
function TableRowEl({
	row,
	state,
}: {
	row: TableRow;
	state: "idle" | "scanning" | "found" | "missed";
}) {
	const bg =
		state === "found"
			? "bg-teal-500/20 border-teal-500/50"
			: state === "scanning"
				? "bg-amber-500/15 border-amber-500/40"
				: state === "missed"
					? "bg-zinc-800/20 border-zinc-700/20 opacity-40"
					: "bg-zinc-800/40 border-zinc-700/30";
	return (
		<motion.div
			layout
			animate={{ opacity: state === "missed" ? 0.4 : 1 }}
			transition={{ duration: 0.15 }}
			className={`flex gap-2 px-2 py-1 rounded border text-xs font-mono transition-colors ${bg}`}
		>
			<span className="w-5 text-zinc-500">{row.id}</span>
			<span className="w-14 truncate text-zinc-300">{row.name}</span>
			<span className="w-6 text-zinc-500">{row.age}</span>
		</motion.div>
	);
}

type BTNodeState = "idle" | "active" | "found";

function BTreeNode({ label, state }: { label: string; state: BTNodeState }) {
	const bg =
		state === "found"
			? "bg-teal-500/25 border-teal-400/70 text-teal-300"
			: state === "active"
				? "bg-amber-500/20 border-amber-400/60 text-amber-300"
				: "bg-zinc-800 border-zinc-600 text-zinc-400";
	return (
		<motion.div
			initial={{ scale: 0.9, opacity: 0 }}
			animate={{ scale: 1, opacity: 1 }}
			className={`px-3 py-1.5 rounded-lg border text-xs font-mono text-center transition-colors duration-300 ${bg}`}
		>
			{label}
		</motion.div>
	);
}

// ── Main component ───────────────────────────────────────────────────────────
type Phase = "idle" | "fullScan" | "indexLookup" | "done";

export function ScanVsIndexDemo() {
	const [query, setQuery] = useState("Mia");
	const [phase, setPhase] = useState<Phase>("idle");
	const [scanIndex, setScanIndex] = useState(-1);
	const [scanFound, setScanFound] = useState<number | null>(null);
	const [indexPhase, setIndexPhase] = useState<
		"idle" | "root" | "internal" | "leaf" | "done"
	>("idle");
	const [indexFound, setIndexFound] = useState<number | null>(null);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const targetIndex = TABLE_DATA.findIndex(
		(r) => r.name.toLowerCase() === query.toLowerCase(),
	);
	const bTreePath =
		targetIndex >= 0 ? getBTreePath(targetIndex) : ["All", "M…Z", "?"];

	const reset = useCallback(() => {
		if (intervalRef.current) clearInterval(intervalRef.current);
		setPhase("idle");
		setScanIndex(-1);
		setScanFound(null);
		setIndexPhase("idle");
		setIndexFound(null);
	}, []);

	const startIndexLookup = useCallback(() => {
		setTimeout(() => setIndexPhase("root"), 100);
		setTimeout(() => setIndexPhase("internal"), 600);
		setTimeout(() => setIndexPhase("leaf"), 1100);
		setTimeout(() => {
			setIndexPhase("done");
			setIndexFound(targetIndex >= 0 ? targetIndex : -1);
			setPhase("done");
		}, 1600);
	}, [targetIndex]);

	const run = useCallback(() => {
		if (phase !== "idle") {
			reset();
			return;
		}
		setScanIndex(-1);
		setScanFound(null);
		setIndexPhase("idle");
		setIndexFound(null);
		setPhase("fullScan");

		let i = 0;
		intervalRef.current = setInterval(() => {
			setScanIndex(i);
			if (
				targetIndex >= 0 &&
				TABLE_DATA[i]?.name.toLowerCase() === query.toLowerCase()
			) {
				setScanFound(i);
				if (intervalRef.current) clearInterval(intervalRef.current);
				intervalRef.current = null;
				setPhase("indexLookup");
				startIndexLookup();
				return;
			}
			i++;
			if (i >= TABLE_DATA.length) {
				if (intervalRef.current) clearInterval(intervalRef.current);
				intervalRef.current = null;
				setScanFound(-1);
				setPhase("indexLookup");
				startIndexLookup();
			}
		}, 200);
	}, [phase, query, targetIndex, reset, startIndexLookup]);

	useEffect(
		() => () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		},
		[],
	);

	const getRowState = (
		idx: number,
	): "idle" | "scanning" | "found" | "missed" => {
		if (phase === "idle") return "idle";
		if (scanFound === idx) return "found";
		if (idx < scanIndex) return "missed";
		if (idx === scanIndex) return "scanning";
		return "idle";
	};

	const rowsScanned =
		scanFound !== null
			? scanFound === -1
				? TABLE_DATA.length
				: scanFound + 1
			: Math.max(0, scanIndex + 1);

	const btNodeState = (level: "root" | "internal" | "leaf"): BTNodeState => {
		const order = ["idle", "root", "internal", "leaf", "done"];
		const curr = order.indexOf(indexPhase);
		const lvl = order.indexOf(level);
		if (curr > lvl) return "found";
		if (curr === lvl) return "active";
		return "idle";
	};

	return (
		<DemoSection
			title="Demo 1: Full Table Scan vs. Index Lookup"
			description="Type a name to search for, then watch how a full scan checks every row while a B-Tree index jumps straight to the answer."
		>
			{/* Controls */}
			<div className="flex flex-wrap gap-3 mb-5 items-center">
				<input
					type="text"
					value={query}
					onChange={(e) => {
						setQuery(e.target.value);
						reset();
					}}
					placeholder="Search name…"
					className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-teal-500/60 w-40"
				/>
				<button
					type="button"
					onClick={run}
					className="px-4 py-1.5 rounded-lg text-sm font-medium bg-teal-600/20 text-teal-300 border border-teal-500/30 hover:bg-teal-600/30 transition-colors"
				>
					{phase === "idle" ? "▶ Run" : "↺ Reset"}
				</button>
				{targetIndex < 0 && query.length > 0 && (
					<span className="text-xs text-red-400">"{query}" not in dataset</span>
				)}
			</div>

			{/* Panels */}
			<div className="grid md:grid-cols-2 gap-4">
				{/* Full Scan Panel */}
				<div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
					<div className="flex items-center justify-between mb-3">
						<div>
							<span className="text-sm font-semibold text-red-300">
								Full Table Scan
							</span>
							<span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
								O(n)
							</span>
						</div>
						<span className="text-xs text-zinc-500 font-mono">
							{rowsScanned}/{TABLE_DATA.length} rows
						</span>
					</div>

					{/* Progress bar */}
					<div className="h-1 rounded-full bg-zinc-800 mb-3 overflow-hidden">
						<motion.div
							className="h-full bg-red-500/60 rounded-full"
							animate={{
								width: `${(rowsScanned / TABLE_DATA.length) * 100}%`,
							}}
							transition={{ duration: 0.2 }}
						/>
					</div>

					<div className="space-y-0.5 max-h-60 overflow-y-auto pr-1">
						{TABLE_DATA.map((row, idx) => (
							<TableRowEl key={row.id} row={row} state={getRowState(idx)} />
						))}
					</div>
					<AnimatePresence>
						{scanFound !== null && (
							<motion.div
								initial={{ opacity: 0, y: 4 }}
								animate={{ opacity: 1, y: 0 }}
								className={`mt-3 text-xs px-3 py-2 rounded-lg border ${scanFound === -1 ? "bg-zinc-800/30 border-zinc-700 text-zinc-400" : "bg-red-500/10 border-red-500/20 text-red-300"}`}
							>
								{scanFound === -1
									? "Not found — scanned all 20 rows."
									: `Found after scanning ${scanFound + 1} row${scanFound === 0 ? "" : "s"}.`}
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				{/* Index Lookup Panel */}
				<div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-4">
					<div className="flex items-center justify-between mb-3">
						<div>
							<span className="text-sm font-semibold text-teal-300">
								B-Tree Index Lookup
							</span>
							<span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
								O(log n)
							</span>
						</div>
						<span className="text-xs text-zinc-500 font-mono">3 hops</span>
					</div>

					{/* Tree visualization */}
					<div className="space-y-2 mb-4">
						{/* Root */}
						<div className="flex justify-center">
							<BTreeNode
								label={`Root: ${bTreePath[0]}`}
								state={btNodeState("root")}
							/>
						</div>
						{/* Connector */}
						<div className="flex justify-center">
							<div
								className={`w-px h-5 transition-colors duration-300 ${indexPhase !== "idle" ? "bg-amber-400/60" : "bg-zinc-700"}`}
							/>
						</div>
						{/* Internal */}
						<div className="flex justify-center">
							<BTreeNode
								label={`Internal: ${bTreePath[1]}`}
								state={btNodeState("internal")}
							/>
						</div>
						{/* Connector */}
						<div className="flex justify-center">
							<div
								className={`w-px h-5 transition-colors duration-300 ${indexPhase === "leaf" || indexPhase === "done" ? "bg-amber-400/60" : "bg-zinc-700"}`}
							/>
						</div>
						{/* Leaf */}
						<div className="flex justify-center">
							<BTreeNode
								label={`Leaf: "${bTreePath[2]}"`}
								state={btNodeState("leaf")}
							/>
						</div>
						{/* Connector to data row */}
						<AnimatePresence>
							{indexPhase === "done" && (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									className="flex flex-col items-center gap-1"
								>
									<div className="w-px h-4 bg-teal-400/60" />
									<div className="px-3 py-1.5 rounded-lg border border-teal-500/50 bg-teal-500/15 text-xs font-mono text-teal-300 text-center">
										→ Row #{(targetIndex >= 0 ? targetIndex : 0) + 1} (direct
										access)
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>

					<AnimatePresence>
						{indexPhase === "done" && (
							<motion.div
								initial={{ opacity: 0, y: 4 }}
								animate={{ opacity: 1, y: 0 }}
								className={`text-xs px-3 py-2 rounded-lg border ${indexFound === -1 ? "bg-zinc-800/30 border-zinc-700 text-zinc-400" : "bg-teal-500/10 border-teal-500/20 text-teal-300"}`}
							>
								{indexFound === -1
									? "Not in index — 3 hops to confirm absence."
									: "Found in 3 hops regardless of table size!"}
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</div>

			{/* Insight */}
			<div className="mt-4 p-3 rounded-lg bg-zinc-800/30 border border-zinc-700/50 text-xs text-zinc-400">
				<strong className="text-zinc-300">Key insight:</strong> A full scan must
				check <em>every</em> row — 20 comparisons. A B-Tree of{" "}
				<strong className="text-teal-400">order 3</strong> (max 2 keys/node, 3
				children) fits all 20 names in{" "}
				<strong className="text-teal-400">3 levels</strong> — because log₃(20) ≈
				2.7. On a table with 1 million rows, the scan does 1,000,000
				comparisons; a B-Tree of order 100 (like PostgreSQL's default) still
				needs only ~3 levels (log₁₀₀(1,000,000) = 3).
			</div>
		</DemoSection>
	);
}
