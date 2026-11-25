import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { bfsLevels, EDGES, NODES, shortestPath } from "./graph";

interface Spread {
	levels: string[][];
	path: string[];
}

export function ShortestPathDemo() {
	const [start, setStart] = useState("A");
	const [target, setTarget] = useState("C");
	const [spread, setSpread] = useState<Spread | null>(null);
	const [revealed, setRevealed] = useState(0);

	const done = spread !== null && revealed >= spread.levels.length;
	const path = done && spread ? spread.path : [];
	const waves = spread ? spread.levels.slice(0, revealed) : [];
	const hops = path.length - 1;
	const targetHop = spread
		? spread.levels.findIndex((ring) => ring.includes(target))
		: -1;
	const targetNode = NODES.find((node) => node.id === target);

	const pathEdges = new Set(
		path
			.slice(0, -1)
			.map((node, index) => [node, path[index + 1] ?? ""].sort().join("-")),
	);

	function hopOf(id: string): number {
		return spread
			? spread.levels.slice(0, revealed).findIndex((ring) => ring.includes(id))
			: -1;
	}

	function step() {
		if (!spread) {
			const levels = bfsLevels(start);
			const end = levels.findIndex((ring) => ring.includes(target));
			setSpread({
				levels: end === -1 ? levels : levels.slice(0, end + 1),
				path: shortestPath(start, target),
			});
			setRevealed(1);
			return;
		}
		setRevealed((value) => value + 1);
	}

	function reset() {
		setSpread(null);
		setRevealed(0);
	}

	return (
		<DemoSection
			title="Algorithms in the wild: fewest hops"
			description="Every edge here costs exactly one hop, so shortest means fewest edges. Step outward one hop at a time: every 1-hop node is checked before any 2-hop node, so the first wave holding the target is the minimum. When edges carry real costs, hop counting stops being the answer — the route-finding demo below covers that."
		>
			<div className="space-y-5">
				<div className="flex flex-wrap items-center gap-2">
					<label htmlFor="graph-path-start" className="text-sm text-zinc-400">
						Start at
					</label>
					<select
						id="graph-path-start"
						value={start}
						onChange={(event) => {
							setStart(event.target.value);
							reset();
						}}
						className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200"
					>
						{NODES.map(({ id }) => (
							<option key={id}>{id}</option>
						))}
					</select>
					<label htmlFor="graph-target" className="text-sm text-zinc-400">
						Target
					</label>
					<select
						id="graph-target"
						value={target}
						onChange={(event) => {
							setTarget(event.target.value);
							reset();
						}}
						className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200"
					>
						{NODES.map(({ id }) => (
							<option key={id}>{id}</option>
						))}
					</select>
					<button
						type="button"
						onClick={step}
						disabled={done}
						className="rounded-lg border border-emerald-500/30 bg-emerald-600/20 px-3 py-1.5 text-sm text-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
					>
						{spread === null ? "Find fewest hops" : "Next hop"}
					</button>
					<button
						type="button"
						onClick={reset}
						className="rounded-lg border border-zinc-600/40 bg-zinc-700/30 px-3 py-1.5 text-sm text-zinc-300"
					>
						Reset
					</button>
				</div>
				<div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
					<svg
						viewBox="0 0 460 240"
						role="img"
						aria-label="Undirected graph with six nodes and eight edges. The dashed ring marks the target, and each lit node shows how many hops it is from the start."
						className="mx-auto w-full max-w-xl"
					>
						{EDGES.map(([a, b]) => {
							const from = NODES.find((node) => node.id === a);
							const to = NODES.find((node) => node.id === b);
							const active = pathEdges.has([a, b].sort().join("-"));
							return from && to ? (
								<line
									key={`${a}-${b}`}
									x1={from.x}
									y1={from.y}
									x2={to.x}
									y2={to.y}
									stroke={active ? "#047857" : "#52525b"}
									strokeWidth={active ? "3.5" : "3"}
									className="transition-[stroke] duration-300"
								/>
							) : null;
						})}
						{targetNode && (
							<circle
								cx={targetNode.x}
								cy={targetNode.y}
								r="30"
								fill="none"
								stroke="#d4d4d8"
								strokeWidth="1.5"
								strokeDasharray="4 4"
							/>
						)}
						{NODES.map(({ id, x, y }) => {
							const hop = hopOf(id);
							const inPath = path.includes(id);
							const isStart = id === start;
							const isFrontier = hop >= 0 && hop === revealed - 1 && !done;
							const fill = inPath
								? "#047857"
								: isStart
									? "#065f46"
									: hop >= 0
										? "#064e3b"
										: "#27272a";
							const stroke =
								inPath || isStart
									? "#6ee7b7"
									: isFrontier
										? "#2dd4bf"
										: hop >= 0
											? "#0f766e"
											: "#71717a";
							return (
								<g key={id}>
									<circle
										cx={x}
										cy={y}
										r="23"
										fill={fill}
										stroke={stroke}
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
									</text>
									{hop >= 0 && (
										<text
											x={x}
											y={y + 38}
											textAnchor="middle"
											fill={inPath ? "#6ee7b7" : "#a1a1aa"}
											fontSize="9"
											fontFamily="monospace"
										>
											{hop} {hop === 1 ? "hop" : "hops"}
										</text>
									)}
								</g>
							);
						})}
					</svg>
				</div>
				{spread && (
					<ol className="flex flex-wrap gap-2">
						{waves.map((ring, hop) => (
							<li
								key={ring.join("-")}
								className={`rounded-md border px-2.5 py-1 text-xs ${
									hop === revealed - 1
										? "border-emerald-500/40 bg-emerald-600/10"
										: "border-zinc-800 bg-zinc-900/60"
								}`}
							>
								<span className="text-zinc-500">
									{hop} {hop === 1 ? "hop" : "hops"}:{" "}
								</span>
								<span className="font-mono text-emerald-300">
									{ring.join(", ")}
								</span>
								{ring.includes(target) && (
									<span className="ml-1 text-emerald-400">target</span>
								)}
							</li>
						))}
					</ol>
				)}
				<output aria-live="polite" className="block text-sm text-zinc-400">
					{!spread ? (
						"Choose a start and target, then step the search outward"
					) : done ? (
						path.length ? (
							<>
								Fewest hops:{" "}
								<span className="font-mono text-emerald-300">
									{path.join(" → ")}
								</span>
								<span className="ml-2 text-xs text-zinc-500">
									{hops} {hops === 1 ? "hop" : "hops"}
								</span>
								{targetHop > 1 && (
									<span className="mt-1 block text-xs text-zinc-500">
										Every node {targetHop - 1}{" "}
										{targetHop - 1 === 1 ? "hop" : "hops"} away was checked
										first and none was {target}, so {targetHop} is the minimum.
									</span>
								)}
							</>
						) : (
							`${start} and ${target} are not connected`
						)
					) : (
						<>
							Checking {revealed - 1} {revealed - 1 === 1 ? "hop" : "hops"} from{" "}
							{start}:{" "}
							<span className="font-mono text-emerald-300">
								{(spread.levels[revealed - 1] ?? []).join(", ")}
							</span>
						</>
					)}
				</output>
				<p className="text-xs text-zinc-500">
					If two routes are equally short, the search shows the first one it
					finds.
				</p>
			</div>
		</DemoSection>
	);
}
