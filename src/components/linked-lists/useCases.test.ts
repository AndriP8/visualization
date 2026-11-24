import { describe, expect, it } from "vitest";
import {
	type CacheEntry,
	historyBack,
	historyForward,
	historyNavigate,
	INITIAL_HISTORY,
	LRU_CAPACITY,
	lruGet,
	lruPut,
} from "./useCases";

const order = (cache: CacheEntry[]) => cache.map((entry) => entry.key);

describe("lruPut", () => {
	it("keeps most recent first", () => {
		const first = lruPut([], "A", 65, LRU_CAPACITY);
		const second = lruPut(first.cache, "B", 66, LRU_CAPACITY);
		expect(order(second.cache)).toEqual(["B", "A"]);
	});

	it("evicts the least recently used entry when full", () => {
		const cache = [
			{ key: "C", value: 67 },
			{ key: "B", value: 66 },
			{ key: "A", value: 65 },
		];
		const result = lruPut(cache, "D", 68, LRU_CAPACITY);
		expect(result.cache).toHaveLength(LRU_CAPACITY);
		expect(order(result.cache)).toEqual(["D", "C", "B"]);
		expect(result.evicted).toBe("A");
	});

	it("refreshes an existing key without duplicating it", () => {
		const cache = [
			{ key: "C", value: 67 },
			{ key: "B", value: 66 },
			{ key: "A", value: 65 },
		];
		const result = lruPut(cache, "A", 1, LRU_CAPACITY);
		expect(order(result.cache)).toEqual(["A", "C", "B"]);
		expect(result.evicted).toBeNull();
	});
});

describe("lruGet", () => {
	it("moves a hit to the front and returns its value", () => {
		const cache = [
			{ key: "C", value: 67 },
			{ key: "B", value: 66 },
			{ key: "A", value: 65 },
		];
		const result = lruGet(cache, "A");
		expect(result.hit).toBe(true);
		expect(result.value).toBe(65);
		expect(order(result.cache)).toEqual(["A", "C", "B"]);
	});

	it("leaves the order alone on a miss", () => {
		const cache = [
			{ key: "C", value: 67 },
			{ key: "B", value: 66 },
		];
		const result = lruGet(cache, "Z");
		expect(result.hit).toBe(false);
		expect(result.value).toBeNull();
		expect(order(result.cache)).toEqual(["C", "B"]);
	});
});

describe("browser history", () => {
	it("clamps back and forward at the ends", () => {
		expect(historyBack(0)).toBe(0);
		expect(historyBack(2)).toBe(1);
		expect(historyForward(2, 3)).toBe(2);
		expect(historyForward(0, 3)).toBe(1);
	});

	it("drops forward entries when navigating from the middle", () => {
		const result = historyNavigate(INITIAL_HISTORY, 1, "reddit.com");
		expect(result.history).toEqual(["google.com", "github.com", "reddit.com"]);
		expect(result.index).toBe(2);
	});

	it("appends when already at the newest entry", () => {
		const result = historyNavigate(INITIAL_HISTORY, 2, "reddit.com");
		expect(result.history).toEqual([
			"google.com",
			"github.com",
			"claude.ai",
			"reddit.com",
		]);
		expect(result.index).toBe(3);
	});
});
