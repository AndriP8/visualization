import { motion } from "motion/react";
import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";

type ResourceType =
	| "html"
	| "css"
	| "js-sync"
	| "js-defer"
	| "js-async"
	| "css-preload";

type BlockingType = "render-blocking" | "parser-blocking" | "none";

interface TimelineResource {
	id: ResourceType;
	label: string;
	shortLabel: string;
	color: string;
	blockingType: BlockingType;
	description: string;
}

const ALL_RESOURCES: TimelineResource[] = [
	{
		id: "html",
		label: "HTML Parsing",
		shortLabel: "HTML",
		color: "#60a5fa",
		blockingType: "none",
		description:
			"The browser parses HTML in a streaming fashion — it can start processing before receiving the full document.",
	},
	{
		id: "css",
		label: '<link rel="stylesheet">',
		shortLabel: "CSS",
		color: "#f59e0b",
		blockingType: "render-blocking",
		description:
			"CSS is render-blocking: the browser pauses rendering until the stylesheet is downloaded and processed. However, the parser can continue looking for other resources while waiting.",
	},
	{
		id: "js-sync",
		label: "<script src>",
		shortLabel: "JS (sync)",
		color: "#ef4444",
		blockingType: "parser-blocking",
		description:
			"Synchronous scripts are parser-blocking: the HTML parser is completely stopped until the script is downloaded, parsed, and executed. This is worse than render-blocking — nothing else can proceed. Parser-blocking resources are also implicitly render-blocking.",
	},
	{
		id: "js-defer",
		label: "<script defer>",
		shortLabel: "JS (defer)",
		color: "#a78bfa",
		blockingType: "none",
		description:
			"Deferred scripts download in parallel with HTML parsing and execute in order after the DOM is fully parsed. They don't block parsing or rendering.",
	},
	{
		id: "js-async",
		label: "<script async>",
		shortLabel: "JS (async)",
		color: "#34d399",
		blockingType: "none",
		description:
			"Async scripts download in parallel and execute as soon as ready (no guaranteed order). They briefly pause the parser during execution but don't block initial rendering.",
	},
	{
		id: "css-preload",
		label: '<link rel="preload">',
		shortLabel: "Preload",
		color: "#22d3ee",
		blockingType: "none",
		description:
			"Preload hints tell the browser to fetch a resource early without blocking rendering or parsing. Useful for fonts, images, or critical resources discovered late in the HTML.",
	},
];

interface TimelineBar {
	resource: TimelineResource;
	downloadStart: number;
	downloadEnd: number;
	execStart?: number;
	execEnd?: number;
	blocksParser: boolean;
	blocksRender: boolean;
}

const RESOURCES_BY_ID = Object.fromEntries(
	ALL_RESOURCES.map((r) => [r.id, r]),
) as Record<ResourceType, TimelineResource>;

function buildTimeline(enabledIds: Set<ResourceType>): {
	bars: TimelineBar[];
	firstPaint: number;
} {
	const bars: TimelineBar[] = [];
	let parserPosition = 0;
	let firstPaint = 0;

	const htmlEnd = 100;

	// CSS — render-blocking (pauses rendering, parser continues)
	if (enabledIds.has("css")) {
		bars.push({
			resource: RESOURCES_BY_ID.css,
			downloadStart: 5,
			downloadEnd: 45,
			blocksParser: false,
			blocksRender: true,
		});
		firstPaint = Math.max(firstPaint, 45);
	}

	// Preload — non-blocking early fetch
	if (enabledIds.has("css-preload")) {
		bars.push({
			resource: RESOURCES_BY_ID["css-preload"],
			downloadStart: 2,
			downloadEnd: 30,
			blocksParser: false,
			blocksRender: false,
		});
	}

	// Sync JS — parser-blocking (stops the parser entirely)
	if (enabledIds.has("js-sync")) {
		const jsStart = 25;
		const jsDownloadEnd = 55;
		const jsExecEnd = 65;
		bars.push({
			resource: RESOURCES_BY_ID["js-sync"],
			downloadStart: jsStart,
			downloadEnd: jsDownloadEnd,
			execStart: jsDownloadEnd,
			execEnd: jsExecEnd,
			blocksParser: true,
			blocksRender: true,
		});
		parserPosition = jsExecEnd;
		firstPaint = Math.max(firstPaint, jsExecEnd);
	}

	// Defer JS — downloads in parallel, executes after parse
	if (enabledIds.has("js-defer")) {
		bars.push({
			resource: RESOURCES_BY_ID["js-defer"],
			downloadStart: 10,
			downloadEnd: 50,
			execStart: htmlEnd,
			execEnd: htmlEnd + 10,
			blocksParser: false,
			blocksRender: false,
		});
	}

	// Async JS — downloads in parallel, executes ASAP
	if (enabledIds.has("js-async")) {
		const asyncDownloadEnd = 40;
		bars.push({
			resource: RESOURCES_BY_ID["js-async"],
			downloadStart: 10,
			downloadEnd: asyncDownloadEnd,
			execStart: asyncDownloadEnd,
			execEnd: asyncDownloadEnd + 8,
			blocksParser: false,
			blocksRender: false,
		});
	}

	// HTML parsing bar (shows parser-blocking gap if sync JS)
	const htmlResource = RESOURCES_BY_ID.html;
	if (enabledIds.has("js-sync")) {
		bars.unshift({
			resource: htmlResource,
			downloadStart: 0,
			downloadEnd: 25,
			blocksParser: false,
			blocksRender: false,
		});
		bars.push({
			resource: {
				...htmlResource,
				label: "HTML Parsing (resumed)",
				shortLabel: "HTML",
			},
			downloadStart: parserPosition,
			downloadEnd: Math.max(htmlEnd, parserPosition + 35),
			blocksParser: false,
			blocksRender: false,
		});
		firstPaint = Math.max(firstPaint, Math.max(htmlEnd, parserPosition + 35));
	} else {
		bars.unshift({
			resource: htmlResource,
			downloadStart: 0,
			downloadEnd: htmlEnd,
			blocksParser: false,
			blocksRender: false,
		});
		firstPaint = Math.max(firstPaint, htmlEnd);
	}

	return { bars, firstPaint };
}

const BLOCKING_BADGE: Record<
	BlockingType,
	{ label: string; className: string } | null
> = {
	"render-blocking": {
		label: "RENDER-BLOCKING",
		className:
			"text-[9px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20",
	},
	"parser-blocking": {
		label: "PARSER-BLOCKING",
		className:
			"text-[9px] px-1 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20",
	},
	none: null,
};

export function RenderBlockingDemo() {
	const [enabledResources, setEnabledResources] = useState<Set<ResourceType>>(
		new Set<ResourceType>(["css", "js-sync"]),
	);

	const toggleResource = (id: ResourceType) => {
		if (id === "html") return;
		setEnabledResources((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	};

	const { bars, firstPaint } = buildTimeline(enabledResources);
	const totalWidth = firstPaint + 20;

	return (
		<DemoSection
			title="Demo 4: Render-Blocking vs Parser-Blocking Resources"
			description="Not all blocking is equal. Render-blocking pauses painting but the parser continues. Parser-blocking stops everything."
		>
			{/* Key distinction callout */}
			<div className="mb-5 p-3 rounded-lg bg-zinc-800/40 border border-zinc-800 space-y-2">
				<div className="flex items-start gap-3">
					<div className="flex-1 space-y-1.5">
						<div className="flex items-center gap-2">
							<span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
							<span className="text-xs font-semibold text-amber-400">
								Render-blocking
							</span>
							<span className="text-xs text-zinc-500">(CSS)</span>
						</div>
						<p className="text-xs text-zinc-400 pl-[18px]">
							Browser pauses <em>rendering</em> until the resource is processed,
							but the{" "}
							<strong className="text-zinc-300">parser continues</strong>{" "}
							scanning for other resources to download.
						</p>
					</div>
					<div className="flex-1 space-y-1.5">
						<div className="flex items-center gap-2">
							<span className="w-2.5 h-2.5 rounded-sm bg-red-400" />
							<span className="text-xs font-semibold text-red-400">
								Parser-blocking
							</span>
							<span className="text-xs text-zinc-500">(sync JS)</span>
						</div>
						<p className="text-xs text-zinc-400 pl-[18px]">
							Browser stops the{" "}
							<strong className="text-zinc-300">HTML parser entirely</strong>.
							Nothing else proceeds until the script is downloaded and executed.
							This is <strong className="text-red-400">much worse</strong> — it
							also implicitly blocks rendering.
						</p>
					</div>
				</div>
			</div>

			{/* Resource toggles */}
			<div className="flex flex-wrap gap-2 mb-5">
				{ALL_RESOURCES.filter((r) => r.id !== "html").map((resource) => {
					const isOn = enabledResources.has(resource.id);
					const badge = BLOCKING_BADGE[resource.blockingType];
					return (
						<button
							key={resource.id}
							type="button"
							onClick={() => toggleResource(resource.id)}
							className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all border flex items-center gap-2 ${
								isOn
									? "border-white/20 bg-zinc-800 text-white"
									: "border-zinc-800 bg-zinc-900/50 text-zinc-600"
							}`}
						>
							<span
								className="w-2.5 h-2.5 rounded-sm"
								style={{
									backgroundColor: isOn ? resource.color : "#3f3f46",
								}}
							/>
							{resource.label}
							{badge && isOn && (
								<span className={badge.className}>{badge.label}</span>
							)}
						</button>
					);
				})}
			</div>

			{/* Waterfall timeline */}
			<div className="rounded-lg bg-zinc-800/30 border border-zinc-800 p-4 overflow-x-auto">
				<div className="min-w-[500px]">
					{/* Time axis */}
					<div className="flex items-center mb-3 ml-[100px]">
						<div className="flex-1 relative h-5">
							<div className="absolute inset-0 flex justify-between text-[10px] text-zinc-600 font-mono">
								<span>0ms</span>
								<span>{Math.round(totalWidth * 2)}ms</span>
							</div>
							<div className="absolute bottom-0 left-0 right-0 h-px bg-zinc-700" />
						</div>
					</div>

					{/* Bars */}
					<div className="space-y-2">
						{bars.map((bar, i) => (
							<div
								key={`${bar.resource.id}-${bar.downloadStart}`}
								className="flex items-center gap-2 h-7"
							>
								{/* Label */}
								<div className="w-[100px] text-right text-xs text-zinc-400 font-mono truncate shrink-0">
									{bar.resource.shortLabel}
								</div>

								{/* Bar area */}
								<div className="flex-1 relative h-full">
									{/* Download bar */}
									<motion.div
										initial={{ width: 0 }}
										animate={{
											left: `${(bar.downloadStart / totalWidth) * 100}%`,
											width: `${((bar.downloadEnd - bar.downloadStart) / totalWidth) * 100}%`,
										}}
										transition={{
											duration: 0.5,
											delay: i * 0.08,
										}}
										className="absolute top-0 h-full rounded"
										style={{
											backgroundColor: `${bar.resource.color}33`,
											borderLeft: `3px solid ${bar.resource.color}`,
										}}
									>
										{bar.blocksParser && (
											<div className="absolute inset-0 flex items-center justify-center">
												<span className="text-[9px] text-red-400 font-mono">
													⛔ parser stopped
												</span>
											</div>
										)}
										{!bar.blocksParser && bar.blocksRender && (
											<div className="absolute inset-0 flex items-center justify-center">
												<span className="text-[9px] text-amber-400 font-mono">
													⏸ render paused
												</span>
											</div>
										)}
									</motion.div>

									{/* Execute bar */}
									{bar.execStart !== undefined && bar.execEnd !== undefined && (
										<motion.div
											initial={{ width: 0 }}
											animate={{
												left: `${(bar.execStart / totalWidth) * 100}%`,
												width: `${((bar.execEnd - bar.execStart) / totalWidth) * 100}%`,
											}}
											transition={{
												duration: 0.4,
												delay: i * 0.08 + 0.3,
											}}
											className="absolute top-0 h-full rounded"
											style={{
												backgroundColor: `${bar.resource.color}55`,
												borderLeft: `2px dashed ${bar.resource.color}`,
											}}
										>
											<div className="absolute inset-0 flex items-center justify-center">
												<span
													className="text-[9px] font-mono"
													style={{
														color: bar.resource.color,
													}}
												>
													exec
												</span>
											</div>
										</motion.div>
									)}
								</div>
							</div>
						))}

						{/* First Paint marker */}
						<div className="flex items-center gap-2 h-7">
							<div className="w-[100px] text-right text-xs text-emerald-400 font-semibold shrink-0">
								First Paint
							</div>
							<div className="flex-1 relative h-full">
								<motion.div
									initial={{ opacity: 0 }}
									animate={{
										opacity: 1,
										left: `${(firstPaint / totalWidth) * 100}%`,
									}}
									transition={{ duration: 0.5, delay: 0.6 }}
									className="absolute top-0 h-full w-0.5 bg-emerald-400"
								>
									<div className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-emerald-400" />
									<motion.span
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										transition={{ delay: 0.8 }}
										className="absolute top-0 left-3 text-[10px] text-emerald-400 font-mono whitespace-nowrap"
									>
										~{Math.round(firstPaint * 2)}ms
									</motion.span>
								</motion.div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Resource descriptions */}
			<div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
				{ALL_RESOURCES.filter(
					(r) => r.id !== "html" && enabledResources.has(r.id),
				).map((resource) => {
					const badge = BLOCKING_BADGE[resource.blockingType];
					return (
						<motion.div
							key={resource.id}
							initial={{ opacity: 0, y: 5 }}
							animate={{ opacity: 1, y: 0 }}
							className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-800"
						>
							<div className="flex items-center gap-2 mb-1">
								<span
									className="w-2 h-2 rounded-full"
									style={{
										backgroundColor: resource.color,
									}}
								/>
								<span
									className="text-xs font-mono font-semibold"
									style={{ color: resource.color }}
								>
									{resource.label}
								</span>
								{badge && (
									<span className={badge.className}>{badge.label}</span>
								)}
							</div>
							<p className="text-xs text-zinc-500">{resource.description}</p>
						</motion.div>
					);
				})}
			</div>
		</DemoSection>
	);
}
