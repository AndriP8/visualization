import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import BlockingScriptsDemo from "../components/resource-priority/BlockingScriptsDemo";
import CriticalRequestDepthDemo from "../components/resource-priority/CriticalRequestDepthDemo";
import PreloadPrefetchDemo from "../components/resource-priority/PreloadPrefetchDemo";
import PriorityQueueDemo from "../components/resource-priority/PriorityQueueDemo";
import type { Protocol } from "../components/resource-priority/types";
import { DemoSection } from "../components/shared/DemoSection";
import { PageHeader } from "../components/shared/PageHeader";

function ResourcePriorityPage() {
	const [protocol, setProtocol] = useState<Protocol>("http2");

	return (
		<div className="max-w-6xl mx-auto space-y-12">
			<PageHeader
				topic={{ label: "Browser", color: "orange" }}
				title="Resource Loading Priority"
				subtitle="Browsers assign internal priority levels to every resource request — scripts, stylesheets, fonts, images — and developer hints like preload, prefetch, async, and defer shift those priorities, directly affecting when the page becomes interactive."
				gradient={{ from: "orange-400", to: "amber-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								The browser fetches resources in a priority queue, not
								first-come-first-served. Render-blocking CSS and synchronous
								scripts get{" "}
								<span className="text-orange-300 font-medium">Highest</span>{" "}
								priority; images below the fold get Low. Without hints, the
								browser discovers late-loaded resources (fonts referenced in
								CSS, images in JS) only after parsing the document — each
								discovery adds a round-trip to the critical path.
							</p>
							<p>
								Developer hints override defaults:{" "}
								<span className="text-amber-300 font-medium">preload</span>{" "}
								elevates a resource the browser will need soon but hasn't
								discovered yet; <code>prefetch</code> fetches at idle-time for
								the next navigation; <code>async</code> and <code>defer</code>{" "}
								remove script render-blocking without changing execution timing.
								Misusing preload — for resources not on the critical path —
								wastes bandwidth and competes with more important fetches.
							</p>
							<p className="text-zinc-400">
								The demos below cover the priority queue simulator, blocking vs
								non-blocking scripts, preload and prefetch strategy, and
								critical request depth reduction.
							</p>
						</div>
					),
				}}
			/>

			<div className="flex items-center gap-3 p-4 bg-zinc-900 rounded-lg border border-zinc-800">
				<span className="text-sm font-medium text-zinc-400">Protocol:</span>
				<button
					type="button"
					onClick={() => setProtocol("http1")}
					className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
						protocol === "http1"
							? "bg-violet-500 text-white"
							: "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
					}`}
				>
					HTTP/1.1 (6 connections)
				</button>
				<button
					type="button"
					onClick={() => setProtocol("http2")}
					className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
						protocol === "http2"
							? "bg-violet-500 text-white"
							: "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
					}`}
				>
					HTTP/2 (multiplexing)
				</button>
			</div>

			<DemoSection
				title="Demo 1: Priority Queue Simulator"
				description="Browsers assign priority levels to resources based on type and attributes. Toggle attributes to see how resources move between priority buckets."
			>
				<PriorityQueueDemo protocol={protocol} />
			</DemoSection>

			<DemoSection
				title="Demo 2: Blocking vs Non-Blocking Scripts"
				description="Synchronous scripts block HTML parsing, while async and defer scripts allow parsing to continue. See the impact on page load performance."
			>
				<BlockingScriptsDemo protocol={protocol} />
			</DemoSection>

			<DemoSection
				title="Demo 3: Preload & Prefetch Strategy"
				description="Resource hints like preload and prefetch let developers optimize loading. See how they affect metrics like LCP and when to use them."
			>
				<PreloadPrefetchDemo protocol={protocol} />
			</DemoSection>

			<DemoSection
				title="Demo 4: Critical Request Depth"
				description="Dependency chains (e.g., HTML → CSS → @import → font) increase request depth and delay rendering. Learn how to flatten the waterfall."
			>
				<CriticalRequestDepthDemo protocol={protocol} />
			</DemoSection>
		</div>
	);
}

export const Route = createFileRoute("/resource-priority")({
	component: ResourcePriorityPage,
});
