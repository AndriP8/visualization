export interface CacheEntry {
	key: string;
	value: number;
}

export interface LruPutResult {
	cache: CacheEntry[];
	evicted: string | null;
}

export interface LruGetResult {
	cache: CacheEntry[];
	value: number | null;
	hit: boolean;
}

export interface HistoryNavigateResult {
	history: string[];
	index: number;
}

export const PRESET_KEYS = ["A", "B", "C", "D", "E"];
export const LRU_CAPACITY = 3;

export const PAGES = [
	"google.com",
	"github.com",
	"claude.ai",
	"reddit.com",
	"news.ycombinator.com",
];
export const INITIAL_HISTORY = ["google.com", "github.com", "claude.ai"];
export const INITIAL_HISTORY_INDEX = INITIAL_HISTORY.length - 1;

export function lruPut(
	cache: CacheEntry[],
	key: string,
	value: number,
	capacity: number,
): LruPutResult {
	const next = [{ key, value }, ...cache.filter((entry) => entry.key !== key)];
	const evicted = next.length > capacity ? (next.at(-1)?.key ?? null) : null;
	return { cache: next.slice(0, capacity), evicted };
}

export function lruGet(cache: CacheEntry[], key: string): LruGetResult {
	const entry = cache.find((item) => item.key === key);
	if (!entry) return { cache, value: null, hit: false };
	return {
		cache: [entry, ...cache.filter((item) => item.key !== key)],
		value: entry.value,
		hit: true,
	};
}

export function historyBack(index: number): number {
	return Math.max(0, index - 1);
}

export function historyForward(index: number, length: number): number {
	return Math.min(length - 1, index + 1);
}

export function historyNavigate(
	history: string[],
	index: number,
	page: string,
): HistoryNavigateResult {
	const next = [...history.slice(0, index + 1), page.trim()];
	return { history: next, index: next.length - 1 };
}
