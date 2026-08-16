import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { DemoSection } from "../shared/DemoSection";

const WIDTH = 600;
const HEIGHT = 360;
const N = 80;
const K = 5;

function mulberry32(seed: number) {
	let s = seed;
	return () => {
		s = (s + 0x6d2b79f5) | 0;
		let t = s;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function generatePoints(): { x: number; y: number }[] {
	const rng = mulberry32(42);
	return Array.from({ length: N }, () => ({
		x: 30 + rng() * (WIDTH - 60),
		y: 30 + rng() * (HEIGHT - 60),
	}));
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
	const dx = a.x - b.x;
	const dy = a.y - b.y;
	return Math.sqrt(dx * dx + dy * dy);
}

export function BruteForceKnnDemo() {
	const points = useMemo(generatePoints, []);
	const [query, setQuery] = useState<{ x: number; y: number } | null>({
		x: 300,
		y: 180,
	});
	const [step, setStep] = useState(N);

	const ranked = useMemo(() => {
		if (!query) return [];
		return points
			.map((p, i) => ({ i, d: dist(p, query) }))
			.sort((a, b) => a.d - b.d);
	}, [points, query]);

	const visitedCount = step;
	const topK = useMemo(() => {
		if (!query || visitedCount < N) return new Set<number>();
		return new Set(ranked.slice(0, K).map((r) => r.i));
	}, [ranked, query, visitedCount]);

	function handleSvgClick(e: React.MouseEvent<SVGSVGElement>) {
		const rect = e.currentTarget.getBoundingClientRect();
		const x = ((e.clientX - rect.left) / rect.width) * WIDTH;
		const y = ((e.clientY - rect.top) / rect.height) * HEIGHT;
		setQuery({ x, y });
		setStep(0);
	}

	function play() {
		setStep(0);
		let i = 0;
		const id = setInterval(() => {
			i += 2;
			if (i >= N) {
				setStep(N);
				clearInterval(id);
			} else {
				setStep(i);
			}
		}, 30);
	}

	return (
		<DemoSection
			title="Demo 1: Brute-Force kNN"
			description="The honest baseline. Compare the query to every point. Correct, slow, O(n·d)."
		>
			<div className="space-y-4">
				<div className="flex gap-2">
					<button
						type="button"
						onClick={play}
						disabled={!query}
						className="px-3 py-1.5 text-xs bg-cyan-600/30 text-cyan-200 border border-cyan-500/40 rounded hover:bg-cyan-600/50 disabled:opacity-50"
					>
						▶ Animate scan
					</button>
					<span className="text-xs text-zinc-500 self-center">
						Click anywhere on the canvas to move the query point.
					</span>
				</div>

				{/* biome-ignore lint/a11y/useKeyWithClickEvents: clickable canvas for query placement */}
				<svg
					viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
					onClick={handleSvgClick}
					className="w-full bg-zinc-950 border border-zinc-800 rounded-lg cursor-crosshair"
					role="img"
					aria-label="2D vector space — click to set query"
				>
					{query &&
						points
							.slice(0, visitedCount)
							.map((p) => (
								<line
									key={`line-${p.x}-${p.y}`}
									x1={query.x}
									y1={query.y}
									x2={p.x}
									y2={p.y}
									stroke="#22d3ee"
									strokeOpacity={0.15}
									strokeWidth={1}
								/>
							))}
					{points.map((p, i) => {
						const isVisited = i < visitedCount;
						const isTopK = topK.has(i);
						const fill = isTopK ? "#22d3ee" : isVisited ? "#475569" : "#27272a";
						const r = isTopK ? 6 : 4;
						return (
							<motion.circle
								key={`p-${p.x}-${p.y}`}
								cx={p.x}
								cy={p.y}
								r={r}
								fill={fill}
								stroke={isTopK ? "#67e8f9" : "transparent"}
								strokeWidth={isTopK ? 2 : 0}
								animate={{ r }}
							/>
						);
					})}
					{query && (
						<>
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
						</>
					)}
				</svg>

				<div className="grid grid-cols-3 gap-3">
					{[
						{ label: "Comparisons", value: visitedCount },
						{ label: "Total points (n)", value: N },
						{ label: "Top-k returned", value: visitedCount === N ? K : 0 },
					].map(({ label, value }) => (
						<div
							key={label}
							className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-center"
						>
							<p className="text-xl font-bold text-cyan-300">{value}</p>
							<p className="text-xs text-zinc-500 mt-0.5">{label}</p>
						</div>
					))}
				</div>

				<div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-3 text-xs text-zinc-400">
					<span className="text-cyan-300 font-medium">
						Why this doesn't scale:
					</span>{" "}
					Each comparison is a dot product over{" "}
					<span className="font-mono">d</span> dimensions. At n=10M and d=1536,
					that's ~30B multiply-adds per query. Production embedding sets need
					sub-linear search — which is why ANN exists.
				</div>
			</div>
		</DemoSection>
	);
}
