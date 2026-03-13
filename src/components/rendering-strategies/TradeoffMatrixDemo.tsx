import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ALL_STRATEGIES, STRATEGY_COLORS, type Strategy } from "./constants";

type Factor =
	| "TTFB"
	| "FCP"
	| "TTI"
	| "SEO"
	| "Personalization"
	| "Hosting Cost"
	| "Build Time";

interface Rating {
	/** 1 = worst, 5 = best */
	score: number;
	label: string;
	/** Concrete "why" shown in the tooltip panel */
	explanation: string;
}

type MatrixData = Record<Strategy, Record<Factor, Rating>>;

const FACTORS: Factor[] = [
	"TTFB",
	"FCP",
	"TTI",
	"SEO",
	"Personalization",
	"Hosting Cost",
	"Build Time",
];

/** Score → color on the dot bar */
function scoreColor(score: number): string {
	if (score >= 4) return "#4ade80";
	if (score === 3) return "#fbbf24";
	return "#f87171";
}

const MATRIX: MatrixData = {
	CSR: {
		TTFB: {
			score: 5,
			label: "Instant",
			explanation:
				"CSR serves a static empty HTML file. The server has nothing to compute — response time is effectively zero, limited only by network latency to the file server or CDN.",
		},
		FCP: {
			score: 1,
			label: "Very Slow",
			explanation:
				"After receiving the empty HTML, the browser must download, parse, and execute the entire JS bundle before the first pixel of content can be painted. On slow connections this creates a multi-second blank screen — the 'white screen of death'.",
		},
		TTI: {
			score: 3,
			label: "Moderate",
			explanation:
				"For CSR, FCP ≈ TTI because when React finishes rendering it also attaches event listeners in the same pass. There is no separate hydration step. However, TTI is still delayed by the large JS bundle download.",
		},
		SEO: {
			score: 1,
			label: "Poor",
			explanation:
				"Most search engine crawlers see an empty <div id='root'> when they first fetch a CSR page. While Googlebot can execute JavaScript, it may index a stale or incomplete snapshot, hurting rankings for content-driven pages.",
		},
		Personalization: {
			score: 5,
			label: "Excellent",
			explanation:
				"Every render happens on the client with full access to cookies, localStorage, and live API calls. Deeply personalized UIs (dashboards, user feeds) are a natural fit and require no special server infrastructure.",
		},
		"Hosting Cost": {
			score: 5,
			label: "Minimal",
			explanation:
				"CSR apps are pure static assets (HTML, JS, CSS). They can be hosted on any CDN or static host (Netlify, S3, GitHub Pages) at near-zero cost — no server processes needed.",
		},
		"Build Time": {
			score: 5,
			label: "Negligible",
			explanation:
				"No pages are pre-rendered at build time. The build step only bundles JS/CSS, which is fast regardless of how many pages the app has.",
		},
	},
	SSR: {
		TTFB: {
			score: 2,
			label: "Slower",
			explanation:
				"Before sending a byte, the server must fetch data (database query, API call) and render React to an HTML string. On a fast server with warm data this might add 50–300ms, but it scales poorly under high traffic without horizontal scaling.",
		},
		FCP: {
			score: 4,
			label: "Fast",
			explanation:
				"The browser receives fully-formed HTML and can paint content as soon as the first bytes arrive. FCP is much earlier than CSR because no JS execution is required before painting.",
		},
		TTI: {
			score: 2,
			label: "Delayed",
			explanation:
				"After FCP, the browser must still download the JS bundle and run React hydration. During this window the page looks interactive but isn't — buttons don't respond. This 'uncanny valley' is SSR's core weakness.",
		},
		SEO: {
			score: 5,
			label: "Excellent",
			explanation:
				"Crawlers receive complete HTML with full content on the first request. No JS execution needed. SSR gives the best possible SEO signal for content that changes frequently.",
		},
		Personalization: {
			score: 5,
			label: "Excellent",
			explanation:
				"Every request hits the origin server, which can read cookies/session data and tailor the HTML response to that specific user. Auth-gated pages and user-specific dashboards are natural fits.",
		},
		"Hosting Cost": {
			score: 2,
			label: "High",
			explanation:
				"Every page view spins up a server-side render. Under high traffic, this requires significant compute (multiple server instances, auto-scaling). Costs scale linearly or super-linearly with traffic.",
		},
		"Build Time": {
			score: 5,
			label: "Negligible",
			explanation:
				"No pages are pre-rendered at build time. The build step only compiles JS/CSS. Build times stay fast no matter how many routes exist.",
		},
	},
	SSG: {
		TTFB: {
			score: 5,
			label: "Instant",
			explanation:
				"HTML is pre-built and deployed to a CDN. Requests are served from the nearest CDN PoP (point of presence) with no origin server involved. TTFB can be under 50ms globally.",
		},
		FCP: {
			score: 5,
			label: "Excellent",
			explanation:
				"Full HTML arrives from the CDN with minimal latency. FCP is as fast as physically possible given network distance to the CDN edge.",
		},
		TTI: {
			score: 3,
			label: "Moderate",
			explanation:
				"After the fast FCP, React still needs to hydrate the static HTML by attaching event listeners. The page is non-interactive during this hydration window.",
		},
		SEO: {
			score: 5,
			label: "Excellent",
			explanation:
				"Pre-built HTML is instantly available to crawlers. No JS execution required. Perfect for marketing sites, blogs, and documentation.",
		},
		Personalization: {
			score: 1,
			label: "None",
			explanation:
				"All users receive identical pre-built HTML. User-specific content requires client-side fetching after hydration, which hurts the user experience. SSG is not suitable for personalized pages.",
		},
		"Hosting Cost": {
			score: 5,
			label: "Minimal",
			explanation:
				"Static files on a CDN cost fractions of a cent per GB served. There is no server-side compute per request. Hosting costs are almost entirely bandwidth-based.",
		},
		"Build Time": {
			score: 2,
			label: "Can Be Long",
			explanation:
				"Every page must be pre-rendered at build time. A site with 100,000 blog posts may take 30+ minutes to build. This is SSG's operational Achilles' heel at scale.",
		},
	},
	ISR: {
		TTFB: {
			score: 5,
			label: "Instant",
			explanation:
				"Like SSG, ISR serves from the CDN cache. Requests always get an immediate response regardless of whether the page is stale — the stale-while-revalidate pattern means users never wait for regeneration.",
		},
		FCP: {
			score: 5,
			label: "Excellent",
			explanation:
				"CDN-served full HTML means FCP is nearly identical to SSG — excellent performance regardless of content freshness.",
		},
		TTI: {
			score: 3,
			label: "Moderate",
			explanation:
				"Same hydration cost as SSG — React must hydrate the CDN-served HTML before the page is interactive.",
		},
		SEO: {
			score: 4,
			label: "Good",
			explanation:
				"Crawlers receive full HTML from the CDN, same as SSG. The caveat: if a page is stale (not yet regenerated), crawlers may index outdated content until the background regeneration completes.",
		},
		Personalization: {
			score: 1,
			label: "None",
			explanation:
				"ISR pages are still cached at the CDN level — all users see the same cached HTML. Personalization requires client-side fetching after hydration, same limitation as SSG.",
		},
		"Hosting Cost": {
			score: 4,
			label: "Low",
			explanation:
				"Mostly CDN costs, same as SSG. The small addition: periodic background regeneration on the origin server. This is minimal compared to SSR's per-request compute cost.",
		},
		"Build Time": {
			score: 4,
			label: "Fast",
			explanation:
				"With ISR, you can choose to only pre-render the most critical pages at build time. New/rare pages are generated on-demand on the first request, avoiding the SSG problem of building 100,000 pages upfront.",
		},
	},
	"Streaming SSR": {
		TTFB: {
			score: 4,
			label: "Good",
			explanation:
				"Server starts responding immediately by streaming the HTML shell. TTFB is faster than traditional SSR because the server doesn't wait for all data before responding.",
		},
		FCP: {
			score: 5,
			label: "Excellent",
			explanation:
				"The HTML shell arrives quickly and the browser can paint it immediately. Users see a meaningful layout before all content has loaded, resulting in fast perceived performance.",
		},
		TTI: {
			score: 4,
			label: "Good",
			explanation:
				"React can hydrate progressively as chunks arrive. Critical interactive elements can become usable before the entire page has finished streaming, though full interactivity waits for all content.",
		},
		SEO: {
			score: 5,
			label: "Excellent",
			explanation:
				"Crawlers receive fully server-rendered HTML. The streaming delivery doesn't affect SEO — the crawler simply waits for the complete response before indexing.",
		},
		Personalization: {
			score: 5,
			label: "Excellent",
			explanation:
				"Each request is server-rendered on-demand, allowing full personalization. The server can fetch user-specific data and stream it progressively, combining personalization with fast FCP.",
		},
		"Hosting Cost": {
			score: 2,
			label: "Expensive",
			explanation:
				"Requires origin server compute for every request to render and stream HTML. Similar to SSR costs — you need servers running 24/7 to handle rendering workload.",
		},
		"Build Time": {
			score: 5,
			label: "Fast",
			explanation:
				"No pre-rendering required at build time. Builds are fast since content is rendered on-demand at request time. Only JS bundles and static assets need to be built.",
		},
	},
};

function ScoreDots({ score }: { score: number }) {
	return (
		<div className="flex gap-0.5 items-center">
			{Array.from({ length: 5 }).map((_, i) => (
				<span
					// biome-ignore lint/suspicious/noArrayIndexKey: static dots
					key={i}
					className="w-2 h-2 rounded-full transition-colors"
					style={{ backgroundColor: i < score ? scoreColor(score) : "#27272a" }}
				/>
			))}
		</div>
	);
}

type CellKey = `${Strategy}:${Factor}`;

export function TradeoffMatrixDemo() {
	const [selectedCell, setSelectedCell] = useState<CellKey | null>(null);

	function parseCell(key: CellKey): { strategy: Strategy; factor: Factor } {
		const parts = key.split(":");
		if (parts.length !== 2) {
			throw new Error(`Invalid cell key format: ${key}`);
		}
		return { strategy: parts[0] as Strategy, factor: parts[1] as Factor };
	}

	const selectedData = selectedCell
		? (() => {
				const { strategy, factor } = parseCell(selectedCell);
				return { strategy, factor, rating: MATRIX[strategy][factor] };
			})()
		: null;

	return (
		<div className="space-y-4">
			{/* Table */}
			<div className="overflow-x-auto">
				<table className="w-full text-xs border-collapse">
					<thead>
						<tr>
							<th className="text-left p-2 text-zinc-500 font-medium w-12" />
							{FACTORS.map((f) => (
								<th
									key={f}
									className="text-center p-2 text-zinc-400 font-semibold whitespace-nowrap"
								>
									{f}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{ALL_STRATEGIES.map((strategy) => (
							<tr key={strategy} className="border-t border-zinc-800/50">
								<td className="p-2">
									<span
										className="font-bold text-xs"
										style={{ color: STRATEGY_COLORS[strategy] }}
									>
										{strategy}
									</span>
								</td>
								{FACTORS.map((factor) => {
									const cellKey: CellKey = `${strategy}:${factor}`;
									const rating = MATRIX[strategy][factor];
									const isSelected = selectedCell === cellKey;
									return (
										<td key={factor} className="p-1.5 text-center">
											<button
												type="button"
												onClick={() =>
													setSelectedCell((prev) =>
														prev === cellKey ? null : cellKey,
													)
												}
												className={clsx(
													"flex flex-col items-center gap-1 w-full p-2 rounded-lg transition-all cursor-pointer",
													isSelected
														? "bg-zinc-700/80 ring-1 ring-white/20"
														: "hover:bg-zinc-800/50",
												)}
												title={rating.label}
											>
												<ScoreDots score={rating.score} />
												<span className="text-[9px] text-zinc-500 leading-tight">
													{rating.label}
												</span>
											</button>
										</td>
									);
								})}
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Explanation panel */}
			<AnimatePresence>
				{selectedData && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						className="overflow-hidden"
					>
						<div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 space-y-2">
							<div className="flex items-center gap-3">
								<span
									className="font-bold text-sm px-2 py-0.5 rounded"
									style={{
										color: STRATEGY_COLORS[selectedData.strategy],
										backgroundColor: `${STRATEGY_COLORS[selectedData.strategy]}15`,
									}}
								>
									{selectedData.strategy}
								</span>
								<span className="text-zinc-400 text-sm">→</span>
								<span className="font-semibold text-zinc-200 text-sm">
									{selectedData.factor}
								</span>
								<span className="ml-auto">
									<ScoreDots score={selectedData.rating.score} />
								</span>
							</div>
							<p className="text-sm text-zinc-300 leading-relaxed">
								{selectedData.rating.explanation}
							</p>
						</div>
					</motion.div>
				)}
				{!selectedData && (
					<motion.p
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="text-xs text-zinc-600 text-center py-2"
					>
						Click any cell to see why it rates that way
					</motion.p>
				)}
			</AnimatePresence>
		</div>
	);
}
