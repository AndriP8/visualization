import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import {
	COMPARISON_MINILM_NEIGHBORS,
	COMPARISON_MINILM_PCA_2D,
	COMPARISON_MPNET_NEIGHBORS,
	COMPARISON_MPNET_PCA_2D,
	COMPARISON_SENTENCES,
	MODEL_INFO,
} from "./embeddingsData";

const VIEWBOX = { w: 480, h: 360, pad: 32 };

function normalizePoints(pts: readonly (readonly [number, number])[]) {
	const xs = pts.map((p) => p[0]);
	const ys = pts.map((p) => p[1]);
	const minX = Math.min(...xs);
	const maxX = Math.max(...xs);
	const minY = Math.min(...ys);
	const maxY = Math.max(...ys);
	const rx = maxX - minX || 1;
	const ry = maxY - minY || 1;
	return pts.map(([x, y]) => ({
		cx: VIEWBOX.pad + ((x - minX) / rx) * (VIEWBOX.w - 2 * VIEWBOX.pad),
		cy: VIEWBOX.pad + (1 - (y - minY) / ry) * (VIEWBOX.h - 2 * VIEWBOX.pad),
	}));
}

interface ScatterProps {
	title: string;
	subtitle: string;
	points: { cx: number; cy: number }[];
	neighbors: readonly (readonly { j: number; score: number }[])[];
	selected: number | null;
	onSelect: (i: number) => void;
	accent: string;
}

function Scatter({
	title,
	subtitle,
	points,
	neighbors,
	selected,
	onSelect,
	accent,
}: ScatterProps) {
	const sn = selected !== null ? neighbors[selected] : [];
	return (
		<div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
			<p className="text-sm font-semibold text-white">{title}</p>
			<p className="text-xs text-zinc-500 mb-3">{subtitle}</p>
			<svg
				viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`}
				className="w-full h-auto"
				role="img"
				aria-label={`${title} scatter`}
			>
				{selected !== null &&
					sn.map((n) => (
						<line
							key={`l-${selected}-${n.j}`}
							x1={points[selected].cx}
							y1={points[selected].cy}
							x2={points[n.j].cx}
							y2={points[n.j].cy}
							stroke="rgba(255,255,255,0.2)"
							strokeWidth={1}
							strokeDasharray="3 3"
						/>
					))}
				{points.map((p, i) => {
					const isSel = selected === i;
					const isNb = sn.some((n) => n.j === i);
					const dim = selected !== null && !isSel && !isNb ? 0.3 : 1;
					const sentence = COMPARISON_SENTENCES[i];
					return (
						// biome-ignore lint/a11y/useSemanticElements: SVG <g> cannot be a <button>
						<g
							key={sentence}
							onClick={() => onSelect(i)}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									onSelect(i);
								}
							}}
							role="button"
							tabIndex={0}
							aria-label={sentence}
							aria-pressed={isSel}
							className="cursor-pointer focus:outline-none"
							opacity={dim}
						>
							<motion.circle
								cx={p.cx}
								cy={p.cy}
								initial={{ r: 0 }}
								animate={{ r: isSel ? 8 : isNb ? 6 : 5 }}
								transition={{ duration: 0.2 }}
								fill={isSel ? "#fff" : isNb ? accent : "rgba(161,161,170,0.7)"}
								stroke={accent}
								strokeWidth={isSel ? 2 : 1}
							/>
						</g>
					);
				})}
			</svg>
		</div>
	);
}

export function ModelComparisonDemo() {
	const [selected, setSelected] = useState<number | null>(0);

	const miniPoints = useMemo(
		() => normalizePoints(COMPARISON_MINILM_PCA_2D),
		[],
	);
	const bgePoints = useMemo(() => normalizePoints(COMPARISON_MPNET_PCA_2D), []);

	const miniNb = selected !== null ? COMPARISON_MINILM_NEIGHBORS[selected] : [];
	const bgeNb = selected !== null ? COMPARISON_MPNET_NEIGHBORS[selected] : [];

	return (
		<DemoSection
			title="Demo 4: Same sentences, two embedding models"
			description="The same 15 sentences encoded by two different models, projected with PCA. Pick a sentence to compare its top-3 nearest neighbors in each model — both the geometry and the neighbor sets differ."
		>
			<div className="space-y-4">
				<label className="block">
					<span className="text-xs text-zinc-500 uppercase tracking-wider">
						Query sentence
					</span>
					<select
						name="comparison-query"
						value={selected ?? ""}
						onChange={(e) => setSelected(Number(e.target.value))}
						className="mt-1 w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-cyan-500/60"
					>
						{COMPARISON_SENTENCES.map((s, i) => (
							<option key={s} value={i}>
								{s}
							</option>
						))}
					</select>
				</label>

				<div className="grid md:grid-cols-2 gap-4">
					<Scatter
						title={MODEL_INFO.minilm.name}
						subtitle={`${MODEL_INFO.minilm.family} · ${MODEL_INFO.minilm.dims}d · PCA → 2D`}
						points={miniPoints}
						neighbors={COMPARISON_MINILM_NEIGHBORS}
						selected={selected}
						onSelect={setSelected}
						accent="#22d3ee"
					/>
					<Scatter
						title={MODEL_INFO.bge.name}
						subtitle={`${MODEL_INFO.bge.family} · ${MODEL_INFO.bge.dims}d · PCA → 2D`}
						points={bgePoints}
						neighbors={COMPARISON_MPNET_NEIGHBORS}
						selected={selected}
						onSelect={setSelected}
						accent="#a78bfa"
					/>
				</div>

				{selected !== null && (
					<div className="grid md:grid-cols-2 gap-4">
						{[
							{
								name: MODEL_INFO.minilm.name,
								nb: miniNb,
								accent: "text-cyan-300",
							},
							{
								name: MODEL_INFO.bge.name,
								nb: bgeNb,
								accent: "text-violet-300",
							},
						].map((m) => (
							<div
								key={m.name}
								className="bg-zinc-900 border border-zinc-800 rounded-lg p-4"
							>
								<p
									className={`text-xs uppercase tracking-wider mb-2 ${m.accent}`}
								>
									{m.name} — top 3 neighbors
								</p>
								<ol className="space-y-1.5">
									{m.nb.map((n, i) => (
										<li
											key={`${m.name}-${n.j}`}
											className="flex items-start gap-2 text-sm"
										>
											<span className="text-zinc-600 font-mono text-xs mt-0.5">
												#{i + 1}
											</span>
											<span className="flex-1 text-zinc-300">
												{COMPARISON_SENTENCES[n.j]}
											</span>
											<span className="font-mono text-xs text-zinc-500">
												{n.score.toFixed(3)}
											</span>
										</li>
									))}
								</ol>
							</div>
						))}
					</div>
				)}

				<div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-3 text-xs text-zinc-400 space-y-1">
					<p>
						<span className="text-cyan-300 font-medium">
							Embeddings are not interchangeable:
						</span>{" "}
						Two models trained on different data with different objectives
						produce different geometries. Cosine scores are not comparable
						across models — a 0.7 on MiniLM doesn't mean the same thing as a 0.7
						on bge. And vectors from one model cannot be searched against an
						index built with another.
					</p>
					<p>
						<span className="text-cyan-300 font-medium">Practical impact:</span>{" "}
						Changing your embedding model requires re-embedding your entire
						corpus and rebuilding your vector index. This is why "just upgrade
						the model" is a non-trivial migration in production RAG systems.
					</p>
				</div>
			</div>
		</DemoSection>
	);
}
