export interface GraphNode {
	id: string;
	x: number;
	y: number;
}

export interface WalkStep {
	visited: string[];
	frontier: string[];
	cycleEdge?: [string, string];
}

export const NODES: GraphNode[] = [
	{ id: "A", x: 70, y: 70 },
	{ id: "B", x: 200, y: 40 },
	{ id: "C", x: 330, y: 70 },
	{ id: "D", x: 110, y: 190 },
	{ id: "E", x: 270, y: 190 },
	{ id: "F", x: 390, y: 170 },
];

export const EDGES: [string, string][] = [
	["A", "B"],
	["A", "D"],
	["B", "C"],
	["B", "D"],
	["C", "E"],
	["C", "F"],
	["D", "E"],
	["E", "F"],
];

// Adjacency list derived from EDGES so both stay in sync
export const GRAPH: Record<string, string[]> = {};
for (const [a, b] of EDGES) {
	if (!GRAPH[a]) GRAPH[a] = [];
	GRAPH[a].push(b);
	if (!GRAPH[b]) GRAPH[b] = [];
	GRAPH[b].push(a);
}

// GRAPH itself contains loops (A–B, A–D, B–D), so the loop-free preset is a
// spanning tree of GRAPH; CYCLE_GRAPH adds one edge back to close a loop.
export const TREE_EDGES: [string, string][] = [
	["A", "B"],
	["A", "D"],
	["B", "C"],
	["C", "E"],
	["C", "F"],
];

export const CYCLE_EDGES: [string, string][] = [...TREE_EDGES, ["D", "E"]];

function adjacency(edges: [string, string][]): Record<string, string[]> {
	const graph: Record<string, string[]> = {};
	for (const [a, b] of edges) {
		if (!graph[a]) graph[a] = [];
		graph[a].push(b);
		if (!graph[b]) graph[b] = [];
		graph[b].push(a);
	}
	return graph;
}

export const TREE_GRAPH = adjacency(TREE_EDGES);
export const CYCLE_GRAPH = adjacency(CYCLE_EDGES);

export function walkSteps(
	graph: Record<string, string[]>,
	start: string,
	depthFirst: boolean,
): WalkStep[] {
	const pending = [start];
	const seen = new Set<string>([start]);
	const cameFrom = new Map<string, string>([[start, start]]);
	const order: string[] = [];
	const steps: WalkStep[] = [];
	let cycleEdge: [string, string] | undefined;
	while (pending.length) {
		const current = (depthFirst ? pending.pop() : pending.shift()) as string;
		order.push(current);
		const neighbors = graph[current] ?? [];
		for (const neighbor of depthFirst ? [...neighbors].reverse() : neighbors) {
			if (seen.has(neighbor)) {
				// The edge back to the node we came from is the same edge, not a loop
				if (neighbor !== cameFrom.get(current) && !cycleEdge)
					cycleEdge = [current, neighbor];
				continue;
			}
			seen.add(neighbor);
			cameFrom.set(neighbor, current);
			pending.push(neighbor);
		}
		steps.push({ visited: [...order], frontier: [...pending], cycleEdge });
	}
	return steps;
}

export function shortestPath(start: string, target: string): string[] {
	const pending = [start];
	const previous = new Map<string, string | null>([[start, null]]);
	for (let index = 0; index < pending.length; index++) {
		const current = pending[index] as string;
		if (current === target) break;
		for (const neighbor of GRAPH[current] ?? []) {
			if (!previous.has(neighbor)) {
				previous.set(neighbor, current);
				pending.push(neighbor);
			}
		}
	}
	if (!previous.has(target)) return [];
	const path: string[] = [];
	for (
		let current: string | null = target;
		current;
		current = previous.get(current) ?? null
	)
		path.push(current);
	return path.reverse();
}

// Nodes grouped by hops from the start — ring 0 is the start itself
export function bfsLevels(start: string): string[][] {
	const levels: string[][] = [[start]];
	const seen = new Set<string>([start]);
	for (let index = 0; index < levels.length; index++) {
		const ring = levels[index] as string[];
		const next: string[] = [];
		for (const node of ring) {
			for (const neighbor of GRAPH[node] ?? []) {
				if (seen.has(neighbor)) continue;
				seen.add(neighbor);
				next.push(neighbor);
			}
		}
		if (next.length) levels.push(next);
	}
	return levels;
}
