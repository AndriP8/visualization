import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { Strategy } from "./constants";

interface NodeConfig {
	/** Which column this work node lives in */
	column: "client" | "edge" | "server";
	label: string;
	description: string;
}

interface ArrowConfig {
	/** Direction label for the arrow */
	label: string;
	from: "client" | "edge" | "server";
	to: "client" | "edge" | "server";
	/** What payload travels along this arrow */
	payload: string;
	color: string;
}

interface WorkConfig {
	strategy: Strategy;
	label: string;
	color: string;
	workNodes: NodeConfig[];
	arrows: ArrowConfig[];
	summary: string;
}

const WORK_CONFIGS: WorkConfig[] = [
	{
		strategy: "CSR",
		label: "CSR",
		color: "#f87171",
		workNodes: [
			{
				column: "server",
				label: "Static File Server",
				description: "Serves empty HTML + JS bundle. No dynamic work.",
			},
			{
				column: "client",
				label: "JS Rendering",
				description: "All HTML generation happens here in the browser.",
			},
		],
		arrows: [
			{
				label: "GET /",
				from: "client",
				to: "server",
				payload: "Request",
				color: "#f87171",
			},
			{
				label: "Empty HTML + JS",
				from: "server",
				to: "client",
				payload: "<div id='root'></div> + bundle.js",
				color: "#f87171",
			},
		],
		summary:
			"HTML is generated entirely on the client. The server only delivers static files. The origin server is never under rendering load, but users see a blank screen until JS executes.",
	},
	{
		strategy: "SSR",
		label: "SSR",
		color: "#fbbf24",
		workNodes: [
			{
				column: "server",
				label: "HTML Generation",
				description:
					"Server fetches data, renders React to HTML string, sends full markup.",
			},
			{
				column: "client",
				label: "Hydration",
				description: "React attaches event listeners to server-rendered DOM.",
			},
		],
		arrows: [
			{
				label: "GET /",
				from: "client",
				to: "server",
				payload: "Request",
				color: "#fbbf24",
			},
			{
				label: "Full HTML",
				from: "server",
				to: "client",
				payload: "Complete HTML + inline data",
				color: "#fbbf24",
			},
		],
		summary:
			"HTML is generated on the origin server per-request. Every page view causes server load. The upside: full HTML arrives at the browser so FCP is fast, and the server can personalize content for each user.",
	},
	{
		strategy: "SSG",
		label: "SSG",
		color: "#4ade80",
		workNodes: [
			{
				column: "server",
				label: "Build-time Generation",
				description:
					"HTML built once at build time. After that, no server rendering work.",
			},
			{
				column: "edge",
				label: "CDN Cache",
				description:
					"Stores and serves pre-built HTML globally from edge nodes.",
			},
			{
				column: "client",
				label: "Hydration",
				description: "React hydrates the static HTML.",
			},
		],
		arrows: [
			{
				label: "GET /",
				from: "client",
				to: "edge",
				payload: "Request",
				color: "#4ade80",
			},
			{
				label: "Cached HTML",
				from: "edge",
				to: "client",
				payload: "Pre-built full HTML (from CDN cache)",
				color: "#4ade80",
			},
		],
		summary:
			"HTML generated once at build time. The CDN serves it globally — no origin server involved per-request. Excellent performance and virtually zero hosting cost at scale, but content can only be as fresh as the last build.",
	},
	{
		strategy: "ISR",
		label: "ISR",
		color: "#22d3ee",
		workNodes: [
			{
				column: "edge",
				label: "Stale-While-Revalidate",
				description:
					"Serves cached HTML instantly. After TTL expires, triggers background rebuild.",
			},
			{
				column: "server",
				label: "Background Rebuild",
				description:
					"Origin regenerates the page in the background and updates the CDN cache.",
			},
			{
				column: "client",
				label: "Hydration",
				description: "React hydrates whatever HTML the CDN served.",
			},
		],
		arrows: [
			{
				label: "GET /",
				from: "client",
				to: "edge",
				payload: "Request",
				color: "#22d3ee",
			},
			{
				label: "Stale HTML (instant)",
				from: "edge",
				to: "client",
				payload: "Cached HTML (may be outdated)",
				color: "#22d3ee",
			},
			{
				label: "BG Revalidate",
				from: "edge",
				to: "server",
				payload: "Trigger rebuild (async, after TTL)",
				color: "#22d3ee",
			},
		],
		summary:
			"ISR is SSG with automatic background page regeneration. Users always get a fast response from the CDN. When content is stale (TTL expired), the current visitor still gets the old page but triggers a background rebuild — the next visitor gets the fresh version.",
	},
	{
		strategy: "Streaming SSR",
		label: "Streaming SSR",
		color: "#a78bfa",
		workNodes: [
			{
				column: "server",
				label: "Start Streaming",
				description:
					"Server begins streaming HTML shell immediately without waiting for all data.",
			},
			{
				column: "server",
				label: "Progressive Rendering",
				description:
					"Server continues rendering and streaming HTML chunks as data becomes available.",
			},
			{
				column: "client",
				label: "Progressive Hydration",
				description:
					"Browser parses and renders HTML incrementally as chunks arrive, then React hydrates progressively.",
			},
		],
		arrows: [
			{
				label: "GET /",
				from: "client",
				to: "server",
				payload: "Request",
				color: "#a78bfa",
			},
			{
				label: "HTML Shell",
				from: "server",
				to: "client",
				payload: "Initial HTML (streamed immediately)",
				color: "#a78bfa",
			},
			{
				label: "Content Chunks",
				from: "server",
				to: "client",
				payload: "Progressive HTML chunks (streaming)",
				color: "#a78bfa",
			},
		],
		summary:
			"Streaming SSR sends HTML progressively as it's generated. The server doesn't wait for all data before responding — it streams the shell first, then chunks of content as they're ready. The browser can parse and paint incrementally, resulting in faster FCP and perceived performance.",
	},
];

const COLUMNS = ["client", "edge", "server"] as const;
type Column = (typeof COLUMNS)[number];

const COLUMN_LABELS: Record<Column, string> = {
	client: "Client Browser",
	edge: "Edge / CDN",
	server: "Origin Server",
};

const COLUMN_ICONS: Record<Column, string> = {
	client: "💻",
	edge: "⚡",
	server: "🖥️",
};

export function WorkLocationDemo() {
	const [selected, setSelected] = useState<Strategy>("CSR");
	const config =
		WORK_CONFIGS.find((c) => c.strategy === selected) ?? WORK_CONFIGS[0];

	return (
		<div className="space-y-6">
			{/* Strategy tabs */}
			<div className="flex flex-wrap gap-2">
				{WORK_CONFIGS.map((c) => (
					<button
						key={c.strategy}
						type="button"
						onClick={() => setSelected(c.strategy)}
						className={clsx(
							"px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
							selected === c.strategy
								? "text-text-primary border-transparent"
								: "text-text-tertiary border-border-secondary hover:border-text-muted",
						)}
						style={
							selected === c.strategy ? { backgroundColor: c.color } : undefined
						}
					>
						{c.label}
					</button>
				))}
			</div>

			{/* 3-column diagram */}
			<AnimatePresence mode="wait">
				<motion.div
					key={selected}
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -8 }}
					transition={{ duration: 0.25 }}
					className="grid grid-cols-3 gap-3"
				>
					{COLUMNS.map((col) => {
						const isActive = config.workNodes.some((n) => n.column === col);
						const node = config.workNodes.find((n) => n.column === col);
						return (
							<div
								key={col}
								className={clsx(
									"rounded-xl border p-4 transition-all duration-300 min-h-36",
									isActive
										? "border-border-tertiary bg-surface-secondary/60"
										: "border-border-primary bg-surface-primary/20 opacity-40",
								)}
								style={
									isActive
										? {
												boxShadow: `0 0 20px ${config.color}25`,
												borderColor: `${config.color}50`,
											}
										: undefined
								}
							>
								<div className="text-xl mb-2">{COLUMN_ICONS[col]}</div>
								<div className="text-xs font-bold text-text-secondary mb-1">
									{COLUMN_LABELS[col]}
								</div>
								{node && (
									<>
										<div
											className="text-xs font-semibold mt-2 mb-1"
											style={{ color: config.color }}
										>
											{node.label}
										</div>
										<p className="text-[10px] text-text-muted leading-relaxed">
											{node.description}
										</p>
									</>
								)}
								{!node && (
									<p className="text-[10px] text-text-secondary mt-3">
										Not involved for {selected}
									</p>
								)}
							</div>
						);
					})}
				</motion.div>
			</AnimatePresence>

			{/* Data flow arrows */}
			<div className="space-y-2">
				<p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
					Data Flow
				</p>
				<AnimatePresence mode="wait">
					<motion.div
						key={`arrows-${selected}`}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="space-y-2"
					>
						{config.arrows.map((arrow) => (
							<div
								key={arrow.label}
								className="flex items-center gap-3 bg-surface-primary/50 rounded-lg p-3 border border-border-primary"
							>
								<div className="flex items-center gap-2 min-w-0 flex-1">
									<span
										className="text-xs font-mono font-semibold shrink-0"
										style={{ color: arrow.color }}
									>
										{COLUMN_LABELS[arrow.from]}
									</span>
									<span className="text-text-faint text-xs shrink-0">→</span>
									<span
										className="text-xs font-mono font-semibold shrink-0"
										style={{ color: arrow.color }}
									>
										{COLUMN_LABELS[arrow.to]}
									</span>
								</div>
								<div className="text-right">
									<div className="text-xs font-semibold text-text-secondary">
										{arrow.label}
									</div>
									<div className="text-[10px] text-text-muted">
										{arrow.payload}
									</div>
								</div>
							</div>
						))}
					</motion.div>
				</AnimatePresence>
			</div>

			{/* Summary */}
			<AnimatePresence mode="wait">
				<motion.p
					key={`summary-${selected}`}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="text-sm text-text-tertiary bg-surface-primary/40 border border-border-primary rounded-lg p-4 leading-relaxed"
				>
					<span className="font-semibold" style={{ color: config.color }}>
						{selected}
					</span>
					: {config.summary}
				</motion.p>
			</AnimatePresence>
		</div>
	);
}
