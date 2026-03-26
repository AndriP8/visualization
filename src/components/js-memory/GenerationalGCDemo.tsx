import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import { DemoSection } from "../shared/DemoSection";

// ─── Types ────────────────────────────────────────────────────────────────────

type ObjectState = "alive" | "dying" | "promoted" | "collected";

interface HeapObject {
	id: string;
	label: string;
	survivals: number; // how many young GC cycles survived
	state: ObjectState;
	generation: "young" | "old";
	// Visual position (0-1 within their generation lane)
	slot: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PROMOTION_THRESHOLD = 2; // survives this many minor GCs → promoted

// Color encodes survival count, not identity
function survivalColor(survivals: number, generation: "young" | "old"): string {
	if (generation === "old") return "#f59e0b"; // amber — promoted
	if (survivals === 0) return "#6366f1"; // dim violet — fresh
	return "#a78bfa"; // bright violet — survived ≥1 GC
}

let nextId = 0;
function makeObject(slot: number): HeapObject {
	const id = `obj-${nextId++}`;
	return {
		id,
		label: id,
		survivals: 0,
		state: "alive",
		generation: "young",
		slot,
	};
}

function makeInitialObjects(): HeapObject[] {
	return Array.from({ length: 7 }, (_, i) => makeObject(i));
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GenerationalGCDemo() {
	const [objects, setObjects] = useState<HeapObject[]>(makeInitialObjects);
	const [youngGcCount, setYoungGcCount] = useState(0);
	const [oldGcCount, setOldGcCount] = useState(0);
	const [isRunning, setIsRunning] = useState(false);
	const [log, setLog] = useState<Array<{ id: string; msg: string }>>(() => [
		{ id: "init", msg: "📦 7 fresh objects allocated in Young space." },
	]);

	const addLog = useCallback((msg: string) => {
		setLog((prev) =>
			[{ id: `log-${Date.now()}-${Math.random()}`, msg }, ...prev].slice(0, 6),
		);
	}, []);

	const runYoungGC = useCallback(async () => {
		if (isRunning) return;
		setIsRunning(true);

		const gcNum = youngGcCount + 1;
		setYoungGcCount(gcNum);
		addLog(`🔄 Young GC #${gcNum} started…`);

		// Phase 1 — mark short-lived objects as dying (simulate ~60% die)
		setObjects((prev) =>
			prev.map((o) => {
				if (o.generation !== "young" || o.state !== "alive") return o;
				// Objects with id ending in even number "die"; odd "survive"
				const dies = Number.parseInt(o.id.replace("obj-", ""), 10) % 3 !== 0;
				return dies ? { ...o, state: "dying" } : o;
			}),
		);

		await sleep(700);

		// Phase 2 — remove dying, increment survivals on survivors
		let promotedCount = 0;
		let collectedCount = 0;
		setObjects((prev) => {
			const surviving: HeapObject[] = [];
			let _promoted = 0;
			let _collected = 0;

			for (const o of prev) {
				if (o.generation === "old") {
					surviving.push(o);
					continue;
				}
				if (o.state === "dying") {
					_collected++;
					continue; // collected
				}
				const newSurvivals = o.survivals + 1;
				if (newSurvivals >= PROMOTION_THRESHOLD) {
					_promoted++;
					surviving.push({
						...o,
						survivals: newSurvivals,
						state: "promoted",
						generation: "old",
						slot: surviving.filter((x) => x.generation === "old").length,
					});
				} else {
					surviving.push({ ...o, survivals: newSurvivals });
				}
			}

			// Re-slot young objects
			let youngSlot = 0;
			const reSlotted = surviving.map((o) => {
				if (o.generation !== "young") return o;
				return { ...o, slot: youngSlot++ };
			});

			promotedCount = _promoted;
			collectedCount = _collected;
			return reSlotted;
		});

		if (promotedCount > 0) {
			addLog(
				`✅ ${collectedCount} collected, ${promotedCount} promoted to Old space.`,
			);
		} else {
			addLog(`✅ ${collectedCount} collected. Survivors bump survival count.`);
		}

		await sleep(700);

		// Clear "promoted" badge state → "alive"
		setObjects((prev) =>
			prev.map((o) => (o.state === "promoted" ? { ...o, state: "alive" } : o)),
		);

		await sleep(300);

		// Phase 3 — allocate new objects to refill young space
		let addedCount = 0;
		setObjects((prev) => {
			const youngCount = prev.filter((o) => o.generation === "young").length;
			const toAdd = Math.max(0, 5 - youngCount);
			const newObjs = Array.from({ length: toAdd }, (_, i) =>
				makeObject(youngCount + i),
			);
			addedCount = toAdd;
			return [...prev, ...newObjs];
		});
		if (addedCount > 0)
			addLog(`📦 ${addedCount} new objects allocated in Young space.`);

		setIsRunning(false);
	}, [isRunning, youngGcCount, addLog]);

	const runOldGC = useCallback(async () => {
		if (isRunning) return;
		setIsRunning(true);
		const gcNum = oldGcCount + 1;
		setOldGcCount(gcNum);
		addLog(`🧹 Full (Major) GC #${gcNum} — sweeping Old space…`);

		// Mark 1 old object as dying
		setObjects((prev) => {
			const oldObjs = prev.filter((o) => o.generation === "old");
			if (oldObjs.length === 0) return prev;
			const target = oldObjs[0];
			return prev.map((o) =>
				o.id === target.id ? { ...o, state: "dying" } : o,
			);
		});

		await sleep(800);

		setObjects((prev) => {
			const filtered = prev.filter((o) => o.state !== "dying");
			// Re-slot old
			let oldSlot = 0;
			return filtered.map((o) => {
				if (o.generation !== "old") return o;
				return { ...o, slot: oldSlot++ };
			});
		});
		addLog("✅ Old GC complete. Old space compacted.");
		setIsRunning(false);
	}, [isRunning, oldGcCount, addLog]);

	const reset = useCallback(() => {
		nextId = 0;
		setObjects(makeInitialObjects());
		setYoungGcCount(0);
		setOldGcCount(0);
		setIsRunning(false);
		setLog([
			{ id: "init", msg: "📦 7 fresh objects allocated in Young space." },
		]);
	}, []);

	const youngObjects = objects.filter((o) => o.generation === "young");
	const oldObjects = objects.filter((o) => o.generation === "old");

	return (
		<DemoSection
			title="Demo 3: V8 Heap Generations"
			description="V8 divides the heap into Young (New Space) and Old (Old Space) regions. Most objects die young — this makes minor GC fast. Objects surviving enough cycles get promoted to Old space."
		>
			{/* Explanation row */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 text-xs text-zinc-400 leading-relaxed">
				<div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/20">
					<div className="font-semibold text-violet-300 mb-1">
						🟣 Young Generation (New Space)
					</div>
					Small (~1-8 MB). Collected very frequently (minor GC). Uses{" "}
					<em>semi-space copying</em>: only live objects are copied, so
					allocation is just a pointer bump. Fast and cheap.
				</div>
				<div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
					<div className="font-semibold text-amber-300 mb-1">
						🟡 Old Generation (Old Space)
					</div>
					Large (~500 MB+). Collected rarely (major/full GC — expensive). Uses{" "}
					<em>mark-sweep-compact</em>. Objects promoted here after surviving{" "}
					<code className="bg-zinc-800 px-1 rounded">
						{PROMOTION_THRESHOLD}
					</code>{" "}
					young GC cycles.
				</div>
			</div>

			{/* Legend strip */}
			<div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-4 px-1 text-[11px] text-zinc-400">
				<span>
					<span className="inline-block w-2.5 h-2.5 rounded-full bg-[#6366f1] mr-1 align-middle" />
					0 survivals
				</span>
				<span>
					<span className="inline-block w-2.5 h-2.5 rounded-full bg-[#a78bfa] mr-1 align-middle" />
					survived ≥1 GC
				</span>
				<span className="text-zinc-600">·</span>
				<span className="text-zinc-500 italic">
					fading = about to be collected
				</span>
				<span className="text-zinc-600">·</span>
				<span>
					<span className="inline-block w-2.5 h-2.5 rounded-full bg-[#f59e0b] mr-1 align-middle" />
					promoted to Old (at {PROMOTION_THRESHOLD} survivals)
				</span>
			</div>

			{/* Generation lanes */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
				{/* Young space */}
				<GenLane
					title="Young Space (New Space)"
					subtitle={`${youngObjects.length} objects — collected frequently`}
					borderColor="#6366f1"
					bgColor="#6366f108"
					objects={youngObjects}
					emptyText="All cleared by GC"
				/>
				{/* Old space */}
				<GenLane
					title="Old Space"
					subtitle={`${oldObjects.length} objects — promoted after ${PROMOTION_THRESHOLD} survivals`}
					borderColor="#f59e0b"
					bgColor="#f59e0b08"
					objects={oldObjects}
					emptyText="Nothing promoted yet"
				/>
			</div>

			{/* Log */}
			<div className="mb-4 rounded-lg bg-zinc-900 border border-zinc-800 p-3 min-h-15">
				<div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
					Log
				</div>
				<AnimatePresence>
					{log.map(({ id, msg }, i) => (
						<motion.div
							key={id}
							initial={{ opacity: 0, x: -8 }}
							animate={{ opacity: 1 - i * 0.18, x: 0 }}
							className="text-xs font-mono text-zinc-300"
						>
							{msg}
						</motion.div>
					))}
				</AnimatePresence>
			</div>

			{/* Controls */}
			<div className="flex flex-wrap items-center gap-3">
				<button
					type="button"
					onClick={runYoungGC}
					disabled={isRunning}
					className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-500/20 text-violet-300 border border-violet-500/30 hover:bg-violet-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
				>
					🔄 Run Young GC
				</button>
				<button
					type="button"
					onClick={runOldGC}
					disabled={isRunning || oldObjects.length === 0}
					className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
				>
					🧹 Run Major GC (Old Space)
				</button>
				<button
					type="button"
					onClick={reset}
					disabled={isRunning}
					className="px-4 py-2 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-zinc-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
				>
					↺ Reset
				</button>
				<span className="text-xs text-zinc-500 ml-auto">
					Young GC #{youngGcCount} · Major GC #{oldGcCount}
				</span>
			</div>
		</DemoSection>
	);
}

// ─── Generation Lane ──────────────────────────────────────────────────────────

interface GenLaneProps {
	title: string;
	subtitle: string;
	borderColor: string;
	bgColor: string;
	objects: HeapObject[];
	emptyText: string;
}

function GenLane({
	title,
	subtitle,
	borderColor,
	bgColor,
	objects,
	emptyText,
}: GenLaneProps) {
	return (
		<div
			className="rounded-xl border p-4 min-h-45"
			style={{ borderColor, background: bgColor }}
		>
			<div
				className="font-semibold text-sm mb-0.5"
				style={{ color: borderColor }}
			>
				{title}
			</div>
			<div className="text-xs text-zinc-500 mb-3">{subtitle}</div>
			<div className="flex flex-wrap gap-2 min-h-25 content-start">
				<AnimatePresence>
					{objects.length === 0 && (
						<motion.p
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="text-xs text-zinc-600 font-mono italic self-center w-full text-center"
						>
							{emptyText}
						</motion.p>
					)}
					{objects.map((obj) => {
						const color = survivalColor(obj.survivals, obj.generation);
						const isDying = obj.state === "dying";
						const isPromoted = obj.state === "promoted";
						const survivalLabel =
							obj.generation === "old"
								? `${obj.survivals}✓`
								: `${obj.survivals}/${PROMOTION_THRESHOLD}`;
						return (
							<motion.div
								key={obj.id}
								layout
								initial={{ opacity: 0, scale: 0.5 }}
								animate={{
									opacity: isDying ? 0.2 : 1,
									scale: isDying ? 0.7 : 1,
								}}
								exit={{ opacity: 0, scale: 0.3 }}
								transition={{ duration: 0.4 }}
								className="relative flex flex-col items-center"
								title={`Survived ${obj.survivals} GC(s)`}
							>
								<div
									className="w-12 h-12 rounded-lg border-2 flex items-center justify-center text-xs font-mono font-bold"
									style={{
										borderColor: color,
										background: `${color}22`,
										color,
									}}
								>
									{survivalLabel}
								</div>
								<div
									className="text-[9px] font-mono mt-0.5"
									style={{ color: "#71717a" }}
								>
									{obj.label}
								</div>
								<AnimatePresence>
									{isPromoted && (
										<motion.div
											initial={{ opacity: 0, y: -4, scale: 0.8 }}
											animate={{ opacity: 1, y: -6, scale: 1 }}
											exit={{ opacity: 0, scale: 0.8 }}
											transition={{ duration: 0.35 }}
											className="absolute -top-4 text-[9px] font-bold text-amber-400 whitespace-nowrap"
										>
											⬆ promoted
										</motion.div>
									)}
								</AnimatePresence>
							</motion.div>
						);
					})}
				</AnimatePresence>
			</div>
		</div>
	);
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
