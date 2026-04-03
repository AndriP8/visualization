import clsx from "clsx";
import { motion, useAnimation } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { STRATEGY_COLORS, type Strategy } from "./constants";

interface Milestone {
	/** Position on the timeline axis, 0–100 */
	position: number;
	label: string;
	/** Brief tooltip explaining this event */
	tooltip: string;
}

interface StrategyConfig {
	id: Strategy;
	label: string;
	color: string;
	bgColor: string;
	borderColor: string;
	/**
	 * Total animation duration in seconds on a "fast" network.
	 * Slow-network multiplier is applied on top.
	 */
	fastDuration: number;
	slowDuration: number;
	milestones: Milestone[];
}

const STRATEGIES: StrategyConfig[] = [
	{
		id: "CSR",
		label: "CSR — Client-Side Rendering",
		color: STRATEGY_COLORS.CSR,
		bgColor: "bg-red-400",
		borderColor: "border-red-500/40",
		fastDuration: 3.5,
		slowDuration: 8,
		milestones: [
			{
				position: 0,
				label: "Request",
				tooltip:
					"Browser sends a GET request to the server. Nothing is visible yet.",
			},
			{
				position: 12,
				label: "Empty HTML",
				tooltip:
					"Server instantly returns a nearly-empty HTML shell with just a <div id='root'>. The page is still blank — there is no content to paint yet.",
			},
			{
				position: 42,
				label: "JS Bundle",
				tooltip:
					"The browser must download, parse, and execute the entire JavaScript bundle before any content can appear. On slow networks this gap is the 'white screen of death'.",
			},
			{
				position: 68,
				label: "FCP",
				tooltip:
					"First Contentful Paint — content finally appears after JS runs and calls ReactDOM.render(). TTFB was fast but FCP is very late.",
			},
			{
				position: 100,
				label: "Interactive",
				tooltip:
					"Time to Interactive (TTI) — event listeners are attached immediately after render. FCP ≈ TTI for CSR.",
			},
		],
	},
	{
		id: "SSR",
		label: "SSR — Server-Side Rendering",
		color: STRATEGY_COLORS.SSR,
		bgColor: "bg-amber-400",
		borderColor: "border-amber-500/40",
		fastDuration: 3,
		slowDuration: 6,
		milestones: [
			{
				position: 0,
				label: "Request",
				tooltip: "Browser sends a GET request to the origin server.",
			},
			{
				position: 25,
				label: "Server Renders",
				tooltip:
					"The origin server fetches data (DB query, API call), renders the React tree to an HTML string, and sends it over the network. TTFB is higher than CSR because the server must do work before responding.",
			},
			{
				position: 48,
				label: "FCP ✓",
				tooltip:
					"Browser receives fully formed HTML and can paint immediately. FCP is very fast from the user's perspective. However, the page is not yet interactive — no JS has run.",
			},
			{
				position: 70,
				label: "JS Bundle",
				tooltip:
					"The browser downloads the React JS bundle. During this window the page looks interactive but clicking buttons does nothing.",
			},
			{
				position: 100,
				label: "Hydration → TTI",
				tooltip:
					"React 'hydrates' the server HTML by attaching event listeners to existing DOM nodes. Only now is the page truly interactive. The gap between FCP and TTI is SSR's main weakness.",
			},
		],
	},
	{
		id: "SSG",
		label: "SSG — Static Site Generation",
		color: STRATEGY_COLORS.SSG,
		bgColor: "bg-green-400",
		borderColor: "border-green-500/40",
		fastDuration: 1.6,
		slowDuration: 3,
		milestones: [
			{
				position: 0,
				label: "Request",
				tooltip:
					"Browser sends a GET request. Because the HTML is pre-built and cached on a CDN, it reaches a nearby edge node — not the origin server.",
			},
			{
				position: 10,
				label: "CDN Hit",
				tooltip:
					"The CDN edge node has the pre-built HTML file in cache. No server computation happens at all. This is why TTFB for SSG can be under 50ms.",
			},
			{
				position: 32,
				label: "FCP ✓",
				tooltip:
					"Full HTML arrives at the browser very quickly. FCP is excellent — often the best of all strategies.",
			},
			{
				position: 68,
				label: "JS Hydrates",
				tooltip:
					"React hydrates the static HTML to add interactivity. Same process as SSR hydration.",
			},
			{
				position: 100,
				label: "Interactive",
				tooltip:
					"Page is fully interactive. The trade-off: content is frozen at build time and cannot show user-specific data without client-side fetching.",
			},
		],
	},
	{
		id: "ISR",
		label: "ISR — Incremental Static Regeneration",
		color: STRATEGY_COLORS.ISR,
		bgColor: "bg-cyan-400",
		borderColor: "border-cyan-500/40",
		fastDuration: 1.8,
		slowDuration: 3.2,
		milestones: [
			{
				position: 0,
				label: "Request",
				tooltip:
					"Browser sends a GET request. Like SSG, it hits the CDN edge node.",
			},
			{
				position: 10,
				label: "Stale CDN Hit",
				tooltip:
					"The CDN serves the cached (possibly stale) HTML immediately — users never wait. If the page's `revalidate` TTL has expired, a background revalidation is also triggered. The requesting user still gets the old content; the NEXT visitor gets the fresh version.",
			},
			{
				position: 30,
				label: "FCP ✓",
				tooltip:
					"Excellent FCP, same speed as SSG because the CDN cache is serving a pre-built page.",
			},
			{
				position: 55,
				label: "BG Revalidation",
				tooltip:
					"After serving the stale page, the framework triggers a background regeneration on the origin server (if the TTL has expired). The current user is already past FCP — this happens completely in the background.",
			},
			{
				position: 72,
				label: "JS Hydrates",
				tooltip: "Hydration proceeds normally — same as SSG/SSR.",
			},
			{
				position: 100,
				label: "Interactive",
				tooltip:
					"Page is interactive. Background regeneration will eventually update the CDN cache for future visitors.",
			},
		],
	},
	{
		id: "Streaming SSR",
		label: "Streaming SSR — Progressive Server Rendering",
		color: STRATEGY_COLORS["Streaming SSR"],
		bgColor: "bg-violet-400",
		borderColor: "border-violet-500/40",
		fastDuration: 2.8,
		slowDuration: 5,
		milestones: [
			{
				position: 0,
				label: "Request",
				tooltip: "Browser sends a GET request to the origin server.",
			},
			{
				position: 15,
				label: "Shell Streamed",
				tooltip:
					"Server immediately starts streaming the HTML shell (layout, nav) before all data is ready. This allows the browser to start parsing and painting early.",
			},
			{
				position: 28,
				label: "FCP ✓",
				tooltip:
					"First Contentful Paint happens early as the shell arrives. Users see a meaningful layout before dynamic content loads.",
			},
			{
				position: 52,
				label: "Content Streams",
				tooltip:
					"Server streams HTML chunks progressively as data becomes available (e.g., user feed loads). The browser renders each chunk as it arrives, updating the page incrementally.",
			},
			{
				position: 75,
				label: "Hydration",
				tooltip:
					"React hydrates progressively as chunks stream in — critical parts first, then remaining content as it arrives.",
			},
			{
				position: 100,
				label: "Interactive",
				tooltip:
					"Fully interactive. Streaming SSR combines server rendering with progressive delivery for faster perceived performance.",
			},
		],
	},
];

interface TimelineRowProps {
	strategy: StrategyConfig;
	playing: boolean;
	playKey: number;
	slowNetwork: boolean;
	dimmed: boolean;
}

function TimelineRow({
	strategy,
	playing,
	playKey,
	slowNetwork,
	dimmed,
}: TimelineRowProps) {
	const controls = useAnimation();
	const [activeMilestone, setActiveMilestone] = useState<number | null>(null);
	const [hoveredMilestone, setHoveredMilestone] = useState<number | null>(null);
	const timerIdsRef = useRef<number[]>([]);

	const duration = slowNetwork ? strategy.slowDuration : strategy.fastDuration;

	// playKey is only used as a React key prop on motion.div, not accessed in the effect body
	useEffect(() => {
		if (!playing) {
			controls.stop();
			controls.set({ left: "0%" });
			setActiveMilestone(null);
			// Clear any pending timers
			for (const timerId of timerIdsRef.current) {
				clearTimeout(timerId);
			}
			timerIdsRef.current = [];
			return;
		}

		controls.start({
			left: "100%",
			transition: { duration, ease: "linear" },
		});

		// Trigger milestone highlights sequentially
		const timerIds: number[] = [];
		for (const [i, milestone] of strategy.milestones.entries()) {
			const delay = (milestone.position / 100) * duration;
			const timerId = window.setTimeout(() => {
				setActiveMilestone(i);
			}, delay * 1000);
			timerIds.push(timerId);
		}
		timerIdsRef.current = timerIds;

		return () => {
			controls.stop();
			// Clear all scheduled timers on cleanup
			for (const timerId of timerIdsRef.current) {
				clearTimeout(timerId);
			}
			timerIdsRef.current = [];
		};
	}, [playing, duration, controls, strategy.milestones]);

	const displayedMilestone = hoveredMilestone ?? activeMilestone;
	const tooltipText =
		displayedMilestone !== null
			? strategy.milestones[displayedMilestone].tooltip
			: null;

	return (
		<div
			className={clsx(
				"transition-opacity duration-500",
				dimmed ? "opacity-25" : "opacity-100",
			)}
		>
			{/* Strategy label */}
			<div className="flex items-center gap-2 mb-2">
				<span
					className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
					style={{ backgroundColor: strategy.color }}
				/>
				<span className="text-xs font-semibold text-text-secondary">
					{strategy.label}
				</span>
				<span className="text-xs text-text-faint ml-auto">
					~{duration}s{slowNetwork ? " (3G)" : ""}
				</span>
			</div>

			{/* Timeline track */}
			<div
				className={clsx(
					"relative h-6 rounded-full bg-surface-secondary/80 border overflow-visible mb-1",
					strategy.borderColor,
				)}
			>
				{/* Milestone nodes */}
				{strategy.milestones.map((m, i) => (
					<button
						key={m.label}
						type="button"
						aria-label={`${m.label}: ${m.tooltip}`}
						className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 cursor-pointer"
						style={{ left: `${m.position}%` }}
						onMouseEnter={() => setHoveredMilestone(i)}
						onMouseLeave={() => setHoveredMilestone(null)}
					>
						<span
							className={clsx(
								"block w-3 h-3 rounded-full border-2 transition-all duration-200",
								activeMilestone !== null && i <= activeMilestone
									? "border-transparent scale-125"
									: "border-border-tertiary bg-surface-secondary",
								hoveredMilestone === i ? "ring-2 ring-white/40 scale-150" : "",
							)}
							style={
								activeMilestone !== null && i <= activeMilestone
									? { backgroundColor: strategy.color }
									: undefined
							}
						/>
						<span className="absolute top-4 left-1/2 -translate-x-1/2 text-[9px] text-text-muted whitespace-nowrap font-mono">
							{m.label}
						</span>
					</button>
				))}

				{/* Animated request ball */}
				<motion.div
					key={`ball-${playKey}`}
					initial={{ left: "0%" }}
					animate={controls}
					className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full z-20 shadow-lg"
					style={{
						backgroundColor: strategy.color,
						boxShadow: `0 0 10px ${strategy.color}80`,
					}}
				/>
			</div>

			{/* Milestone tooltip */}
			<div className="h-8 mt-3 flex items-start">
				{tooltipText && (
					<motion.p
						key={displayedMilestone}
						initial={{ opacity: 0, y: 4 }}
						animate={{ opacity: 1, y: 0 }}
						className="text-[10px] text-text-tertiary leading-relaxed"
					>
						<span
							className="font-semibold mr-1"
							style={{ color: strategy.color }}
						>
							{displayedMilestone !== null &&
								strategy.milestones[displayedMilestone].label}
							:
						</span>
						{tooltipText}
					</motion.p>
				)}
			</div>
		</div>
	);
}

interface TimelineComparisonDemoProps {
	eliminatedStrategies: Set<Strategy>;
}

export function TimelineComparisonDemo({
	eliminatedStrategies,
}: TimelineComparisonDemoProps) {
	const [playing, setPlaying] = useState(false);
	const [playKey, setPlayKey] = useState(0);
	const [slowNetwork, setSlowNetwork] = useState(false);

	const maxDuration = Math.max(
		...STRATEGIES.map((s) => (slowNetwork ? s.slowDuration : s.fastDuration)),
	);

	function handlePlay() {
		setPlayKey((k) => k + 1);
		setPlaying(true);
		setTimeout(() => setPlaying(false), maxDuration * 1000 + 500);
	}

	return (
		<div className="space-y-4">
			{/* Controls */}
			<div className="flex items-center gap-4 flex-wrap">
				<button
					type="button"
					onClick={handlePlay}
					disabled={playing}
					className={clsx(
						"px-4 py-2 rounded-lg text-sm font-semibold transition-all",
						playing
							? "bg-surface-tertiary text-text-muted cursor-not-allowed"
							: "bg-violet-600 hover:bg-violet-500 text-text-primary shadow-lg shadow-violet-500/20",
					)}
				>
					{playing ? "⏳ Animating…" : "▶ Play All Timelines"}
				</button>

				<label className="flex items-center gap-2 text-sm text-text-tertiary cursor-pointer select-none ml-auto">
					<span className="text-xs">🐇 Fast</span>
					{/* A real <input type="checkbox"> is hidden; the visible toggle is a styled div controlled by the label */}
					<input
						type="checkbox"
						className="sr-only"
						checked={slowNetwork}
						onChange={(e) => setSlowNetwork(e.target.checked)}
					/>
					<div
						aria-hidden="true"
						className={clsx(
							"relative inline-block w-10 h-5 rounded-full transition-colors pointer-events-none",
							slowNetwork ? "bg-amber-500" : "bg-surface-tertiary",
						)}
					>
						<span
							className={clsx(
								"absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
								slowNetwork ? "translate-x-5" : "translate-x-0.5",
							)}
						/>
					</div>
					<span className="text-xs">🐢 Slow (3G)</span>
				</label>
			</div>

			{/* Timelines */}
			<div className="space-y-8 pt-2">
				{STRATEGIES.map((s) => (
					<TimelineRow
						key={s.id}
						strategy={s}
						playing={playing}
						playKey={playKey}
						slowNetwork={slowNetwork}
						dimmed={eliminatedStrategies.has(s.id)}
					/>
				))}
			</div>

			<p className="text-xs text-text-faint mt-4">
				💡 Hover milestone nodes for explanations. Use Case Matcher (below) dims
				strategies that don't fit your answers.
			</p>
		</div>
	);
}
