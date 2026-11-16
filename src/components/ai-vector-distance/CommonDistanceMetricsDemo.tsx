import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";

type Vector2D = { x: number; y: number };

const PRESETS = [
	{
		label: "Same direction, different size",
		a: { x: 80, y: 40 },
		b: { x: 140, y: 70 },
	},
	{
		label: "Point 90° apart",
		a: { x: 100, y: 0 },
		b: { x: 0, y: 100 },
	},
	{
		label: "Opposite vectors",
		a: { x: 100, y: 30 },
		b: { x: -80, y: -24 },
	},
	{
		label: "Same direction and size",
		a: { x: 90, y: 60 },
		b: { x: 90, y: 60 },
	},
];

export function CommonDistanceMetricsDemo() {
	const [vecA, setVecA] = useState<Vector2D>({ x: 90, y: 40 });
	const [vecB, setVecB] = useState<Vector2D>({ x: 60, y: 100 });

	const magA = Math.sqrt(vecA.x * vecA.x + vecA.y * vecA.y);
	const magB = Math.sqrt(vecB.x * vecB.x + vecB.y * vecB.y);

	const dotProduct = vecA.x * vecB.x + vecA.y * vecB.y;
	const cosineSim =
		magA > 0 && magB > 0
			? Math.max(-1, Math.min(1, dotProduct / (magA * magB)))
			: 0;
	const angleRad = Math.acos(cosineSim);
	const angleDeg = (angleRad * 180) / Math.PI;

	const dx = vecA.x - vecB.x;
	const dy = vecA.y - vecB.y;
	const l2Distance = Math.sqrt(dx * dx + dy * dy);

	// SVG origin center
	const origin = { x: 160, y: 160 };

	return (
		<DemoSection
			title="Demo 1: The Common Metrics"
			description="Each vector stands for a piece of text. Drag the endpoints and watch all three metrics react to the same change: cosine reads only the angle θ, the dot product also grows with vector length, and Euclidean reads only the straight-line gap between the arrow tips."
		>
			<div className="space-y-6">
				{/* Presets */}
				<div className="flex flex-wrap gap-2 items-center">
					<span className="text-xs text-zinc-400 font-medium mr-1">
						Try an example:
					</span>
					{PRESETS.map((preset) => (
						<button
							key={preset.label}
							type="button"
							onClick={() => {
								setVecA(preset.a);
								setVecB(preset.b);
							}}
							className="px-2.5 py-1 text-xs rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-violet-500/50 transition-colors"
						>
							{preset.label}
						</button>
					))}
				</div>

				<div className="grid md:grid-cols-2 gap-6">
					{/* Interactive Controls & SVG */}
					<div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-4">
						<div className="flex justify-between items-center text-xs text-zinc-400">
							<span className="font-semibold text-zinc-200">
								Vectors as Arrows (2D Example)
							</span>
							<span>Center = zero</span>
						</div>

						<div className="relative w-full aspect-square max-w-[320px] mx-auto bg-zinc-900/60 rounded-lg border border-zinc-800/80 overflow-hidden">
							<svg
								viewBox="0 0 320 320"
								className="w-full h-full"
								role="img"
								aria-label="2D vector visualizer"
							>
								{/* Grid Lines */}
								<line
									x1={0}
									y1={origin.y}
									x2={320}
									y2={origin.y}
									stroke="rgba(255,255,255,0.07)"
									strokeDasharray="3 3"
								/>
								<line
									x1={origin.x}
									y1={0}
									x2={origin.x}
									y2={320}
									stroke="rgba(255,255,255,0.07)"
									strokeDasharray="3 3"
								/>

								{/* Unit circle reference (radius 80px) */}
								<circle
									cx={origin.x}
									cy={origin.y}
									r={80}
									fill="none"
									stroke="rgba(167, 139, 250, 0.15)"
									strokeDasharray="4 4"
								/>
								<text
									x={origin.x + 86}
									y={origin.y - 72}
									fill="rgba(167, 139, 250, 0.55)"
									fontSize={9}
								>
									length 1
								</text>

								{/* Euclidean Distance Line connecting tips */}
								<line
									x1={origin.x + vecA.x}
									y1={origin.y - vecA.y}
									x2={origin.x + vecB.x}
									y2={origin.y - vecB.y}
									stroke="#10b981"
									strokeWidth={2}
									strokeDasharray="4 3"
								/>

								{/* Vector A */}
								<line
									x1={origin.x}
									y1={origin.y}
									x2={origin.x + vecA.x}
									y2={origin.y - vecA.y}
									stroke="#a78bfa"
									strokeWidth={3.5}
								/>
								<circle
									cx={origin.x + vecA.x}
									cy={origin.y - vecA.y}
									r={5}
									fill="#a78bfa"
								/>
								<text
									x={origin.x + vecA.x + 8}
									y={origin.y - vecA.y}
									fill="#a78bfa"
									fontSize={12}
									fontWeight={600}
								>
									A ({vecA.x}, {vecA.y})
								</text>

								{/* Vector B */}
								<line
									x1={origin.x}
									y1={origin.y}
									x2={origin.x + vecB.x}
									y2={origin.y - vecB.y}
									stroke="#22d3ee"
									strokeWidth={3.5}
								/>
								<circle
									cx={origin.x + vecB.x}
									cy={origin.y - vecB.y}
									r={5}
									fill="#22d3ee"
								/>
								<text
									x={origin.x + vecB.x + 8}
									y={origin.y - vecB.y}
									fill="#22d3ee"
									fontSize={12}
									fontWeight={600}
								>
									B ({vecB.x}, {vecB.y})
								</text>

								{/* Angle indicator */}
								<text
									x={origin.x + 12}
									y={origin.y - 12}
									fill="#f59e0b"
									fontSize={11}
									fontWeight={500}
								>
									θ = {angleDeg.toFixed(1)}°
								</text>
							</svg>
						</div>

						{/* Sliders */}
						<div className="grid grid-cols-2 gap-4 text-xs pt-2">
							<div className="space-y-2 bg-violet-950/20 border border-violet-900/30 p-2.5 rounded-lg">
								<p className="font-semibold text-violet-300">
									Vector A Controls
								</p>
								<label className="block">
									<span className="text-zinc-400">X: {vecA.x}</span>
									<input
										type="range"
										min="-120"
										max="120"
										value={vecA.x}
										onChange={(e) =>
											setVecA({ ...vecA, x: Number(e.target.value) })
										}
										className="w-full accent-violet-500"
									/>
								</label>
								<label className="block">
									<span className="text-zinc-400">Y: {vecA.y}</span>
									<input
										type="range"
										min="-120"
										max="120"
										value={vecA.y}
										onChange={(e) =>
											setVecA({ ...vecA, y: Number(e.target.value) })
										}
										className="w-full accent-violet-500"
									/>
								</label>
							</div>

							<div className="space-y-2 bg-cyan-950/20 border border-cyan-900/30 p-2.5 rounded-lg">
								<p className="font-semibold text-cyan-300">Vector B Controls</p>
								<label className="block">
									<span className="text-zinc-400">X: {vecB.x}</span>
									<input
										type="range"
										min="-120"
										max="120"
										value={vecB.x}
										onChange={(e) =>
											setVecB({ ...vecB, x: Number(e.target.value) })
										}
										className="w-full accent-cyan-500"
									/>
								</label>
								<label className="block">
									<span className="text-zinc-400">Y: {vecB.y}</span>
									<input
										type="range"
										min="-120"
										max="120"
										value={vecB.y}
										onChange={(e) =>
											setVecB({ ...vecB, y: Number(e.target.value) })
										}
										className="w-full accent-cyan-500"
									/>
								</label>
							</div>
						</div>
					</div>

					{/* Metrics Display */}
					<div className="space-y-4">
						{/* Cosine */}
						<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
							<div className="flex justify-between items-start">
								<div>
									<h4 className="text-sm font-semibold text-violet-300">
										Cosine Similarity
									</h4>
									<p className="text-xs text-zinc-400 mt-0.5">
										Compares which way the arrows point. Closer to 1 means more
										alike.
									</p>
								</div>
							</div>

							<div className="mt-3 grid grid-cols-2 gap-2">
								<div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
									<span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
										Similarity
									</span>
									<span className="text-xl font-bold font-mono text-violet-300">
										{cosineSim.toFixed(4)}
									</span>
								</div>
								<div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
									<span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
										Distance (1 − sim)
									</span>
									<span className="text-xl font-bold font-mono text-zinc-400">
										{(1 - cosineSim).toFixed(4)}
									</span>
								</div>
							</div>
							<p className="mt-2 text-[10px] text-zinc-500">
								Similarity: higher is closer. Distance: lower is closer. Cosine
								is undefined when either vector has length 0.
							</p>
						</div>

						{/* L2 Euclidean */}
						<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
							<div className="flex justify-between items-start">
								<div>
									<h4 className="text-sm font-semibold text-emerald-300">
										Euclidean Distance
									</h4>
									<p className="text-xs text-zinc-400 mt-0.5">
										Measures the straight-line gap between tips. Smaller means
										closer.
									</p>
								</div>
							</div>

							<div className="mt-3">
								<div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
									<span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
										Distance
									</span>
									<span className="text-xl font-bold font-mono text-emerald-300">
										{l2Distance.toFixed(2)}
									</span>
								</div>
							</div>
						</div>

						{/* Dot Product */}
						<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
							<div className="flex justify-between items-start">
								<div>
									<h4 className="text-sm font-semibold text-amber-300">
										Dot Product
									</h4>
									<p className="text-xs text-zinc-400 mt-0.5">
										Combines direction and length. Higher means a stronger
										match.
									</p>
								</div>
							</div>

							<div className="mt-3">
								<div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
									<span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
										Dot product score
									</span>
									<span className="text-xl font-bold font-mono text-amber-300">
										{dotProduct.toFixed(1)}
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Key Insight Box */}
				<div className="bg-violet-950/20 border border-violet-800/40 rounded-lg p-4 text-xs space-y-2">
					<p className="font-semibold text-violet-300 flex items-center gap-1.5">
						<span>💡</span> How to Read the Scores
					</p>
					<div className="grid md:grid-cols-3 gap-3 text-zinc-300">
						<div>
							<strong className="text-violet-300 block mb-1">Cosine:</strong>A
							higher similarity score means the arrows point in a more similar
							direction. The matching distance is 1 − similarity, where lower is
							closer.
						</div>
						<div>
							<strong className="text-emerald-300 block mb-1">
								Euclidean (L2):
							</strong>
							A smaller distance means the arrow tips are closer together.
							Squared L2 ranks the same but skips the square root.
						</div>
						<div>
							<strong className="text-amber-300 block mb-1">
								Dot Product:
							</strong>
							A higher score means a stronger match. Its value changes with
							vector length, so normalize first if you want it to match cosine.
						</div>
					</div>
				</div>
			</div>
		</DemoSection>
	);
}
