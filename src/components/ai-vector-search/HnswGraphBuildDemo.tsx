import { useMemo, useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { buildHnsw, generatePoints, HEIGHT, WIDTH } from "./hnsw";

const LAYER_COLORS = ["#22d3ee", "#a78bfa", "#f472b6", "#fbbf24"];

export function HnswGraphBuildDemo() {
	const points = useMemo(generatePoints, []);
	const { nodes, maxLevel } = useMemo(() => buildHnsw(points), [points]);

	const [viewLayer, setViewLayer] = useState<number | "all">("all");

	const layerCounts = useMemo(() => {
		const counts = Array(maxLevel + 1).fill(0);
		for (const n of nodes) {
			for (let l = 0; l <= n.level; l++) counts[l]++;
		}
		return counts;
	}, [nodes, maxLevel]);

	const edges = useMemo(() => {
		const out: { from: number; to: number; layer: number }[] = [];
		const seen = new Set<string>();
		for (const node of nodes) {
			for (let l = 0; l <= node.level; l++) {
				if (viewLayer !== "all" && l !== viewLayer) continue;
				for (const nid of node.neighbors[l] ?? []) {
					const key =
						node.id < nid ? `${l}-${node.id}-${nid}` : `${l}-${nid}-${node.id}`;
					if (seen.has(key)) continue;
					seen.add(key);
					out.push({ from: node.id, to: nid, layer: l });
				}
			}
		}
		return out;
	}, [nodes, viewLayer]);

	return (
		<DemoSection
			title="Demo 2: HNSW Graph Construction"
			description="Goal: build shortcuts so queries reach any point in ~log n hops instead of scanning all n. Upper layers are sparse long-range highways; the bottom layer (Layer 0) holds every node with dense local edges."
		>
			<div className="space-y-4">
				<div className="flex flex-wrap gap-2 items-center">
					<span className="text-xs text-zinc-500">View:</span>
					<button
						type="button"
						onClick={() => setViewLayer("all")}
						className={`px-3 py-1.5 text-xs rounded border ${
							viewLayer === "all"
								? "bg-cyan-600/30 text-cyan-200 border-cyan-500/40"
								: "bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-600"
						}`}
					>
						All layers
					</button>
					{Array.from({ length: maxLevel + 1 }, (_, i) => maxLevel - i).map(
						(l) => (
							<button
								key={`btn-layer-${l}`}
								type="button"
								onClick={() => setViewLayer(l)}
								className={`px-3 py-1.5 text-xs rounded border ${
									viewLayer === l
										? "bg-cyan-600/30 text-cyan-200 border-cyan-500/40"
										: "bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-600"
								}`}
							>
								<span
									className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle"
									style={{ backgroundColor: LAYER_COLORS[l] }}
								/>
								Layer {l}
							</button>
						),
					)}
				</div>

				<svg
					viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
					className="w-full bg-zinc-950 border border-zinc-800 rounded-lg"
					role="img"
					aria-label="HNSW graph"
				>
					{edges.map((e) => {
						const a = nodes[e.from].point;
						const b = nodes[e.to].point;
						const color = LAYER_COLORS[e.layer] ?? "#fff";
						const opacity = viewLayer === "all" ? 0.15 + e.layer * 0.2 : 0.5;
						return (
							<line
								key={`e-${e.layer}-${e.from}-${e.to}`}
								x1={a.x}
								y1={a.y}
								x2={b.x}
								y2={b.y}
								stroke={color}
								strokeOpacity={opacity}
								strokeWidth={1}
							/>
						);
					})}
					{nodes.map((node) => {
						const visible =
							viewLayer === "all" ? true : node.level >= (viewLayer as number);
						if (!visible) {
							return (
								<circle
									key={node.id}
									cx={node.point.x}
									cy={node.point.y}
									r={2}
									fill="#27272a"
								/>
							);
						}
						const color = LAYER_COLORS[node.level] ?? "#fff";
						return (
							<circle
								key={node.id}
								cx={node.point.x}
								cy={node.point.y}
								r={3 + node.level}
								fill={color}
								fillOpacity={0.8}
							/>
						);
					})}
				</svg>

				<div className="grid grid-cols-4 gap-3">
					{layerCounts.map((count, l) => (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: layer index is the natural stable identity
							key={`layer-${l}`}
							className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-center"
						>
							<p
								className="text-xl font-bold"
								style={{ color: LAYER_COLORS[l] }}
							>
								{count}
							</p>
							<p className="text-xs text-zinc-500 mt-0.5">
								Layer {l} {l === 0 ? "(all nodes)" : ""}
							</p>
						</div>
					))}
				</div>

				<div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-3 text-xs text-zinc-400">
					<span className="text-cyan-300 font-medium">Why the pyramid:</span>{" "}
					Search starts at the sparse top for cheap long-range jumps, then
					refines locally on denser layers below. Each node's level is sampled
					from an exponential decay (
					<span className="font-mono">level = floor(-ln(U) / ln(M))</span>).
					Most nodes land at Layer 0; exponentially fewer reach higher layers.{" "}
					<span className="font-mono">M={4}</span> caps neighbors per node per
					layer — this is set at build time.
				</div>
			</div>
		</DemoSection>
	);
}
