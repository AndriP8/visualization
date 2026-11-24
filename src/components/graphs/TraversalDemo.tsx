import { useEffect, useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import {
	CYCLE_EDGES,
	CYCLE_GRAPH,
	NODES,
	TREE_EDGES,
	TREE_GRAPH,
	type WalkStep,
	walkSteps,
} from "./graph";

type Preset = "tree" | "cycle";

export function TraversalDemo() {
	const [start, setStart] = useState("A");
	const [mode, setMode] = useState<"bfs" | "dfs">("bfs");
	const [preset, setPreset] = useState<Preset>("tree");
	const [steps, setSteps] = useState<WalkStep[]>([]);
	const [index, setIndex] = useState(0);
	const [playing, setPlaying] = useState(false);

	const graph = preset === "tree" ? TREE_GRAPH : CYCLE_GRAPH;
	const edges = preset === "tree" ? TREE_EDGES : CYCLE_EDGES;

	useEffect(() => {
		if (!playing) return;
		if (index >= steps.length - 1) {
			setPlaying(false);
			return;
		}
		const timer = setTimeout(() => setIndex((value) => value + 1), 700);
		return () => clearTimeout(timer);
	}, [playing, index, steps]);

	function run(nextMode: "bfs" | "dfs") {
		setMode(nextMode);
		setSteps(walkSteps(graph, start, nextMode === "dfs"));
		setIndex(0);
		setPlaying(true);
	}

	function switchPreset(next: Preset) {
		setPreset(next);
		setSteps([]);
		setIndex(0);
		setPlaying(false);
	}

	function advance() {
		if (!steps.length) return;
		setPlaying(false);
		setIndex((value) => Math.min(value + 1, steps.length - 1));
	}

	const current = steps[index];
	const visited = current?.visited ?? [];
	const frontier = current?.frontier ?? [];
	const cycleEdge = current?.cycleEdge;
	const done = steps.length > 0 && index >= steps.length - 1;
	const nextOut = mode === "bfs" ? frontier[0] : frontier.at(-1);

	return (
		<DemoSection
			title="Algorithms in the wild: reachability & cycles"
			description="A walk visits every node you can reach from the start. That answers the question 'can I get there from here?'. When the walk meets a neighbor it already reached through a different edge, those two paths close a loop — that edge lights up red. The row of nodes below is the frontier: the waiting line of nodes the walk is holding in memory (a queue for BFS, a stack for DFS)."
		>
			<div className="space-y-5">
				<div className="grid gap-3 sm:grid-cols-2">
					<div className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2.5">
						<p className="text-sm font-medium text-cyan-300">BFS · queue</p>
						<p className="mt-1 text-xs text-zinc-500">
							Takes from the front and pushes neighbors at the back, so it
							sweeps one hop further each round. First arrival at a node is the
							fewest hops away.
						</p>
					</div>
					<div className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2.5">
						<p className="text-sm font-medium text-purple-300">DFS · stack</p>
						<p className="mt-1 text-xs text-zinc-500">
							Takes from the same end it pushes, so it follows one path until it
							dead-ends, then backtracks. Finds reachability fast but not
							shortest paths.
						</p>
					</div>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<div className="flex gap-2">
						<button
							type="button"
							onClick={() => switchPreset("tree")}
							className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
								preset === "tree"
									? "border-purple-500/40 bg-purple-600/20 text-purple-300"
									: "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:text-zinc-200"
							}`}
						>
							No loop
						</button>
						<button
							type="button"
							onClick={() => switchPreset("cycle")}
							className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
								preset === "cycle"
									? "border-rose-500/40 bg-rose-600/20 text-rose-300"
									: "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:text-zinc-200"
							}`}
						>
							Loop
						</button>
					</div>
					<label htmlFor="graph-start" className="text-sm text-zinc-400">
						Start at
					</label>
					<select
						id="graph-start"
						value={start}
						onChange={(event) => {
							setStart(event.target.value);
							setSteps([]);
							setIndex(0);
							setPlaying(false);
						}}
						className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200"
					>
						{NODES.map(({ id }) => (
							<option key={id}>{id}</option>
						))}
					</select>
					<button
						type="button"
						onClick={() => run("bfs")}
						className="rounded-lg border border-cyan-500/30 bg-cyan-600/20 px-3 py-1.5 text-sm text-cyan-300"
					>
						Run BFS
					</button>
					<button
						type="button"
						onClick={() => run("dfs")}
						className="rounded-lg border border-purple-500/30 bg-purple-600/20 px-3 py-1.5 text-sm text-purple-300"
					>
						Run DFS
					</button>
					<button
						type="button"
						onClick={() => setPlaying(!playing)}
						disabled={!steps.length || done}
						className="rounded-lg border border-purple-500/30 bg-purple-600/20 px-3 py-1.5 text-sm text-purple-300 disabled:opacity-50"
					>
						{playing ? "Pause" : "Play"}
					</button>
					<button
						type="button"
						onClick={advance}
						disabled={!steps.length || done}
						className="rounded-lg border border-amber-500/30 bg-amber-600/20 px-3 py-1.5 text-sm text-amber-300 disabled:opacity-50"
					>
						Step
					</button>
					<button
						type="button"
						onClick={() => {
							setSteps([]);
							setIndex(0);
							setPlaying(false);
						}}
						className="rounded-lg border border-zinc-600/40 bg-zinc-700/30 px-3 py-1.5 text-sm text-zinc-300"
					>
						Reset
					</button>
				</div>
				<div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
					<svg
						viewBox="0 0 460 240"
						role="img"
						aria-label={`Undirected graph with six nodes and ${edges.length} edges`}
						className="mx-auto w-full max-w-xl"
					>
						{edges.map(([a, b]) => {
							const from = NODES.find((node) => node.id === a);
							const to = NODES.find((node) => node.id === b);
							const active = visited.includes(a) && visited.includes(b);
							const closesLoop =
								cycleEdge !== undefined &&
								((cycleEdge[0] === a && cycleEdge[1] === b) ||
									(cycleEdge[0] === b && cycleEdge[1] === a));
							return from && to ? (
								<line
									key={`${a}-${b}`}
									x1={from.x}
									y1={from.y}
									x2={to.x}
									y2={to.y}
									stroke={
										closesLoop ? "#fb7185" : active ? "#a855f7" : "#52525b"
									}
									strokeWidth={closesLoop ? 4 : 3}
									className="transition-[stroke] duration-300"
								/>
							) : null;
						})}
						{NODES.map(({ id, x, y }) => {
							const isVisited = visited.includes(id);
							return (
								<g key={id}>
									<circle
										cx={x}
										cy={y}
										r="23"
										fill={isVisited ? "#7e22ce" : "#27272a"}
										stroke={isVisited ? "#d8b4fe" : "#71717a"}
										strokeWidth="2"
										className="transition-[fill,stroke] duration-300"
									/>
									<text
										x={x}
										y={y + 5}
										textAnchor="middle"
										fill="#f4f4f5"
										fontSize="14"
										fontFamily="monospace"
									>
										{id}
										{isVisited ? ` ${visited.indexOf(id) + 1}` : ""}
									</text>
								</g>
							);
						})}
					</svg>
				</div>
				<div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
					<p className="mb-2 text-sm font-medium text-zinc-200">
						{mode === "bfs" ? "Queue · FIFO" : "Stack · LIFO"}
					</p>
					<p className="mb-3 text-xs text-zinc-500">
						The amber node leaves the waiting line next
					</p>
					<div className="flex min-h-10 flex-wrap items-center gap-2">
						{frontier.length ? (
							frontier.map((id) => (
								<span
									key={id}
									className={`rounded-md border px-3 py-2 font-mono text-sm ${
										id === nextOut
											? "border-amber-500/40 bg-amber-500/10 text-amber-200"
											: "border-purple-500/30 bg-purple-500/10 text-purple-200"
									}`}
								>
									{id}
								</span>
							))
						) : (
							<span className="text-sm text-zinc-600">
								{done ? "Drained — traversal complete" : "Empty"}
							</span>
						)}
					</div>
				</div>
				<output aria-live="polite" className="block text-sm text-zinc-400">
					{cycleEdge ? (
						<p className="text-rose-300">
							{cycleEdge[1]} was already visited through a different edge — the{" "}
							{cycleEdge[0]}–{cycleEdge[1]} edge closes a loop
						</p>
					) : null}
					{done ? (
						<>
							Visit order:{" "}
							<span className="font-mono text-purple-300">
								{visited.join(" → ")}
							</span>
						</>
					) : steps.length ? (
						<>
							Step {index + 1} of {steps.length} —{" "}
							<span className="font-mono text-purple-300">
								visiting {visited.at(-1)}
							</span>
						</>
					) : (
						"Run BFS or DFS to see the visit order"
					)}
				</output>
			</div>
		</DemoSection>
	);
}
