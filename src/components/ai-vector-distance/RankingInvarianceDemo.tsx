import { DemoSection } from "../shared/DemoSection";
import { DOCUMENTS, QUERY, QUERY_LABEL } from "./vectorDistanceData";
import {
	METRICS,
	type MetricId,
	normalize,
	rankDocuments,
	scoreDocument,
} from "./vectorMetrics";

function formatScore(score: number): string {
	return score.toFixed(3);
}

export function RankingInvarianceDemo() {
	const preparedQuery = normalize(QUERY);
	const preparedDocuments = DOCUMENTS.map((document) => ({
		...document,
		vector: normalize(document.vector),
	}));

	const ranks = new Map<MetricId, Map<string, number>>();
	const cosineOrder = rankDocuments({
		documents: DOCUMENTS,
		query: QUERY,
		metric: "cosine",
		normalized: true,
	});
	const order = cosineOrder
		.map((document) => document.id.toUpperCase())
		.join(" → ");

	for (const metric of METRICS) {
		const ranking = rankDocuments({
			documents: DOCUMENTS,
			query: QUERY,
			metric: metric.id,
			normalized: true,
		});
		ranks.set(
			metric.id,
			new Map(ranking.map((document) => [document.id, document.rank])),
		);
	}

	return (
		<DemoSection
			title="Demo 3: Similarity vs distance, and why the order stays the same"
			description="These five columns all point at the same documents in the same order. Only the numbers differ. When every metric is a monotonic transform of another, the ranking cannot change — so a distance is just a similarity with the sign flipped."
		>
			<div className="space-y-5">
				<div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-wider text-zinc-500">
					<span>Query: {QUERY_LABEL}</span>
					<span className="normal-case tracking-normal">
						vectors normalized to length 1
					</span>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full min-w-[720px] border-collapse text-xs">
						<thead>
							<tr className="border-b border-zinc-800 text-left">
								<th className="py-2 pr-3 font-medium text-zinc-400">
									Document
								</th>
								{METRICS.map((metric) => (
									<th
										key={metric.id}
										className="py-2 px-3 font-medium text-zinc-400"
									>
										<span className="block text-zinc-300">{metric.label}</span>
										<span className="text-[10px] font-normal text-zinc-500">
											{metric.higherIsBetter
												? "higher is better"
												: "lower is better"}
										</span>
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{cosineOrder.map((document) => {
								const source = preparedDocuments.find(
									(item) => item.id === document.id,
								);
								if (!source) return null;

								return (
									<tr
										key={document.id}
										className="border-b border-zinc-900 last:border-0"
									>
										<td className="py-2.5 pr-3 text-zinc-200">
											<span className="mr-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-violet-500/20 text-[10px] font-bold text-violet-300">
												{document.rank}
											</span>
											{document.label}
										</td>
										{METRICS.map((metric) => {
											const score = scoreDocument(
												preparedQuery,
												source.vector,
												metric.id,
											);
											const rank = ranks.get(metric.id)?.get(document.id);
											const matches = rank === document.rank;

											return (
												<td key={metric.id} className="py-2.5 px-3">
													<div className="flex items-center gap-2 font-mono">
														<span className="text-zinc-300">
															{score === null ? "—" : formatScore(score)}
														</span>
														<span
															className={`rounded px-1 py-0.5 text-[10px] font-sans ${
																matches
																	? "bg-emerald-950/60 text-emerald-300"
																	: "bg-rose-950/60 text-rose-300"
															}`}
														>
															#{rank}
														</span>
													</div>
												</td>
											);
										})}
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>

				<div className="grid gap-3 md:grid-cols-2">
					<div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs">
						<p className="font-semibold text-zinc-200">The sorting trap</p>
						<p className="mt-1 text-zinc-400">
							Similarity and dot product are sorted{" "}
							<strong className="text-zinc-300">highest first</strong>. Cosine
							distance, Euclidean, and squared Euclidean are sorted{" "}
							<strong className="text-zinc-300">lowest first</strong>.
						</p>
						<p className="mt-2 text-zinc-400">
							If your database returns a distance and your code sorts it
							descending, the worst match appears at the top.
						</p>
					</div>

					<div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs">
						<p className="font-semibold text-zinc-200">
							Never compare scores across columns
						</p>
						<p className="mt-1 text-zinc-400">
							The same document scores 0.9997 by cosine and 0.0099 by cosine
							distance. Neither number is "the match quality" on its own.
							Thresholds belong to one metric, one model, and one dimension
							count.
						</p>
						<p className="mt-2 text-zinc-400">
							What survives the transform is the order: {order}.
						</p>
					</div>
				</div>
			</div>
		</DemoSection>
	);
}
