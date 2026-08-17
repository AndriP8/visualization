import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { EvalRegressionSuiteDemo } from "../components/ai-evals-guardrails/EvalRegressionSuiteDemo";
import { GuardrailPipelineDemo } from "../components/ai-evals-guardrails/GuardrailPipelineDemo";
import { GuardrailTechniquesComparisonDemo } from "../components/ai-evals-guardrails/GuardrailTechniquesComparisonDemo";
import { JudgeRubricEvaluatorDemo } from "../components/ai-evals-guardrails/JudgeRubricEvaluatorDemo";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/ai-evals-guardrails")({
	component: EvalsGuardrailsPage,
});

function EvalsGuardrailsPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-8">
			<PageHeader
				topic={{ label: "AI Engineering", color: "violet" }}
				title="Evaluation & Guardrails"
				subtitle="Testing AI quality and stopping unsafe or incorrect answers in real time."
				gradient={{ from: "violet-400", to: "indigo-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								<span className="text-violet-300 font-medium">Evaluation</span>{" "}
								tests your AI system with test questions and gives each answer a
								score so you can see if updates make it better or worse.
								<span className="text-indigo-300 font-medium"> Guardrails</span>{" "}
								are real-time safety checks that block harmful inputs (like
								jailbreaks) and catch mistakes (like made-up facts or private
								data leaks) before the user sees them.
							</p>
							<p>
								Simple rules (like pattern matching) can instantly hide
								sensitive information like credit cards and passwords. Faster AI
								filters catch attack attempts in milliseconds, while a second AI
								model can act as a judge to grade truthfulness and tone.
							</p>
							<p className="text-zinc-400">
								The 4 interactive demos below walk through safety filter
								pipelines, speed vs. cost trade-offs, AI grading rules, and
								automated quality checks before deploying updates.
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
				<GuardrailPipelineDemo />
				<GuardrailTechniquesComparisonDemo />
				<JudgeRubricEvaluatorDemo />
				<EvalRegressionSuiteDemo />
			</motion.div>
		</div>
	);
}
