import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { OpenTelemetryTraceDemo } from "../components/ai-evals-observability/OpenTelemetryTraceDemo";
import { PairwiseArenaDemo } from "../components/ai-evals-observability/PairwiseArenaDemo";
import { PromptRegressionCiDemo } from "../components/ai-evals-observability/PromptRegressionCiDemo";
import { RagTriadEvaluatorDemo } from "../components/ai-evals-observability/RagTriadEvaluatorDemo";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/ai-evals-observability")({
	component: EvalsObservabilityPage,
});

function EvalsObservabilityPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-8">
			<PageHeader
				topic={{ label: "AI Engineering", color: "violet" }}
				title="Evals & Observability"
				subtitle="Non-deterministic outputs make traditional unit tests obsolete. LLM-as-a-Judge and RAG Triad evaluation metrics provide continuous quality guarantees."
				gradient={{ from: "violet-400", to: "indigo-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								<span className="text-violet-300 font-medium">
									LLM-as-a-Judge
								</span>{" "}
								evaluates pipeline outputs against rubrics (e.g., factual
								accuracy, safety).
								<span className="text-violet-300 font-medium">
									{" "}
									Continuous evaluation
								</span>{" "}
								traces production inputs and builds datasets for regression
								testing.
							</p>
							<p className="text-zinc-400">
								These demos cover tracing, RAG evaluation metrics, pairwise
								comparisons, and CI pipelines.
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
				<OpenTelemetryTraceDemo />
				<RagTriadEvaluatorDemo />
				<PairwiseArenaDemo />
				<PromptRegressionCiDemo />
			</motion.div>
		</div>
	);
}
