export type Point = { x: number; y: number };
export type HnswNode = {
	id: number;
	point: Point;
	level: number;
	neighbors: number[][];
};

export const WIDTH = 600;
export const HEIGHT = 360;
export const N = 80;
export const M = 4;
export const ML = 1 / Math.log(M);

export function mulberry32(seed: number) {
	let s = seed;
	return () => {
		s = (s + 0x6d2b79f5) | 0;
		let t = s;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export function generatePoints(): Point[] {
	const rng = mulberry32(42);
	return Array.from({ length: N }, () => ({
		x: 30 + rng() * (WIDTH - 60),
		y: 30 + rng() * (HEIGHT - 60),
	}));
}

export function dist(a: Point, b: Point): number {
	const dx = a.x - b.x;
	const dy = a.y - b.y;
	return Math.sqrt(dx * dx + dy * dy);
}

function assignLevels(rng: () => number): number[] {
	return Array.from({ length: N }, () =>
		Math.floor(-Math.log(rng() + 1e-9) * ML),
	);
}

export function buildHnsw(points: Point[]): {
	nodes: HnswNode[];
	maxLevel: number;
	entry: number;
} {
	const rng = mulberry32(7);
	const levels = assignLevels(rng);

	const nodes: HnswNode[] = points.map((p, id) => ({
		id,
		point: p,
		level: levels[id],
		neighbors: Array.from({ length: levels[id] + 1 }, () => []),
	}));

	let entry = 0;
	let maxLevel = nodes[0].level;

	for (let i = 1; i < nodes.length; i++) {
		const node = nodes[i];
		const inserted = nodes.slice(0, i);

		let curr = entry;
		for (let l = maxLevel; l > node.level; l--) {
			curr = greedyClosest(nodes, curr, node.point, l);
		}

		for (let l = Math.min(node.level, maxLevel); l >= 0; l--) {
			const candidates = inserted
				.filter((n) => n.level >= l)
				.map((n) => ({ id: n.id, d: dist(n.point, node.point) }))
				.sort((a, b) => a.d - b.d)
				.slice(0, M);

			for (const c of candidates) {
				node.neighbors[l].push(c.id);
				nodes[c.id].neighbors[l].push(node.id);
				if (nodes[c.id].neighbors[l].length > M) {
					const owner = nodes[c.id];
					owner.neighbors[l] = owner.neighbors[l]
						.map((nid) => ({ id: nid, d: dist(nodes[nid].point, owner.point) }))
						.sort((a, b) => a.d - b.d)
						.slice(0, M)
						.map((x) => x.id);
				}
			}
			curr = candidates[0]?.id ?? curr;
		}

		if (node.level > maxLevel) {
			maxLevel = node.level;
			entry = node.id;
		}
	}

	return { nodes, maxLevel, entry };
}

function greedyClosest(
	nodes: HnswNode[],
	startId: number,
	query: Point,
	layer: number,
): number {
	let curr = startId;
	let currDist = dist(nodes[curr].point, query);
	while (true) {
		let improved = false;
		const neighbors = nodes[curr].neighbors[layer] ?? [];
		for (const nid of neighbors) {
			const d = dist(nodes[nid].point, query);
			if (d < currDist) {
				currDist = d;
				curr = nid;
				improved = true;
			}
		}
		if (!improved) return curr;
	}
}

export type SearchStep = {
	layer: number;
	visited: number[];
	current: number;
};

export function searchHnsw(
	nodes: HnswNode[],
	entry: number,
	maxLevel: number,
	query: Point,
	ef: number,
	k = 5,
): { steps: SearchStep[]; results: number[]; visited: Set<number> } {
	const steps: SearchStep[] = [];
	const visited = new Set<number>();

	let curr = entry;
	visited.add(curr);

	for (let l = maxLevel; l > 0; l--) {
		const layerVisited: number[] = [curr];
		let currDist = dist(nodes[curr].point, query);
		while (true) {
			let improved = false;
			for (const nid of nodes[curr].neighbors[l] ?? []) {
				visited.add(nid);
				layerVisited.push(nid);
				const d = dist(nodes[nid].point, query);
				if (d < currDist) {
					currDist = d;
					curr = nid;
					improved = true;
				}
			}
			if (!improved) break;
		}
		steps.push({ layer: l, visited: layerVisited, current: curr });
	}

	const candidates: { id: number; d: number }[] = [
		{ id: curr, d: dist(nodes[curr].point, query) },
	];
	const dynamic: { id: number; d: number }[] = [...candidates];
	const seen = new Set<number>([curr]);
	const layerVisited: number[] = [curr];

	while (dynamic.length > 0) {
		dynamic.sort((a, b) => a.d - b.d);
		const c = dynamic.shift();
		if (!c) break;
		const furthest = candidates[candidates.length - 1];
		if (candidates.length >= ef && c.d > furthest.d) break;

		for (const nid of nodes[c.id].neighbors[0] ?? []) {
			if (seen.has(nid)) continue;
			seen.add(nid);
			visited.add(nid);
			layerVisited.push(nid);
			const d = dist(nodes[nid].point, query);
			const f = candidates[candidates.length - 1];
			if (candidates.length < ef || d < f.d) {
				candidates.push({ id: nid, d });
				candidates.sort((a, b) => a.d - b.d);
				if (candidates.length > ef) candidates.pop();
				dynamic.push({ id: nid, d });
			}
		}
	}

	steps.push({
		layer: 0,
		visited: layerVisited,
		current: candidates[0]?.id ?? curr,
	});

	const results = candidates.slice(0, k).map((c) => c.id);
	return { steps, results, visited };
}

export function bruteForceTopK(
	points: Point[],
	query: Point,
	k: number,
): number[] {
	return points
		.map((p, i) => ({ i, d: dist(p, query) }))
		.sort((a, b) => a.d - b.d)
		.slice(0, k)
		.map((r) => r.i);
}
