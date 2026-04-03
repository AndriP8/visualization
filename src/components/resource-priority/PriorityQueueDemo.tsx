import { motion } from "motion/react";
import { useState } from "react";
import {
	buildWaterfallTiming,
	calculatePriority,
	getPriorityBg,
	getPriorityBorder,
	getPriorityColor,
	type Protocol,
	type Resource,
	type SimplePriority,
} from "./types";

const INITIAL_RESOURCES: Resource[] = [
	{ id: "r1", type: "html", url: "/index.html", size: 15, attributes: {} },
	{ id: "r2", type: "css", url: "/styles.css", size: 25, attributes: {} },
	{
		id: "r3",
		type: "font",
		url: "/font.woff2",
		size: 50,
		attributes: {},
	},
	{
		id: "r4",
		type: "script",
		url: "/app.js",
		size: 120,
		attributes: {},
	},
	{
		id: "r5",
		type: "script",
		url: "/analytics.js",
		size: 30,
		attributes: { async: true },
	},
	{
		id: "r6",
		type: "image",
		url: "/hero.jpg",
		size: 200,
		attributes: { inViewport: true },
	},
	{
		id: "r7",
		type: "image",
		url: "/footer.jpg",
		size: 150,
		attributes: { inViewport: false },
	},
	{
		id: "r8",
		type: "script",
		url: "/defer.js",
		size: 40,
		attributes: { defer: true },
	},
	{
		id: "r9",
		type: "css",
		url: "/print.css",
		size: 10,
		attributes: { media: "print" },
	},
	{
		id: "r10",
		type: "font",
		url: "/next.woff2",
		size: 45,
		attributes: { prefetch: true },
	},
];

interface PriorityQueueDemoProps {
	protocol: Protocol;
}

export default function PriorityQueueDemo({
	protocol,
}: PriorityQueueDemoProps) {
	const [resources, setResources] = useState<Resource[]>(INITIAL_RESOURCES);
	const [showWaterfall, setShowWaterfall] = useState(false);

	const http2 = protocol === "http2";

	const toggleAttribute = (
		resourceId: string,
		attribute: keyof Resource["attributes"],
	) => {
		setResources((prev) =>
			prev.map((r) => {
				if (r.id !== resourceId) return r;

				// For mutually exclusive attributes (async, defer)
				if (attribute === "async" && r.attributes.defer) {
					return {
						...r,
						attributes: { ...r.attributes, async: true, defer: false },
					};
				}
				if (attribute === "defer" && r.attributes.async) {
					return {
						...r,
						attributes: { ...r.attributes, defer: true, async: false },
					};
				}

				// For mutually exclusive hints (preload, prefetch)
				if (attribute === "preload" && r.attributes.prefetch) {
					return {
						...r,
						attributes: { ...r.attributes, preload: true, prefetch: false },
					};
				}
				if (attribute === "prefetch" && r.attributes.preload) {
					return {
						...r,
						attributes: { ...r.attributes, prefetch: true, preload: false },
					};
				}

				return {
					...r,
					attributes: {
						...r.attributes,
						[attribute]: !r.attributes[attribute],
					},
				};
			}),
		);
	};

	// Group resources by priority
	const resourcesByPriority: Record<SimplePriority, Resource[]> = {
		High: [],
		Medium: [],
		Low: [],
		Lowest: [],
	};

	for (const resource of resources) {
		const priority = calculatePriority(resource, http2);
		resourcesByPriority[priority].push(resource);
	}

	const waterfallBars = showWaterfall
		? buildWaterfallTiming(resources, http2, {
				protocol,
				bandwidth: 10,
				latency: 50,
			})
		: [];

	const maxEndTime =
		waterfallBars.length > 0
			? Math.max(...waterfallBars.map((b) => b.timing.downloadEnd))
			: 1000;
	const SCALE = 0.5; // px per ms

	const getPriorityTextColor = (priority: SimplePriority): string => {
		switch (priority) {
			case "High":
				return "text-rose-500";
			case "Medium":
				return "text-amber-500";
			case "Low":
				return "text-cyan-500";
			case "Lowest":
				return "text-text-faint";
		}
	};

	return (
		<div className="space-y-6">
			{/* Explanation */}
			<div className="p-4 bg-surface-primary/50 border border-border-primary rounded-lg text-sm text-text-tertiary">
				<p className="mb-2">
					<span className="text-text-primary font-medium">How it works:</span>{" "}
					Toggle attributes on resources to see how browsers prioritize them.
					Resources automatically move to different priority buckets based on
					their type and hints.
				</p>
				<ul className="list-disc list-inside space-y-1 ml-2 text-xs">
					<li>
						<span className="text-accent-rose">High priority</span>: Downloaded
						first (HTML, CSS, parser-blocking scripts)
					</li>
					<li>
						<span className="text-accent-amber">Medium priority</span>:
						Downloaded after critical resources (fonts, XHR)
					</li>
					<li>
						<span className="text-accent-cyan">Low priority</span>: Downloaded
						when bandwidth available (async/defer scripts, off-screen images)
					</li>
					<li>
						<span className="text-text-muted">Lowest priority</span>: Prefetched
						resources for future navigation
					</li>
				</ul>
			</div>

			<div className="grid lg:grid-cols-2 gap-6">
				{/* Left: Resource Cards */}
				<div className="space-y-3">
					<h3 className="text-sm font-medium text-text-tertiary mb-3">
						Resources (toggle attributes)
					</h3>
					<div className="space-y-2">
						{resources.map((resource) => (
							<motion.div
								key={resource.id}
								layout
								className="p-3 bg-surface-primary rounded border border-border-primary space-y-2"
							>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<span className="text-xs font-mono text-accent-violet">
											{resource.type}
										</span>
										<span className="text-xs text-text-tertiary">
											{resource.url}
										</span>
									</div>
									<span className="text-xs text-text-muted">
										{resource.size}KB
									</span>
								</div>

								<div className="flex flex-wrap gap-2">
									{resource.type === "script" && (
										<>
											<button
												type="button"
												onClick={() => toggleAttribute(resource.id, "async")}
												className={`px-2 py-1 text-xs rounded ${
													resource.attributes.async
														? "bg-cyan-500/20 text-accent-cyan border border-cyan-500/50"
														: "bg-surface-secondary text-text-muted border border-border-secondary"
												}`}
											>
												async
											</button>
											<button
												type="button"
												onClick={() => toggleAttribute(resource.id, "defer")}
												className={`px-2 py-1 text-xs rounded ${
													resource.attributes.defer
														? "bg-cyan-500/20 text-accent-cyan border border-cyan-500/50"
														: "bg-surface-secondary text-text-muted border border-border-secondary"
												}`}
											>
												defer
											</button>
										</>
									)}
									<button
										type="button"
										onClick={() => toggleAttribute(resource.id, "preload")}
										className={`px-2 py-1 text-xs rounded ${
											resource.attributes.preload
												? "bg-rose-500/20 text-accent-rose border border-rose-500/50"
												: "bg-surface-secondary text-text-muted border border-border-secondary"
										}`}
									>
										preload
									</button>
									<button
										type="button"
										onClick={() => toggleAttribute(resource.id, "prefetch")}
										className={`px-2 py-1 text-xs rounded ${
											resource.attributes.prefetch
												? "bg-surface-tertiary/20 text-text-tertiary border border-border-tertiary/50"
												: "bg-surface-secondary text-text-muted border border-border-secondary"
										}`}
									>
										prefetch
									</button>
									{resource.type === "image" && (
										<button
											type="button"
											onClick={() => toggleAttribute(resource.id, "inViewport")}
											className={`px-2 py-1 text-xs rounded ${
												resource.attributes.inViewport
													? "bg-amber-500/20 text-accent-amber border border-amber-500/50"
													: "bg-surface-secondary text-text-muted border border-border-secondary"
											}`}
										>
											in viewport
										</button>
									)}
								</div>
							</motion.div>
						))}
					</div>
				</div>

				{/* Right: Priority Buckets */}
				<div className="space-y-3">
					<h3 className="text-sm font-medium text-text-tertiary mb-3">
						Priority Buckets
					</h3>
					<div className="space-y-3">
						{(["High", "Medium", "Low", "Lowest"] as SimplePriority[]).map(
							(priority) => (
								<div
									key={priority}
									className={`p-3 rounded border ${getPriorityBg(priority)} ${getPriorityBorder(priority)}`}
								>
									<div className="flex items-center justify-between mb-2">
										<span
											className={`text-sm font-medium text-${getPriorityColor(priority)}`}
										>
											{priority}
										</span>
										<span className="text-xs text-text-muted">
											{resourcesByPriority[priority].length} resources
										</span>
									</div>
									<div className="space-y-1">
										{resourcesByPriority[priority].map((resource) => (
											<motion.div
												key={resource.id}
												layoutId={resource.id}
												className="p-2 bg-surface-primary/50 rounded text-xs font-mono"
											>
												<div className="flex items-center justify-between">
													<span className="text-accent-violet">
														{resource.type}
													</span>
													<span className="text-text-tertiary">
														{resource.url}
													</span>
												</div>
											</motion.div>
										))}
									</div>
								</div>
							),
						)}
					</div>
				</div>
			</div>

			{/* Waterfall Toggle */}
			<div className="flex items-center gap-3">
				<button
					type="button"
					onClick={() => setShowWaterfall(!showWaterfall)}
					className="px-4 py-2 bg-violet-500 text-text-primary rounded-md text-sm font-medium hover:bg-violet-600 transition-colors"
				>
					{showWaterfall ? "Hide Waterfall" : "Show Waterfall"}
				</button>
			</div>

			{/* Waterfall Visualization */}
			{showWaterfall && (
				<motion.div
					initial={{ opacity: 0, height: 0 }}
					animate={{ opacity: 1, height: "auto" }}
					exit={{ opacity: 0, height: 0 }}
					className="p-4 bg-surface-primary rounded border border-border-primary overflow-x-auto"
				>
					<h3 className="text-sm font-medium text-text-tertiary mb-4">
						Network Waterfall ({protocol === "http2" ? "HTTP/2" : "HTTP/1.1"})
					</h3>
					<div className="space-y-1 min-w-max">
						{waterfallBars.map((bar) => (
							<div key={bar.resource.id} className="flex items-center gap-2">
								<span className="text-xs font-mono text-text-tertiary w-32 truncate">
									{bar.resource.url}
								</span>
								<div className="relative h-6 flex-1">
									<motion.div
										initial={{ scaleX: 0 }}
										animate={{ scaleX: 1 }}
										transition={{ duration: 0.3 }}
										className={`absolute h-full rounded border ${getPriorityBg(bar.timing.priority)} ${getPriorityBorder(bar.timing.priority)} flex items-center px-2`}
										style={{
											width: `${(bar.timing.downloadEnd - bar.timing.downloadStart) * SCALE}px`,
											left: `${bar.timing.downloadStart * SCALE}px`,
											transformOrigin: "left",
										}}
									>
										<span className="text-xs text-text-secondary">
											{bar.resource.size}KB
										</span>
									</motion.div>
								</div>
								<span
									className={`text-xs font-medium w-16 text-right ${getPriorityTextColor(bar.timing.priority)}`}
								>
									{bar.timing.priority}
								</span>
							</div>
						))}
					</div>
					<div className="mt-4 flex items-center gap-4 text-xs text-text-muted">
						<span>Total time: {Math.round(maxEndTime)}ms</span>
						{protocol === "http1" && <span>Max 6 concurrent connections</span>}
					</div>
				</motion.div>
			)}
		</div>
	);
}
