import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

// ─── Types ────────────────────────────────────────────────────────────────────

type LeakMode = "leaking" | "fixed";
type Scenario = "event-listener" | "stale-closure" | "unbounded-cache";

// ─── Code Snippets ────────────────────────────────────────────────────────────

const CODE: Record<Scenario, Record<LeakMode, string>> = {
	"event-listener": {
		leaking: `// ❌ Leaking: listener added but never removed
function ChatBox() {
  useEffect(() => {
    function handleResize() {
      // captures component state in closure
      console.log("resized");
    }
    window.addEventListener("resize", handleResize);
    // No cleanup! Each mount adds ANOTHER listener.
    // When component unmounts, the listener stays.
    // GC cannot collect handleResize — window holds it.
  }, []);
  return <div>Chat</div>;
}`,
		fixed: `// ✅ Fixed: cleanup function removes the listener
function ChatBox() {
  useEffect(() => {
    function handleResize() {
      console.log("resized");
    }
    window.addEventListener("resize", handleResize);

    // Cleanup runs on every unmount (and before
    // next effect re-run). Reference dropped → GC can act.
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  return <div>Chat</div>;
}`,
	},
	"stale-closure": {
		leaking: `// ❌ Leaking: closure captures a huge array
function DataView({ id }) {
  const [bigData, setBigData] = useState(
    () => new Array(100_000).fill(0) // ~800 KB
  );

  useEffect(() => {
    const timer = setInterval(() => {
      // This closure captures bigData.
      // Even after component unmounts, the interval
      // (and its closure) keeps bigData alive.
      console.log("items:", bigData.length);
    }, 1000);
    // No cleanup — interval outlives the component!
  }, []); // empty deps → stale closure

  return <div>{bigData.length} items</div>;
}`,
		fixed: `// ✅ Fixed: clear the interval on unmount
function DataView({ id }) {
  const [bigData, setBigData] = useState(
    () => new Array(100_000).fill(0)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      console.log("items:", bigData.length);
    }, 1000);

    // Cleanup clears the interval → closure released →
    // bigData can be GC'd once component unmounts.
    return () => clearInterval(timer);
  }, [bigData]); // correct deps too

  return <div>{bigData.length} items</div>;
}`,
	},
	"unbounded-cache": {
		leaking: `// ❌ Leaking: module-level Map grows forever
const cache = new Map<string, object>();

function UserCard({ userId }) {
  useEffect(() => {
    fetchUser(userId).then((data) => {
      // Key is a string — Map holds strong reference.
      // Even after UserCard unmounts, data stays in
      // cache indefinitely. The Map has no eviction.
      cache.set(userId, data);
    });
  }, [userId]);
}

// After 1000 navigations → cache holds 1000 large objects
// GC cannot collect any of them!`,
		fixed: `// ✅ Option A: WeakMap (keys are weak references)
// When the key object is GC'd, the entry is auto-evicted.
const cache = new WeakMap<object, object>();
// Note: keys must be objects, not strings.

// ✅ Option B: Explicit eviction with size limit
const MAX = 100;
const cache2 = new Map<string, object>();

function UserCard({ userId }) {
  useEffect(() => {
    fetchUser(userId).then((data) => {
      if (cache2.size >= MAX) {
        // Evict oldest (first inserted) key
        const first = cache2.keys().next().value;
        cache2.delete(first);
      }
      cache2.set(userId, data);
    });
  }, [userId]);
}`,
	},
};

// ─── Explanation text ─────────────────────────────────────────────────────────

const EXPLANATION: Record<Scenario, Record<LeakMode, string>> = {
	"event-listener": {
		leaking:
			"Each time this component mounts, it adds a new listener. On unmount, no cleanup runs — so the listener (and its closure capturing component state) remains attached to window. GC cannot collect it because window holds a live reference.",
		fixed:
			"The cleanup function calls removeEventListener, dropping the reference. Once the component unmounts, no live reference chain points to handleResize, so GC can collect it. The heap stays flat across mount/unmount cycles.",
	},
	"stale-closure": {
		leaking:
			"The interval callback closes over bigData (800 KB). Because there's no cleanup, the interval runs even after the component unmounts — keeping the closure and its captured bigData alive indefinitely.",
		fixed:
			"Returning clearInterval from useEffect ensures the interval is cleared when the component unmounts. The closure is released; bigData becomes unreachable and GC can collect ~800 KB.",
	},
	"unbounded-cache": {
		leaking:
			"A module-level Map with string keys holds strong references. After 1000 navigations, 1000 large objects are pinned in memory. No GC can help — every value has a live reference from the Map.",
		fixed:
			"WeakMap auto-evicts when the key object is GC'd. For string keys, use explicit LRU eviction: cap the Map size and delete the oldest entry before inserting. Either approach prevents unbounded growth.",
	},
};

// ─── Memory bar chart ─────────────────────────────────────────────────────────

const MAX_BARS = 20;
const MAX_HEIGHT = 80; // px (leaking peak)

function MemoryGraph({ mode }: { mode: LeakMode }) {
	const [samples, setSamples] = useState<number[]>([5]);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		// Clear existing interval before starting a new one
		if (intervalRef.current !== null) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}

		// Reset samples when mode changes
		setSamples([5]);

		intervalRef.current = setInterval(() => {
			setSamples((prev) => {
				const last = prev[prev.length - 1] ?? 5;
				let next: number;
				if (mode === "leaking") {
					// Grow with small random jitter, cap at MAX_HEIGHT-5
					next = Math.min(last + 3 + Math.random() * 3, MAX_HEIGHT - 5);
				} else {
					// GC periodically drops it back; otherwise stays roughly flat
					const tick = prev.length;
					next = tick % 7 === 0 ? 5 : 5 + Math.random() * 4;
				}
				const trimmed = prev.length >= MAX_BARS ? prev.slice(1) : prev;
				return [...trimmed, next];
			});
		}, 400);

		return () => {
			if (intervalRef.current !== null) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [mode]);

	return (
		<div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3">
			<div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
				Simulated Heap Usage Over Time
			</div>
			<div className="flex items-end gap-0.5 h-22.5">
				{Array.from({ length: MAX_BARS }, (_, i) => {
					const value = samples[i] ?? 0;
					const barHeight = (value / MAX_HEIGHT) * MAX_BARS * 4;
					return (
						<motion.div
							// biome-ignore lint/suspicious/noArrayIndexKey: positional bar slots — index IS the identity
							key={`slot-${i}`}
							className="flex-1 rounded-t"
							style={{
								height: `${barHeight}px`,
								backgroundColor:
									mode === "leaking"
										? `hsl(${Math.max(0, 120 - value * 1.5)}, 80%, 55%)`
										: "#22c55e",
								opacity: i < samples.length ? 1 : 0.15,
							}}
							animate={{ height: `${barHeight}px` }}
							transition={{ duration: 0.35 }}
						/>
					);
				})}
			</div>
			<div className="flex justify-between mt-1">
				<span className="text-[9px] text-zinc-600 font-mono">older</span>
				<span
					className={`text-[10px] font-semibold font-mono ${mode === "leaking" ? "text-red-400" : "text-emerald-400"}`}
				>
					{mode === "leaking" ? "📈 Growing — leak!" : "📉 Flat — GC healthy"}
				</span>
				<span className="text-[9px] text-zinc-600 font-mono">now</span>
			</div>
		</div>
	);
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TABS: Array<{ id: Scenario; label: string; icon: string }> = [
	{ id: "event-listener", label: "Event Listener", icon: "🎧" },
	{ id: "stale-closure", label: "Stale Closure", icon: "🔗" },
	{ id: "unbounded-cache", label: "Unbounded Cache", icon: "📦" },
];

export function MemoryLeakPatternsDemo() {
	const [scenario, setScenario] = useState<Scenario>("event-listener");
	const [mode, setMode] = useState<LeakMode>("leaking");

	const handleScenarioChange = (s: Scenario) => {
		setScenario(s);
		setMode("leaking"); // reset mode when switching tabs
	};

	return (
		<DemoSection
			title="Demo 4: Memory Leak Patterns in React"
			description="Three common React memory leaks — and their fixes. Toggle between Leaking and Fixed to see the heap graph stays flat once properly managed."
		>
			{/* Scenario tabs */}
			<div className="flex gap-2 flex-wrap mb-5">
				{TABS.map((tab) => (
					<button
						key={tab.id}
						type="button"
						onClick={() => handleScenarioChange(tab.id)}
						className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
							scenario === tab.id
								? "bg-violet-500/20 text-violet-300 border-violet-500/40"
								: "bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200"
						}`}
					>
						{tab.icon} {tab.label}
					</button>
				))}
			</div>

			{/* Mode toggle */}
			<div className="flex gap-2 mb-5">
				{(["leaking", "fixed"] as LeakMode[]).map((m) => (
					<button
						key={m}
						type="button"
						onClick={() => setMode(m)}
						className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
							mode === m
								? m === "leaking"
									? "bg-red-500/20 text-red-300 border-red-500/40"
									: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
								: "bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200"
						}`}
					>
						{m === "leaking" ? "❌ Leaking" : "✅ Fixed"}
					</button>
				))}
			</div>

			{/* Main content */}
			<AnimatePresence mode="wait">
				<motion.div
					key={`${scenario}-${mode}`}
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -8 }}
					transition={{ duration: 0.2 }}
					className="space-y-4"
				>
					{/* Code */}
					<ShikiCode
						code={CODE[scenario][mode]}
						language="tsx"
						showLineNumbers={true}
					/>

					{/* Memory graph */}
					<MemoryGraph mode={mode} />

					{/* Explanation */}
					<div
						className={`p-4 rounded-lg border text-sm leading-relaxed ${
							mode === "leaking"
								? "bg-red-500/5 border-red-500/20 text-red-300/80"
								: "bg-emerald-500/5 border-emerald-500/20 text-emerald-300/80"
						}`}
					>
						<div className="font-semibold mb-1">
							{mode === "leaking" ? "❌ Why This Leaks" : "✅ Why This Works"}
						</div>
						{EXPLANATION[scenario][mode]}
					</div>

					{/* GC reference chain callout */}
					{mode === "leaking" && (
						<div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700 text-xs text-zinc-400 font-mono">
							<span className="text-zinc-300 font-semibold not-italic">
								Reference chain keeping object alive:{" "}
							</span>
							{scenario === "event-listener" &&
								"window.eventListeners → handleResize closure → component state"}
							{scenario === "stale-closure" &&
								"global timer queue → setInterval callback → bigData array (800 KB)"}
							{scenario === "unbounded-cache" &&
								"module scope → Map instance → Map entries → user data objects"}
						</div>
					)}
				</motion.div>
			</AnimatePresence>
		</DemoSection>
	);
}
