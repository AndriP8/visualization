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
				topic={{ label: "JavaScript Internals", color: "emerald" }}
				title="Web Workers"
				subtitle="How JavaScript achieves true parallelism - running code on separate threads without blocking the UI."
				gradient={{ from: "emerald-400", to: "teal-400" }}
				explanation={{
					content: (
						<div className="text-sm text-text-tertiary space-y-3">
							<p>
								<strong className="text-text-secondary">The problem:</strong>{" "}
								JavaScript's main thread handles both UI rendering and code
								execution. Heavy tasks (image processing, large data parsing)
								freeze the UI.
							</p>
							<p>
								<strong className="text-accent-emerald-soft">
									Web Workers
								</strong>{" "}
								run JavaScript in separate threads - truly parallel execution
								that keeps the UI responsive. Workers can't access the DOM, but
								they can handle computationally expensive tasks in the
								background.
							</p>
							<div className="mt-4 p-3 bg-surface-primary/50 border border-border-primary rounded-lg">
								<p className="text-xs text-text-muted">
									<strong className="text-text-tertiary">
										Browser Requirements:
									</strong>{" "}
									Dedicated Workers (all modern browsers), Transferable Objects
									(Safari 15+, Chrome 90+, Firefox 88+), Shared Workers (Chrome,
									Edge, Firefox desktop - not Safari or iOS browsers)
								</p>
							</div>
						</div>
					),
				}}
			/>
			<DemoSection
				title="Main Thread Blocking"
				description="See the difference between running heavy computations on the main thread vs a worker thread. The FPS counter shows real-time UI responsiveness."
			>
				<BlockingDemo />
			</DemoSection>

			<DemoSection
				title="postMessage Communication"
				description="How the main thread and worker threads communicate through message passing. Structured cloning determines what data can cross thread boundaries."
			>
				<PostMessageDemo />
			</DemoSection>

			<DemoSection
				title="Transferable Objects (Zero-Copy)"
				description="Transfer ownership of ArrayBuffers without copying - critical for performance when working with large datasets."
			>
				<TransferableDemo />
			</DemoSection>

			<DemoSection
				title="Real-World Use Cases"
				description="Practical examples showing when to use Web Workers: image processing, data parsing, and cryptographic operations."
			>
				<UseCasesDemo />
			</DemoSection>

			<DemoSection
				title="Shared Workers (Cross-Tab Communication)"
				description="Unlike Dedicated Workers, Shared Workers can be accessed from multiple browser tabs/windows - useful for shared state and coordination."
			>
				<SharedWorkerDemo />
			</DemoSection>
		</div>
	);
}
