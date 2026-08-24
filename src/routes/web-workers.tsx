import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { PageHeader } from "../components/shared/PageHeader";
import { BlockingDemo } from "../components/web-workers/BlockingDemo";
import { PostMessageDemo } from "../components/web-workers/PostMessageDemo";
import { SharedWorkerDemo } from "../components/web-workers/SharedWorkerDemo";
import { TransferableDemo } from "../components/web-workers/TransferableDemo";
import { UseCasesDemo } from "../components/web-workers/UseCasesDemo";

export const Route = createFileRoute("/web-workers")({
	component: WebWorkersPage,
});

function WebWorkersPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-12 pb-20">
			<PageHeader
				topic={{ label: "JavaScript Internals", color: "amber" }}
				title="Web Workers"
				subtitle="How JavaScript achieves true parallelism - running code on separate threads without blocking the UI."
				gradient={{ from: "amber-400", to: "yellow-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								JavaScript's main thread is responsible for both UI rendering
								and code execution. Heavy CPU-bound tasks — image processing,
								large data parsing, cryptographic operations — block the event
								loop and freeze the UI. This is not a scheduling problem the
								browser can solve; the single thread is genuinely occupied and
								cannot process input events or paint frames until the work
								finishes.
							</p>
							<p>
								<span className="text-amber-300 font-medium">Web Workers</span>{" "}
								run JavaScript on a separate OS thread — true parallelism, not
								cooperative multitasking. Workers cannot access the DOM, but
								they communicate with the main thread via{" "}
								<span className="text-yellow-300 font-medium">
									structured-clone message passing
								</span>
								. For large binary data, Transferable Objects transfer ownership
								of ArrayBuffers without copying, making zero-copy off-thread
								processing practical.
							</p>
							<p className="text-zinc-400">
								The demos below cover main thread blocking, postMessage
								communication, transferable objects, real-world use cases, and
								shared workers for cross-tab coordination.
							</p>
						</div>
					),
				}}
			/>

			{/* Demos */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.2, duration: 0.4 }}
				className="space-y-12"
			>
				<BlockingDemo />
				<PostMessageDemo />
				<TransferableDemo />
				<UseCasesDemo />
				<SharedWorkerDemo />
			</motion.div>
		</div>
	);
}
