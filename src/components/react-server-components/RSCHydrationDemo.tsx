import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { match } from "ts-pattern";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

type Phase = "idle" | "streaming" | "reconciling" | "hydrating" | "done";
type NavMode = "rsc" | "full";

interface TreeNode {
	id: string;
	label: string;
	kind: "server" | "client" | "suspense";
	depth: number;
	flightKey?: string;
	hydrated?: boolean;
	clientState?: string;
}

const TREE_NODES: TreeNode[] = [
	{ id: "page", label: "Page", kind: "server", depth: 0, flightKey: "0" },
	{ id: "header", label: "Header", kind: "server", depth: 1, flightKey: "0" },
	{ id: "nav", label: "NavBar", kind: "server", depth: 2, flightKey: "0" },
	{
		id: "suspense-1",
		label: "Suspense",
		kind: "suspense",
		depth: 1,
		flightKey: "1",
	},
	{
		id: "greeting",
		label: "UserGreeting",
		kind: "server",
		depth: 2,
		flightKey: "3",
	},
	{
		id: "counter",
		label: "Counter",
		kind: "client",
		depth: 1,
		flightKey: "2",
		clientState: "count = 0",
	},
	{
		id: "like-btn",
		label: "LikeButton",
		kind: "client",
		depth: 2,
		flightKey: "2",
		clientState: "liked = false",
	},
	{ id: "footer", label: "Footer", kind: "server", depth: 1, flightKey: "0" },
];

interface FlightChunk {
	key: string;
	content: string;
	kind: "element" | "suspense" | "client-ref" | "resolved";
	appearsAt: number;
}

const FLIGHT_CHUNKS: FlightChunk[] = [
	{
		key: "0",
		content: '["$","div",null,{"children":["Header","Footer"]}]',
		kind: "element",
		appearsAt: 0,
	},
	{ key: "1", content: '"$Sreact.suspense"', kind: "suspense", appearsAt: 0 },
	{
		key: "2",
		content:
			'["$","$L4",null,{}]  // Counter\n["$","$L5",null,{}]  // LikeButton',
		kind: "client-ref",
		appearsAt: 1,
	},
	{
		key: "3",
		content: '["$","p",{"children":"Welcome, Andri"}]',
		kind: "resolved",
		appearsAt: 3,
	},
];

const PHASE_SEQUENCE: Phase[] = [
	"idle",
	"streaming",
	"reconciling",
	"hydrating",
	"done",
];

const PHASE_LABELS: Record<Phase, string> = {
	idle: "Idle",
	streaming: "Payload streaming",
	reconciling: "Tree reconciliation",
	hydrating: "Selective hydration",
	done: "Interactive",
};

const PHASE_DESCRIPTIONS: Record<Phase, string> = {
	idle: "Click 'Load Page' to simulate an RSC navigation.",
	streaming:
		"Flight payload chunks arrive from the server. The client reads rows as they stream — it doesn't wait for the full payload.",
	reconciling:
		"React walks the Flight payload and reconstructs the element tree in memory. No DOM changes yet — just diffing against the existing tree.",
	hydrating:
		"React attaches event handlers ONLY to $L (lazy client component) nodes. Server nodes get no JS — they're already correct HTML.",
	done: "Page is interactive. Client components are hydrated. Server components have zero attached JS.",
};

export function RSCHydrationDemo() {
	const [phase, setPhase] = useState<Phase>("idle");
	const [visibleChunks, setVisibleChunks] = useState<Set<string>>(new Set());
	const [hydratedNodes, setHydratedNodes] = useState<Set<string>>(new Set());
	const [navMode, setNavMode] = useState<NavMode>("rsc");
	const [navCount, setNavCount] = useState(0);
	const [formValue, setFormValue] = useState("my draft text");
	const [isReloading, setIsReloading] = useState(false);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	function clearAll() {
		if (intervalRef.current) clearInterval(intervalRef.current);
		setPhase("idle");
		setVisibleChunks(new Set());
		setHydratedNodes(new Set());
	}

	function runPlayback() {
		clearAll();
		let step = 0;
		const steps: (() => void)[] = [
			() => setPhase("streaming"),
			() => setVisibleChunks(new Set(["0", "1", "2"])),
			() => setPhase("reconciling"),
			() => setVisibleChunks(new Set(["0", "1", "2", "3"])),
			() => setPhase("hydrating"),
			() => setHydratedNodes(new Set(["counter"])),
			() => setHydratedNodes(new Set(["counter", "like-btn"])),
			() => setPhase("done"),
		];

		intervalRef.current = setInterval(() => {
			if (step < steps.length) {
				steps[step]();
				step++;
			} else {
				if (intervalRef.current) clearInterval(intervalRef.current);
			}
		}, 700);
	}

	function simulateNav() {
		setNavCount((c) => c + 1);
		if (navMode === "full") {
			setIsReloading(true);
			setHydratedNodes(new Set());
			setTimeout(() => {
				setFormValue("my draft text");
				setIsReloading(false);
				setHydratedNodes(new Set(["counter", "like-btn"]));
			}, 800);
		}
	}

	useEffect(
		() => () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		},
		[],
	);

	const clientNodes = TREE_NODES.filter((n) => n.kind === "client");
	const serverNodes = TREE_NODES.filter((n) => n.kind === "server");
	const hydratedCount = hydratedNodes.size;
	const totalNodes = TREE_NODES.length;

	return (
		<DemoSection
			title="Selective Hydration"
			description="RSC doesn't eliminate hydration — it makes it selective. Only Client Components ($L refs) get event handlers attached. Server nodes ship zero JS."
		>
			<div className="space-y-6">
				{/* Phase indicator */}
				<div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4 space-y-3">
					<div className="flex items-center justify-between">
						<div className="flex gap-1.5">
							{PHASE_SEQUENCE.filter((p) => p !== "idle").map((p) => (
								<div
									key={p}
									className={`h-1.5 rounded-full transition-all duration-500 ${
										PHASE_SEQUENCE.indexOf(phase) >= PHASE_SEQUENCE.indexOf(p)
											? match(p)
													.with("streaming", () => "bg-cyan-400 w-16")
													.with("reconciling", () => "bg-amber-400 w-16")
													.with("hydrating", () => "bg-violet-400 w-16")
													.with("done", () => "bg-emerald-400 w-16")
													.otherwise(() => "bg-zinc-600 w-8")
											: "bg-zinc-700 w-8"
									}`}
								/>
							))}
						</div>
						<span
							className={`text-xs font-medium ${match(phase)
								.with("streaming", () => "text-cyan-400")
								.with("reconciling", () => "text-amber-400")
								.with("hydrating", () => "text-violet-400")
								.with("done", () => "text-emerald-400")
								.otherwise(() => "text-zinc-500")}`}
						>
							{PHASE_LABELS[phase]}
						</span>
					</div>
					<p className="text-xs text-zinc-400">{PHASE_DESCRIPTIONS[phase]}</p>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={runPlayback}
							className="px-4 py-2 rounded-lg bg-violet-500/20 text-violet-300 border border-violet-500/30 text-sm hover:bg-violet-500/30 transition-colors"
						>
							{phase === "idle" ? "Load Page" : "Replay"}
						</button>
						{phase !== "idle" && (
							<button
								type="button"
								onClick={clearAll}
								className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-400 border border-zinc-700 text-sm hover:text-white transition-colors"
							>
								Reset
							</button>
						)}
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
					{/* Left: Flight payload stream */}
					<div className="space-y-2">
						<h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
							Flight Payload — streaming chunks
						</h4>
						<div className="bg-zinc-900 rounded-xl border border-zinc-700 font-mono text-xs overflow-hidden min-h-36">
							<div className="px-3 py-2 border-b border-zinc-700 bg-zinc-800/60 text-zinc-400">
								RSC wire format
							</div>
							<div className="p-3 space-y-2">
								<AnimatePresence>
									{FLIGHT_CHUNKS.filter((c) => visibleChunks.has(c.key)).map(
										(chunk) => (
											<motion.div
												key={chunk.key}
												initial={{ opacity: 0, x: -10 }}
												animate={{ opacity: 1, x: 0 }}
												className="flex gap-2"
											>
												<span className="text-zinc-600 shrink-0">
													{chunk.key}:
												</span>
												<span
													className={`break-all ${match(chunk.kind)
														.with("element", () => "text-cyan-300")
														.with("suspense", () => "text-amber-300")
														.with("client-ref", () => "text-violet-300")
														.with("resolved", () => "text-emerald-300")
														.exhaustive()}`}
												>
													{chunk.content}
												</span>
											</motion.div>
										),
									)}
								</AnimatePresence>
								{visibleChunks.size === 0 && (
									<p className="text-zinc-700 text-xs italic">
										waiting for payload…
									</p>
								)}
							</div>
						</div>
					</div>

					{/* Right: Component tree with hydration state */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
								Component Tree
							</h4>
							{phase !== "idle" && (
								<span className="text-xs text-zinc-500">
									Hydrated:{" "}
									<span className="text-violet-400 font-medium">
										{hydratedCount}
									</span>
									{" / "}
									<span className="text-zinc-400">{totalNodes} nodes</span>
								</span>
							)}
						</div>
						<div className="space-y-1">
							{TREE_NODES.map((node) => {
								const isHydrated = hydratedNodes.has(node.id);
								const isClient = node.kind === "client";
								const isVisible = phase !== "idle";

								return (
									<motion.div
										key={node.id}
										initial={{ opacity: 0.3 }}
										animate={{ opacity: isVisible ? 1 : 0.3 }}
										style={{ marginLeft: `${node.depth * 20}px` }}
										className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${
											!isVisible
												? "border-zinc-800 bg-zinc-900"
												: isClient
													? isHydrated
														? "border-violet-500/50 bg-violet-500/15"
														: "border-violet-500/20 bg-violet-500/5"
													: node.kind === "suspense"
														? "border-amber-500/20 bg-amber-500/5"
														: "border-emerald-500/20 bg-emerald-500/5"
										}`}
									>
										<span
											className={`font-mono font-semibold ${
												!isVisible
													? "text-zinc-600"
													: isClient
														? "text-violet-400"
														: node.kind === "suspense"
															? "text-amber-400"
															: "text-emerald-400"
											}`}
										>
											{`<${node.label}>`}
										</span>
										{isClient && isHydrated && (
											<motion.span
												initial={{ opacity: 0, scale: 0.8 }}
												animate={{ opacity: 1, scale: 1 }}
												className="text-violet-300 bg-violet-500/20 px-1.5 py-0.5 rounded text-[10px]"
											>
												hydrated ✓
											</motion.span>
										)}
										{isClient && !isHydrated && isVisible && (
											<span className="text-zinc-600 text-[10px]">
												waiting…
											</span>
										)}
										{!isClient && isVisible && node.kind !== "suspense" && (
											<span className="text-emerald-600 text-[10px]">
												no JS
											</span>
										)}
										{node.clientState && isHydrated && (
											<span className="ml-auto text-[10px] text-zinc-500 font-mono">
												{node.clientState}
											</span>
										)}
									</motion.div>
								);
							})}
						</div>
					</div>
				</div>

				{/* Hydration counter callout */}
				<AnimatePresence>
					{phase === "done" && (
						<motion.div
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-start gap-4"
						>
							<div className="text-center shrink-0">
								<p className="text-3xl font-bold text-violet-400">
									{hydratedCount}
								</p>
								<p className="text-xs text-zinc-500">hydrated</p>
							</div>
							<div className="h-10 w-px bg-zinc-700" />
							<div className="text-center shrink-0">
								<p className="text-3xl font-bold text-emerald-400">
									{totalNodes - hydratedCount}
								</p>
								<p className="text-xs text-zinc-500">zero JS</p>
							</div>
							<div className="h-10 w-px bg-zinc-700" />
							<p className="text-xs text-zinc-300 flex-1">
								Only{" "}
								<span className="text-violet-300 font-medium">
									{clientNodes.map((n) => n.label).join(", ")}
								</span>{" "}
								hydrated — they hold client state (useState, event listeners).
								The remaining {serverNodes.length} server nodes are reconciled
								as plain HTML with no JS attached.
							</p>
						</motion.div>
					)}
				</AnimatePresence>

				{/* Navigation comparison */}
				<div className="bg-zinc-800/50 rounded-xl border border-zinc-700 p-4 space-y-4">
					<h4 className="text-sm font-medium text-zinc-300">
						Client State Preservation on Navigation
					</h4>
					<p className="text-xs text-zinc-500">
						On RSC navigation, a new Flight payload arrives for the new route.
						React reconciles the tree WITHOUT unmounting Client Components —
						their state is preserved.
					</p>

					<div className="flex bg-zinc-800 rounded-lg p-1 w-fit">
						<button
							type="button"
							onClick={() => setNavMode("rsc")}
							className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${navMode === "rsc" ? "bg-emerald-500/20 text-emerald-400" : "text-zinc-400 hover:text-white"}`}
						>
							RSC Navigation
						</button>
						<button
							type="button"
							onClick={() => setNavMode("full")}
							className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${navMode === "full" ? "bg-red-500/20 text-red-400" : "text-zinc-400 hover:text-white"}`}
						>
							Full Page Nav
						</button>
					</div>

					<div className="bg-zinc-900 rounded-lg border border-zinc-700 p-4 space-y-3">
						<div className="flex items-center gap-3">
							<div className="flex-1">
								<p className="text-xs text-zinc-500 mb-1">
									Draft input (Client Component state)
								</p>
								<input
									type="text"
									value={formValue}
									onChange={(e) => setFormValue(e.target.value)}
									className="w-full bg-zinc-800 border border-zinc-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-violet-500"
								/>
							</div>
							<div>
								<p className="text-xs text-zinc-500 mb-1">Navigations</p>
								<p className="text-2xl font-bold text-zinc-300">{navCount}</p>
							</div>
						</div>
						<button
							type="button"
							onClick={simulateNav}
							className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${navMode === "rsc" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30" : "bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30"}`}
						>
							{navMode === "rsc" ? "Navigate (RSC)" : "Navigate (Full Page)"}
						</button>
						<AnimatePresence mode="wait">
							{isReloading ? (
								<motion.p
									key="reloading"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									className="text-xs text-zinc-500 italic"
								>
									Re-running SSR → re-downloading JS → re-mounting tree…
								</motion.p>
							) : (
								<motion.p
									key={`${navMode}-${navCount}`}
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									className={`text-xs ${navMode === "rsc" ? "text-emerald-400" : "text-red-400"}`}
								>
									{navMode === "rsc"
										? navCount > 0
											? `Navigated ${navCount}x — draft "${formValue}" preserved. React received new Flight payload and reconciled without unmounting.`
											: "RSC nav preserves Client Component state across route changes."
										: navCount > 0
											? `Full page nav ${navCount}x — draft was reset (component unmounted + remounted). You lost your work.`
											: "Full page nav unmounts the entire tree, resetting all Client Component state."}
								</motion.p>
							)}
						</AnimatePresence>
					</div>
				</div>

				<ShikiCode
					language="tsx"
					code={`// RSC hydration is selective — React only attaches JS to $L nodes.

// What happens on RSC navigation:
// 1. Browser fetches /new-route?_rsc=1
// 2. Server streams Flight payload (not HTML)
// 3. React reconciles against the existing DOM tree:
//    - Server nodes: React verifies DOM matches payload → no JS work
//    - $L nodes: React loads the chunk → calls hydrateRoot on that subtree only
// 4. Client components KEEP their state (useState, useRef, scroll position)
//    because React reconciles, not unmounts

// What SSR hydration does instead:
// hydrateRoot(document.body, <App />)
// → walks the ENTIRE tree, even static server-only nodes
// → attaches listeners where needed, skips where not
// → but React still traverses every node (O(n) work)

// RSC is different: server nodes ship zero JS — no listener attachment,
// no component logic re-executes on the client. Only $L subtrees need hydration work.`}
					showLineNumbers={false}
					className="text-xs"
				/>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
					{[
						{
							title: "SSR Hydration",
							items: [
								"Walks entire component tree",
								"O(n) traversal for n total components",
								"Server nodes traversed but no listeners attached",
								"Full page navigation resets all state",
							],
							color: "amber",
						},
						{
							title: "RSC Hydration",
							items: [
								"Only $L (client) refs need hydration",
								"Zero JS shipped for server subtrees",
								"Server nodes: no listener attach, no re-execution",
								"RSC navigation preserves client state",
							],
							color: "emerald",
						},
					].map((col) => (
						<div
							key={col.title}
							className={`rounded-lg border p-3 space-y-1.5 ${col.color === "amber" ? "border-amber-500/30 bg-amber-500/10" : "border-emerald-500/30 bg-emerald-500/10"}`}
						>
							<p
								className={`font-semibold ${col.color === "amber" ? "text-amber-400" : "text-emerald-400"}`}
							>
								{col.title}
							</p>
							{col.items.map((item) => (
								<p key={item} className="text-zinc-400">
									{item}
								</p>
							))}
						</div>
					))}
				</div>
			</div>
		</DemoSection>
	);
}
