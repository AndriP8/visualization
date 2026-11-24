export interface KeyValueEntry {
	key: string;
	value: string;
}

export interface LookupResult {
	bucket: number;
	chain: string[];
	position: number;
	comparisons: number;
	value?: string;
}

export interface EventRecord {
	id: string;
	user: string;
	action: string;
}

export interface TaggedEvent extends EventRecord {
	duplicate: boolean;
}

export interface UserRate {
	user: string;
	count: number;
	remaining: number;
	blocked: number;
}

export const TABLE_SIZE = 8;
export const RATE_LIMIT = 3;

export const CACHE_ENTRIES: KeyValueEntry[] = [
	{ key: "/api/users", value: '{"count": 128}' },
	{ key: "/api/orders", value: '{"count": 42}' },
	{ key: "/api/products", value: '{"count": 512}' },
	{ key: "session:9f2a", value: '{"user": "ada"}' },
	{ key: "feature:new-nav", value: "true" },
	{ key: "rate:ada", value: "17" },
];

export const DNS_ENTRIES: KeyValueEntry[] = [
	{ key: "example.com", value: "93.184.216.34" },
	{ key: "api.example.com", value: "93.184.216.35" },
	{ key: "cdn.example.com", value: "151.101.1.69" },
	{ key: "mail.example.com", value: "74.125.24.26" },
	{ key: "docs.example.com", value: "151.101.2.5" },
	{ key: "status.example.com", value: "104.18.32.7" },
];

export const EVENT_STREAM: EventRecord[] = [
	{ id: "evt-1", user: "ada", action: "signup" },
	{ id: "evt-2", user: "ada", action: "view" },
	{ id: "evt-3", user: "linus", action: "purchase" },
	{ id: "evt-1", user: "ada", action: "signup" },
	{ id: "evt-4", user: "ada", action: "view-product" },
	{ id: "evt-5", user: "linus", action: "view" },
	{ id: "evt-2", user: "ada", action: "view" },
	{ id: "evt-6", user: "grace", action: "signup" },
	{ id: "evt-7", user: "ada", action: "purchase" },
	{ id: "evt-3", user: "linus", action: "purchase" },
	{ id: "evt-8", user: "grace", action: "purchase" },
];

export function hashKey(key: string, size: number): number {
	let hash = 0;
	for (let i = 0; i < key.length; i++) {
		hash = (hash * 31 + key.charCodeAt(i)) % size;
	}
	return hash;
}

export function buildTable(
	entries: KeyValueEntry[],
	size: number,
): KeyValueEntry[][] {
	const table = Array.from({ length: size }, (): KeyValueEntry[] => []);
	for (const entry of entries) {
		table[hashKey(entry.key, size)]?.unshift(entry);
	}
	return table;
}

export function lookup(table: KeyValueEntry[][], key: string): LookupResult {
	const bucket = hashKey(key, table.length);
	const chain = table[bucket] ?? [];
	const position = chain.findIndex((entry) => entry.key === key);
	return {
		bucket,
		chain: chain.map((entry) => entry.key),
		position,
		comparisons: position >= 0 ? position + 1 : chain.length,
		value: position >= 0 ? chain[position]?.value : undefined,
	};
}

export function tagDuplicates(events: EventRecord[]): TaggedEvent[] {
	const seen = new Set<string>();
	return events.map((event) => {
		const duplicate = seen.has(event.id);
		seen.add(event.id);
		return { ...event, duplicate };
	});
}

export function dedupe(events: EventRecord[]): {
	unique: TaggedEvent[];
	duplicates: TaggedEvent[];
} {
	const tagged = tagDuplicates(events);
	return {
		unique: tagged.filter((event) => !event.duplicate),
		duplicates: tagged.filter((event) => event.duplicate),
	};
}

export function countByUser(events: EventRecord[]): Record<string, number> {
	const counts: Record<string, number> = {};
	for (const event of events) {
		counts[event.user] = (counts[event.user] ?? 0) + 1;
	}
	return counts;
}

export function rateLimit(
	counts: Record<string, number>,
	limit: number,
): UserRate[] {
	return Object.entries(counts)
		.map(([user, count]) => ({
			user,
			count,
			remaining: Math.max(limit - count, 0),
			blocked: Math.max(count - limit, 0),
		}))
		.sort((a, b) => b.count - a.count || a.user.localeCompare(b.user));
}
