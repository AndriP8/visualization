export interface ScenarioNode {
	id: string;
	x: number;
	y: number;
}

export interface ScenarioEdge {
	a: string;
	b: string;
	weight?: number;
}

export interface Scenario {
	nodes: ScenarioNode[];
	edges: ScenarioEdge[];
}

export type Adjacency = Record<string, string[]>;
export type Weights = Record<string, Record<string, number>>;

// GPS-style road network: edges carry travel minutes
export const ROAD_MAP: Scenario = {
	nodes: [
		{ id: "Home", x: 70, y: 60 },
		{ id: "Mall", x: 210, y: 40 },
		{ id: "Station", x: 350, y: 60 },
		{ id: "Park", x: 110, y: 175 },
		{ id: "Airport", x: 270, y: 180 },
		{ id: "Beach", x: 395, y: 150 },
	],
	edges: [
		{ a: "Home", b: "Mall", weight: 7 },
		{ a: "Home", b: "Park", weight: 4 },
		{ a: "Mall", b: "Station", weight: 9 },
		{ a: "Mall", b: "Park", weight: 6 },
		{ a: "Station", b: "Airport", weight: 5 },
		{ a: "Station", b: "Beach", weight: 12 },
		{ a: "Park", b: "Airport", weight: 8 },
		{ a: "Airport", b: "Beach", weight: 3 },
	],
};

// Friend graph: edges carry friendships
export const SOCIAL_GRAPH: Scenario = {
	nodes: [
		{ id: "You", x: 70, y: 55 },
		{ id: "Ana", x: 200, y: 35 },
		{ id: "Ben", x: 215, y: 125 },
		{ id: "Cara", x: 335, y: 65 },
		{ id: "Dev", x: 355, y: 165 },
		{ id: "Ela", x: 265, y: 205 },
		{ id: "Fay", x: 415, y: 140 },
	],
	edges: [
		{ a: "You", b: "Ana" },
		{ a: "You", b: "Ben" },
		{ a: "Ana", b: "Cara" },
		{ a: "Ben", b: "Cara" },
		{ a: "Ben", b: "Dev" },
		{ a: "Cara", b: "Ela" },
		{ a: "Dev", b: "Ela" },
		{ a: "Ela", b: "Fay" },
		{ a: "Dev", b: "Fay" },
	],
};

export function toAdjacency(scenario: Scenario): Adjacency {
	const adjacency: Adjacency = {};
	for (const { a, b } of scenario.edges) {
		adjacency[a] ??= [];
		adjacency[a].push(b);
		adjacency[b] ??= [];
		adjacency[b].push(a);
	}
	return adjacency;
}

export function toWeights(scenario: Scenario): Weights {
	const weights: Weights = {};
	for (const { a, b, weight } of scenario.edges) {
		if (weight === undefined) continue;
		weights[a] ??= {};
		weights[a][b] = weight;
		weights[b] ??= {};
		weights[b][a] = weight;
	}
	return weights;
}

export function weightedShortestPath(
	weights: Weights,
	start: string,
	target: string,
): { path: string[]; total: number } {
	const dist = new Map<string, number>([[start, 0]]);
	const previous = new Map<string, string>();
	const settled = new Set<string>();
	for (;;) {
		let current: string | null = null;
		let best = Number.POSITIVE_INFINITY;
		for (const [id, d] of dist) {
			if (!settled.has(id) && d < best) {
				current = id;
				best = d;
			}
		}
		if (current === null || current === target) break;
		settled.add(current);
		for (const [neighbor, weight] of Object.entries(weights[current] ?? {})) {
			const candidate = best + weight;
			if (candidate < (dist.get(neighbor) ?? Number.POSITIVE_INFINITY)) {
				dist.set(neighbor, candidate);
				previous.set(neighbor, current);
			}
		}
	}
	if (start === target) return { path: [start], total: 0 };
	if (!previous.has(target)) return { path: [], total: 0 };
	const path: string[] = [];
	for (let at: string | undefined = target; at; at = previous.get(at))
		path.push(at);
	return { path: path.reverse(), total: dist.get(target) ?? 0 };
}

export function bfsPath(
	adjacency: Adjacency,
	start: string,
	target: string,
): string[] {
	const previous = new Map<string, string | null>([[start, null]]);
	const pending = [start];
	for (let index = 0; index < pending.length; index++) {
		const current = pending[index] as string;
		if (current === target) break;
		for (const neighbor of adjacency[current] ?? []) {
			if (!previous.has(neighbor)) {
				previous.set(neighbor, current);
				pending.push(neighbor);
			}
		}
	}
	if (!previous.has(target)) return [];
	const path: string[] = [];
	for (let at: string | null = target; at; at = previous.get(at) ?? null)
		path.push(at);
	return path.reverse();
}

export interface Suggestion {
	id: string;
	mutuals: string[];
}

export function friendSuggestions(
	adjacency: Adjacency,
	person: string,
): Suggestion[] {
	const direct = new Set(adjacency[person] ?? []);
	const via = new Map<string, string[]>();
	for (const friend of direct) {
		for (const friendOfFriend of adjacency[friend] ?? []) {
			if (friendOfFriend === person || direct.has(friendOfFriend)) continue;
			via.set(friendOfFriend, [...(via.get(friendOfFriend) ?? []), friend]);
		}
	}
	return [...via.entries()]
		.sort((a, b) => b[1].length - a[1].length)
		.map(([id, mutuals]) => ({ id, mutuals }));
}
