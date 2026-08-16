import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { DecisionMatrixDemo } from "../components/ai-fine-tuning/DecisionMatrixDemo";
import { FormatComplianceDemo } from "../components/ai-fine-tuning/FormatComplianceDemo";
import { KnowledgeUpdateSpeedDemo } from "../components/ai-fine-tuning/KnowledgeUpdateSpeedDemo";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/ai-fine-tuning")({
	component: FineTuningPage,
});

function FineTuningPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-8">
			<PageHeader
				topic={{ label: "AI Engineering", color: "indigo" }}
				title="Fine-Tuning vs. RAG"
				subtitle="When to bake knowledge into the model's weights versus when to provide it in the context window."
				gradient={{ from: "violet-400", via: "cyan-400", to: "blue-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								Fine-tuning changes the model's weights using a dataset of
								examples. RAG retrieves information at runtime. Use{" "}
								<span className="text-violet-300 font-medium">fine-tuning</span>{" "}
								for form, tone, and specific tasks. Use{" "}
								<span className="text-violet-300 font-medium">RAG</span> for
								facts that change and access control.
							</p>
							<p className="text-zinc-400">
								These demos compare knowledge update speeds, format compliance,
								and provide a decision matrix.
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
				<KnowledgeUpdateSpeedDemo />
				<FormatComplianceDemo />
				<DecisionMatrixDemo />
			</motion.div>
		</div>
	);
}
