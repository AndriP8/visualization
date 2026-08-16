import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ErrorRecoveryDemo } from "../components/ai-agent-loops/ErrorRecoveryDemo";
import { MultiAgentDemo } from "../components/ai-agent-loops/MultiAgentDemo";
import { PlanExecuteDemo } from "../components/ai-agent-loops/PlanExecuteDemo";
import { ReactLoopTraceDemo } from "../components/ai-agent-loops/ReactLoopTraceDemo";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/ai-agent-loops")({
	component: AgentLoopsPage,
});

function AgentLoopsPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-8">
			<PageHeader
				topic={{ label: "AI Engineering", color: "indigo" }}
				title="Agent Loops"
				subtitle="Equipping a model with tools is not enough. Agents need a structured reasoning loop to plan, act, observe, and adjust dynamically."
				gradient={{ from: "violet-400", via: "cyan-400", to: "blue-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								<span className="text-violet-300 font-medium">
									The core loop:
								</span>{" "}
								LLMs describe intent; the application runtime manages execution.
								In a <span className="font-medium text-violet-300">ReAct</span>{" "}
								(Reasoning + Acting) loop, the model emits a reasoning trace (
								<em>Thought</em>) and a tool call (<em>Action</em>). The host
								app executes the tool and feeds the result back as an{" "}
								<em>Observation</em>. This grounds the model in real-world
								feedback and mitigates hallucination compounding.
							</p>
							<p>
								<span className="text-violet-300 font-medium">
									Loop patterns & boundaries:
								</span>{" "}
								Iterative loops adapt dynamically to unexpected outputs, while{" "}
								<span className="font-medium text-cyan-300">
									Plan-and-Execute
								</span>{" "}
								creates an explicit dependency graph upfront for parallel
								dispatch. Production loops require strict guardrails: tool error
								feedback for self-correction, retry budgets, and step limits to
								prevent runaway execution.
							</p>
							<p className="text-zinc-400">
								The demos below cover the step-by-step ReAct trace, error
								recovery with retry budgets, execution graph planning, and
								multi-agent supervisor-worker delegation.
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
				<ReactLoopTraceDemo />
				<ErrorRecoveryDemo />
				<PlanExecuteDemo />
				<MultiAgentDemo />
			</motion.div>
		</div>
	);
}
