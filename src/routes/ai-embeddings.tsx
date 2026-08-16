import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { AnalogyDemo } from "../components/ai-embeddings/AnalogyDemo";
import { CosineSimilarityDemo } from "../components/ai-embeddings/CosineSimilarityDemo";
import { EmbeddingProjectionDemo } from "../components/ai-embeddings/EmbeddingProjectionDemo";
import { ModelComparisonDemo } from "../components/ai-embeddings/ModelComparisonDemo";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/ai-embeddings")({
	component: EmbeddingsPage,
});

function EmbeddingsPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-8">
			<PageHeader
				topic={{ label: "AI Engineering", color: "indigo" }}
				title="Vector Embeddings"
				subtitle="Text is mapped to a fixed-length vector in a high-dimensional space. The geometry of that space — distances and angles — encodes semantic similarity. Embeddings are the substrate of search, RAG, clustering, and classification."
				gradient={{ from: "cyan-400", via: "blue-400", to: "violet-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								An{" "}
								<span className="text-cyan-300 font-medium">
									embedding model
								</span>{" "}
								is a neural network that maps a string of text to a fixed-size
								dense vector — for example, 384 dimensions for{" "}
								<code className="text-zinc-200">all-MiniLM-L6-v2</code> or 1536
								for OpenAI's{" "}
								<code className="text-zinc-200">text-embedding-3-small</code>.
								Most are trained with a{" "}
								<span className="text-violet-300 font-medium">
									contrastive objective
								</span>
								: pairs known to be similar are pulled together in the space;
								unrelated pairs are pushed apart. The model never "understands"
								text — it learns a compression that preserves a similarity
								structure.
							</p>
							<p>
								Once you have vectors, similarity becomes geometry. Production
								APIs return{" "}
								<span className="text-cyan-300 font-medium">L2-normalized</span>{" "}
								vectors — every output sits on the surface of the unit sphere.
								For unit vectors, cosine similarity and Euclidean distance rank
								points identically, so you can treat the choice as a convention
								rather than a correctness question. Cosine is preferred in
								practice because it's bounded to [−1, 1] and remains meaningful
								even when magnitudes drift.
							</p>
							<p className="text-zinc-400">
								The demos below project a real 384-d MiniLM space to 2D, let you
								measure cosine similarity between sentences, test the famous
								"king − man + woman" analogy on modern embeddings, and compare
								how two different models partition the same input.
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
				<EmbeddingProjectionDemo />
				<CosineSimilarityDemo />
				<AnalogyDemo />
				<ModelComparisonDemo />
			</motion.div>
		</div>
	);
}
