import { useMemo, useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { cosineSimilarity } from "./vectorMetrics";

const DIMENSIONS = [2, 8, 32, 128, 512, 1536];
const SAMPLE_COUNT = 400;
const BIN_COUNT = 20;

function mulberry32(seed: number): () => number {
	let state = seed;
	return () => {
		state |= 0;
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function gaussianVector(dimension: number, random: () => number): number[] {
	const values = new Array<number>(dimension);
	for (let i = 0; i < dimension; i += 2) {
		const u = Math.max(random(), Number.EPSILON);
		const v = random();
		const radius = Math.sqrt(-2 * Math.log(u));
		values[i] = radius * Math.cos(2 * Math.PI * v);
		if (i + 1 < dimension) {
			values[i + 1] = radius * Math.sin(2 * Math.PI * v);
		}
	}
	return values;
}

interface HistogramBin {
	id: number;
	from: number;
	count: number;
}

interface SampleStats {
	histogram: HistogramBin[];
	mean: number;
	standardDeviation: number;
}

function sampleAt(dimension: number): SampleStats {
	const random = mulberry32(dimension * 7919);
	const histogram: HistogramBin[] = Array.from(
		{ length: BIN_COUNT },
		(_, index) => ({
			id: index,
			from: -1 + (index / BIN_COUNT) * 2,
			count: 0,
		}),
	);
	let sum = 0;
	let sumOfSquares = 0;

	for (let i = 0; i < SAMPLE_COUNT; i++) {
		const a = gaussianVector(dimension, random);
		const b = gaussianVector(dimension, random);
		const similarity = cosineSimilarity(a, b) ?? 0;

		sum += similarity;
		sumOfSquares += similarity * similarity;

		const bin = Math.min(
			BIN_COUNT - 1,
			Math.floor(((similarity + 1) / 2) * BIN_COUNT),
		);
		histogram[Math.max(0, bin)].count += 1;
	}

	const mean = sum / SAMPLE_COUNT;
	const variance = Math.max(0, sumOfSquares / SAMPLE_COUNT - mean * mean);

	return {
		histogram,
		mean,
		standardDeviation: Math.sqrt(variance),
	};
}

export function HighDimensionalityDemo() {
	const [dimension, setDimension] = useState(1536);
	const stats = useMemo(() => sampleAt(dimension), [dimension]);
	const maxBin = Math.max(...stats.histogram.map((bin) => bin.count));

	return (
		<DemoSection
			title="Demo 4: Why 2D arrows mislead"
			description="Real embeddings have hundreds or thousands of dimensions. In high-dimensional space, two random directions are almost always perpendicular. The spread of chance similarity collapses toward zero, and the safe range for a score depends on the model."
		>
			<div className="space-y-5">
				<div className="flex flex-wrap items-center gap-2">
					<span className="text-xs text-zinc-400 font-medium mr-1">
						Dimensions:
					</span>
					{DIMENSIONS.map((value) => (
						<button
							key={value}
							type="button"
							onClick={() => setDimension(value)}
							className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
								dimension === value
									? "bg-violet-950/40 border-violet-600/60 text-violet-200"
									: "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
							}`}
						>
							{value}
						</button>
					))}
				</div>

				<div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
					<div className="flex items-baseline justify-between text-xs">
						<span className="text-zinc-300">
							Cosine similarity of {SAMPLE_COUNT} random pairs
						</span>
						<span className="font-mono text-zinc-500">
							mean {stats.mean.toFixed(3)} · spread ±
							{stats.standardDeviation.toFixed(3)}
						</span>
					</div>

					<div className="mt-3 flex h-32 items-end gap-[2px]">
						{stats.histogram.map((bin) => (
							<div
								key={bin.id}
								className="flex-1 rounded-t-sm bg-violet-500/70"
								style={{
									height: `${maxBin === 0 ? 0 : (bin.count / maxBin) * 100}%`,
									minHeight: bin.count > 0 ? 2 : 0,
								}}
								title={`${bin.from.toFixed(2)} to ${(bin.from + 2 / BIN_COUNT).toFixed(2)}: ${bin.count} pairs`}
							/>
						))}
					</div>

					<div className="mt-1 flex justify-between text-[10px] font-mono text-zinc-500">
						<span>−1 (opposite)</span>
						<span>0 (perpendicular)</span>
						<span>+1 (identical)</span>
					</div>
				</div>

				<div className="grid gap-3 md:grid-cols-2">
					<div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs">
						<p className="font-semibold text-zinc-200">
							What the histogram shows
						</p>
						<p className="mt-1 text-zinc-400">
							At 2 dimensions a random pair can easily land near 0.5. At 1536
							dimensions almost every random pair lands within ±0.1. The average
							stays at zero; the spread shrinks as dimensions grow.
						</p>
					</div>

					<div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs">
						<p className="font-semibold text-zinc-200">
							Why that matters in production
						</p>
						<p className="mt-1 text-zinc-400">
							A score of 0.3 is a strong match in a 2D sketch and a weak one in
							a 1536-dimensional model. Thresholds do not transfer between
							models, dimension counts, or normalized vs raw vectors. Calibrate
							them on your own data.
						</p>
					</div>
				</div>
			</div>
		</DemoSection>
	);
}
