import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";

interface Config {
	rsc: boolean;
	ssr: boolean;
}

interface MatrixCell {
	htmlOnLoad: string;
	bundleSize: string;
	hydrationCost: string;
	dataFetching: string;
	interactivity: string;
	color: string;
	label: string;
	recommendation: string;
}

function getCell(config: Config): MatrixCell {
	if (!config.ssr && !config.rsc) {
		return {
			label: "CSR only",
			htmlOnLoad: "No — blank shell until JS runs",
			bundleSize: "Full app bundle",
			hydrationCost: "Full mount (not hydration)",
			dataFetching: "Client-side (useEffect, SWR)",
			interactivity: "Yes",
			color: "zinc",
			recommendation:
				"Simple SPAs with no SEO requirement and fast client devices.",
		};
	}
	if (config.ssr && !config.rsc) {
		return {
			label: "SSR only",
			htmlOnLoad: "Yes — full HTML on first request",
			bundleSize: "Full app bundle (all components)",
			hydrationCost: "Full tree — O(n) traversal",
			dataFetching: "Server at request time (getServerSideProps)",
			interactivity: "Yes",
			color: "amber",
			recommendation:
				"When you need SEO but don't need to optimize JS bundle. Classic Next.js Pages Router.",
		};
	}
	if (!config.ssr && config.rsc) {
		return {
			label: "RSC only (no SSR)",
			htmlOnLoad: "No* — Flight payload, no HTML",
			bundleSize: "Client components only",
			hydrationCost: "Client components only",
			dataFetching: "Server (direct DB, fs, secrets)",
			interactivity: "Yes",
			color: "cyan",
			recommendation:
				"React Native / Expo RSC, or build-time static generation. Rare in web.",
		};
	}
	return {
		label: "SSR + RSC (App Router)",
		htmlOnLoad: "Yes — HTML from server components",
		bundleSize: "Client components only",
		hydrationCost: "Client components only — server nodes skip hydration",
		dataFetching: "Server components (no API layer needed)",
		interactivity: "Yes",
		color: "emerald",
		recommendation:
			"Best for most production Next.js apps. HTML on first load, minimal bundle, direct DB access.",
	};
}

const WATERFALL_BARS: Record<
	string,
	{ items: { label: string; width: number; color: string }[] }
> = {
	"csr-only": {
		items: [
			{ label: "HTML shell", width: 5, color: "bg-zinc-600" },
			{ label: "JS bundle (full)", width: 80, color: "bg-red-500/60" },
			{ label: "Data fetch", width: 40, color: "bg-amber-500/60" },
			{ label: "Mount + render", width: 30, color: "bg-zinc-500/60" },
		],
	},
	"ssr-only": {
		items: [
			{ label: "HTML (full)", width: 35, color: "bg-emerald-500/60" },
			{ label: "JS bundle (full)", width: 75, color: "bg-red-500/60" },
			{ label: "Hydrate full tree", width: 40, color: "bg-amber-500/60" },
		],
	},
	"rsc-only": {
		items: [
			{ label: "Flight payload", width: 20, color: "bg-cyan-500/60" },
			{ label: "Client JS (small)", width: 25, color: "bg-violet-500/60" },
			{ label: "Hydrate client nodes", width: 15, color: "bg-violet-500/40" },
		],
	},
	"ssr-rsc": {
		items: [
			{
				label: "HTML (server components)",
				width: 30,
				color: "bg-emerald-500/60",
			},
			{ label: "Client JS (small)", width: 20, color: "bg-violet-500/60" },
			{
				label: "Hydrate client nodes only",
				width: 12,
				color: "bg-violet-500/40",
			},
		],
	},
};

function getWaterfallKey(config: Config): string {
	if (!config.ssr && !config.rsc) return "csr-only";
	if (config.ssr && !config.rsc) return "ssr-only";
	if (!config.ssr && config.rsc) return "rsc-only";
	return "ssr-rsc";
}

export function RSCvsSSRDemo() {
	const [config, setConfig] = useState<Config>({ rsc: false, ssr: false });
	const cell = getCell(config);
	const wfKey = getWaterfallKey(config);
	const wf = WATERFALL_BARS[wfKey];

	function toggle(key: keyof Config) {
		setConfig((prev) => ({ ...prev, [key]: !prev[key] }));
	}

	const colorMap: Record<string, string> = {
		emerald: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
		amber: "border-amber-500/40 bg-amber-500/10 text-amber-400",
		cyan: "border-cyan-500/40 bg-cyan-500/10 text-cyan-400",
		zinc: "border-zinc-600/40 bg-zinc-700/20 text-zinc-400",
	};

	return (
		<DemoSection
			title="RSC vs SSR — They're Orthogonal"
			description="RSC is about WHERE code runs (server vs client). SSR is about WHEN HTML is generated (server at request vs client). Toggle each independently to see the trade-offs."
		>
			<div className="space-y-6">
				{/* Toggles */}
				<div className="flex flex-wrap gap-4">
					{(["ssr", "rsc"] as const).map((key) => (
						<button
							key={key}
							type="button"
							onClick={() => toggle(key)}
							className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${config[key] ? "border-violet-500/50 bg-violet-500/15 text-violet-300" : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:text-white"}`}
						>
							<span
								className={`w-4 h-4 rounded border flex items-center justify-center text-xs ${config[key] ? "border-violet-400 bg-violet-500/40 text-violet-200" : "border-zinc-600"}`}
							>
								{config[key] ? "✓" : ""}
							</span>
							{key === "ssr"
								? "SSR (Server-Side Rendering)"
								: "RSC (React Server Components)"}
						</button>
					))}
				</div>

				<AnimatePresence mode="wait">
					<motion.div
						key={wfKey}
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						className="space-y-5"
					>
						{/* Label */}
						<div
							className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold ${colorMap[cell.color]}`}
						>
							{cell.label}
						</div>

						{/* Waterfall */}
						<div className="bg-zinc-800/50 rounded-xl border border-zinc-700 p-4 space-y-3">
							<h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
								Network waterfall
							</h4>
							<div className="space-y-2">
								{wf.items.map((bar, i) => (
									<div
										key={bar.label}
										className="flex items-center gap-3 text-xs"
									>
										<span className="text-zinc-500 w-36 shrink-0">
											{bar.label}
										</span>
										<div className="flex-1 h-5 bg-zinc-900 rounded overflow-hidden">
											<motion.div
												className={`h-full ${bar.color} rounded`}
												initial={{ width: 0 }}
												animate={{ width: `${bar.width}%` }}
												transition={{ duration: 0.5, delay: i * 0.1 }}
											/>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Properties */}
						<div className="overflow-x-auto rounded-xl border border-zinc-800">
							<table className="w-full text-xs">
								<tbody>
									{[
										["HTML on first load", cell.htmlOnLoad],
										["JS bundle", cell.bundleSize],
										["Hydration cost", cell.hydrationCost],
										["Data fetching", cell.dataFetching],
										["Client interactivity", cell.interactivity],
									].map(([label, value]) => (
										<tr
											key={label}
											className="border-b border-zinc-800 last:border-0"
										>
											<td className="px-4 py-2.5 text-zinc-500 w-40 shrink-0">
												{label}
											</td>
											<td className="px-4 py-2.5 text-zinc-300">{value}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						{/* Recommendation */}
						<div className={`rounded-lg border p-3 ${colorMap[cell.color]}`}>
							<p className="text-xs font-semibold mb-1">When to use</p>
							<p className="text-xs text-zinc-300">{cell.recommendation}</p>
						</div>
					</motion.div>
				</AnimatePresence>

				{/* Mental model callout */}
				<div className="rounded-xl border border-zinc-700 bg-zinc-800/30 p-4 space-y-2 text-xs">
					<p className="text-zinc-300 font-medium">Mental model</p>
					<p className="text-zinc-400">
						<span className="text-violet-300 font-medium">RSC</span> = split
						your component tree by runtime environment (server vs client).
						Decides WHERE each component runs.
					</p>
					<p className="text-zinc-400">
						<span className="text-amber-300 font-medium">SSR</span> = generate
						HTML on the server for the initial page load. Decides WHEN HTML is
						produced.
					</p>
					<p className="text-zinc-500 mt-2">
						They compose: SSR + RSC gives you HTML on first load (SSR) with
						minimal client bundle and selective hydration (RSC). You almost
						always want both in a production Next.js app.
					</p>
				</div>
			</div>
		</DemoSection>
	);
}
