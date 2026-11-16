import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { DOCUMENTS, QUERY, QUERY_LABEL } from "./vectorDistanceData";
import { magnitude, rankDocuments } from "./vectorMetrics";

const METRIC_OPTIONS = [
	{ id: "cosine", label: "Cosine similarity" },
	{ id: "dot", label: "Dot product" },
	{ id: "euclidean", label: "Euclidean distance" },
] as const;

type MetricOptionId = (typeof METRIC_OPTIONS)[number]["id"];

function formatScore(score: number, metric: MetricOptionId): string {
	if (metric === "euclidean") return score.toFixed(2);
	if (metric === "dot") return score.toFixed(2);
	return score.toFixed(4);
}

export function NormalizationDemo() {
	const [normalized, setNormalized] = useState(false);
	const [metric, setMetric] = useState<MetricOptionId>("dot");

	const cosineRanking = rankDocuments({
		documents: DOCUMENTS,
		query: QUERY,
		metric: "cosine",
		normalized,
	});
	const ranking = rankDocuments({
		documents: DOCUMENTS,
		query: QUERY,
		metric,
		normalized,
	});

	const sameOrder =
		cosineRanking.map((document) => document.id).join(",") ===
		ranking.map((document) => document.id).join(",");

	const worstScore = ranking[ranking.length - 1].score;
	const bestScore = ranking[0].score;
	const barWidth = (score: number) => {
		if (metric === "euclidean") {
			if (worstScore <= 0) return 100;
			return Math.max(4, (1 - score / worstScore) * 100);
		}
		if (bestScore <= 0) return 0;
		return Math.max(0, Math.min(100, (score / bestScore) * 100));
	};

	return (
		<DemoSection
			title="Demo 2: What normalization changes"
			description="Length is noise in text search. A long document naturally produces a longer vector, and the dot product rewards that size even when the meaning is a poorer match. Switch the vectors to unit length and watch the ranking snap to meaning."
		>
			<div className="space-y-5">
				<div className="flex flex-wrap items-center gap-2">
					<span className="text-xs text-zinc-400 font-medium mr-1">
						Vector length:
					</span>
					<button
						type="button"
						onClick={() => setNormalized(false)}
						className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
							normalized
								? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
								: "bg-violet-950/40 border-violet-600/60 text-violet-200"
						}`}
					>
						Raw (as stored)
					</button>
					<button
						type="button"
						onClick={() => setNormalized(true)}
						className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
							normalized
								? "bg-violet-950/40 border-violet-600/60 text-violet-200"
								: "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
						}`}
					>
						Unit length (normalized)
					</button>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<span className="text-xs text-zinc-400 font-medium mr-1">
						Rank by:
					</span>
					{METRIC_OPTIONS.map((option) => (
						<button
							key={option.id}
							type="button"
							onClick={() => setMetric(option.id)}
							className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
								metric === option.id
									? "bg-zinc-800 border-zinc-600 text-white"
									: "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
							}`}
						>
							{option.label}
						</button>
					))}
				</div>

				<div
					className={`rounded-lg border p-3 text-xs ${
						sameOrder
							? "border-emerald-900/50 bg-emerald-950/20 text-emerald-200"
							: "border-amber-900/50 bg-amber-950/20 text-amber-200"
					}`}
				>
					{metric === "cosine"
						? "Cosine ignores vector length, so its ranking is the same in both modes."
						: sameOrder
							? `Same order as cosine. With unit-length vectors, ${metric === "dot" ? "dot product" : "Euclidean"} ranks the documents identically.`
							: `Different order from cosine. Raw ${metric === "dot" ? "dot product" : "Euclidean distance"} is being swayed by vector length, not just direction.`}
				</div>

				<div className="space-y-2">
					<div className="flex justify-between text-[10px] uppercase tracking-wider text-zinc-500">
						<span>Query: {QUERY_LABEL}</span>
						<span>{normalized ? "All vectors length 1" : "Best first"}</span>
					</div>

					{ranking.map((document) => {
						const source = DOCUMENTS.find((item) => item.id === document.id);
						const length = source ? magnitude(source.vector) : 0;
						const isBest = document.rank === 1;
						const expectedRank = cosineRanking.find(
							(item) => item.id === document.id,
						)?.rank;
						const mismatched = expectedRank !== document.rank;

						return (
							<div
								key={document.id}
								className="rounded-lg border border-zinc-800 bg-zinc-950 p-3"
							>
								<div className="flex items-center justify-between gap-3 text-xs">
									<div className="flex items-center gap-2 min-w-0">
										<span
											className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
												isBest
													? "bg-violet-500 text-white"
													: "bg-zinc-800 text-zinc-400"
											}`}
										>
											{document.rank}
										</span>
										<span className="truncate text-zinc-200">
											{document.label}
										</span>
										{mismatched && (
											<span className="shrink-0 rounded bg-amber-950/60 px-1.5 py-0.5 text-[10px] text-amber-300">
												cosine rank #{expectedRank}
											</span>
										)}
									</div>
									<div className="shrink-0 text-right font-mono">
										<span
											className={isBest ? "text-violet-300" : "text-zinc-400"}
										>
											{formatScore(document.score, metric)}
										</span>
										<span className="ml-2 text-[10px] text-zinc-600">
											len {normalized ? "1.00" : length.toFixed(2)}
										</span>
									</div>
								</div>
								<div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-900">
									<div
										className={`h-full rounded-full ${
											isBest ? "bg-violet-500" : "bg-zinc-600"
										}`}
										style={{ width: `${barWidth(document.score)}%` }}
									/>
								</div>
							</div>
						);
					})}
				</div>

				<div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 text-xs text-zinc-400">
					Cosine already ignores length, so normalizing does not change it.
					Normalizing is what makes{" "}
					<strong className="text-zinc-200">dot product</strong> and{" "}
					<strong className="text-zinc-200">Euclidean</strong> behave like
					cosine. Most embedding APIs return unit vectors for exactly this
					reason.
				</div>
			</div>
		</DemoSection>
	);
}
