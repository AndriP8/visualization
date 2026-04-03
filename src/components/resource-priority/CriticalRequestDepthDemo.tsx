import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { Protocol } from "./types";

type DepthState = "bad" | "transforming" | "good";

interface WaterfallItem {
	id: string;
	name: string;
	start: number;
	end: number;
	depth: number;
	color: string;
}

interface Dependency {
	from: string;
	to: string;
}

interface CriticalRequestDepthDemoProps {
	protocol: Protocol;
}

export default function CriticalRequestDepthDemo({
	protocol: _protocol,
}: CriticalRequestDepthDemoProps) {
	const [state, setState] = useState<DepthState>("bad");

	const badWaterfall: WaterfallItem[] = [
		{ id: "html", name: "HTML", start: 0, end: 200, depth: 1, color: "violet" },
		{
			id: "css",
			name: "styles.css",
			start: 200,
			end: 500,
			depth: 2,
			color: "cyan",
		},
		{
			id: "icons",
			name: "icons.css (@import)",
			start: 500,
			end: 700,
			depth: 3,
			color: "amber",
		},
		{
			id: "font",
			name: "font.woff2",
			start: 700,
			end: 1100,
			depth: 4,
			color: "rose",
		},
	];

	const badDependencies: Dependency[] = [
		{ from: "html", to: "css" },
		{ from: "css", to: "icons" },
		{ from: "icons", to: "font" },
	];

	const goodWaterfall: WaterfallItem[] = [
		{ id: "html", name: "HTML", start: 0, end: 200, depth: 1, color: "violet" },
		{
			id: "css",
			name: "styles.css",
			start: 200,
			end: 500,
			depth: 2,
			color: "cyan",
		},
		{
			id: "font",
			name: "font.woff2 (preload)",
			start: 200,
			end: 600,
			depth: 2,
			color: "rose",
		},
	];

	const goodDependencies: Dependency[] = [
		{ from: "html", to: "css" },
		{ from: "html", to: "font" },
	];

	const waterfall = state === "bad" ? badWaterfall : goodWaterfall;
	const dependencies = state === "bad" ? badDependencies : goodDependencies;
	const maxDepth = state === "bad" ? 4 : 2;
	const criticalPath = state === "bad" ? 1100 : 600;

	const SCALE = 0.8;
	const BAR_HEIGHT = 40;
	const BAR_SPACING = 60;

	const applyFixes = () => {
		setState("transforming");
		setTimeout(() => setState("good"), 500);
	};

	const resetTooBad = () => {
		setState("bad");
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<div
						className={`px-3 py-1 rounded text-sm font-medium ${
							state === "bad"
								? "bg-rose-500/20 text-accent-rose border border-rose-500/50"
								: "bg-green-500/20 text-accent-green border border-green-500/50"
						}`}
					>
						{state === "bad" ? "❌ Bad: Depth 4" : "✓ Good: Depth 2"}
					</div>
					<div className="text-sm text-text-tertiary">
						Critical Path:{" "}
						<span className="text-text-primary font-medium">
							{criticalPath}ms
						</span>
					</div>
				</div>
				<div className="flex gap-2">
					{state === "bad" && (
						<button
							type="button"
							onClick={applyFixes}
							className="px-4 py-2 bg-green-500 text-text-primary rounded-md text-sm font-medium hover:bg-green-600 transition-colors"
						>
							Apply Fixes
						</button>
					)}
					{state === "good" && (
						<button
							type="button"
							onClick={resetTooBad}
							className="px-4 py-2 bg-surface-tertiary text-text-primary rounded-md text-sm font-medium hover:bg-surface-tertiary transition-colors"
						>
							Reset
						</button>
					)}
				</div>
			</div>

			{/* Waterfall Visualization */}
			<div className="p-6 bg-surface-primary rounded border border-border-primary overflow-x-auto">
				<div
					className="relative min-w-max"
					style={{ height: waterfall.length * BAR_SPACING + 40 }}
				>
					{/* SVG for dependency arrows */}
					<svg
						className="absolute inset-0 pointer-events-none"
						style={{ width: "100%", height: "100%" }}
						aria-label="Dependency arrows between resources"
					>
						<title>Resource Dependency Arrows</title>
						<defs>
							<marker
								id="arrowhead"
								markerWidth="10"
								markerHeight="10"
								refX="9"
								refY="3"
								orient="auto"
							>
								<polygon points="0 0, 10 3, 0 6" fill="#8b5cf6" />
							</marker>
						</defs>
						<AnimatePresence mode="wait">
							{dependencies.map((dep) => {
								const fromItem = waterfall.find((w) => w.id === dep.from);
								const toItem = waterfall.find((w) => w.id === dep.to);

								if (!fromItem || !toItem) return null;

								const fromIndex = waterfall.indexOf(fromItem);
								const toIndex = waterfall.indexOf(toItem);

								const x1 = fromItem.end * SCALE;
								const y1 = fromIndex * BAR_SPACING + BAR_HEIGHT / 2;
								const x2 = toItem.start * SCALE;
								const y2 = toIndex * BAR_SPACING + BAR_HEIGHT / 2;

								return (
									<motion.line
										key={`${dep.from}-${dep.to}`}
										x1={x1}
										y1={y1}
										x2={x2}
										y2={y2}
										stroke="#8b5cf6"
										strokeWidth={2}
										markerEnd="url(#arrowhead)"
										initial={{ pathLength: 0, opacity: 0 }}
										animate={{ pathLength: 1, opacity: 1 }}
										exit={{ pathLength: 0, opacity: 0 }}
										transition={{ duration: 0.5 }}
									/>
								);
							})}
						</AnimatePresence>
					</svg>

					{/* Waterfall bars */}
					<AnimatePresence mode="wait">
						{waterfall.map((item, index) => {
							const colorClasses = {
								violet: "bg-violet-500/20 border-violet-500/50",
								cyan: "bg-cyan-500/20 border-cyan-500/50",
								amber: "bg-amber-500/20 border-amber-500/50",
								rose: "bg-rose-500/20 border-rose-500/50",
							};

							const textColorClasses = {
								violet: "text-accent-violet",
								cyan: "text-accent-cyan",
								amber: "text-accent-amber",
								rose: "text-accent-rose",
							};

							return (
								<motion.div
									key={item.id}
									layout
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: 20 }}
									transition={{ duration: 0.3 }}
									className="absolute"
									style={{
										top: index * BAR_SPACING,
										left: item.start * SCALE,
										width: (item.end - item.start) * SCALE,
										height: BAR_HEIGHT,
									}}
								>
									<div
										className={`h-full rounded border ${colorClasses[item.color as keyof typeof colorClasses]} flex items-center justify-between px-3`}
									>
										<span className="text-sm font-medium text-text-primary">
											{item.name}
										</span>
										<span
											className={`text-xs ${textColorClasses[item.color as keyof typeof textColorClasses]}`}
										>
											{item.end - item.start}ms
										</span>
									</div>
								</motion.div>
							);
						})}
					</AnimatePresence>
				</div>
			</div>

			{/* Metrics Panel */}
			<div className="grid md:grid-cols-2 gap-4">
				<div className="p-4 bg-surface-primary rounded border border-border-primary">
					<div className="text-sm text-text-tertiary mb-1">
						Critical Request Depth
					</div>
					<motion.div
						key={maxDepth}
						initial={{ scale: 1.2 }}
						animate={{ scale: 1 }}
						className="text-3xl font-bold text-text-primary"
					>
						{maxDepth}
					</motion.div>
				</div>
				<div className="p-4 bg-surface-primary rounded border border-border-primary">
					<div className="text-sm text-text-tertiary mb-1">
						Critical Path Duration
					</div>
					<motion.div
						key={criticalPath}
						initial={{ scale: 1.2 }}
						animate={{ scale: 1 }}
						className="text-3xl font-bold text-text-primary"
					>
						{criticalPath}ms
					</motion.div>
				</div>
			</div>

			{/* Explanation */}
			<div className="p-4 bg-surface-primary rounded border border-border-primary space-y-3">
				<h4 className="text-sm font-medium text-text-primary">
					{state === "bad" ? "Problem" : "Solution"}
				</h4>
				{state === "bad" ? (
					<div className="text-sm text-text-tertiary space-y-2">
						<p>The browser discovers resources sequentially:</p>
						<ol className="list-decimal list-inside space-y-1 ml-2">
							<li>HTML loads → discovers CSS link</li>
							<li>CSS loads → discovers @import for icons.css</li>
							<li>icons.css loads → discovers font-face</li>
							<li>Font loads → finally LCP can happen</li>
						</ol>
						<p className="text-accent-rose font-medium">
							Total: 1100ms, depth of 4 requests
						</p>
					</div>
				) : (
					<div className="text-sm text-text-tertiary space-y-2">
						<p>
							Using{" "}
							<code className="text-accent-violet bg-surface-secondary px-1 rounded">
								{'<link rel="preload" as="font">'}
							</code>{" "}
							in HTML:
						</p>
						<ol className="list-decimal list-inside space-y-1 ml-2">
							<li>HTML loads → discovers both CSS and font</li>
							<li>CSS and font load in parallel</li>
							<li>LCP happens as soon as font is ready</li>
						</ol>
						<p className="text-accent-green font-medium">
							Total: 600ms, depth of 2 requests (500ms saved!)
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
