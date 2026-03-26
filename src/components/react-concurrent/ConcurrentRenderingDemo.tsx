import { AnimatePresence, motion } from "motion/react";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

type Mode = "synchronous" | "deferred";

// Generate 10k items once
const ALL_ITEMS = Array.from({ length: 10000 }, (_, i) => ({
	id: i,
	name: `Item ${i} — ${["React", "Vue", "Angular", "Svelte", "Solid", "Preact", "Qwik", "Astro"][i % 8]}`,
}));

// CPU-heavy filter: inner loop burns ~200ms for broad queries
function heavyFilter(items: typeof ALL_ITEMS, query: string) {
	if (!query) return items.slice(0, 100);
	const lower = query.toLowerCase();
	const results: typeof ALL_ITEMS = [];
	for (const item of items) {
		// Simulate expensive computation per item
		let sum = 0;
		for (let j = 0; j < 300; j++) {
			sum += Math.sqrt(j);
		}
		if (item.name.toLowerCase().includes(lower) && sum >= 0) {
			results.push(item);
		}
	}
	return results.slice(0, 200);
}

export function ConcurrentRenderingDemo() {
	const [query, setQuery] = useState("");
	const [mode, setMode] = useState<Mode>("synchronous");

	const deferredQuery = useDeferredValue(query);

	// In deferred mode, compute from deferredQuery so the heavy work runs
	// in the deferred render pass, not the urgent input render pass.
	// In sync mode, compute immediately from query.
	const activeQuery = mode === "deferred" ? deferredQuery : query;

	// isStale is true while deferredQuery hasn't caught up to query yet.
	// This correctly reflects React scheduling: the urgent re-render (input update)
	// has committed but the deferred re-render hasn't started yet.
	const isStale = mode === "deferred" && query !== deferredQuery;

	// Track render time using a ref so we don't trigger extra renders
	const renderTimeRef = useRef(0);
	const [renderTime, setRenderTime] = useState(0);

	const filtered = useMemo(() => {
		const start = performance.now();
		const items = heavyFilter(ALL_ITEMS, activeQuery);
		renderTimeRef.current = performance.now() - start;
		return items;
	}, [activeQuery]);

	// Sync renderTimeRef → state after each committed render
	// biome-ignore lint/correctness/useExhaustiveDependencies: <For sync renderTimeRef → state after each committed render>
	useEffect(() => {
		setRenderTime(renderTimeRef.current);
	}, [filtered]);

	return (
		<DemoSection
			title="Concurrent Rendering vs Blocking"
			description="Type in the input to filter 10,000 items with heavy computation. Toggle modes to see how useDeferredValue keeps input responsive."
		>
			<div className="space-y-6">
				{/* Mode Toggle */}
				<div className="flex items-center justify-between">
					<div className="flex bg-zinc-800 rounded-lg p-1">
						<button
							type="button"
							onClick={() => setMode("synchronous")}
							className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
								mode === "synchronous"
									? "bg-red-500/20 text-red-400"
									: "text-zinc-400 hover:text-white"
							}`}
						>
							Synchronous
						</button>
						<button
							type="button"
							onClick={() => setMode("deferred")}
							className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
								mode === "deferred"
									? "bg-emerald-500/20 text-emerald-400"
									: "text-zinc-400 hover:text-white"
							}`}
						>
							Deferred
						</button>
					</div>

					<div className="flex items-center gap-3">
						{isStale && (
							<motion.span
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{ opacity: 1, scale: 1 }}
								className="px-2 py-1 rounded text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30"
							>
								Rendering...
							</motion.span>
						)}
						<span className="text-xs text-zinc-500">
							Last render: {renderTime.toFixed(0)}ms
						</span>
					</div>
				</div>

				{/* Input */}
				<input
					type="text"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Type to filter (try 'react', 'vue', 'angular')..."
					className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
				/>

				{/* Thread Timeline Visualization */}
				<div className="bg-zinc-800/50 rounded-lg p-4 space-y-3">
					<h4 className="text-sm font-medium text-zinc-300">
						Main Thread Timeline
					</h4>

					<AnimatePresence mode="wait">
						{mode === "synchronous" ? (
							<motion.div
								key="sync"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className="space-y-2"
							>
								<div className="flex items-center gap-2 text-xs text-zinc-400">
									<span className="w-16 shrink-0">Blocking</span>
									<div className="flex-1 flex h-8 rounded overflow-hidden">
										<motion.div
											className="bg-violet-500/30 border border-violet-500/50 flex items-center justify-center text-[10px] text-violet-300"
											style={{ width: "10%" }}
											initial={{ scaleX: 0 }}
											animate={{ scaleX: 1 }}
											transition={{ duration: 0.3 }}
										>
											Input
										</motion.div>
										<motion.div
											className="bg-red-500/30 border border-red-500/50 flex items-center justify-center text-[10px] text-red-300"
											style={{ width: "70%" }}
											initial={{ scaleX: 0 }}
											animate={{ scaleX: 1 }}
											transition={{ duration: 0.5, delay: 0.2 }}
										>
											Filter + Render (UI frozen)
										</motion.div>
										<motion.div
											className="bg-violet-500/30 border border-violet-500/50 flex items-center justify-center text-[10px] text-violet-300"
											style={{ width: "10%" }}
											initial={{ scaleX: 0 }}
											animate={{ scaleX: 1 }}
											transition={{ duration: 0.3, delay: 0.5 }}
										>
											Input
										</motion.div>
										<motion.div
											className="bg-red-500/30 border border-red-500/50 flex items-center justify-center text-[10px] text-red-300"
											style={{ width: "10%" }}
											initial={{ scaleX: 0 }}
											animate={{ scaleX: 1 }}
											transition={{ duration: 0.3, delay: 0.6 }}
										>
											...
										</motion.div>
									</div>
								</div>
								<p className="text-[10px] text-zinc-500">
									Every keystroke blocks until filter completes. Input can't
									update until render finishes.
								</p>
							</motion.div>
						) : (
							<motion.div
								key="deferred"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className="space-y-2"
							>
								<div className="flex items-center gap-2 text-xs text-zinc-400">
									<span className="w-16 shrink-0">Deferred</span>
									<div className="flex-1 flex h-8 rounded overflow-hidden gap-0.5">
										<motion.div
											className="bg-violet-500/30 border border-violet-500/50 flex items-center justify-center text-[10px] text-violet-300"
											style={{ width: "8%" }}
											initial={{ scaleX: 0 }}
											animate={{ scaleX: 1 }}
											transition={{ duration: 0.2 }}
										>
											r
										</motion.div>
										<motion.div
											className="bg-violet-500/30 border border-violet-500/50 flex items-center justify-center text-[10px] text-violet-300"
											style={{ width: "8%" }}
											initial={{ scaleX: 0 }}
											animate={{ scaleX: 1 }}
											transition={{ duration: 0.2, delay: 0.1 }}
										>
											e
										</motion.div>
										<motion.div
											className="bg-violet-500/30 border border-violet-500/50 flex items-center justify-center text-[10px] text-violet-300"
											style={{ width: "8%" }}
											initial={{ scaleX: 0 }}
											animate={{ scaleX: 1 }}
											transition={{ duration: 0.2, delay: 0.2 }}
										>
											a
										</motion.div>
										<motion.div
											className="bg-violet-500/30 border border-violet-500/50 flex items-center justify-center text-[10px] text-violet-300"
											style={{ width: "8%" }}
											initial={{ scaleX: 0 }}
											animate={{ scaleX: 1 }}
											transition={{ duration: 0.2, delay: 0.3 }}
										>
											c
										</motion.div>
										<motion.div
											className="bg-violet-500/30 border border-violet-500/50 flex items-center justify-center text-[10px] text-violet-300"
											style={{ width: "8%" }}
											initial={{ scaleX: 0 }}
											animate={{ scaleX: 1 }}
											transition={{ duration: 0.2, delay: 0.4 }}
										>
											t
										</motion.div>
										<motion.div
											className="bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[10px] text-amber-300"
											style={{ width: "12%" }}
											initial={{ scaleX: 0 }}
											animate={{ scaleX: 1 }}
											transition={{ duration: 0.2, delay: 0.5 }}
										>
											idle
										</motion.div>
										<motion.div
											className="bg-emerald-500/30 border border-emerald-500/50 flex items-center justify-center text-[10px] text-emerald-300"
											style={{ width: "38%" }}
											initial={{ scaleX: 0 }}
											animate={{ scaleX: 1 }}
											transition={{ duration: 0.4, delay: 0.6 }}
										>
											Deferred render ("react")
										</motion.div>
										<motion.div
											className="bg-zinc-600/50 flex items-center justify-center text-[10px] text-zinc-400"
											style={{ width: "10%" }}
											initial={{ scaleX: 0 }}
											animate={{ scaleX: 1 }}
											transition={{ duration: 0.2, delay: 0.9 }}
										>
											Done
										</motion.div>
									</div>
								</div>
								<p className="text-[10px] text-zinc-500">
									Input updates at high priority. The deferred render runs at
									lower priority — React may skip superseded intermediate
									values.
								</p>
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				{/* Results */}
				<div
					className={`transition-opacity duration-200 ${isStale ? "opacity-60" : "opacity-100"}`}
				>
					<div className="flex items-center justify-between mb-2">
						<span className="text-sm text-zinc-400">
							{filtered.length} results
							{filtered.length === 200 ? " (capped)" : ""}
						</span>
					</div>
					<div className="h-48 overflow-y-auto rounded-lg bg-zinc-800/50 border border-zinc-700/50">
						{filtered.map((item) => (
							<div
								key={item.id}
								className="px-3 py-1.5 text-sm text-zinc-300 border-b border-zinc-800/50 last:border-b-0"
							>
								{item.name}
							</div>
						))}
					</div>
				</div>

				{/* Code Example */}
				<ShikiCode
					language="tsx"
					code={`// Blocking: computed synchronously, freezes UI
function BlockingList({ query }: { query: string }) {
  const filtered = heavyFilter(allItems, query); // ~200ms
  return <ul>{filtered.map(item => <li key={item.id}>{item.name}</li>)}</ul>;
}

// Deferred: React can interrupt and yield to input
function DeferredList({ query }: { query: string }) {
  const deferredQuery = useDeferredValue(query);
  const filtered = heavyFilter(allItems, deferredQuery);
  return <ul>{filtered.map(item => <li key={item.id}>{item.name}</li>)}</ul>;
}`}
					showLineNumbers={false}
					className="text-xs"
				/>

				<p className="text-xs text-zinc-500 italic">
					React 18 concurrent rendering doesn't make computation faster — it
					makes the UI feel faster by keeping high-priority work (user input)
					unblocked.
				</p>
			</div>
		</DemoSection>
	);
}
