import { motion } from "motion/react";
import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";

interface DataPoint {
	loadFactor: number;
	chainingAvg: number;
	openLinearAvg: number;
}

// Expected probe counts from theory (Knuth)
// Chaining successful search: 1 + α/2
// Open addressing linear probing successful search: ½(1 + 1/(1-α))
function chainingExpected(alpha: number): number {
	return 1 + alpha / 2;
}

function openAddressingExpected(alpha: number): number {
	if (alpha >= 1) return 999;
	return 0.5 * (1 + 1 / (1 - alpha));
}

const LOAD_FACTORS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95];

const DATA_POINTS: DataPoint[] = LOAD_FACTORS.map((lf) => ({
	loadFactor: lf,
	chainingAvg: chainingExpected(lf),
	openLinearAvg: openAddressingExpected(lf),
}));

const MAX_Y = 12;

function BarChart() {
	return (
		<div className="space-y-2">
			<div className="flex gap-4 text-xs mb-3">
				<div className="flex items-center gap-1.5">
					<div className="w-3 h-3 rounded bg-purple-400/70" />
					<span className="text-zinc-400">Chaining avg probes</span>
				</div>
				<div className="flex items-center gap-1.5">
					<div className="w-3 h-3 rounded bg-red-400/70" />
					<span className="text-zinc-400">
						Open addressing (linear) avg probes
					</span>
				</div>
			</div>
			<div className="flex items-end gap-1 h-40">
				{DATA_POINTS.map((pt) => {
					const chainH = Math.min((pt.chainingAvg / MAX_Y) * 100, 100);
					const openH = Math.min((pt.openLinearAvg / MAX_Y) * 100, 100);
					return (
						<div
							key={pt.loadFactor}
							className="flex-1 flex flex-col items-center gap-0.5"
						>
							<div className="w-full flex items-end gap-0.5 h-36">
								<motion.div
									initial={{ height: 0 }}
									animate={{ height: `${chainH}%` }}
									transition={{ duration: 0.6, delay: pt.loadFactor * 0.3 }}
									className="flex-1 rounded-t bg-purple-400/60 min-h-[2px]"
									title={`Chaining: ${pt.chainingAvg.toFixed(2)}`}
								/>
								<motion.div
									initial={{ height: 0 }}
									animate={{ height: `${openH}%` }}
									transition={{
										duration: 0.6,
										delay: pt.loadFactor * 0.3 + 0.1,
									}}
									className="flex-1 rounded-t bg-red-400/60 min-h-[2px]"
									title={`Open: ${pt.openLinearAvg.toFixed(2)}`}
								/>
							</div>
							<span className="text-xs text-zinc-600 font-mono">
								{pt.loadFactor.toFixed(1).replace("0.", ".")}
							</span>
						</div>
					);
				})}
			</div>
			<div className="text-center text-xs text-zinc-500">
				Load factor α (n/m)
			</div>
		</div>
	);
}

export function PerformanceDemo() {
	const [selectedAlpha, setSelectedAlpha] = useState(0.5);

	const chainingVal = chainingExpected(selectedAlpha);
	const openVal = openAddressingExpected(selectedAlpha);

	return (
		<DemoSection
			title="Demo 4: Performance & Load Factor"
			description="As load factor α = n/m grows, expected probe counts diverge between chaining and open addressing. Open addressing degrades sharply near α = 1."
		>
			<div className="space-y-6">
				{/* Chart */}
				<BarChart />

				{/* Interactive slider */}
				<div className="space-y-3">
					<div className="flex items-center justify-between text-xs text-zinc-400">
						<span>Load factor α</span>
						<span className="font-mono text-purple-300">
							{selectedAlpha.toFixed(2)}
						</span>
					</div>
					<input
						type="range"
						min={0.1}
						max={0.95}
						step={0.05}
						value={selectedAlpha}
						onChange={(e) => setSelectedAlpha(Number(e.target.value))}
						className="w-full accent-purple-500"
					/>
					<div className="grid grid-cols-2 gap-3">
						<div className="rounded-lg bg-purple-500/10 border border-purple-500/20 p-3 text-center">
							<div className="text-xs text-zinc-500 mb-1">
								Chaining avg probes
							</div>
							<div className="font-mono font-bold text-xl text-purple-300">
								{chainingVal.toFixed(2)}
							</div>
							<div className="text-xs text-zinc-600 mt-1">formula: 1 + α/2</div>
						</div>
						<div
							className={`rounded-lg border p-3 text-center ${
								openVal > 10
									? "bg-red-500/10 border-red-500/20"
									: openVal > 3
										? "bg-amber-500/10 border-amber-500/20"
										: "bg-zinc-800/40 border-zinc-700/50"
							}`}
						>
							<div className="text-xs text-zinc-500 mb-1">
								Open addressing (linear) avg probes
							</div>
							<div
								className={`font-mono font-bold text-xl ${
									openVal > 10
										? "text-red-300"
										: openVal > 3
											? "text-amber-300"
											: "text-zinc-300"
								}`}
							>
								{openVal > 99 ? "∞" : openVal.toFixed(2)}
							</div>
							<div className="text-xs text-zinc-600 mt-1">
								formula: ½(1 + 1/(1−α))
							</div>
						</div>
					</div>
				</div>

				{/* Complexity table */}
				<div className="overflow-x-auto">
					<p className="text-xs text-zinc-500 mb-2">
						Assumes α is kept below threshold. Open addressing degrades faster
						than chaining as α grows — see chart above.
					</p>
					<table className="w-full text-xs border-collapse">
						<thead>
							<tr className="text-zinc-500 border-b border-zinc-800">
								<th className="py-2 pr-4 text-left font-medium">Operation</th>
								<th className="py-2 px-4 text-center font-medium text-purple-300">
									Average
								</th>
								<th className="py-2 pl-4 text-center font-medium text-red-300">
									Worst
								</th>
							</tr>
						</thead>
						<tbody className="text-zinc-400">
							{[
								{ op: "Insert", avg: "O(1)", worst: "O(n)" },
								{ op: "Search", avg: "O(1)", worst: "O(n)" },
								{ op: "Delete", avg: "O(1)", worst: "O(n)" },
								{ op: "Space", avg: "O(n)", worst: "O(n)" },
							].map(({ op, avg, worst }) => (
								<tr key={op} className="border-b border-zinc-800/50">
									<td className="py-2 pr-4 text-zinc-300">{op}</td>
									<td className="py-2 px-4 text-center">
										<span className="px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-300 font-mono">
											{avg}
										</span>
									</td>
									<td className="py-2 pl-4 text-center">
										<span className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-300 font-mono">
											{worst}
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				<div className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-700/50 text-xs text-zinc-400">
					<strong className="text-zinc-300">Rehashing:</strong> When α exceeds
					the threshold, the table is doubled and all keys are re-inserted —{" "}
					<span className="text-amber-300">O(n)</span> upfront but amortized{" "}
					<span className="text-green-300">O(1)</span> per insert. Typical
					thresholds differ by strategy: chaining resizes around{" "}
					<span className="text-purple-300">α = 0.75</span> (chains stay short);
					open addressing resizes earlier, around{" "}
					<span className="text-red-300">α = 0.7</span>, because probe counts
					grow sharply as α → 1.
				</div>
			</div>
		</DemoSection>
	);
}
