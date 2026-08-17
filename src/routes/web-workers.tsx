import { createFileRoute } from "@tanstack/react-router";
import { DemoSection } from "../components/shared/DemoSection";
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
			<DemoSection
				title="Demo 1: Main Thread Blocking"
				description="See the difference between running heavy computations on the main thread vs a worker thread. The FPS counter shows real-time UI responsiveness."
			>
				<BlockingDemo />
			</DemoSection>

			<DemoSection
				title="Demo 2: postMessage Communication"
				description="How the main thread and worker threads communicate through message passing. Structured cloning determines what data can cross thread boundaries."
			>
				<PostMessageDemo />
			</DemoSection>

			<DemoSection
				title="Demo 3: Transferable Objects (Zero-Copy)"
				description="Transfer ownership of ArrayBuffers without copying - critical for performance when working with large datasets."
			>
				<TransferableDemo />
			</DemoSection>

			<DemoSection
				title="Demo 4: Real-World Use Cases"
				description="Practical examples showing when to use Web Workers: image processing, data parsing, and cryptographic operations."
			>
				<UseCasesDemo />
			</DemoSection>

			<DemoSection
				title="Demo 5: Shared Workers (Cross-Tab Communication)"
				description="Unlike Dedicated Workers, Shared Workers can be accessed from multiple browser tabs/windows - useful for shared state and coordination."
			>
				<SharedWorkerDemo />
			</DemoSection>
		</div>
	);
}
