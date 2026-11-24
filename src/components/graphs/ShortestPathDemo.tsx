import { useEffect, useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { bfsLevels, EDGES, NODES, shortestPath } from "./graph";

interface Spread {
	levels: string[][];
	path: string[];
}

export function ShortestPathDemo() {
	const [start, setStart] = useState("A");
	const [target, setTarget] = useState("F");
	const [spread, setSpread] = useState<Spread | null>(null);
	const [revealed, setRevealed] = useState(0);

	const done = spread !== null && revealed >= spread.levels.length;
	const path = done && spread ? spread.path : [];
	const reached = spread ? spread.levels.slice(0, revealed).flat() : [];

	useEffect(() => {
		if (!spread || done) return;
		const timer = setTimeout(() => setRevealed((value) => value + 1), 700);
		return () => clearTimeout(timer);
	}, [spread, done]);

	function find() {
		const levels = bfsLevels(start);
		const end = levels.findIndex((ring) => ring.includes(target));
		setSpread({
			levels: end === -1 ? levels : levels.slice(0, end + 1),
			path: shortestPath(start, target),
		});
		setRevealed(1);
	}

	function reset() {
		setSpread(null);
		setRevealed(0);
	}

	const pathEdges = new Set(
		path
			.slice(0, -1)
			.map((node, index) => [node, path[index + 1] ?? ""].sort().join("-")),
	);

	return (
		<DemoSection
			title="Algorithms in the wild: fewest hops"
			description="Here every edge costs the same: one hop. So the shortest path is simply the one with the fewest edges. The search spreads outward one ring at a time, which guarantees that the first time it reaches the target it used the fewest hops. When edges carry real costs, hop count is not the answer, and the route-finding demo below handles that."
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
						onClick={find}
						className="rounded-lg border border-emerald-500/30 bg-emerald-600/20 px-3 py-1.5 text-sm text-emerald-300"
					>
						Find fewest hops
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
						aria-label="Undirected graph with six nodes and eight edges"
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
						{NODES.map(({ id, x, y }) => {
							const inPath = path.includes(id);
							const inRing = reached.includes(id);
							const fill = inPath ? "#047857" : inRing ? "#064e3b" : "#27272a";
							const stroke = inPath
								? "#6ee7b7"
								: inRing
									? "#2dd4bf"
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
										{inPath ? ` ${path.indexOf(id) + 1}` : ""}
									</text>
								</g>
							);
						})}
					</svg>
				</div>
				<output aria-live="polite" className="block text-sm text-zinc-400">
					{!spread ? (
						"Choose a start and target, then watch the search spread outward"
					) : done ? (
						<>
							Fewest hops:{" "}
							<span className="font-mono text-emerald-300">
								{path.join(" → ")}
							</span>
							<span className="ml-2 text-xs text-zinc-500">
								{path.length - 1} {path.length - 1 === 1 ? "hop" : "hops"}
							</span>
						</>
					) : (
						<>
							Spreading outward — ring {revealed - 1}:{" "}
							<span className="font-mono text-emerald-300">
								{(spread.levels[revealed - 1] ?? []).join(", ")}
							</span>
						</>
					)}
				</output>
			</div>
		</DemoSection>
	);
}
