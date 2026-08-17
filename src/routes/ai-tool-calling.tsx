import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { LoopAnimationDemo } from "../components/ai-tool-calling/LoopAnimationDemo";
import { ParallelToolCallsDemo } from "../components/ai-tool-calling/ParallelToolCallsDemo";
import { ToolCallingFailuresDemo } from "../components/ai-tool-calling/ToolCallingFailuresDemo";
import { ToolSchemaDemo } from "../components/ai-tool-calling/ToolSchemaDemo";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/ai-tool-calling")({
	component: ToolCallingPage,
});

function ToolCallingPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-8">
			<PageHeader
				topic={{ label: "AI Engineering", color: "violet" }}
				title="Tool Calling Loop"
				subtitle="Tool calling lets the model emit structured function invocations instead of text. The application executes them and feeds results back — creating an agentic loop that can interact with the real world."
				gradient={{ from: "violet-400", to: "indigo-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								<span className="text-violet-300 font-medium">
									The problem:
								</span>{" "}
								LLMs are text-in / text-out. Anything outside the model —
								database lookups, API calls, code execution — requires the
								application to step in. Without structure, the model would emit
								free-form text that the app parses heuristically, which is
								brittle and unpredictable.
							</p>
							<p>
								<span className="text-indigo-300 font-medium">
									The solution:
								</span>{" "}
								A turn-based loop. The model emits a structured{" "}
								<span className="font-mono text-indigo-200">tool_use</span>{" "}
								block matching a declared JSON Schema. The{" "}
								<span className="font-medium">application</span> runs the tool,
								appends a{" "}
								<span className="font-mono text-indigo-200">tool_result</span>{" "}
								to the conversation as a user-role message, and re-invokes the
								model with the full history. This repeats until the model
								returns a response with no{" "}
								<span className="font-mono text-indigo-200">tool_use</span>{" "}
								block.{" "}
								<span className="font-medium">
									The model never executes anything — it only describes intent.
								</span>
							</p>
							<p>
								<span className="text-violet-300 font-medium">
									The trade-off:
								</span>{" "}
								The loop is controlled by your code, not the model. Termination,
								error handling, parallelism, and timeouts are your
								responsibility. Common failure modes: infinite loops when tool
								results are ambiguous, hallucinated outputs when errors are
								swallowed, and race conditions when stateful tools run in
								parallel.
							</p>
							<p className="text-zinc-400">
								The demos below walk through the full loop anatomy, how tool
								schemas shape model behavior, parallel tool execution, and the
								four most common failure modes with their fixes.
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
				<LoopAnimationDemo />
				<ToolSchemaDemo />
				<ParallelToolCallsDemo />
				<ToolCallingFailuresDemo />
			</motion.div>
		</div>
	);
}
