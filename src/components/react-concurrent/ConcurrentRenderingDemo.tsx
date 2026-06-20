import { motion } from "motion/react";
import { memo, useMemo, useState, useTransition } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

type Mode = "synchronous" | "transition";
type Dataset = "small" | "heavy";

const ALL_ITEMS = Array.from({ length: 10000 }, (_, i) => ({
	id: i,
	name: `Item ${i} — ${["React", "Vue", "Angular", "Svelte", "Solid", "Preact", "Qwik", "Astro"][i % 8]}`,
}));

// CPU-heavy render: inner loop burns ~200ms for the heavy dataset
function heavyFilter(items: typeof ALL_ITEMS, count: number) {
	const results: typeof ALL_ITEMS = [];
	for (const item of items) {
		if (results.length >= count) break;
		let sum = 0;
		for (let j = 0; j < 300; j++) {
			sum += Math.sqrt(j);
		}
		if (sum >= 0) results.push(item);
	}
	return results;
}

// Separate memo'd component — React can schedule this independently from the
// urgent render (button state, isPending) that commits immediately on click.
const ItemList = memo(function ItemList({ dataset }: { dataset: Dataset }) {
	const items = useMemo(
		() => heavyFilter(ALL_ITEMS, dataset === "heavy" ? 10000 : 100),
		[dataset],
	);

	return (
		<div className="h-48 overflow-y-auto rounded-lg bg-zinc-800/50 border border-zinc-700/50">
			{items.map((item) => (
				<div
					key={item.id}
					className="px-3 py-1.5 text-sm text-zinc-300 border-b border-zinc-800/50 last:border-b-0"
				>
					{item.name}
				</div>
			))}
		</div>
	);
});

export function ConcurrentRenderingDemo() {
	const [mode, setMode] = useState<Mode>("synchronous");
	const [dataset, setDataset] = useState<Dataset>("small");
	const [pendingTarget, setPendingTarget] = useState<Dataset | null>(null);
	const [isPending, startTransition] = useTransition();

	function handleDatasetChange(next: Dataset) {
		if (mode === "transition") {
			setPendingTarget(next);
			startTransition(() => {
				setDataset(next);
				setPendingTarget(null);
			});
		} else {
			setDataset(next);
		}
	}

	const DATASETS: { key: Dataset; label: string; count: string }[] = [
		{ key: "small", label: "Small", count: "100 items" },
		{ key: "heavy", label: "Heavy", count: "10k items (~200ms)" },
	];

	return (
		<DemoSection
			title="The Scheduler: Urgent vs Transition Work"
			description="Click 'Heavy' to trigger a slow render. Toggle modes to see how React's priority scheduler keeps the UI responsive."
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
							onClick={() => setMode("transition")}
							className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
								mode === "transition"
									? "bg-emerald-500/20 text-emerald-400"
									: "text-zinc-400 hover:text-white"
							}`}
						>
							Transition
						</button>
					</div>

					{isPending && mode === "transition" && (
						<motion.span
							initial={{ opacity: 0, scale: 0.8 }}
							animate={{ opacity: 1, scale: 1 }}
							className="px-2 py-1 rounded text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30"
						>
							isPending: true
						</motion.span>
					)}
				</div>

				{/* Dataset Buttons */}
				<div className="flex gap-3">
					{DATASETS.map(({ key, label, count }) => (
						<button
							key={key}
							type="button"
							onClick={() => handleDatasetChange(key)}
							className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
								dataset === key
									? "bg-violet-500/20 text-violet-300 border-violet-500/30"
									: "bg-zinc-800 text-zinc-400 hover:text-white border-zinc-700"
							}`}
						>
							{isPending && mode === "transition" && pendingTarget === key && (
								<span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
							)}
							{label}
							<span className="ml-2 text-xs text-zinc-500">({count})</span>
						</button>
					))}
				</div>

				{/* Scheduler Timeline Visualization */}
				<div className="bg-zinc-800/50 rounded-lg p-4 space-y-4">
					<h4 className="text-sm font-medium text-zinc-300">
						What happens when you click "Heavy"
					</h4>

					{/* Synchronous */}
					{mode === "synchronous" && (
						<div className="space-y-1">
							<div className="flex items-center gap-2 text-xs">
								<span className="w-24 shrink-0 text-red-400 font-medium">
									Synchronous
								</span>
								<div className="flex-1 flex h-7 rounded overflow-hidden">
									<div className="bg-violet-500/30 border border-violet-500/50 flex items-center justify-center text-[10px] text-violet-300 w-[10%]">
										click
									</div>
									<div className="bg-red-500/40 border border-red-500/50 flex items-center justify-center text-[10px] text-red-300 w-[80%]">
										Render 10k items (~200ms) — UI frozen ⛔
									</div>
									<div className="bg-zinc-600/50 flex items-center justify-center text-[10px] text-zinc-400 w-[10%]">
										done
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Transition — two lanes */}
					{mode === "transition" && (
						<div className="space-y-2">
							{/* Urgent lane */}
							<div className="flex items-center gap-2 text-xs">
								<span className="w-24 shrink-0 text-emerald-400 font-medium">
									Urgent lane
								</span>
								<div className="flex-1 flex h-7 rounded overflow-hidden gap-px">
									<div className="bg-violet-500/30 border border-violet-500/50 flex items-center justify-center text-[10px] text-violet-300 w-[10%]">
										click
									</div>
									<div className="bg-emerald-500/30 border border-emerald-500/50 flex items-center justify-center text-[10px] text-emerald-300 w-[25%]">
										isPending = true ✓
									</div>
									<div className="bg-zinc-700/30 border border-zinc-600/50 flex items-center justify-center text-[10px] text-zinc-500 w-[55%]">
										responsive — new clicks land here
									</div>
									<div className="bg-emerald-500/30 border border-emerald-500/50 flex items-center justify-center text-[10px] text-emerald-300 w-[10%]">
										done
									</div>
								</div>
							</div>

							{/* Transition lane */}
							<div className="flex items-center gap-2 text-xs">
								<span className="w-24 shrink-0 text-amber-400 font-medium">
									Transition lane
								</span>
								<div className="flex-1 flex h-7 rounded overflow-hidden gap-px">
									<div className="bg-zinc-800/50 w-[10%]" />
									<div className="bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[10px] text-amber-300 w-[20%]">
										chunk
									</div>
									<div className="bg-zinc-800/50 flex items-center justify-center text-[10px] text-zinc-600 w-[5%]">
										yield
									</div>
									<div className="bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[10px] text-amber-300 w-[20%]">
										chunk
									</div>
									<div className="bg-zinc-800/50 flex items-center justify-center text-[10px] text-zinc-600 w-[5%]">
										yield
									</div>
									<div className="bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[10px] text-amber-300 w-[20%]">
										chunk → commit
									</div>
									<div className="bg-zinc-800/50 w-[20%]" />
								</div>
							</div>

							<p className="text-[10px] text-zinc-500">
								A new urgent click (e.g. back to Small) discards the in-flight
								transition chunks and restarts from the latest state — no stale
								render committed.
							</p>
						</div>
					)}
				</div>

				{/* Results */}
				<div
					className={`transition-opacity duration-200 ${
						isPending && mode === "transition" ? "opacity-60" : "opacity-100"
					}`}
				>
					<div className="flex items-center justify-between mb-2">
						<span className="text-sm text-zinc-400">
							{isPending && pendingTarget ? (
								<>
									Loading:{" "}
									<span className="text-amber-300">
										{pendingTarget === "heavy" ? "10,000" : "100"} items...
									</span>
								</>
							) : (
								<>
									Showing:{" "}
									<span className="text-violet-300">
										{dataset === "heavy" ? "10,000" : "100"} items
									</span>
								</>
							)}
						</span>
						{mode === "transition" && !isPending && (
							<span className="text-xs text-zinc-500">
								Try clicking Heavy → then immediately click Small
							</span>
						)}
					</div>
					<ItemList dataset={dataset} />
				</div>

				{/* Code Example */}
				<ShikiCode
					language="tsx"
					code={`// ❌ Synchronous: setDataset runs eagerly — React blocks the main
// thread for the entire render before yielding back to the browser.
function handleClick(next: Dataset) {
  setDataset(next); // freezes UI until ItemList finishes rendering
}

// ✅ Transition: React commits the urgent update (isPending = true)
// immediately, then renders ItemList in interruptible chunks.
// A new click discards the in-flight render and restarts from latest state.
const [isPending, startTransition] = useTransition();

function handleClick(next: Dataset) {
  startTransition(() => {
    setDataset(next); // low-priority — can be preempted
  });
}

// Key: ItemList must be a separate memo'd component so React can
// schedule its re-render independently from the urgent commit.
const ItemList = memo(({ dataset }: { dataset: Dataset }) => {
  const items = useMemo(() => heavyFilter(allItems, dataset), [dataset]);
  return <ul>{items.map(item => <li key={item.id}>{item.name}</li>)}</ul>;
});`}
					showLineNumbers={false}
					className="text-xs"
				/>

				<p className="text-xs text-zinc-500 italic">
					React's concurrent scheduler doesn't make computation faster — it
					makes the UI feel faster by letting urgent work (button highlight,
					isPending) commit immediately while expensive work runs in
					low-priority interruptible chunks. The next demo covers the{" "}
					<code className="text-violet-300">useTransition</code> API in depth.
				</p>
			</div>
		</DemoSection>
	);
}
