import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { FailureInjectionDemo } from "../components/ai-rag/FailureInjectionDemo";
import { GroundingDemo } from "../components/ai-rag/GroundingDemo";
import { OfflineIndexingDemo } from "../components/ai-rag/OfflineIndexingDemo";
import { OnlineQueryDemo } from "../components/ai-rag/OnlineQueryDemo";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/ai-rag")({
	component: RAGPage,
});

function RAGPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-8">
			<PageHeader
				topic={{ label: "AI Engineering", color: "indigo" }}
				title="RAG Pipeline"
				subtitle="Retrieval-Augmented Generation injects external facts into the prompt at query time, so the model can answer questions about content it was never trained on. The pipeline is short; the failure modes are subtle and cascade across stages."
				gradient={{ from: "emerald-400", via: "cyan-400", to: "violet-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								RAG splits into two pipelines.{" "}
								<span className="text-emerald-300 font-medium">Offline</span>{" "}
								(run once per document change): chunk the source, embed each
								chunk, store vectors in an ANN index.{" "}
								<span className="text-cyan-300 font-medium">Online</span> (run
								per user query): embed the query, retrieve the nearest chunks,
								optionally rerank for precision, assemble them into a prompt,
								and generate.
							</p>
							<p>
								The failure modes are{" "}
								<span className="text-rose-300 font-medium">cascading</span> and
								easy to misdiagnose. Bad chunking starves the embedder. Low
								recall delivers irrelevant context. A too-large context dilutes
								attention. And critically — even with <em>perfect</em>{" "}
								retrieval, the model can still hallucinate if the prompt doesn't
								force it to stay inside the provided context. Each failure
								surfaces as something that looks like LLM hallucination, but the
								root cause is upstream.
							</p>
							<p className="text-zinc-400">
								The demos walk through both pipelines, then inject realistic
								failures so you can see which symptom each one produces — and
								why the fix isn't always "better prompting."
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
				<OfflineIndexingDemo />
				<OnlineQueryDemo />
				<FailureInjectionDemo />
				<GroundingDemo />
			</motion.div>
		</div>
	);
}
