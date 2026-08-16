import { useMemo, useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import {
	bruteForceTopK,
	buildHnsw,
	generatePoints,
	N,
	searchHnsw,
} from "./hnsw";

const EF_VALUES = [1, 2, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128];
const K = 10;
const QUERY = { x: 480, y: 90 };

export function RecallSpeedTradeoffDemo() {
	const points = useMemo(generatePoints, []);
	const { nodes, maxLevel, entry } = useMemo(() => buildHnsw(points), [points]);
	const truth = useMemo(
		() => new Set(bruteForceTopK(points, QUERY, K)),
		[points],
	);

	const curve = useMemo(() => {
		return EF_VALUES.map((ef) => {
			const { results, visited } = searchHnsw(
				nodes,
				entry,
				maxLevel,
				QUERY,
				ef,
				K,
			);
			const found = results.filter((r) => truth.has(r)).length;
			return {
				ef,
				recall: (found / K) * 100,
				cost: visited.size,
			};
		});
	}, [nodes, entry, maxLevel, truth]);

	const [efIdx, setEfIdx] = useState(EF_VALUES.length - 4);
	const current = curve[efIdx];

	const chartW = 280;
	const chartH = 160;
	const maxCost = Math.max(...curve.map((c) => c.cost), N);

	function xPos(efIdx: number) {
		return 20 + (efIdx / (EF_VALUES.length - 1)) * (chartW - 40);
	}

	function recallPath() {
		return curve
			.map(
				(c, i) =>
					`${i === 0 ? "M" : "L"} ${xPos(i)} ${chartH - 20 - (c.recall / 100) * (chartH - 40)}`,
			)
			.join(" ");
	}

	function costPath() {
		return curve
			.map(
				(c, i) =>
					`${i === 0 ? "M" : "L"} ${xPos(i)} ${chartH - 20 - (c.cost / maxCost) * (chartH - 40)}`,
			)
			.join(" ");
	}

	return (
		<DemoSection
			title="Demo 4: Recall vs Speed Trade-off"
			description="ef (Exploration Factor) is the size of the dynamic candidate list kept while refining on Layer 0 — a query-time knob (unlike build-time M). Left chart: Recall @10 vs ef (accuracy). Right chart: Cost (nodes visited) vs ef (search effort)."
		>
			<div className="space-y-4">
				<div>
					<div className="flex justify-between items-center mb-2">
						<label
							htmlFor="ef-slider"
							className="text-xs text-zinc-400 uppercase tracking-wider"
						>
							ef (search expansion)
						</label>
						<span className="text-sm font-mono text-cyan-300">
							{current.ef}
						</span>
					</div>
					<input
						id="ef-slider"
						type="range"
						min={0}
						max={EF_VALUES.length - 1}
						value={efIdx}
						onChange={(e) => setEfIdx(Number(e.target.value))}
						className="w-full accent-cyan-400"
					/>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
						<p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
							Recall @{K}
						</p>
						<svg
							viewBox={`0 0 ${chartW} ${chartH}`}
							className="w-full"
							role="img"
							aria-label="Recall vs ef chart"
						>
							<line
								x1={20}
								y1={chartH - 20 - 0.95 * (chartH - 40)}
								x2={chartW - 20}
								y2={chartH - 20 - 0.95 * (chartH - 40)}
								stroke="#10b981"
								strokeOpacity={0.3}
								strokeDasharray="4 3"
							/>
							<text
								x={chartW - 20}
								y={chartH - 20 - 0.95 * (chartH - 40) - 4}
								textAnchor="end"
								fontSize={9}
								fill="#10b981"
							>
								95% target
							</text>
							<path
								d={recallPath()}
								fill="none"
								stroke="#22d3ee"
								strokeWidth={2}
							/>
							{curve.map((c, i) => (
								<circle
									key={c.ef}
									cx={xPos(i)}
									cy={chartH - 20 - (c.recall / 100) * (chartH - 40)}
									r={i === efIdx ? 5 : 2.5}
									fill={i === efIdx ? "#67e8f9" : "#22d3ee"}
								/>
							))}
							<line
								x1={xPos(efIdx)}
								y1={10}
								x2={xPos(efIdx)}
								y2={chartH - 20}
								stroke="#f59e0b"
								strokeOpacity={0.5}
								strokeWidth={1}
							/>
							<text x={20} y={chartH - 6} fontSize={9} fill="#71717a">
								ef=1
							</text>
							<text x={chartW - 28} y={chartH - 6} fontSize={9} fill="#71717a">
								ef=128
							</text>
						</svg>
						<p className="text-2xl font-bold text-cyan-300 mt-2">
							{current.recall.toFixed(0)}%
						</p>
					</div>

					<div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
						<p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
							Cost (nodes visited)
						</p>
						<svg
							viewBox={`0 0 ${chartW} ${chartH}`}
							className="w-full"
							role="img"
							aria-label="Cost vs ef chart"
						>
							<line
								x1={20}
								y1={chartH - 20 - (N / maxCost) * (chartH - 40)}
								x2={chartW - 20}
								y2={chartH - 20 - (N / maxCost) * (chartH - 40)}
								stroke="#f43f5e"
								strokeOpacity={0.3}
								strokeDasharray="4 3"
							/>
							<text
								x={chartW - 20}
								y={chartH - 20 - (N / maxCost) * (chartH - 40) - 4}
								textAnchor="end"
								fontSize={9}
								fill="#f43f5e"
							>
								brute force (n={N})
							</text>
							<path
								d={costPath()}
								fill="none"
								stroke="#a78bfa"
								strokeWidth={2}
							/>
							{curve.map((c, i) => (
								<circle
									key={c.ef}
									cx={xPos(i)}
									cy={chartH - 20 - (c.cost / maxCost) * (chartH - 40)}
									r={i === efIdx ? 5 : 2.5}
									fill={i === efIdx ? "#c4b5fd" : "#a78bfa"}
								/>
							))}
							<line
								x1={xPos(efIdx)}
								y1={10}
								x2={xPos(efIdx)}
								y2={chartH - 20}
								stroke="#f59e0b"
								strokeOpacity={0.5}
								strokeWidth={1}
							/>
						</svg>
						<p className="text-2xl font-bold text-violet-300 mt-2">
							{current.cost}{" "}
							<span className="text-sm text-zinc-500">nodes</span>
						</p>
					</div>
				</div>

				<div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-3 text-xs text-zinc-400">
					<span className="text-cyan-300 font-medium">How to tune:</span> Chart
					reference lines show target accuracy (dashed green = 95% recall
					target) vs full scan baseline (dashed rose = brute-force cost of n={N}
					nodes). <span className="font-mono">ef</span> is set per query at
					search time; <span className="font-mono">M</span> (graph density) is
					set at build time. Production typically targets 95–99% recall — past
					that, cost climbs fast for diminishing returns. The curve here is for
					one representative query on n={N} synthetic 2D points; real workloads
					vary, but the shape is the same.
				</div>
			</div>
		</DemoSection>
	);
}
