import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DemoSection } from "../shared/DemoSection";

// ── Scenario types ─────────────────────────────────────────────────────────────
type Scenario = "high-write" | "low-cardinality" | "small-table";

// ── High-write scenario ────────────────────────────────────────────────────────
// Teaching point: write amplification — every INSERT must write to table + every index.
// Splits are a SECONDARY cost. The primary cost is that you can't avoid N index writes for N inserts.

const NUM_INDEXES = 3; // simulate a table with 3 indexes (PK + 2 secondary)

function HighWriteCard() {
	const [insertCount, setInsertCount] = useState(0);
	const [animating, setAnimating] = useState(false);
	const [nodes, setNodes] = useState([2, 5, 8]);

	const simulateInsert = useCallback(() => {
		if (animating) return;
		setAnimating(true);
		const newVal = Math.floor(Math.random() * 99) + 1;
		setInsertCount((c) => c + 1);
		setNodes((prev) => {
			const next = [...prev, newVal].sort((a, b) => a - b);
			if (next.length > 5) return next.slice(-5);
			return next;
		});
		setTimeout(() => setAnimating(false), 500);
	}, [animating]);

	const reset = () => {
		setInsertCount(0);
		setNodes([2, 5, 8]);
	};

	// Write amplification: 1 table write + NUM_INDEXES index writes per INSERT
	const totalWrites = insertCount * (1 + NUM_INDEXES);
	const amplification = NUM_INDEXES + 1;

	return (
		<div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-3">
			<div className="flex items-start justify-between">
				<div>
					<h4 className="text-sm font-semibold text-accent-red">
						⚡ High Write Frequency
					</h4>
					<p className="text-xs text-text-muted mt-0.5">
						Every INSERT must update the table <em>and</em> every index.
					</p>
				</div>
				<button
					type="button"
					onClick={reset}
					className="text-xs text-text-faint hover:text-text-tertiary transition-colors"
				>
					↺
				</button>
			</div>

			{/* Mini insert visualization */}
			<div className="flex justify-center gap-1 flex-wrap">
				{nodes.map((n, i) => (
					<motion.div
						key={`node-pos-${i}-val-${n}`}
						layout
						initial={{ scale: 0, opacity: 0 }}
						animate={{
							scale: animating && i === nodes.length - 1 ? [1, 1.2, 1] : 1,
							opacity: 1,
						}}
						transition={{ duration: 0.3 }}
						className={`px-2 py-1 rounded border text-xs font-mono ${
							animating && i === nodes.length - 1
								? "bg-red-500/20 border-red-500/40 text-accent-red"
								: "bg-surface-secondary border-border-secondary text-text-tertiary"
						}`}
					>
						{n}
					</motion.div>
				))}
			</div>

			{/* Write amplification breakdown */}
			<div className="rounded-lg bg-surface-secondary/60 p-3 text-xs space-y-1.5">
				<div className="flex justify-between text-text-tertiary">
					<span>Table writes</span>
					<span className="font-mono text-text-secondary">{insertCount}</span>
				</div>
				{Array.from({ length: NUM_INDEXES }, (_, i) => (
					<div
						key={`index-write-${i + 1}`}
						className="flex justify-between text-text-muted"
					>
						<span>Index {i + 1} writes</span>
						<span className="font-mono text-accent-red-soft">
							{insertCount}
						</span>
					</div>
				))}
				<div className="border-t border-border-secondary pt-1.5 flex justify-between font-semibold">
					<span className="text-text-secondary">Total disk writes</span>
					<span className="font-mono text-accent-red">{totalWrites}</span>
				</div>
				<div className="text-[10px] text-text-faint text-right">
					Write amplification: {amplification}× per INSERT
				</div>
			</div>

			<button
				type="button"
				onClick={simulateInsert}
				disabled={animating}
				className="w-full py-2 rounded-lg text-xs font-medium bg-red-500/15 text-accent-red border border-red-500/25 hover:bg-red-500/25 transition-colors disabled:opacity-40"
			>
				➕ Insert Row
			</button>

			<p className="text-[11px] text-text-muted">
				<strong className="text-text-tertiary">Verdict:</strong> With{" "}
				{NUM_INDEXES} indexes, every INSERT costs {amplification}× the writes.
				On write-heavy workloads (logs, events), consider fewer indexes or using
				append-only tables without secondary indexes.
			</p>
		</div>
	);
}

// ── Low-cardinality scenario ────────────────────────────────────────────────────
const BOOL_DATA = [
	{ id: 1, name: "Alice", active: true },
	{ id: 2, name: "Bob", active: false },
	{ id: 3, name: "Carol", active: true },
	{ id: 4, name: "David", active: true },
	{ id: 5, name: "Eve", active: false },
	{ id: 6, name: "Frank", active: true },
	{ id: 7, name: "Grace", active: false },
	{ id: 8, name: "Hank", active: true },
];

function LowCardinalityCard() {
	const [searched, setSearched] = useState<boolean | null>(null);

	const trueCount = BOOL_DATA.filter((r) => r.active).length;
	const falseCount = BOOL_DATA.length - trueCount;

	// Selectivity = fraction of rows returned. High selectivity = bad index candidate.
	const trueSelectivity = ((trueCount / BOOL_DATA.length) * 100).toFixed(0);
	const falseSelectivity = ((falseCount / BOOL_DATA.length) * 100).toFixed(0);

	const lookup = (val: boolean) => setSearched(val);
	const reset = () => setSearched(null);

	const currentCount =
		searched === null ? 0 : searched ? trueCount : falseCount;
	const currentSelectivity =
		searched === null ? "–" : searched ? trueSelectivity : falseSelectivity;

	return (
		<div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 space-y-3">
			<div className="flex items-start justify-between">
				<div>
					<h4 className="text-sm font-semibold text-accent-yellow">
						🎲 Low Cardinality Column
					</h4>
					<p className="text-xs text-text-muted mt-0.5">
						Indexing a boolean — only 2 distinct values.
					</p>
				</div>
				<button
					type="button"
					onClick={reset}
					className="text-xs text-text-faint hover:text-text-tertiary transition-colors"
				>
					↺
				</button>
			</div>

			{/* True/False distribution bar — computed from actual data */}
			<div>
				<div className="text-[10px] text-text-muted mb-1">
					Column distribution (active)
				</div>
				<div className="flex h-6 rounded overflow-hidden">
					<div
						className="bg-green-500/40 flex items-center justify-center text-[10px] text-accent-green"
						style={{ width: `${(trueCount / BOOL_DATA.length) * 100}%` }}
					>
						{trueCount} true ({trueSelectivity}%)
					</div>
					<div
						className="bg-surface-tertiary/40 flex items-center justify-center text-[10px] text-text-tertiary"
						style={{ width: `${(falseCount / BOOL_DATA.length) * 100}%` }}
					>
						{falseCount} false ({falseSelectivity}%)
					</div>
				</div>
				<div className="text-[10px] text-text-faint mt-1">
					2 distinct values across {BOOL_DATA.length} rows
				</div>
			</div>

			{/* Rows */}
			<div className="space-y-0.5">
				{BOOL_DATA.map((row) => {
					const isMatch = searched !== null && row.active === searched;
					return (
						<motion.div
							key={row.id}
							animate={{
								backgroundColor: isMatch
									? "rgba(234,179,8,0.15)"
									: "rgba(39,39,42,0.4)",
								borderColor: isMatch
									? "rgba(234,179,8,0.4)"
									: "rgba(63,63,70,0.3)",
							}}
							className="flex gap-2 px-2 py-0.5 rounded border text-xs font-mono"
						>
							<span className="w-14 text-text-secondary">{row.name}</span>
							<span
								className={
									row.active ? "text-accent-green-soft" : "text-text-muted"
								}
							>
								{row.active ? "true" : "false"}
							</span>
						</motion.div>
					);
				})}
			</div>

			<div className="flex gap-2">
				<button
					type="button"
					onClick={() => lookup(true)}
					className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-yellow-500/10 text-accent-yellow border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors"
				>
					WHERE active = true
				</button>
				<button
					type="button"
					onClick={() => lookup(false)}
					className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-yellow-500/10 text-accent-yellow border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors"
				>
					WHERE active = false
				</button>
			</div>

			<AnimatePresence>
				{searched !== null && (
					<motion.div
						key={String(searched)}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="text-[11px] text-accent-yellow/80 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20"
					>
						Returns{" "}
						<strong>
							{currentCount}/{BOOL_DATA.length}
						</strong>{" "}
						rows ({currentSelectivity}% selectivity). The query planner will
						likely skip this index and do a full scan — traversing the B-Tree
						only to read {currentSelectivity}% of the table anyway is slower
						than just scanning it directly.
					</motion.div>
				)}
			</AnimatePresence>

			<p className="text-[11px] text-text-muted">
				<strong className="text-text-tertiary">Verdict:</strong> Avoid indexing
				boolean, status, or gender columns. The query planner (Postgres, MySQL)
				often ignores such indexes. A <em>partial index</em> (
				<code className="text-text-tertiary">WHERE active = true</code>) can
				help when one value is rare.
			</p>
		</div>
	);
}

// ── Small table scenario ────────────────────────────────────────────────────────
const SMALL_TABLE = ["Alice", "Bob", "Carol", "David", "Eve"];
const INDEX_STEPS = ["Root", "Internal", "Leaf", "Data row"];

function SmallTableCard() {
	const [mode, setMode] = useState<"idle" | "scan" | "index">("idle");
	const [step, setStep] = useState(0);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	// Clean up interval on unmount (card is inside AnimatePresence which unmounts it)
	useEffect(() => {
		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, []);

	const runScan = () => {
		if (intervalRef.current) clearInterval(intervalRef.current);
		setMode("scan");
		setStep(0);
		let i = 0;
		intervalRef.current = setInterval(() => {
			i++;
			setStep(i);
			if (i >= SMALL_TABLE.length) {
				if (intervalRef.current) clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		}, 250);
	};

	const runIndex = () => {
		if (intervalRef.current) clearInterval(intervalRef.current);
		setMode("index");
		setStep(0);
		let i = 0;
		intervalRef.current = setInterval(() => {
			i++;
			setStep(i);
			if (i >= INDEX_STEPS.length) {
				if (intervalRef.current) clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		}, 300);
	};

	const reset = () => {
		if (intervalRef.current) clearInterval(intervalRef.current);
		intervalRef.current = null;
		setMode("idle");
		setStep(0);
	};

	return (
		<div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-3">
			<div className="flex items-start justify-between">
				<div>
					<h4 className="text-sm font-semibold text-accent-blue">
						📦 Small Table
					</h4>
					<p className="text-xs text-text-muted mt-0.5">
						5 rows — sequential scan is faster than tree traversal overhead.
					</p>
				</div>
				<button
					type="button"
					onClick={reset}
					className="text-xs text-text-faint hover:text-text-tertiary transition-colors"
				>
					↺
				</button>
			</div>

			{/* Comparison */}
			<div className="grid grid-cols-2 gap-2">
				<div className="rounded-lg border border-green-500/20 bg-green-500/5 p-2">
					<div className="text-[10px] text-accent-green-soft mb-1">
						Seq Scan
					</div>
					{SMALL_TABLE.map((name, i) => (
						<motion.div
							key={name}
							animate={{
								color:
									mode === "scan" && i < step
										? "#86efac"
										: mode === "scan" && i === step - 1
											? "#4ade80"
											: "var(--svg-text-muted)",
							}}
							className="text-[11px] font-mono"
						>
							{i + 1}. {name}
						</motion.div>
					))}
					<div className="text-[10px] text-text-faint mt-1">
						{mode === "scan" && step > 0
							? `${step}/${SMALL_TABLE.length} ops`
							: `${SMALL_TABLE.length} ops total`}
					</div>
				</div>

				<div className="rounded-lg border border-red-500/20 bg-red-500/5 p-2">
					<div className="text-[10px] text-accent-red-soft mb-1">
						Index Lookup
					</div>
					{INDEX_STEPS.map((s, i) => (
						<motion.div
							key={s}
							animate={{
								color:
									mode === "index" && i < step
										? "#fca5a5"
										: "var(--svg-text-muted)",
							}}
							className="text-[11px] font-mono"
						>
							{i + 1}. {s}
						</motion.div>
					))}
					<div className="text-[10px] text-text-faint mt-1">
						{mode === "index" && step > 0
							? `${step}/${INDEX_STEPS.length} ops`
							: `${INDEX_STEPS.length} ops (overhead!)`}
					</div>
				</div>
			</div>

			{/* Winner callout */}
			<AnimatePresence>
				{mode !== "idle" &&
					step >= Math.max(SMALL_TABLE.length, INDEX_STEPS.length) && (
						<motion.div
							initial={{ opacity: 0, y: 4 }}
							animate={{ opacity: 1, y: 0 }}
							className="text-[11px] px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-accent-green"
						>
							Seq scan: <strong>{SMALL_TABLE.length}</strong> ops · Index:{" "}
							<strong>{INDEX_STEPS.length}</strong> ops — index lost!
						</motion.div>
					)}
			</AnimatePresence>

			<div className="flex gap-2">
				<button
					type="button"
					onClick={runScan}
					disabled={mode !== "idle"}
					className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 text-accent-green border border-green-500/20 hover:bg-green-500/20 transition-colors disabled:opacity-40"
				>
					▶ Seq Scan
				</button>
				<button
					type="button"
					onClick={runIndex}
					disabled={mode !== "idle"}
					className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-accent-red border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-40"
				>
					▶ Index Lookup
				</button>
			</div>

			<p className="text-[11px] text-text-muted">
				<strong className="text-text-tertiary">Verdict:</strong> PostgreSQL and
				MySQL automatically ignore indexes on tiny tables during planning
				(visible in <code className="text-text-tertiary">EXPLAIN</code>). The
				buffer pool can fit the entire table in one page read — B-Tree traversal
				is pure overhead.
			</p>
		</div>
	);
}

// ── Main component ─────────────────────────────────────────────────────────────
const SCENARIOS: { id: Scenario; label: string }[] = [
	{ id: "high-write", label: "⚡ High Writes" },
	{ id: "low-cardinality", label: "🎲 Low Cardinality" },
	{ id: "small-table", label: "📦 Small Table" },
];

export function WhenNotToIndexDemo() {
	const [active, setActive] = useState<Scenario>("high-write");

	return (
		<DemoSection
			title="Demo 4: When NOT to Index"
			description="Indexes aren't always the answer. These three scenarios show when indexes hurt more than they help — critical interview knowledge."
		>
			{/* Tab selector */}
			<div className="flex gap-2 mb-4 flex-wrap">
				{SCENARIOS.map(({ id, label }) => (
					<button
						key={id}
						type="button"
						onClick={() => setActive(id)}
						className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
							active === id
								? "bg-surface-tertiary text-text-primary border-text-muted"
								: "bg-surface-secondary/50 text-text-tertiary border-border-secondary hover:bg-surface-tertiary/50"
						}`}
					>
						{label}
					</button>
				))}
			</div>

			<AnimatePresence mode="wait">
				<motion.div
					key={active}
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -8 }}
					transition={{ duration: 0.2 }}
				>
					{active === "high-write" && <HighWriteCard />}
					{active === "low-cardinality" && <LowCardinalityCard />}
					{active === "small-table" && <SmallTableCard />}
				</motion.div>
			</AnimatePresence>

			<div className="mt-4 p-3 rounded-lg bg-surface-secondary/30 border border-border-secondary/50 text-xs text-text-tertiary">
				<strong className="text-text-secondary">Rule of thumb:</strong> Index
				columns you <em>frequently filter, sort, or join on</em> with high
				cardinality (many distinct values). Every index adds{" "}
				<em>write overhead + storage cost</em>. Run{" "}
				<code className="text-text-secondary">EXPLAIN ANALYZE</code> in
				PostgreSQL to verify an index is actually being used — the planner might
				be ignoring it.
			</div>
		</DemoSection>
	);
}
