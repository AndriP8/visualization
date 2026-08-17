import { motion } from "motion/react";
import {
	memo,
	useCallback,
	useDeferredValue,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

type Mode = "immediate" | "deferred";

const ALL_ITEMS = Array.from({ length: 2000 }, (_, i) => ({
	id: i,
	name: `${["useEffect", "useState", "useMemo", "useCallback", "useRef", "useContext", "useReducer", "useTransition"][i % 8]} example #${i}`,
}));

function heavyFilter(items: typeof ALL_ITEMS, query: string) {
	if (!query) return items.slice(0, 100);
	const lower = query.toLowerCase();
	const results: typeof ALL_ITEMS = [];
	for (const item of items) {
		// Synthetic CPU burn; sum check prevents dead-code elimination.
		let sum = 0;
		for (let j = 0; j < 200; j++) {
			sum += Math.sqrt(j);
		}
		if (item.name.toLowerCase().includes(lower) && sum >= 0) {
			results.push(item);
		}
	}
	return results.slice(0, 200);
}

interface KeystrokeEvent {
	id: number;
	type: "input" | "render";
	timestamp: number;
}

// ─── Separate component so React can defer this render independently ─────────

const FilteredList = memo(function FilteredList({
	query,
	activeQuery,
	isStale,
	onRender,
}: {
	query: string;
	activeQuery: string;
	isStale: boolean;
	onRender: (timestamp: number) => void;
}) {
	const filtered = useMemo(() => heavyFilter(ALL_ITEMS, query), [query]);

	// Fires after this component actually commits — captures the real render time
	// biome-ignore lint/correctness/useExhaustiveDependencies: report render event after commit
	useEffect(() => {
		onRender(performance.now());
	}, [filtered]);

	return (
		<div className="relative">
			<div
				className={`transition-opacity duration-200 ${isStale ? "opacity-50" : "opacity-100"}`}
			>
				<div className="flex items-center justify-between mb-2">
					<span className="text-sm text-zinc-400">
						{filtered.length} results
						{filtered.length === 200 ? " (capped)" : ""}
					</span>
					<span className="text-xs text-zinc-500">
						Showing: "{activeQuery || "(all)"}"
					</span>
				</div>
				<div className="h-40 overflow-y-auto rounded-lg bg-zinc-800/50 border border-zinc-700/50">
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
			{isStale && (
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					className="absolute inset-0 flex items-center justify-center pointer-events-none"
				>
					<span className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 text-sm font-medium border border-amber-500/30 backdrop-blur-sm">
						Updating...
					</span>
				</motion.div>
			)}
		</div>
	);
});

export function DeferredValueDemo() {
	const [query, setQuery] = useState("");
	const [mode, setMode] = useState<Mode>("immediate");
	const [events, setEvents] = useState<KeystrokeEvent[]>([]);
	const eventIdRef = useRef(0);
	const timelineStartRef = useRef(0);

	const deferredQuery = useDeferredValue(query);
	// In deferred mode, FilteredList receives deferredQuery — React skips it
	// during urgent keystroke renders and schedules it at low priority.
	const activeQuery = mode === "deferred" ? deferredQuery : query;
	const isStale = mode === "deferred" && query !== deferredQuery;

	// Track input events in the parent (fires on every keystroke immediately)
	function handleInput(value: string) {
		if (timelineStartRef.current === 0) {
			timelineStartRef.current = performance.now();
		}
		const id = ++eventIdRef.current;
		setQuery(value);
		setEvents((prev) => [
			...prev.slice(-20),
			{
				id,
				type: "input",
				timestamp: performance.now() - timelineStartRef.current,
			},
		]);
	}

	// Callback passed to FilteredList — fires when that component actually renders
	// Stable reference via useCallback so memo() on FilteredList isn't defeated
	const handleRender = useCallback((timestamp: number) => {
		if (timelineStartRef.current === 0) return;
		const id = ++eventIdRef.current;
		setEvents((prev) => [
			...prev.slice(-20),
			{
				id,
				type: "render",
				timestamp: timestamp - timelineStartRef.current,
			},
		]);
	}, []);

	// Reset timeline when query is cleared
	useEffect(() => {
		if (!query) {
			setEvents([]);
			timelineStartRef.current = 0;
		}
	}, [query]);

	const maxTime = events.reduce((max, e) => Math.max(max, e.timestamp), 1);

	return (
		<DemoSection
			title="Demo 3: useDeferredValue — Keeping Input Snappy"
			description="Type fast to see how useDeferredValue keeps the input responsive while the expensive list update trails behind."
		>
			<div className="space-y-6">
				{/* Mode Toggle */}
				<div className="flex items-center justify-between">
					<div className="flex bg-zinc-800 rounded-lg p-1">
						<button
							type="button"
							onClick={() => {
								setMode("immediate");
								setQuery("");
							}}
							className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
								mode === "immediate"
									? "bg-red-500/20 text-red-400"
									: "text-zinc-400 hover:text-white"
							}`}
						>
							Immediate
						</button>
						<button
							type="button"
							onClick={() => {
								setMode("deferred");
								setQuery("");
							}}
							className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
								mode === "deferred"
									? "bg-emerald-500/20 text-emerald-400"
									: "text-zinc-400 hover:text-white"
							}`}
						>
							Deferred
						</button>
					</div>

					{isStale && (
						<motion.span
							initial={{ opacity: 0, scale: 0.8 }}
							animate={{ opacity: 1, scale: 1 }}
							className="px-2 py-1 rounded text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30"
						>
							Stale
						</motion.span>
					)}
				</div>

				{/* Input */}
				<input
					type="text"
					value={query}
					onChange={(e) => handleInput(e.target.value)}
					placeholder="Type fast (try 'useEffect', 'useState')..."
					className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
				/>

				{/* Live divergence tracker */}
				{query && mode === "deferred" && (
					<div className="bg-zinc-800/50 rounded-lg p-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
						<div className="flex items-center gap-2">
							<span className="text-zinc-500">Input:</span>
							<code className="text-violet-300 font-mono">"{query}"</code>
						</div>
						<div className="text-zinc-700">→</div>
						<div className="flex items-center gap-2">
							<span className="text-zinc-500">List filtering:</span>
							<code
								className={`font-mono transition-colors ${
									isStale ? "text-amber-400" : "text-emerald-400"
								}`}
							>
								"{deferredQuery}"
							</code>
							{isStale && (
								<span className="text-amber-500/70 text-[10px]">
									(deferred value catching up...)
								</span>
							)}
						</div>
					</div>
				)}

				{/* Keystroke Timeline — render events now come from FilteredList itself */}
				{events.length > 0 && (
					<div className="bg-zinc-800/50 rounded-lg p-4 space-y-2">
						<h4 className="text-sm font-medium text-zinc-300">
							Event Timeline
						</h4>
						<div className="relative h-16 rounded bg-zinc-900 overflow-hidden">
							{/* Input events - top row */}
							<div className="absolute top-0 left-0 right-0 h-8 flex items-center">
								<span className="absolute left-1 text-[10px] text-violet-400 z-10">
									Input
								</span>
								{events
									.filter((e) => e.type === "input")
									.map((e) => (
										<motion.div
											key={e.id}
											className="absolute top-1 w-1.5 h-6 bg-violet-500 rounded-full"
											style={{
												left: `${(e.timestamp / maxTime) * 95 + 5}%`,
											}}
											initial={{ scaleY: 0 }}
											animate={{ scaleY: 1 }}
											transition={{ duration: 0.1 }}
										/>
									))}
							</div>
							{/* Render events - bottom row */}
							<div className="absolute bottom-0 left-0 right-0 h-8 flex items-center">
								<span className="absolute left-1 text-[10px] text-emerald-400 z-10">
									Render
								</span>
								{events
									.filter((e) => e.type === "render")
									.map((e) => (
										<motion.div
											key={e.id}
											className="absolute bottom-1 w-1.5 h-6 bg-emerald-500 rounded-full"
											style={{
												left: `${(e.timestamp / maxTime) * 95 + 5}%`,
											}}
											initial={{ scaleY: 0 }}
											animate={{ scaleY: 1 }}
											transition={{ duration: 0.1 }}
										/>
									))}
							</div>
						</div>
						<p className="text-[10px] text-zinc-500">
							In deferred mode, input events (violet) fire immediately while
							render events (green) batch and trail behind.
						</p>
					</div>
				)}

				{/* Results — FilteredList owns its own render, parent just wraps it */}
				<FilteredList
					query={activeQuery}
					activeQuery={activeQuery}
					isStale={isStale}
					onRender={handleRender}
				/>

				{/* When to use which */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="bg-violet-500/5 border border-violet-500/20 rounded-lg p-4">
						<h5 className="text-sm font-semibold text-violet-300 mb-2">
							useDeferredValue
						</h5>
						<p className="text-xs text-zinc-400">
							Use when you receive a value as a prop or can't wrap the setter.
							It wraps the <em>value</em>.
						</p>
					</div>
					<div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
						<h5 className="text-sm font-semibold text-emerald-300 mb-2">
							useTransition
						</h5>
						<p className="text-xs text-zinc-400">
							Use when you own the state setter. It wraps the{" "}
							<em>state update</em>.
						</p>
					</div>
				</div>

				{/* Code Example */}
				<ShikiCode
					language="tsx"
					code={`// ✅ The key: FilteredList is a separate memo'd component.
// React commits the input render immediately (query updates),
// then defers FilteredList's re-render until the thread is free.
const FilteredList = memo(({ query }: { query: string }) => {
  const filtered = useMemo(() => heavyFilter(items, query), [query]);
  return <ul>{filtered.map(item => <li key={item.id}>{item.name}</li>)}</ul>;
});

function SearchPage() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery;

  return (
    <>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <div style={{ opacity: isStale ? 0.6 : 1 }}>
        <FilteredList query={deferredQuery} />
      </div>
    </>
  );
}`}
					showLineNumbers={false}
					className="text-xs"
				/>

				<p className="text-xs text-zinc-500 italic">
					useDeferredValue does NOT debounce — it shows the latest value React
					has time for. Under light load, it's nearly instant. The separation
					into a child component is what gives React the scheduling flexibility.
					In deferred mode, React renders the child twice: once with the
					previous value (committed immediately), then again at low priority
					with the new value once the thread is free.
				</p>
			</div>
		</DemoSection>
	);
}
