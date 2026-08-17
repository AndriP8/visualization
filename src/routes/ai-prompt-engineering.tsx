import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ChainOfThoughtDemo } from "../components/ai-prompt-engineering/ChainOfThoughtDemo";
import { InstructionHierarchyDemo } from "../components/ai-prompt-engineering/InstructionHierarchyDemo";
import { ZeroShotDemo } from "../components/ai-prompt-engineering/ZeroShotDemo";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/ai-prompt-engineering")({
	component: PromptEngineeringPage,
});

function PromptEngineeringPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-8">
			<PageHeader
				topic={{ label: "AI Engineering", color: "violet" }}
				title="Prompt Engineering"
				subtitle="The foundational interface to the model. How you structure the context determines the quality, reliability, and tone of the output."
				gradient={{ from: "violet-400", to: "indigo-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								System prompts establish the persona, constraints, and
								operational rules, while user prompts provide the specific task.
								<span className="text-violet-300 font-medium"> Zero-shot</span>{" "}
								relies entirely on the model's pre-training, whereas{" "}
								<span className="text-violet-300 font-medium">few-shot</span>{" "}
								provides demonstrations.
							</p>
							<p className="text-zinc-400">
								These demos cover zero-shot vs few-shot, chain of thought, and
								instruction hierarchy.
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
				<ZeroShotDemo />
				<ChainOfThoughtDemo />
				<InstructionHierarchyDemo />
			</motion.div>
		</div>
	);
}
