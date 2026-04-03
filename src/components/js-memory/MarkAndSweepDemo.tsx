import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import { useColorScheme } from "../../hooks/useColorScheme";
import { THEME_COLORS } from "../../theme/tokens";
import { DemoSection } from "../shared/DemoSection";

// ─── Types ────────────────────────────────────────────────────────────────────

type NodeStatus = "unreachable" | "marked" | "swept";

interface GCNode {
	id: string;
	label: string;
	x: number; // 0–1
	y: number;
	isRoot: boolean;
}

interface GCEdge {
	from: string;
	to: string;
	id: string;
}

// ─── Initial Graph Data ───────────────────────────────────────────────────────

const INITIAL_NODES: GCNode[] = [
	{ id: "global", label: "global", x: 0.08, y: 0.45, isRoot: true },
	{ id: "stack", label: "stack\nframe", x: 0.08, y: 0.75, isRoot: true },
	{ id: "a", label: "Obj A", x: 0.28, y: 0.2, isRoot: false },
	{ id: "b", label: "Obj B", x: 0.28, y: 0.6, isRoot: false },
	{ id: "c", label: "Obj C", x: 0.52, y: 0.15, isRoot: false },
	{ id: "d", label: "Obj D", x: 0.52, y: 0.5, isRoot: false },
	{ id: "e", label: "Obj E", x: 0.75, y: 0.3, isRoot: false },
	{ id: "f", label: "Obj F", x: 0.75, y: 0.72, isRoot: false },
	{ id: "g", label: "Obj G", x: 0.52, y: 0.82, isRoot: false }, // isolated
];

const INITIAL_EDGES: GCEdge[] = [
	{ from: "global", to: "a", id: "global-a" },
	{ from: "global", to: "b", id: "global-b" },
	{ from: "stack", to: "b", id: "stack-b" },
	{ from: "a", to: "c", id: "a-c" },
	{ from: "a", to: "e", id: "a-e" },
	{ from: "b", to: "d", id: "b-d" },
	{ from: "d", to: "f", id: "d-f" },
	// g is intentionally disconnected from roots
];

const PHASE_DELAY_MS = 1200;
const MARK_STEP_MS = 320;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildAdjacency(
	nodes: GCNode[],
	edges: GCEdge[],
): Map<string, string[]> {
	const adj = new Map<string, string[]>();
	for (const n of nodes) adj.set(n.id, []);
	for (const e of edges) {
		adj.get(e.from)?.push(e.to);
	}
	return adj;
}

// BFS order from all roots through the given edge set
function bfsOrder(nodes: GCNode[], edges: GCEdge[]): string[] {
	const adj = buildAdjacency(nodes, edges);
	const roots = nodes.filter((n) => n.isRoot).map((n) => n.id);
	const visited = new Set<string>();
	const queue = [...roots];
	const order: string[] = [];
	for (const r of roots) visited.add(r);
	while (queue.length > 0) {
		const cur = queue.shift() as string;
		order.push(cur);
		for (const neighbor of adj.get(cur) ?? []) {
			if (!visited.has(neighbor)) {
				visited.add(neighbor);
				queue.push(neighbor);
			}
		}
	}
	return order;
}

// ─── Canvas dims ──────────────────────────────────────────────────────────────

const CW = 560;
const CH = 340;
const NR = 28;

// ─── Component ────────────────────────────────────────────────────────────────

export function MarkAndSweepDemo() {
	const t = THEME_COLORS[useColorScheme()];
	const [nodes] = useState<GCNode[]>(INITIAL_NODES);
	const [edges, setEdges] = useState<GCEdge[]>(INITIAL_EDGES);
	const [statuses, setStatuses] = useState<Record<string, NodeStatus>>(() =>
		Object.fromEntries(INITIAL_NODES.map((n) => [n.id, "unreachable"])),
	);
	const [phase, setPhase] = useState<"idle" | "marking" | "sweeping" | "done">(
		"idle",
	);
	const [highlightedEdge, setHighlightedEdge] = useState<string | null>(null);

	const reset = useCallback(() => {
		setEdges(INITIAL_EDGES);
		setStatuses(
			Object.fromEntries(INITIAL_NODES.map((n) => [n.id, "unreachable"])),
		);
		setPhase("idle");
		setHighlightedEdge(null);
	}, []);

	const severEdge = (edgeId: string) => {
		if (phase === "marking" || phase === "sweeping") return;
		setEdges((prev) => prev.filter((e) => e.id !== edgeId));
		// Reset statuses so user can re-run GC
		setStatuses(
			Object.fromEntries(INITIAL_NODES.map((n) => [n.id, "unreachable"])),
		);
		setPhase("idle");
	};

	const runGC = useCallback(async () => {
		if (phase === "marking" || phase === "sweeping") return;

		// Always reset statuses before a new GC run
		const freshStatuses: Record<string, NodeStatus> = Object.fromEntries(
			nodes.map((n) => [n.id, "unreachable"]),
		);
		setStatuses(freshStatuses);
		setPhase("marking");

		// --- Mark Phase ---
		const order = bfsOrder(nodes, edges);
		const updatedStatuses = { ...freshStatuses };

		for (const nodeId of order) {
			await sleep(MARK_STEP_MS);
			updatedStatuses[nodeId] = "marked";
			setStatuses({ ...updatedStatuses });
		}

		// --- Sweep Phase ---
		await sleep(PHASE_DELAY_MS);
		setPhase("sweeping");

		const finalStatuses = { ...updatedStatuses };
		for (const nodeId of Object.keys(finalStatuses)) {
			if (finalStatuses[nodeId] !== "marked") {
				finalStatuses[nodeId] = "swept";
			}
		}
		setStatuses({ ...finalStatuses });

		await sleep(600);
		setPhase("done");
	}, [nodes, edges, phase]);

	const nodeById = Object.fromEntries(nodes.map((n) => [n.id, n]));

	const nodeColor = (id: string): string => {
		const n = nodes.find((x) => x.id === id);
		if (n?.isRoot) return "#f59e0b"; // amber – GC root
		const s = statuses[id];
		if (s === "marked") return "#22c55e"; // green – alive
		if (s === "swept") return "var(--svg-text-muted)"; // grey – swept
		return "#6366f1"; // indigo – unreachable (unvisited)
	};

	return (
		<DemoSection
			title="Demo 2: GC Roots & Mark-and-Sweep"
			description="Watch V8 traverse from GC roots (amber), mark every reachable node green, then sweep unreachable objects. Sever an edge first to see a newly isolated node get collected."
		>
			{/* Legend */}
			<div className="flex flex-wrap gap-4 mb-4 text-xs font-mono">
				{[
					{ color: "#f59e0b", label: "GC Root (global/stack)" },
					{ color: "#6366f1", label: "Unreachable (not yet visited)" },
					{ color: "#22c55e", label: "Reachable (marked alive)" },
					{ color: "var(--svg-text-muted)", label: "Swept (reclaimed)" },
				].map(({ color, label }) => (
					<div key={label} className="flex items-center gap-1.5">
						<div
							className="w-3 h-3 rounded-full border"
							style={{ background: `${color}33`, borderColor: color }}
						/>
						<span className="text-text-tertiary">{label}</span>
					</div>
				))}
			</div>

			{/* Phase indicator */}
			<AnimatePresence mode="wait">
				{phase !== "idle" && (
					<motion.div
						key={phase}
						initial={{ opacity: 0, y: -6 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0 }}
						className="mb-4 px-4 py-2 rounded-lg text-sm font-medium border inline-flex items-center gap-2"
						style={
							phase === "marking"
								? {
										background: "#6366f130",
										borderColor: "#6366f155",
										color: "#a5b4fc",
									}
								: phase === "sweeping"
									? {
											background: "#f59e0b20",
											borderColor: "#f59e0b55",
											color: "#fcd34d",
										}
									: {
											background: "#22c55e20",
											borderColor: "#22c55e55",
											color: "#86efac",
										}
						}
					>
						{phase === "marking" && (
							<>
								<span className="inline-block w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
								Mark Phase — traversing from roots via BFS…
							</>
						)}
						{phase === "sweeping" && (
							<>
								<span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
								Sweep Phase — reclaiming unreachable objects…
							</>
						)}
						{phase === "done" && <>✅ GC cycle complete</>}
					</motion.div>
				)}
			</AnimatePresence>

			{/* Graph */}
			<div className="overflow-x-auto">
				<svg
					width="100%"
					viewBox={`0 0 ${CW} ${CH}`}
					className="rounded-xl border border-border-primary bg-surface-base"
					style={{ minWidth: 380 }}
					role="img"
					aria-label="GC heap graph"
				>
					<title>GC heap graph</title>

					{/* Edges */}
					{edges
						.filter(
							(edge) =>
								statuses[edge.from] !== "swept" &&
								statuses[edge.to] !== "swept",
						)
						.map((edge) => {
							const from = nodeById[edge.from];
							const to = nodeById[edge.to];
							if (!from || !to) return null;
							const fx = from.x * CW;
							const fy = from.y * CH;
							const tx = to.x * CW;
							const ty = to.y * CH;
							// Compute direction vector for arrow offset
							const dx = tx - fx;
							const dy = ty - fy;
							const dist = Math.sqrt(dx * dx + dy * dy) || 1;
							const ex2 = tx - (dx / dist) * (NR + 6);
							const ey2 = ty - (dy / dist) * (NR + 6);
							const isHovered = highlightedEdge === edge.id;
							return (
								// biome-ignore lint/a11y/noStaticElementInteractions: SVG <g> groups are standard interactive wrappers in SVG; ARIA roles don't apply here
								<g
									key={edge.id}
									onMouseEnter={() => setHighlightedEdge(edge.id)}
									onMouseLeave={() => setHighlightedEdge(null)}
									onClick={() => severEdge(edge.id)}
									style={{
										cursor:
											phase === "idle" || phase === "done"
												? "pointer"
												: "default",
									}}
								>
									{/* Fat invisible hit area */}
									<line
										x1={fx}
										y1={fy}
										x2={ex2}
										y2={ey2}
										stroke="transparent"
										strokeWidth={16}
									/>
									<motion.line
										x1={fx}
										y1={fy}
										x2={ex2}
										y2={ey2}
										stroke={isHovered ? "#ef4444" : t.svgBorder}
										strokeWidth={isHovered ? 2.5 : 1.5}
										markerEnd={`url(#arrowhead)`}
										animate={{ stroke: isHovered ? "#ef4444" : t.svgBorder }}
										transition={{ duration: 0.15 }}
									/>
									{isHovered && (
										<text
											x={(fx + ex2) / 2}
											y={(fy + ey2) / 2 - 8}
											textAnchor="middle"
											fontSize={9}
											fill="#ef4444"
											fontFamily="monospace"
										>
											click to sever
										</text>
									)}
								</g>
							);
						})}

					<defs>
						<marker
							id="arrowhead"
							markerWidth="6"
							markerHeight="6"
							refX="3"
							refY="3"
							orient="auto"
						>
							<path d="M0,0 L6,3 L0,6 Z" fill="var(--svg-border)" />
						</marker>
					</defs>

					{/* Nodes */}
					{nodes.map((node) => {
						const cx = node.x * CW;
						const cy = node.y * CH;
						const color = nodeColor(node.id);
						const swept = statuses[node.id] === "swept";
						return (
							<AnimatePresence key={node.id}>
								{!swept && (
									<motion.g
										initial={{ opacity: 0, scale: 0.5 }}
										animate={{
											opacity: 1,
											scale: 1,
										}}
										exit={{ opacity: 0, scale: 0 }}
										transition={{ duration: 0.5 }}
										style={{ transformOrigin: `${cx}px ${cy}px` }}
									>
										<motion.circle
											cx={cx}
											cy={cy}
											r={NR}
											fill={`${color}22`}
											stroke={color}
											strokeWidth={node.isRoot ? 2.5 : 1.5}
											animate={{ fill: `${color}22`, stroke: color }}
											transition={{ duration: 0.4 }}
										/>
										{node.isRoot && (
											<rect
												x={cx - 18}
												y={cy - NR - 14}
												width={36}
												height={13}
												rx={4}
												fill="#f59e0b33"
												stroke="#f59e0b55"
											/>
										)}
										{node.isRoot && (
											<text
												x={cx}
												y={cy - NR - 4}
												textAnchor="middle"
												fontSize={8}
												fill="#f59e0b"
												fontFamily="monospace"
												fontWeight="bold"
											>
												ROOT
											</text>
										)}
										<text
											x={cx}
											y={cy + 4}
											textAnchor="middle"
											fontSize={10}
											fill={color}
											fontFamily="monospace"
											fontWeight="600"
										>
											{node.label}
										</text>
									</motion.g>
								)}
							</AnimatePresence>
						);
					})}
				</svg>
			</div>

			{/* Controls */}
			<div className="flex items-center gap-3 mt-5">
				<button
					type="button"
					onClick={runGC}
					disabled={phase === "marking" || phase === "sweeping"}
					className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500/20 text-accent-emerald border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
				>
					🔄 Run GC
				</button>
				<button
					type="button"
					onClick={reset}
					disabled={phase === "marking" || phase === "sweeping"}
					className="px-4 py-2 rounded-lg text-sm font-medium bg-surface-secondary text-text-tertiary border border-border-secondary hover:text-text-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
				>
					↺ Reset Graph
				</button>
				<span className="text-xs text-text-faint ml-auto">
					{phase === "idle"
						? "Tip: hover an edge and click to sever it, then run GC"
						: phase === "done"
							? "Try severing another edge and run GC again"
							: ""}
				</span>
			</div>
		</DemoSection>
	);
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
