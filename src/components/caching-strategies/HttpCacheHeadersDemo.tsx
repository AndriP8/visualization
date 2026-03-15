import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ShikiCode } from "../shared/ShikiCode";

type Scenario = "max-age" | "no-cache" | "no-store" | "s-maxage";

interface ScenarioDef {
	id: Scenario;
	label: string;
	headerSnippet: string;
	tagline: string;
	color: string;
	steps: AnimStep[];
}

interface AnimStep {
	label: string;
	from: NodeId;
	to: NodeId;
	badge?: string;
	badgeColor?: string;
	note?: string;
}

type NodeId = "browser" | "cdn" | "origin";

const NODE_LABELS: Record<NodeId, { icon: string; label: string }> = {
	browser: { icon: "🌐", label: "Browser" },
	cdn: { icon: "☁️", label: "CDN Edge" },
	origin: { icon: "🖥️", label: "Origin Server" },
};

const SCENARIOS: ScenarioDef[] = [
	{
		id: "max-age",
		label: "max-age=3600",
		color: "green",
		tagline:
			"Response cached at browser for 1 hour. 2nd request served from memory.",
		headerSnippet: `# Response headers from origin:
Cache-Control: max-age=3600, public
ETag: "abc123"
Last-Modified: Thu, 01 Jan 2026 00:00:00 GMT`,
		steps: [
			{ from: "browser", to: "cdn", label: "Request #1", note: "Cache empty" },
			{
				from: "cdn",
				to: "origin",
				label: "Forward (CDN miss)",
				badge: "MISS",
				badgeColor: "orange",
			},
			{
				from: "origin",
				to: "cdn",
				label: "200 OK + Cache-Control: max-age=3600",
			},
			{
				from: "cdn",
				to: "browser",
				label: "Response cached at CDN + Browser",
				badge: "STORED",
				badgeColor: "green",
			},
			{
				from: "browser",
				to: "browser",
				label: "Request #2 (within 3600s) → Browser Memory Cache HIT ✓",
				badge: "HIT",
				badgeColor: "green",
			},
		],
	},
	{
		id: "no-cache",
		label: "no-cache",
		color: "amber",
		tagline:
			"Always revalidates with origin, but may get 304 Not Modified (fast).",
		headerSnippet: `# Response headers from origin:
Cache-Control: no-cache
ETag: "abc123"

# Browser revalidation request:
If-None-Match: "abc123"

# Origin response if unchanged:
HTTP/1.1 304 Not Modified`,
		steps: [
			{ from: "browser", to: "cdn", label: "Request + If-None-Match header" },
			{ from: "cdn", to: "origin", label: "Revalidation request" },
			{
				from: "origin",
				to: "cdn",
				label: "304 Not Modified (content unchanged)",
				badge: "304",
				badgeColor: "amber",
			},
			{
				from: "cdn",
				to: "browser",
				label: "304 → browser uses cached body",
				badge: "FAST",
				badgeColor: "green",
			},
		],
	},
	{
		id: "no-store",
		label: "no-store",
		color: "rose",
		tagline:
			"Nothing is ever cached. Every request hits origin. No revalidation.",
		headerSnippet: `# Response headers from origin:
Cache-Control: no-store, no-cache

# Every request goes all the way
# to origin — no intermediate storage.
# Use for sensitive data (banking, auth).`,
		steps: [
			{
				from: "browser",
				to: "cdn",
				label: "Request #1",
				note: "no-store → CDN skips",
			},
			{
				from: "cdn",
				to: "origin",
				label: "Always forwarded to origin",
				badge: "BYPASS",
				badgeColor: "rose",
			},
			{ from: "origin", to: "cdn", label: "200 OK (not stored)" },
			{
				from: "cdn",
				to: "browser",
				label: "Response (not stored at browser either)",
			},
			{
				from: "browser",
				to: "cdn",
				label: "Request #2 → same journey again",
				badge: "NO CACHE",
				badgeColor: "rose",
			},
		],
	},
	{
		id: "s-maxage",
		label: "s-maxage",
		color: "sky",
		tagline:
			"CDN caches for s-maxage; browser uses max-age. Different TTLs per layer.",
		headerSnippet: `# Response headers from origin:
Cache-Control: max-age=60, s-maxage=86400, public

# Browser: caches for 60 seconds (1 min)
# CDN:     caches for 86400 seconds (1 day)
# 
# After 60s, browser re-fetches from CDN.
# CDN serves from its own cache (no origin hit).`,
		steps: [
			{ from: "browser", to: "cdn", label: "Request" },
			{ from: "cdn", to: "origin", label: "Forward (CDN miss)" },
			{
				from: "origin",
				to: "cdn",
				label: "200 OK + max-age=60, s-maxage=86400",
				note: "CDN stores for 1 day",
			},
			{
				from: "cdn",
				to: "browser",
				label: "Response (browser stores for 60s)",
			},
			{
				from: "browser",
				to: "cdn",
				label: "After 60s: browser TTL expired → hits CDN",
				badge: "CDN HIT",
				badgeColor: "sky",
			},
			{
				from: "cdn",
				to: "browser",
				label: "CDN serves from its own cache (no origin hit)",
				badge: "✓ FAST",
				badgeColor: "green",
			},
		],
	},
];

const NODE_ORDER: NodeId[] = ["browser", "cdn", "origin"];

const scenarioButtonClasses: Record<
	string,
	{ active: string; inactive: string }
> = {
	green: {
		active: "bg-green-500/15 text-green-300 border-green-500/40",
		inactive: "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600",
	},
	amber: {
		active: "bg-amber-500/15 text-amber-300 border-amber-500/40",
		inactive: "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600",
	},
	rose: {
		active: "bg-rose-500/15 text-rose-300 border-rose-500/40",
		inactive: "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600",
	},
	sky: {
		active: "bg-sky-500/15 text-sky-300 border-sky-500/40",
		inactive: "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600",
	},
};

function NetworkDiagram({
	steps,
	activeStep,
}: {
	steps: AnimStep[];
	activeStep: number;
}) {
	return (
		<div className="space-y-4">
			{/* Nodes */}
			<div className="grid grid-cols-3 gap-3">
				{NODE_ORDER.map((nodeId) => {
					const n = NODE_LABELS[nodeId];
					const currentStep = steps[activeStep];
					const isActive =
						currentStep &&
						(currentStep.from === nodeId || currentStep.to === nodeId);

					return (
						<motion.div
							key={nodeId}
							animate={{
								borderColor: isActive ? "#a78bfa" : "#3f3f46",
								backgroundColor: isActive ? "#a78bfa15" : "#27272a99",
							}}
							transition={{ duration: 0.3 }}
							className="flex flex-col items-center gap-1.5 p-3 rounded-xl border"
						>
							<span className="text-xl">{n.icon}</span>
							<span className="text-xs text-zinc-400 font-medium">
								{n.label}
							</span>
						</motion.div>
					);
				})}
			</div>

			{/* Steps list */}
			<div className="space-y-2">
				{steps.map((step, idx) => {
					const isCurrent = idx === activeStep;
					const isPast = idx < activeStep;
					const isSelf = step.from === step.to;

					return (
						<motion.div
							key={`step-${step.label}`}
							initial={{ opacity: 0 }}
							animate={{
								opacity: isPast ? 0.4 : isCurrent ? 1 : 0.15,
							}}
							transition={{ duration: 0.3 }}
							className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
								isCurrent ? "bg-zinc-800/80 ring-1 ring-zinc-600" : ""
							}`}
						>
							<span className="text-xs text-zinc-600 w-4 shrink-0">
								{idx + 1}.
							</span>
							{!isSelf && (
								<span className="text-xs text-zinc-500 shrink-0">
									{NODE_LABELS[step.from].icon}→{NODE_LABELS[step.to].icon}
								</span>
							)}
							{isSelf && (
								<span className="text-xs text-zinc-500 shrink-0">🔁</span>
							)}
							<span className="text-xs text-zinc-300 flex-1">{step.label}</span>
							{step.badge && (
								<AnimatePresence>
									{isCurrent && (
										<motion.span
											initial={{ scale: 0.7, opacity: 0 }}
											animate={{ scale: 1, opacity: 1 }}
											className={`px-2 py-0.5 rounded-full text-xs font-bold ${
												step.badgeColor === "green"
													? "bg-green-500/20 text-green-400 border border-green-500/30"
													: step.badgeColor === "orange"
														? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
														: step.badgeColor === "amber"
															? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
															: step.badgeColor === "rose"
																? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
																: step.badgeColor === "sky"
																	? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
																	: "bg-zinc-700 text-zinc-300 border border-zinc-600"
											}`}
										>
											{step.badge}
										</motion.span>
									)}
								</AnimatePresence>
							)}
						</motion.div>
					);
				})}
			</div>
		</div>
	);
}

export function HttpCacheHeadersDemo() {
	const [selected, setSelected] = useState<Scenario>("max-age");
	const [activeStep, setActiveStep] = useState(-1);
	const [running, setRunning] = useState(false);
	const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

	const scenario = SCENARIOS.find((s) => s.id === selected) ?? SCENARIOS[0];

	const clearTimeouts = useCallback(() => {
		for (const t of timeoutsRef.current) clearTimeout(t);
		timeoutsRef.current = [];
	}, []);

	const runFlow = useCallback(() => {
		if (running) return;
		clearTimeouts();
		setActiveStep(-1);
		setRunning(true);

		scenario.steps.forEach((_, idx) => {
			const t = setTimeout(
				() => {
					setActiveStep(idx);
					if (idx === scenario.steps.length - 1) {
						const done = setTimeout(() => setRunning(false), 800);
						timeoutsRef.current.push(done);
					}
				},
				idx * 800 + 100,
			);
			timeoutsRef.current.push(t);
		});
	}, [running, clearTimeouts, scenario]);

	const reset = useCallback(() => {
		clearTimeouts();
		setActiveStep(-1);
		setRunning(false);
	}, [clearTimeouts]);

	useEffect(() => {
		reset();
	}, [reset]);

	useEffect(() => () => clearTimeouts(), [clearTimeouts]);

	return (
		<div className="space-y-6">
			{/* Scenario tabs */}
			<div className="flex flex-wrap gap-2">
				{SCENARIOS.map((s) => {
					const colors = scenarioButtonClasses[s.color];
					return (
						<button
							key={s.id}
							type="button"
							onClick={() => setSelected(s.id)}
							className={`px-3 py-1.5 rounded-lg text-sm font-mono font-semibold border transition-all ${
								selected === s.id ? colors.active : colors.inactive
							}`}
						>
							{s.label}
						</button>
					);
				})}
			</div>

			<p className="text-sm text-zinc-400">{scenario.tagline}</p>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Animation */}
				<div className="space-y-4">
					<NetworkDiagram steps={scenario.steps} activeStep={activeStep} />
					<button
						type="button"
						onClick={running ? reset : runFlow}
						className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors ${
							running
								? "bg-zinc-700 text-zinc-300"
								: "bg-violet-600 hover:bg-violet-500 text-white"
						}`}
					>
						{running ? "⏹ Stop" : activeStep >= 0 ? "↺ Replay" : "▶ Animate"}
					</button>
				</div>

				{/* Headers */}
				<div className="space-y-2">
					<p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
						HTTP Headers
					</p>
					<ShikiCode
						code={scenario.headerSnippet}
						language="http"
						showLineNumbers={false}
						className="text-xs"
					/>
					<div className="mt-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700 text-xs text-zinc-400 space-y-1">
						<strong className="text-zinc-300 text-xs">Quick reference:</strong>
						<ul className="space-y-1 mt-1">
							<li>
								<code className="text-amber-300">max-age</code> — browser TTL
							</li>
							<li>
								<code className="text-sky-300">s-maxage</code> — CDN/shared
								cache TTL (overrides max-age for CDNs)
							</li>
							<li>
								<code className="text-rose-300">no-cache</code> — must
								revalidate before serving
							</li>
							<li>
								<code className="text-rose-300">no-store</code> — never cache
								(even in memory)
							</li>
							<li>
								<code className="text-violet-300">ETag</code> — fingerprint for
								conditional requests
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
}
