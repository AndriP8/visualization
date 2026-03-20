interface ServerBase {
	id: number;
	healthy?: boolean;
	activeConnections?: number;
	weight?: number;
}

/**
 * Round Robin: returns the index of the next healthy server starting from `currentIndex`.
 * Returns -1 if no healthy server found.
 */
export function getNextRoundRobin<T extends ServerBase>(
	servers: T[],
	currentIndex: number,
): { serverIndex: number; nextIndex: number } | null {
	if (servers.length === 0) return null;

	let attempts = 0;
	let index = currentIndex % servers.length;

	while (attempts < servers.length) {
		if (servers[index].healthy !== false) {
			return {
				serverIndex: index,
				nextIndex: (index + 1) % servers.length,
			};
		}
		index = (index + 1) % servers.length;
		attempts++;
	}

	return null;
}

/**
 * Weighted Round Robin: builds a sequence based on weights, then picks
 * the server at `currentIndex` in that sequence.
 * Returns null if no servers provided.
 */
export function buildWeightedSequence<T extends ServerBase>(servers: T[]): T[] {
	const sequence: T[] = [];
	for (const server of servers) {
		const w = server.weight ?? 1;
		for (let i = 0; i < w; i++) {
			sequence.push(server);
		}
	}
	return sequence;
}

export function getNextWeightedRoundRobin<T extends ServerBase>(
	servers: T[],
	currentIndex: number,
): { server: T; nextIndex: number } | null {
	const sequence = buildWeightedSequence(servers);
	if (sequence.length === 0) return null;

	const index = currentIndex % sequence.length;
	return {
		server: sequence[index],
		nextIndex: (index + 1) % sequence.length,
	};
}

/**
 * Least Connections: returns the server with fewest active connections.
 * Ties are broken by picking the first one found (stable).
 */
export function getLeastConnected<T extends ServerBase>(
	servers: T[],
): T | null {
	if (servers.length === 0) return null;

	return servers.reduce((min, server) =>
		(server.activeConnections ?? 0) < (min.activeConnections ?? 0)
			? server
			: min,
	);
}
