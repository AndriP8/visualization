export type ResourceType = "html" | "css" | "font" | "script" | "image" | "xhr";

export interface ResourceAttributes {
	async?: boolean;
	defer?: boolean;
	preload?: boolean;
	prefetch?: boolean;
	dnsPrefetch?: boolean;
	fetchpriority?: "high" | "low" | "auto";
	inViewport?: boolean;
	media?: string;
}

export interface Resource {
	id: string;
	type: ResourceType;
	url: string;
	size: number; // KB
	attributes: ResourceAttributes;
}

export type SimplePriority = "High" | "Medium" | "Low" | "Lowest";

export interface NetworkTiming {
	queueStart: number;
	downloadStart: number;
	downloadEnd: number;
	priority: SimplePriority;
	lane: number; // HTTP/1.1 connection lane (0-5)
}

export interface WaterfallBar {
	resource: Resource;
	timing: NetworkTiming;
	color: string;
}

export type Protocol = "http1" | "http2";

export interface NetworkConfig {
	protocol: Protocol;
	bandwidth: number; // Mbps
	latency: number; // ms
}

export function calculatePriority(
	resource: Resource,
	_http2: boolean,
): SimplePriority {
	const { type, attributes } = resource;

	// fetchpriority overrides
	if (attributes.fetchpriority === "high") return "High";
	if (attributes.fetchpriority === "low") return "Low";

	// Preload hints
	if (attributes.preload) {
		if (type === "css" || type === "font") return "High";
		if (type === "script") return "Medium";
	}

	// Prefetch = lowest
	if (attributes.prefetch) return "Lowest";

	// Default browser rules
	switch (type) {
		case "html":
			return "High";
		case "css":
			return "High";
		case "font":
			return attributes.preload ? "High" : "Medium";
		case "script":
			if (attributes.async || attributes.defer) return "Low";
			return "High"; // Parser-blocking
		case "image":
			return attributes.inViewport ? "Medium" : "Low";
		case "xhr":
			return "Medium";
	}
}

export function getPriorityColor(priority: SimplePriority): string {
	switch (priority) {
		case "High":
			return "rose-500";
		case "Medium":
			return "amber-500";
		case "Low":
			return "cyan-500";
		case "Lowest":
			return "zinc-600";
	}
}

export function getPriorityBg(priority: SimplePriority): string {
	switch (priority) {
		case "High":
			return "bg-rose-500/15";
		case "Medium":
			return "bg-amber-500/15";
		case "Low":
			return "bg-cyan-500/15";
		case "Lowest":
			return "bg-zinc-700/30";
	}
}

export function getPriorityBorder(priority: SimplePriority): string {
	switch (priority) {
		case "High":
			return "border-rose-500/50";
		case "Medium":
			return "border-amber-500/50";
		case "Low":
			return "border-cyan-500/50";
		case "Lowest":
			return "border-zinc-600/50";
	}
}

const PRIORITY_ORDER: Record<SimplePriority, number> = {
	High: 0,
	Medium: 1,
	Low: 2,
	Lowest: 3,
};

export function buildWaterfallTiming(
	resources: Resource[],
	http2: boolean,
	config: NetworkConfig,
): WaterfallBar[] {
	// Calculate priorities for all resources
	const resourcesWithPriority = resources.map((resource) => ({
		resource,
		priority: calculatePriority(resource, http2),
	}));

	// Sort by priority, then FIFO within priority
	resourcesWithPriority.sort((a, b) => {
		const priorityDiff =
			PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
		if (priorityDiff !== 0) return priorityDiff;
		// FIFO: maintain original order
		return resources.indexOf(a.resource) - resources.indexOf(b.resource);
	});

	const bars: WaterfallBar[] = [];
	const currentTime = 0;

	if (http2) {
		// HTTP/2: All resources can download in parallel but priority affects start time
		// Higher priority resources start slightly earlier
		resourcesWithPriority.forEach(({ resource, priority }, index) => {
			const priorityDelay = PRIORITY_ORDER[priority] * 50; // 50ms delay per priority level
			const downloadStart = currentTime + config.latency + priorityDelay;
			const downloadDuration = (resource.size * 8) / config.bandwidth; // Convert KB to Kb, divide by Mbps
			const downloadEnd = downloadStart + downloadDuration;

			bars.push({
				resource,
				timing: {
					queueStart: currentTime,
					downloadStart,
					downloadEnd,
					priority,
					lane: index, // All resources get their own lane in HTTP/2
				},
				color: getPriorityColor(priority),
			});
		});
	} else {
		// HTTP/1.1: Max 6 concurrent connections
		const MAX_CONNECTIONS = 6;
		const laneBusyUntil: number[] = Array(MAX_CONNECTIONS).fill(0);

		resourcesWithPriority.forEach(({ resource, priority }) => {
			// Find the earliest available lane
			const earliestLane = laneBusyUntil.indexOf(Math.min(...laneBusyUntil));
			const queueStart = currentTime;
			const downloadStart =
				Math.max(laneBusyUntil[earliestLane], currentTime) + config.latency;
			const downloadDuration = (resource.size * 8) / config.bandwidth;
			const downloadEnd = downloadStart + downloadDuration;

			// Update lane availability
			laneBusyUntil[earliestLane] = downloadEnd;

			bars.push({
				resource,
				timing: {
					queueStart,
					downloadStart,
					downloadEnd,
					priority,
					lane: earliestLane,
				},
				color: getPriorityColor(priority),
			});
		});
	}

	return bars;
}
