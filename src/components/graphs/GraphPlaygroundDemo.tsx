import { useEffect, useState } from "react";
import { match } from "ts-pattern";
import { DemoSection } from "../shared/DemoSection";
import { EDGES, NODES } from "./graph";

interface Point {
	x: number;
	y: number;
}

type Adjacency = Record<string, string[]>;

function buildAdjacency(): Adjacency {
	const adjacency: Adjacency = {};
	for (const [a, b] of EDGES) {
		adjacency[a] ??= [];
		adjacency[a].push(b);
		adjacency[b] ??= [];
		adjacency[b].push(a);
	}
	return adjacency;
}

// 4-column grid inside the 460×240 viewBox, two rows of four
function slot(index: number): Point {
	return { x: 60 + (index % 4) * 115, y: index % 8 < 4 ? 55 : 185 };
}

const selectClass =
	"rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-sm text-zinc-200";

const initialAdjacency = buildAdjacency();
const initialNodes = NODES.map((node) => node.id);
const initialPositions: Record<string, Point> = Object.fromEntries(
	NODES.map((node) => [node.id, { x: node.x, y: node.y }]),
);

export function GraphPlaygroundDemo() {
	const [nodes, setNodes] = useState<string[]>(initialNodes);
	const [positions, setPositions] = useState(initialPositions);
	const [adj, setAdj] = useState<Adjacency>(initialAdjacency);
	const [log, setLog] = useState<string[]>(["Loaded the built-in graph"]);

	const [edgeA, setEdgeA] = useState("A");
	const [edgeB, setEdgeB] = useState("B");
	const [dropNode, setDropNode] = useState("A");
	const [searchFrom, setSearchFrom] = useState("A");
	const [searchTo, setSearchTo] = useState("D");

	// Edge-existence search: reveals the target's neighbor list one item at a time
	const [scan, setScan] = useState<{
		from: string;
		to: string;
		checked: number;
	} | null>(null);

	const neighborsOf = (id: string) => adj[id] ?? [];
	const scanList = scan ? neighborsOf(scan.from) : [];
	const targetIndex = scan ? scanList.indexOf(scan.to) : -1;
	const scanStop = scan
		? targetIndex === -1
			? scanList.length
			: targetIndex + 1
		: 0;
	const scanDone = scan !== null && scan.checked >= scanStop;
	const scanFound = scanDone && scanList.includes(scan.to);

	useEffect(() => {
		if (!scan || scanDone) return;
		const timer = setTimeout(
			() =>
				setScan(
					(current) => current && { ...current, checked: current.checked + 1 },
				),
			320,
		);
		return () => clearTimeout(timer);
	}, [scan, scanDone]);

	function pushLog(message: string) {
		setLog((entries) => [message, ...entries].slice(0, 4));
	}

	function addNode() {
		if (nodes.length >= 8) return;
		const label = "ABCDEFGH"
			.split("")
			.find((letter) => !nodes.includes(letter));
		if (!label) return;
		setNodes([...nodes, label]);
		setPositions({ ...positions, [label]: slot(nodes.length) });
		setAdj({ ...adj, [label]: [] });
		pushLog(`addNode(${label}) → adjacency[${label}] = []`);
	}

	function removeNode(id: string) {
		let touched = 0;
		const next: Adjacency = {};
		for (const [key, list] of Object.entries(adj)) {
			if (key === id) continue;
			if (list.includes(id)) touched++;
			next[key] = list.filter((neighbor) => neighbor !== id);
		}
		setNodes(nodes.filter((node) => node !== id));
		setAdj(next);
		const { [id]: _dropped, ...kept } = positions;
		setPositions(kept);
		pushLog(`removeNode(${id}) → removed from ${touched} neighbor lists`);
		setScan(null);
	}

	function addEdge(a: string, b: string) {
		if (a === b || neighborsOf(a).includes(b)) return;
		setAdj({
			...adj,
			[a]: [...neighborsOf(a), b],
			[b]: [...neighborsOf(b), a],
		});
		pushLog(`addEdge(${a}, ${b}) → appended to both lists`);
	}

	function removeEdge(a: string, b: string) {
		if (a === b || !neighborsOf(a).includes(b)) return;
		setAdj({
			...adj,
			[a]: neighborsOf(a).filter((neighbor) => neighbor !== b),
			[b]: neighborsOf(b).filter((neighbor) => neighbor !== a),
		});
		pushLog(`removeEdge(${a}, ${b}) → removed from both lists`);
	}

	function reset() {
		setNodes(initialNodes);
		setPositions(initialPositions);
		setAdj(initialAdjacency);
		setLog(["Reset to the built-in graph"]);
		setScan(null);
	}

	const edgeExists = edgeA !== edgeB && neighborsOf(edgeA).includes(edgeB);
	const canvasEdges: [string, string][] = [];
	for (const [a, list] of Object.entries(adj)) {
		for (const b of list) {
			if (a < b) canvasEdges.push([a, b]);
		}
	}

	const verdict = match({ done: scanDone, found: scanFound, scan })
		.with({ done: true, found: true }, ({ scan: s }) =>
			s
				? `"${s.to}" found in "${s.from}"'s list after ${s.checked} check${s.checked === 1 ? "" : "s"} — edge exists`
				: "",
		)
		.with({ done: true, found: false }, ({ scan: s }) =>
			s
				? `"${s.to}" not in "${s.from}"'s list — checked all ${s.checked}, no edge`
				: "",
		)
		.otherwise(({ scan: s }) =>
			s
				? `Scanning "${s.from}"'s neighbor list — ${s.checked}/${scanStop}`
				: "",
		);

	const button =
		"rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed";

	return (
		<DemoSection
			title="Operations playground"
			description="You can add or remove nodes and edges here. Every change edits the neighbor lists on the right, because those lists are the whole graph. Adding a node takes the same short work every time. An edge writes two entries. After a few edits, check whether two nodes are connected and watch the search walk one neighbor list entry at a time."
		>
			<div className="space-y-5">
				<div className="flex flex-wrap items-center gap-2">
					<button
						type="button"
						onClick={addNode}
						disabled={nodes.length >= 8}
						className={`${button} border-emerald-500/30 bg-emerald-600/20 text-emerald-300`}
					>
						+ Add node
					</button>
					<label htmlFor="pg-drop" className="sr-only">
						Node to remove
					</label>
					<select
						id="pg-drop"
						value={dropNode}
						onChange={(event) => setDropNode(event.target.value)}
						className={selectClass}
					>
						{nodes.map((id) => (
							<option key={id}>{id}</option>
						))}
					</select>
					<button
						type="button"
						onClick={() => removeNode(dropNode)}
						className={`${button} border-rose-500/30 bg-rose-600/20 text-rose-300`}
					>
						− Remove node
					</button>
					<span className="mx-1 h-5 w-px bg-zinc-700" />
					<label htmlFor="pg-edge-a" className="sr-only">
						Edge endpoint A
					</label>
					<select
						id="pg-edge-a"
						value={edgeA}
						onChange={(event) => setEdgeA(event.target.value)}
						className={selectClass}
					>
						{nodes.map((id) => (
							<option key={id}>{id}</option>
						))}
					</select>
					<label htmlFor="pg-edge-b" className="sr-only">
						Edge endpoint B
					</label>
					<select
						id="pg-edge-b"
						value={edgeB}
						onChange={(event) => setEdgeB(event.target.value)}
						className={selectClass}
					>
						{nodes.map((id) => (
							<option key={id}>{id}</option>
						))}
					</select>
					<button
						type="button"
						onClick={() => addEdge(edgeA, edgeB)}
						disabled={edgeExists}
						className={`${button} border-emerald-500/30 bg-emerald-600/20 text-emerald-300`}
					>
						+ Edge
					</button>
					<button
						type="button"
						onClick={() => removeEdge(edgeA, edgeB)}
						disabled={!edgeExists}
						className={`${button} border-rose-500/30 bg-rose-600/20 text-rose-300`}
					>
						− Edge
					</button>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<label htmlFor="pg-search-from" className="text-sm text-zinc-400">
						Does
					</label>
					<select
						id="pg-search-from"
						value={searchFrom}
						onChange={(event) => {
							setSearchFrom(event.target.value);
							setScan(null);
						}}
						className={selectClass}
					>
						{nodes.map((id) => (
							<option key={id}>{id}</option>
						))}
					</select>
					<label htmlFor="pg-search-to" className="text-sm text-zinc-400">
						have an edge to
					</label>
					<select
						id="pg-search-to"
						value={searchTo}
						onChange={(event) => {
							setSearchTo(event.target.value);
							setScan(null);
						}}
						className={selectClass}
					>
						{nodes.map((id) => (
							<option key={id}>{id}</option>
						))}
					</select>
					<button
						type="button"
						onClick={() =>
							setScan({ from: searchFrom, to: searchTo, checked: 0 })
						}
						className={`${button} border-amber-500/30 bg-amber-600/20 text-amber-300`}
					>
						Check edge
					</button>
					<button
						type="button"
						onClick={reset}
						className={`${button} border-zinc-600/40 bg-zinc-700/30 text-zinc-300`}
					>
						Reset
					</button>
				</div>
				<div className="grid gap-5 lg:grid-cols-2">
					<div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
						<svg
							viewBox="0 0 460 240"
							role="img"
							aria-label="Editable undirected graph"
							className="mx-auto w-full max-w-xl"
						>
							{canvasEdges.map(([a, b]) => {
								const from = positions[a];
								const to = positions[b];
								const active =
									scanFound &&
									scan !== null &&
									scan.from === a &&
									scan.to === b;
								return from && to ? (
									<line
										key={`${a}-${b}`}
										x1={from.x}
										y1={from.y}
										x2={to.x}
										y2={to.y}
										stroke={active ? "#059669" : "#52525b"}
										strokeWidth={active ? 3.5 : 3}
									/>
								) : null;
							})}
							{nodes.map((id) => {
								const point = positions[id];
								const isFrom = scan?.from === id;
								const isHit = scanFound && scan?.to === id;
								const fill = isFrom ? "#854d0e" : isHit ? "#065f46" : "#27272a";
								const stroke = isFrom
									? "#fcd34d"
									: isHit
										? "#6ee7b7"
										: "#71717a";
								return point ? (
									<g key={id}>
										<circle
											cx={point.x}
											cy={point.y}
											r="23"
											fill={fill}
											stroke={stroke}
											strokeWidth="2"
										/>
										<text
											x={point.x}
											y={point.y + 5}
											textAnchor="middle"
											fill="#f4f4f5"
											fontSize="14"
											fontFamily="monospace"
										>
											{id}
										</text>
									</g>
								) : null;
							})}
						</svg>
					</div>
					<div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
						<p className="mb-3 text-sm font-medium text-zinc-200">
							Adjacency list · internal state
						</p>
						<div className="grid gap-2 sm:grid-cols-2">
							{nodes.map((id) => {
								const list = neighborsOf(id);
								return (
									<div
										key={id}
										className={`rounded-md border px-3 py-2 font-mono text-xs ${
											scan?.from === id
												? "border-amber-500/50 bg-amber-500/5"
												: "border-zinc-800 bg-zinc-950/40"
										}`}
									>
										<span className="text-zinc-400">{id}:</span>{" "}
										{list.length ? (
											list.map((neighbor) => {
												const checked =
													scan?.from === id &&
													list.indexOf(neighbor) < scan.checked;
												const isTarget =
													scan?.from === id && neighbor === scan.to;
												const tone = match({
													checked,
													isTarget,
													found: scanFound,
												})
													.with(
														{ isTarget: true, found: true },
														() => "rounded px-1 text-emerald-300",
													)
													.with(
														{ checked: true },
														() => "text-zinc-600 line-through",
													)
													.with({ isTarget: true }, () => "text-amber-300")
													.otherwise(() => "text-zinc-300");
												return (
													<span key={neighbor} className={tone}>
														{neighbor}{" "}
													</span>
												);
											})
										) : (
											<span className="text-zinc-600">∅</span>
										)}
									</div>
								);
							})}
						</div>
					</div>
				</div>
				<output aria-live="polite" className="block text-sm text-zinc-400">
					{verdict || "Pick two nodes and check whether an edge connects them"}
				</output>
				<div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
					<p className="mb-2 text-sm font-medium text-zinc-200">
						Operation log
					</p>
					<ul className="space-y-1 font-mono text-xs text-zinc-500">
						{log.map((entry) => (
							<li key={entry}>› {entry}</li>
						))}
					</ul>
				</div>
			</div>
		</DemoSection>
	);
}
