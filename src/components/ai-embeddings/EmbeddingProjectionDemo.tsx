import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import {
	CONCEPT_NEIGHBORS,
	CONCEPT_PCA_2D,
	CONCEPTS,
	type ConceptCategory,
} from "./embeddingsData";

const CATEGORY_COLORS: Record<
	ConceptCategory,
	{ fill: string; ring: string; chip: string; text: string }
> = {
	animals: {
		fill: "#22d3ee",
		ring: "ring-cyan-400/60",
		chip: "bg-cyan-500/15 border-cyan-500/30 text-cyan-300",
		text: "text-cyan-300",
	},
	foods: {
		fill: "#fb7185",
		ring: "ring-rose-400/60",
		chip: "bg-rose-500/15 border-rose-500/30 text-rose-300",
		text: "text-rose-300",
	},
	programming: {
		fill: "#a78bfa",
		ring: "ring-violet-400/60",
		chip: "bg-violet-500/15 border-violet-500/30 text-violet-300",
		text: "text-violet-300",
	},
	emotions: {
		fill: "#fbbf24",
		ring: "ring-amber-400/60",
		chip: "bg-amber-500/15 border-amber-500/30 text-amber-300",
		text: "text-amber-300",
	},
	countries: {
		fill: "#34d399",
		ring: "ring-emerald-400/60",
		chip: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
		text: "text-emerald-300",
	},
};

const CATEGORIES: ConceptCategory[] = [
	"animals",
	"foods",
	"programming",
	"emotions",
	"countries",
];

const VIEWBOX = { w: 800, h: 480, pad: 40 };

export function EmbeddingProjectionDemo() {
	const [selected, setSelected] = useState<number | null>(null);

	// Pre-compute pixel coordinates by normalizing PCA points to viewBox.
	const points = useMemo(() => {
		const xs = CONCEPT_PCA_2D.map((p) => p[0]);
		const ys = CONCEPT_PCA_2D.map((p) => p[1]);
		const minX = Math.min(...xs);
		const maxX = Math.max(...xs);
		const minY = Math.min(...ys);
		const maxY = Math.max(...ys);
		const rangeX = maxX - minX || 1;
		const rangeY = maxY - minY || 1;
		return CONCEPT_PCA_2D.map(([x, y]) => ({
			cx: VIEWBOX.pad + ((x - minX) / rangeX) * (VIEWBOX.w - 2 * VIEWBOX.pad),
			cy:
				VIEWBOX.pad + (1 - (y - minY) / rangeY) * (VIEWBOX.h - 2 * VIEWBOX.pad),
		}));
	}, []);

	const selectedConcept = selected !== null ? CONCEPTS[selected] : null;
	const selectedNeighbors =
		selected !== null ? CONCEPT_NEIGHBORS[selected] : [];

	return (
		<DemoSection
			title="Demo 1: 2D projection of a 384-d embedding space"
			description="30 concepts embedded by all-MiniLM-L6-v2 (384 dimensions), then projected to 2D via PCA for display. Click a point to see its true nearest neighbors — computed in the full 384-d space, not from this 2-d view."
		>
			<div className="space-y-4">
				<div className="flex flex-wrap items-center gap-2 text-xs">
					{CATEGORIES.map((c) => (
						<span
							key={c}
							className={`px-2.5 py-1 rounded border ${CATEGORY_COLORS[c].chip}`}
						>
							{c}
						</span>
					))}
				</div>

				<div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
					<svg
						viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`}
						className="w-full h-auto"
						role="img"
						aria-label="2D PCA projection of concept embeddings"
					>
						{/* Neighbor lines from the selected point */}
						{selected !== null &&
							selectedNeighbors.map((n) => (
								<line
									key={`line-${selected}-${n.j}`}
									x1={points[selected].cx}
									y1={points[selected].cy}
									x2={points[n.j].cx}
									y2={points[n.j].cy}
									stroke="rgba(255,255,255,0.25)"
									strokeWidth={1}
									strokeDasharray="4 3"
								/>
							))}

						{points.map((p, i) => {
							const concept = CONCEPTS[i];
							const color = CATEGORY_COLORS[concept.category];
							const isSelected = selected === i;
							const isNeighbor = selectedNeighbors.some((n) => n.j === i);
							const dim =
								selected !== null && !isSelected && !isNeighbor ? 0.25 : 1;
							return (
								// biome-ignore lint/a11y/useSemanticElements: SVG <g> cannot be a <button>
								<g
									key={concept.text}
									onClick={() => setSelected(isSelected ? null : i)}
									onKeyDown={(e) => {
										if (e.key === "Enter" || e.key === " ") {
											e.preventDefault();
											setSelected(isSelected ? null : i);
										}
									}}
									role="button"
									tabIndex={0}
									aria-label={`${concept.text} (${concept.category})`}
									aria-pressed={isSelected}
									className="cursor-pointer focus:outline-none"
									opacity={dim}
								>
									<motion.circle
										cx={p.cx}
										cy={p.cy}
										initial={{ r: 0 }}
										animate={{ r: isSelected ? 9 : 6 }}
										transition={{ duration: 0.2 }}
										fill={color.fill}
										stroke={isSelected ? "#fff" : "rgba(255,255,255,0.4)"}
										strokeWidth={isSelected ? 2 : 1}
									/>
									<text
										x={p.cx + 10}
										y={p.cy + 4}
										fontSize={11}
										fill="rgba(228,228,231,0.85)"
										className="select-none pointer-events-none"
									>
										{concept.text}
									</text>
								</g>
							);
						})}
					</svg>
				</div>

				{selectedConcept ? (
					<div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
						<p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
							Nearest neighbors of{" "}
							<span
								className={`${CATEGORY_COLORS[selectedConcept.category].text} font-medium`}
							>
								{selectedConcept.text}
							</span>{" "}
							(full 384-d cosine)
						</p>
						<div className="space-y-1.5">
							{selectedNeighbors.map((n) => {
								const c = CONCEPTS[n.j];
								return (
									<div
										key={`nb-${n.j}`}
										className="flex items-center justify-between text-sm"
									>
										<span
											className={`font-mono ${CATEGORY_COLORS[c.category].text}`}
										>
											{c.text}
										</span>
										<span className="font-mono text-zinc-400">
											cos = {n.score.toFixed(3)}
										</span>
									</div>
								);
							})}
						</div>
					</div>
				) : (
					<p className="text-xs text-zinc-500 italic">
						Click any point to highlight its top-3 nearest neighbors.
					</p>
				)}

				<div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-3 text-xs text-zinc-400 space-y-1">
					<p>
						<span className="text-cyan-300 font-medium">Why 2-d is a lie:</span>{" "}
						PCA preserves the directions of greatest variance but throws away
						382 of 384 dimensions. Two points that look adjacent here may be far
						apart in the full space — and vice versa. The neighbors panel uses
						the real 384-d cosine, which is what a vector database would use.
					</p>
					<p>
						<span className="text-cyan-300 font-medium">
							What clusters tell you:
						</span>{" "}
						semantically similar inputs end up in nearby regions because the
						model was trained with a contrastive objective — similar pairs
						pulled together, dissimilar pairs pushed apart.
					</p>
				</div>
			</div>
		</DemoSection>
	);
}
