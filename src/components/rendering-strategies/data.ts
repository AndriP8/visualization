import type {
	StrategyTimeline,
	StrategyTradeoffs,
	TradeoffMetric,
} from "./types";

export const STRATEGY_TIMELINES: StrategyTimeline[] = [
	{
		strategy: "CSR",
		description: "Client-Side Rendering - HTML generated in browser",
		icon: "🖥️",
		color: "#ef4444",
		events: [
			{ label: "Request", color: "#64748b" },
			{ label: "Empty HTML", color: "#64748b" },
			{ label: "JS Download", color: "#f59e0b" },
			{ label: "JS Execute", color: "#f59e0b" },
			{ label: "Render", color: "#10b981" },
			{ label: "Interactive", color: "#8b5cf6" },
		],
		timings: [0, 100, 1000, 2000, 2200, 2400],
	},
	{
		strategy: "SSR",
		description: "Server-Side Rendering - HTML generated on each request",
		icon: "⚙️",
		color: "#3b82f6",
		events: [
			{ label: "Request", color: "#64748b" },
			{ label: "Server Renders", color: "#f59e0b" },
			{ label: "Full HTML (FCP)", color: "#10b981" },
			{ label: "JS Download", color: "#f59e0b" },
			{ label: "Hydration", color: "#f59e0b" },
			{ label: "Interactive", color: "#8b5cf6" },
		],
		timings: [0, 200, 400, 600, 1200, 1400],
	},
	{
		strategy: "SSG",
		description: "Static Site Generation - HTML pre-built at build time",
		icon: "📦",
		color: "#10b981",
		events: [
			{ label: "Request", color: "#64748b" },
			{ label: "CDN Serves HTML (FCP)", color: "#10b981" },
			{ label: "JS Download", color: "#f59e0b" },
			{ label: "Hydration", color: "#f59e0b" },
			{ label: "Interactive", color: "#8b5cf6" },
		],
		timings: [0, 50, 200, 600, 800],
	},
	{
		strategy: "ISR",
		description:
			"Incremental Static Regeneration - Stale content served, revalidated in background",
		icon: "🔄",
		color: "#06b6d4",
		events: [
			{ label: "Request", color: "#64748b" },
			{ label: "Stale HTML (FCP)", color: "#10b981" },
			{ label: "JS Hydrates", color: "#f59e0b" },
			{ label: "Interactive", color: "#8b5cf6" },
			{
				label: "Background Reval",
				color: "#64748b",
				description: "Next request gets fresh content",
			},
		],
		timings: [0, 50, 600, 800, 1000],
	},
	{
		strategy: "Streaming SSR",
		description:
			"Streaming Server-Side Rendering - HTML streams progressively as it's generated",
		icon: "🌊",
		color: "#a855f7",
		events: [
			{ label: "Request", color: "#64748b" },
			{ label: "Shell Streamed (FCP)", color: "#10b981" },
			{ label: "Content Streams In", color: "#f59e0b" },
			{ label: "JS Downloads", color: "#f59e0b" },
			{ label: "Progressive Hydration", color: "#f59e0b" },
			{ label: "Interactive", color: "#8b5cf6" },
		],
		timings: [0, 150, 300, 500, 800, 1000],
	},
];

export const TRADEOFF_METRICS: TradeoffMetric[] = [
	{
		label: "TTFB",
		description: "Time to First Byte - how fast server responds",
	},
	{
		label: "FCP",
		description: "First Contentful Paint - when user sees content",
	},
	{
		label: "TTI",
		description: "Time to Interactive - when page becomes usable",
	},
	{
		label: "SEO",
		description: "Search engine optimization - crawler can see content",
	},
	{
		label: "Personalization",
		description: "Support for user-specific content",
	},
	{
		label: "Cost",
		description: "Server/infrastructure cost (lower is better)",
	},
	{
		label: "Build Time",
		description: "How long builds take (lower is better)",
	},
];

export const STRATEGY_TRADEOFFS: StrategyTradeoffs[] = [
	{
		strategy: "CSR",
		ttfb: 5, // Fast TTFB (just empty HTML)
		fcp: 1, // Slow FCP (needs JS to render)
		tti: 1, // Slow TTI (same as FCP)
		seo: 1, // Poor SEO (crawlers see empty page)
		personalization: 5, // Excellent (all client-side)
		cost: 5, // Cheap (just static files)
		buildTime: 5, // Fast builds
	},
	{
		strategy: "SSR",
		ttfb: 2, // Slower TTFB (server must render)
		fcp: 5, // Fast FCP (HTML arrives quickly)
		tti: 3, // Medium TTI (hydration delay)
		seo: 5, // Excellent SEO
		personalization: 5, // Excellent (per-request)
		cost: 2, // Expensive (server compute)
		buildTime: 5, // Fast builds
	},
	{
		strategy: "SSG",
		ttfb: 5, // Fastest TTFB (CDN edge)
		fcp: 5, // Fastest FCP
		tti: 4, // Good TTI (just hydration)
		seo: 5, // Excellent SEO
		personalization: 1, // Poor (static for all users)
		cost: 5, // Cheap (CDN hosting)
		buildTime: 2, // Slow builds (pre-render all pages)
	},
	{
		strategy: "ISR",
		ttfb: 5, // Fast TTFB (stale from CDN)
		fcp: 5, // Fast FCP
		tti: 4, // Good TTI
		seo: 5, // Excellent SEO
		personalization: 2, // Limited (can cache per-user-segment)
		cost: 4, // Affordable (CDN + occasional rebuild)
		buildTime: 4, // Fast (incremental)
	},
	{
		strategy: "Streaming SSR",
		ttfb: 4, // Good TTFB (shell streams quickly)
		fcp: 5, // Fast FCP (shell appears early)
		tti: 4, // Good TTI (progressive)
		seo: 5, // Excellent SEO
		personalization: 5, // Excellent
		cost: 2, // Expensive (server compute)
		buildTime: 5, // Fast builds
	},
];
