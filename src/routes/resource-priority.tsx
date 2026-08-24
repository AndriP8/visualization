import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { BlockingScriptsDemo } from "../components/resource-priority/BlockingScriptsDemo";
import { CriticalRequestDepthDemo } from "../components/resource-priority/CriticalRequestDepthDemo";
import { PreloadPrefetchDemo } from "../components/resource-priority/PreloadPrefetchDemo";
import { PriorityQueueDemo } from "../components/resource-priority/PriorityQueueDemo";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/resource-priority")({
	component: ResourcePriorityPage,
});

function ResourcePriorityPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-8">
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

			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.2, duration: 0.4 }}
				className="space-y-8"
			>
				<PriorityQueueDemo />
				<BlockingScriptsDemo />
				<PreloadPrefetchDemo />
				<CriticalRequestDepthDemo />
			</motion.div>
		</div>
	);
}
