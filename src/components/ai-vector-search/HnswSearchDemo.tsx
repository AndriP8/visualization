import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import {
	bruteForceTopK,
	buildHnsw,
	generatePoints,
	HEIGHT,
	N,
	searchHnsw,
	WIDTH,
} from "./hnsw";

const LAYER_COLORS = ["#22d3ee", "#a78bfa", "#f472b6", "#fbbf24"];
const K = 5;

export function HnswSearchDemo() {
	const points = useMemo(generatePoints, []);
	const { nodes, maxLevel, entry } = useMemo(() => buildHnsw(points), [points]);
	const [query, setQuery] = useState({ x: 480, y: 90 });
	const [stepIdx, setStepIdx] = useState(0);

	const { steps, results } = useMemo(
		() => searchHnsw(nodes, entry, maxLevel, query, 16, K),
		[nodes, entry, maxLevel, query],
	);
	const trueTopK = useMemo(
		() => bruteForceTopK(points, query, K),
		[points, query],
	);

	const recall = useMemo(() => {
		const truth = new Set(trueTopK);
		const found = results.filter((r) => truth.has(r)).length;
		return (found / K) * 100;
	}, [trueTopK, results]);

	useEffect(() => {
		setStepIdx(0);
	}, []);

	useEffect(() => {
		if (stepIdx >= steps.length) return;
		const id = setTimeout(() => setStepIdx((s) => s + 1), 700);
		return () => clearTimeout(id);
	}, [stepIdx, steps.length]);

	const visitedSoFar = useMemo(() => {
		const set = new Set<number>();
		for (let i = 0; i < Math.min(stepIdx + 1, steps.length); i++) {
			for (const v of steps[i].visited) set.add(v);
		}
		return set;
	}, [stepIdx, steps]);

	const currentLayerInfo = steps[Math.min(stepIdx, steps.length - 1)];
	const resultsSet =
		stepIdx >= steps.length ? new Set(results) : new Set<number>();
	const truthSet = new Set(trueTopK);

	function handleClick(e: React.MouseEvent<SVGSVGElement>) {
		const rect = e.currentTarget.getBoundingClientRect();
		const x = ((e.clientX - rect.left) / rect.width) * WIDTH;
		const y = ((e.clientY - rect.top) / rect.height) * HEIGHT;
		setQuery({ x, y });
		setStepIdx(0);
	}

	function replay() {
		setStepIdx(0);
	}

	return (
		<DemoSection
			title="Demo 3: HNSW Search Traversal"
			description="Goal: find top-k nearest neighbors while visiting only a small fraction of total nodes (compare Nodes visited vs Brute-force baseline below). Traversal steps: (1) Start at top-layer entry point, (2) greedily hop to closest neighbor on current layer until no neighbor is closer, then drop down a layer, (3) at Layer 0 expand an ef-sized candidate list to refine locally, (4) return top-k closest candidates."
		>
			<div className="space-y-4">
				<div className="flex gap-2 items-center flex-wrap">
					<button
						type="button"
						onClick={replay}
						className="px-3 py-1.5 text-xs bg-cyan-600/30 text-cyan-200 border border-cyan-500/40 rounded hover:bg-cyan-600/50"
					>
						▶ Replay
					</button>
					<span className="text-xs text-zinc-500">
						Click to move query. Currently on{" "}
						<span className="text-cyan-300 font-mono">
							Layer {currentLayerInfo?.layer ?? 0}
						</span>
					</span>
				</div>

				{/* biome-ignore lint/a11y/useKeyWithClickEvents: clickable canvas for query placement */}
				<svg
					viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
					onClick={handleClick}
					className="w-full bg-zinc-950 border border-zinc-800 rounded-lg cursor-crosshair"
					role="img"
					aria-label="HNSW search traversal — click to set query"
				>
					{nodes.flatMap((node) =>
						(node.neighbors[0] ?? [])
							.filter((nid) => nid > node.id)
							.map((nid) => (
								<line
									key={`bg-${node.id}-${nid}`}
									x1={node.point.x}
									y1={node.point.y}
									x2={nodes[nid].point.x}
									y2={nodes[nid].point.y}
									stroke="#3f3f46"
									strokeOpacity={0.4}
									strokeWidth={0.5}
								/>
							)),
					)}

					{nodes.map((node) => {
						const isVisited = visitedSoFar.has(node.id);
						const isResult = resultsSet.has(node.id);
						const isTruth = truthSet.has(node.id);
						const isHit = isResult && isTruth;
						const isMiss = isTruth && !isResult && stepIdx >= steps.length;
						const fill = isHit
							? "#22d3ee"
							: isMiss
								? "#f43f5e"
								: isResult
									? "#67e8f9"
									: isVisited
										? "#64748b"
										: "#27272a";
						const r = isResult || isMiss ? 6 : isVisited ? 4 : 3;
						return (
							<motion.circle
								key={node.id}
								cx={node.point.x}
								cy={node.point.y}
								r={r}
								fill={fill}
								stroke={isHit ? "#a5f3fc" : isMiss ? "#fda4af" : "transparent"}
								strokeWidth={isHit || isMiss ? 2 : 0}
								animate={{ r }}
								transition={{ duration: 0.2 }}
							/>
						);
					})}

					{currentLayerInfo && stepIdx < steps.length && (
						<circle
							cx={nodes[currentLayerInfo.current].point.x}
							cy={nodes[currentLayerInfo.current].point.y}
							r={10}
							fill="none"
							stroke={LAYER_COLORS[currentLayerInfo.layer]}
							strokeWidth={2}
						/>
					)}

					<circle cx={query.x} cy={query.y} r={10} fill="#f59e0b" />
					<circle
						cx={query.x}
						cy={query.y}
						r={16}
						fill="none"
						stroke="#f59e0b"
						strokeOpacity={0.4}
						strokeWidth={2}
					/>
				</svg>

				<div className="grid grid-cols-4 gap-3">
					{[
						{
							label: "Nodes visited",
							value: visitedSoFar.size,
							color: "text-cyan-300",
						},
						{ label: "Brute-force baseline", value: N, color: "text-zinc-400" },
						{
							label: "Speedup",
							value:
								visitedSoFar.size > 0
									? `${(N / visitedSoFar.size).toFixed(1)}×`
									: "—",
							color: "text-emerald-300",
						},
						{
							label: "Recall @5",
							value: stepIdx >= steps.length ? `${recall.toFixed(0)}%` : "—",
							color: recall === 100 ? "text-emerald-300" : "text-rose-300",
						},
					].map(({ label, value, color }) => (
						<div
							key={label}
							className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-center"
						>
							<p className={`text-xl font-bold ${color}`}>{value}</p>
							<p className="text-xs text-zinc-500 mt-0.5">{label}</p>
						</div>
					))}
				</div>

				<div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-3 text-xs text-zinc-400">
					<span className="text-cyan-300 font-medium">
						Approximate, not exact:
					</span>{" "}
					Traversal follows entry → greedy descent → Layer 0 ef refinement. Cyan
					circles are correct hits; rose circles are true neighbors HNSW missed.
					Greedy descent can get stuck in a local pocket and skip the global
					optimum — that's the "A" in ANN. The next demo shows how to dial
					recall up by widening the search.
				</div>
			</div>
		</DemoSection>
	);
}
