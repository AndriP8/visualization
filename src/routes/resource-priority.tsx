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
				subtitle="How browsers prioritize resources and how developer hints (preload, prefetch, async, defer) affect the loading waterfall"
				gradient={{ from: "orange-400", via: "amber-400", to: "yellow-400" }}
			/>

			<div className="flex items-center gap-3 p-4 bg-surface-primary rounded-lg border border-border-primary">
				<span className="text-sm font-medium text-text-tertiary">
					Protocol:
				</span>
				<button
					type="button"
					onClick={() => setProtocol("http1")}
					className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
						protocol === "http1"
							? "bg-violet-500 text-text-primary"
							: "bg-surface-secondary text-text-tertiary hover:bg-surface-tertiary"
					}`}
				>
					HTTP/1.1 (6 connections)
				</button>
				<button
					type="button"
					onClick={() => setProtocol("http2")}
					className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
						protocol === "http2"
							? "bg-violet-500 text-text-primary"
							: "bg-surface-secondary text-text-tertiary hover:bg-surface-tertiary"
					}`}
				>
					HTTP/2 (multiplexing)
				</button>
			</div>

			<DemoSection
				title="Priority Queue Simulator"
				description="Browsers assign priority levels to resources based on type and attributes. Toggle attributes to see how resources move between priority buckets."
			>
				<PriorityQueueDemo protocol={protocol} />
			</DemoSection>

			<DemoSection
				title="Blocking vs Non-Blocking Scripts"
				description="Synchronous scripts block HTML parsing, while async and defer scripts allow parsing to continue. See the impact on page load performance."
			>
				<BlockingScriptsDemo protocol={protocol} />
			</DemoSection>

			<DemoSection
				title="Preload & Prefetch Strategy"
				description="Resource hints like preload and prefetch let developers optimize loading. See how they affect metrics like LCP and when to use them."
			>
				<PreloadPrefetchDemo protocol={protocol} />
			</DemoSection>

			<DemoSection
				title="Critical Request Depth"
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
