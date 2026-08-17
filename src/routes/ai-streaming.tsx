import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { AbortCleanupDemo } from "../components/ai-streaming/AbortCleanupDemo";
import { PartialJSONDemo } from "../components/ai-streaming/PartialJSONDemo";
import { SSEWireFormatDemo } from "../components/ai-streaming/SSEWireFormatDemo";
import { TokenStreamRenderDemo } from "../components/ai-streaming/TokenStreamRenderDemo";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/ai-streaming")({
	component: StreamingPage,
});

function StreamingPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-8">
			<PageHeader
				topic={{ label: "AI Engineering", color: "violet" }}
				title="Streaming & SSE"
				subtitle="LLM responses arrive token-by-token over Server-Sent Events. Rendering them correctly means parsing a line-delimited wire format, buffering partial JSON, and cancelling fetches cleanly — none of which the underlying fetch API does for you."
				gradient={{ from: "violet-400", to: "indigo-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								<span className="text-violet-300 font-medium">
									Server-Sent Events (SSE)
								</span>{" "}
								are a one-way streaming format over a normal HTTP response. The
								server keeps the connection open and writes newline-delimited{" "}
								<span className="font-mono text-indigo-300">data:</span> frames
								as soon as each token is decoded. The client reads from{" "}
								<span className="font-mono">response.body</span> as a{" "}
								<span className="text-indigo-300 font-medium">
									ReadableStream
								</span>{" "}
								and renders incrementally — that's why the first word appears
								~33ms after generation starts instead of after the full response
								completes.
							</p>
							<p>
								Three failure modes catch every team once. (1) TCP chunks{" "}
								<em>don't</em> align with SSE frame boundaries, so you must
								split on newlines and{" "}
								<span className="text-violet-300 font-medium">
									keep the trailing partial line in a buffer
								</span>{" "}
								for the next read. (2) JSON deltas can themselves arrive split,
								so structured output requires accumulating before parsing. (3)
								Closing a React component does not cancel the underlying fetch —
								only{" "}
								<span className="text-rose-300 font-medium">
									AbortController
								</span>{" "}
								closes the socket and stops the server from billing further
								tokens.
							</p>
							<p className="text-zinc-400">
								The demos below show the raw SSE wire format, the perceptual
								impact of token throughput, what a leaked cancellation costs in
								wasted tokens, and how to handle JSON that arrives in pieces.
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
				<SSEWireFormatDemo />
				<TokenStreamRenderDemo />
				<AbortCleanupDemo />
				<PartialJSONDemo />
			</motion.div>
		</div>
	);
}
