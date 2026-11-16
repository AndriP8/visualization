import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { CommonDistanceMetricsDemo } from "../components/ai-vector-distance/CommonDistanceMetricsDemo";
import { HighDimensionalityDemo } from "../components/ai-vector-distance/HighDimensionalityDemo";
import { MetricChoiceDemo } from "../components/ai-vector-distance/MetricChoiceDemo";
import { NormalizationDemo } from "../components/ai-vector-distance/NormalizationDemo";
import { RankingInvarianceDemo } from "../components/ai-vector-distance/RankingInvarianceDemo";
import { UncommonDistanceMetricsDemo } from "../components/ai-vector-distance/UncommonDistanceMetricsDemo";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/ai-vector-distance")({
	component: VectorDistancePage,
});

function VectorDistancePage() {
	return (
		<div className="max-w-6xl mx-auto space-y-8 pb-20">
			<PageHeader
				topic={{ label: "AI Engineering", color: "violet" }}
				title="Vector Distance Metrics"
				subtitle="AI turns text into lists of numbers called embeddings. Distance metrics compare those lists to find text with similar meaning."
				gradient={{ from: "violet-400", to: "indigo-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								<span className="text-violet-300 font-medium">
									The three common ways to compare embeddings:
								</span>{" "}
								<strong>Cosine</strong> compares their direction,{" "}
								<strong>dot product</strong> also considers their length, and{" "}
								<strong>Euclidean</strong> measures the straight-line gap
								between them.
							</p>
							<p>
								Each score comes in two directions. A{" "}
								<span className="text-indigo-300 font-medium">similarity</span>{" "}
								gets larger for a better match. A{" "}
								<span className="text-indigo-300 font-medium">distance</span>{" "}
								gets smaller. Cosine distance is simply 1 minus cosine
								similarity, so the two rank results the same way. Sorting the
								wrong direction quietly returns the worst matches first.
							</p>
							<p>
								Vector length is the other trap. Most models return vectors of
								length 1, and then dot product, cosine, and Euclidean all rank
								identically. On raw vectors, a long document can win on size
								alone. Normalize to compare meaning.
							</p>
							<p className="text-zinc-400">
								The demos below drag two vectors through the common metrics,
								show what normalization changes, compare similarity with
								distance, demonstrate why 2D arrows mislead at real dimensions,
								list the specialized metrics, and map the names to real
								databases.
							</p>
						</div>
					),
				}}
			/>

			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.2, duration: 0.4 }}
				className="space-y-8"
			>
				<CommonDistanceMetricsDemo />
				<NormalizationDemo />
				<RankingInvarianceDemo />
				<HighDimensionalityDemo />
				<UncommonDistanceMetricsDemo />
				<MetricChoiceDemo />
			</motion.div>
		</div>
	);
}
