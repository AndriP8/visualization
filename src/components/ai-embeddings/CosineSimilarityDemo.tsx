import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { match } from "ts-pattern";
import { DemoSection } from "../shared/DemoSection";
import { SENTENCE_COSINE, SENTENCE_POOL } from "./embeddingsData";

function similarityLabel(score: number) {
	return match(true)
		.when(
			() => score >= 0.7,
			() => ({ label: "Very similar", color: "text-emerald-300" }),
		)
		.when(
			() => score >= 0.5,
			() => ({ label: "Related", color: "text-cyan-300" }),
		)
		.when(
			() => score >= 0.3,
			() => ({ label: "Weakly related", color: "text-amber-300" }),
		)
		.otherwise(() => ({ label: "Unrelated", color: "text-zinc-400" }));
}

export function CosineSimilarityDemo() {
	const [i, setI] = useState(0);
	const [j, setJ] = useState(4);

	const score = SENTENCE_COSINE[i][j];
	const angleDeg =
		(Math.acos(Math.max(-1, Math.min(1, score))) * 180) / Math.PI;
	const { label, color } = similarityLabel(score);

	// Schematic: render the angle between two unit vectors in a 2D box.
	// Vector A fixed along +x; vector B rotated by `angleDeg` counter-clockwise.
	const radius = 120;
	const center = { x: 160, y: 160 };
	const ax = center.x + radius;
	const ay = center.y;
	const angleRad = (angleDeg * Math.PI) / 180;
	const bx = center.x + radius * Math.cos(-angleRad);
	const by = center.y + radius * Math.sin(-angleRad);

	const arcRadius = 40;
	const arcEndX = center.x + arcRadius * Math.cos(-angleRad);
	const arcEndY = center.y + arcRadius * Math.sin(-angleRad);
	const largeArc = angleDeg > 180 ? 1 : 0;

	const pairs = useMemo(
		() =>
			SENTENCE_POOL.map((text, idx) => ({ idx, text })).sort((a, b) =>
				a.text.localeCompare(b.text),
			),
		[],
	);

	return (
		<DemoSection
			title="Demo 2: Cosine similarity between sentences"
			description="Pick two sentences. Cosine similarity is the dot product of their L2-normalized vectors — equivalently, the cosine of the angle between them. Values run from −1 (opposite) to 1 (identical direction). All values below come from the full 384-d MiniLM space."
		>
			<div className="space-y-4">
				<div className="grid md:grid-cols-2 gap-3">
					<label className="block">
						<span className="text-xs text-zinc-500 uppercase tracking-wider">
							Sentence A
						</span>
						<select
							name="sentence-a"
							value={i}
							onChange={(e) => setI(Number(e.target.value))}
							className="mt-1 w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-cyan-500/60"
						>
							{pairs.map((p) => (
								<option key={p.idx} value={p.idx}>
									{p.text}
								</option>
							))}
						</select>
					</label>
					<label className="block">
						<span className="text-xs text-zinc-500 uppercase tracking-wider">
							Sentence B
						</span>
						<select
							name="sentence-b"
							value={j}
							onChange={(e) => setJ(Number(e.target.value))}
							className="mt-1 w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-cyan-500/60"
						>
							{pairs.map((p) => (
								<option key={p.idx} value={p.idx}>
									{p.text}
								</option>
							))}
						</select>
					</label>
				</div>

				<div className="grid md:grid-cols-2 gap-4">
					<div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
						<p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">
							Angle (schematic — 2-d view of a 384-d relationship)
						</p>
						<svg
							viewBox="0 0 320 320"
							className="w-full max-w-[280px] mx-auto"
							role="img"
							aria-label="Angle between two vectors"
						>
							<circle
								cx={center.x}
								cy={center.y}
								r={radius}
								fill="none"
								stroke="rgba(255,255,255,0.08)"
							/>
							<path
								d={`M ${center.x + arcRadius} ${center.y} A ${arcRadius} ${arcRadius} 0 ${largeArc} 0 ${arcEndX} ${arcEndY}`}
								fill="none"
								stroke="rgba(34,211,238,0.5)"
								strokeWidth={2}
							/>
							<line
								x1={center.x}
								y1={center.y}
								x2={ax}
								y2={ay}
								stroke="#a78bfa"
								strokeWidth={3}
							/>
							<line
								x1={center.x}
								y1={center.y}
								x2={bx}
								y2={by}
								stroke="#22d3ee"
								strokeWidth={3}
								style={{ transition: "all 0.3s ease-out" }}
							/>
							{/* Projection of B onto A: dashed perpendicular from B tip to A's line */}
							<line
								x1={bx}
								y1={by}
								x2={bx}
								y2={ay}
								stroke="rgba(251,191,36,0.45)"
								strokeWidth={1.5}
								strokeDasharray="4 3"
							/>
							<circle cx={bx} cy={ay} r={3} fill="rgba(251,191,36,0.6)" />
							<text
								x={bx + 8}
								y={ay - 8}
								fontSize={10}
								fill="rgba(251,191,36,0.7)"
							>
								cos θ = {(bx - center.x) / radius >= 0 ? " " : ""}
								{((bx - center.x) / radius).toFixed(2)}
							</text>
							<text
								x={ax + 8}
								y={ay + 4}
								fontSize={12}
								fill="#a78bfa"
								fontWeight={600}
							>
								A
							</text>
							<text
								x={bx + 8}
								y={by + 4}
								fontSize={12}
								fill="#22d3ee"
								fontWeight={600}
							>
								B
							</text>
							<text
								x={center.x + arcRadius + 10}
								y={center.y - 8}
								fontSize={11}
								fill="rgba(34,211,238,0.8)"
							>
								{angleDeg.toFixed(0)}°
							</text>
						</svg>
					</div>

					<div className="space-y-3">
						<div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
							<p className="text-xs text-zinc-500 uppercase tracking-wider">
								Cosine similarity
							</p>
							<p className="text-3xl font-bold font-mono mt-1 text-cyan-300">
								{score.toFixed(3)}
							</p>
							<p className={`text-sm mt-1 ${color}`}>{label}</p>
						</div>
						<div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
							<p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
								Bar (mapped from [−1, 1])
							</p>
							<div className="h-3 bg-zinc-800 rounded overflow-hidden relative">
								<div className="absolute inset-y-0 left-1/2 w-px bg-zinc-600" />
								<motion.div
									className="absolute inset-y-0 bg-gradient-to-r from-cyan-500 to-violet-500"
									initial={false}
									animate={{
										left: `${score < 0 ? 50 + score * 50 : 50}%`,
										width: `${Math.abs(score) * 50}%`,
									}}
									transition={{ type: "spring", stiffness: 100, damping: 18 }}
								/>
							</div>
							<div className="flex justify-between text-[10px] text-zinc-500 mt-1 font-mono">
								<span>−1</span>
								<span>0</span>
								<span>1</span>
							</div>
						</div>
						<div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
							<p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">
								What cosine means
							</p>
							<div className="grid grid-cols-3 gap-2 mb-2">
								{(
									[
										{
											deg: 0,
											cos: 1,
											label: "Aligned",
											a: [54, 32],
											b: [54, 28],
											arc: null,
											color: "text-emerald-300",
										},
										{
											deg: 90,
											cos: 0,
											label: "Perpendicular",
											a: [54, 32],
											b: [32, 10],
											arc: "M 47 32 A 15 15 0 0 0 32 17",
											color: "text-amber-300",
										},
										{
											deg: 180,
											cos: -1,
											label: "Opposite",
											a: [54, 32],
											b: [10, 32],
											arc: "M 47 32 A 15 15 0 0 0 17 32",
											color: "text-rose-300",
										},
									] as const
								).map((c) => (
									<div key={c.deg} className="text-center">
										<svg
											viewBox="0 0 64 64"
											className="w-full max-w-[56px] mx-auto"
											role="img"
											aria-label={`${c.deg} degrees, cosine = ${c.cos}`}
										>
											<circle
												cx={32}
												cy={32}
												r={22}
												fill="none"
												stroke="rgba(255,255,255,0.06)"
											/>
											{c.arc && (
												<path
													d={c.arc}
													fill="none"
													stroke="rgba(255,255,255,0.15)"
													strokeWidth={1}
												/>
											)}
											<line
												x1={32}
												y1={32}
												x2={c.a[0]}
												y2={c.a[1]}
												stroke="#a78bfa"
												strokeWidth={2}
											/>
											<line
												x1={32}
												y1={32}
												x2={c.b[0]}
												y2={c.b[1]}
												stroke="#22d3ee"
												strokeWidth={2}
											/>
										</svg>
										<p className={`text-[10px] font-mono ${c.color} mt-1`}>
											cos = {c.cos}
										</p>
										<p className="text-[10px] text-zinc-500">{c.label}</p>
									</div>
								))}
							</div>
							<p className="text-[11px] text-zinc-400 leading-relaxed">
								Cosine measures{" "}
								<span className="text-zinc-200 font-medium">
									directional agreement
								</span>{" "}
								between two vectors — not their distance. It answers:{" "}
								<span className="text-cyan-300">
									"how much of one vector points in the same direction as the
									other?"
								</span>{" "}
								When vectors are unit-length, the projection of B onto A equals
								cos(θ).
							</p>
						</div>
					</div>
				</div>

				<div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-3 text-xs text-zinc-400 space-y-1">
					<p>
						<span className="text-cyan-300 font-medium">
							Why cosine, not Euclidean:
						</span>{" "}
						Cosine measures direction only — it ignores vector length. For
						embeddings, length is rarely meaningful (it's mostly a side effect
						of training), so direction is what actually tracks meaning.
					</p>
					<p>
						<span className="text-cyan-300 font-medium">
							The schematic, honestly:
						</span>{" "}
						The angle on the left is the true angle between the two 384-d
						vectors, drawn in a 2-d plane that happens to contain both. Other
						vectors don't live in this plane — the 2-d view is for intuition
						only.
					</p>
				</div>
			</div>
		</DemoSection>
	);
}
