import { describe, expect, it } from "vitest";
import {
	buildTable,
	CACHE_ENTRIES,
	countByUser,
	DNS_ENTRIES,
	dedupe,
	EVENT_STREAM,
	hashKey,
	lookup,
	RATE_LIMIT,
	rateLimit,
	TABLE_SIZE,
	tagDuplicates,
} from "./useCases";

describe("hashKey", () => {
	it("is stable and stays inside the table", () => {
		expect(hashKey("/api/users", TABLE_SIZE)).toBe(
			hashKey("/api/users", TABLE_SIZE),
		);
		expect(hashKey("anything", TABLE_SIZE)).toBeGreaterThanOrEqual(0);
		expect(hashKey("anything", TABLE_SIZE)).toBeLessThan(TABLE_SIZE);
	});
});

describe("chained lookup", () => {
	const table = buildTable(CACHE_ENTRIES, TABLE_SIZE);

	it("finds every inserted entry", () => {
		for (const entry of CACHE_ENTRIES) {
			const result = lookup(table, entry.key);
			expect(result.position).toBeGreaterThanOrEqual(0);
			expect(result.value).toBe(entry.value);
			expect(result.comparisons).toBe(result.position + 1);
		}
	});

	it("reports a miss after exhausting the chain", () => {
		const result = lookup(table, "missing-key");
		expect(result.position).toBe(-1);
		expect(result.comparisons).toBe(result.chain.length);
		expect(result.value).toBeUndefined();
	});

	it("keeps DNS hosts in the same bucket array shape", () => {
		const dns = buildTable(DNS_ENTRIES, TABLE_SIZE);
		expect(dns.flat()).toHaveLength(DNS_ENTRIES.length);
		expect(lookup(dns, "api.example.com").value).toBe("93.184.216.35");
	});
});

describe("dedupe", () => {
	it("drops repeated event ids and keeps retries labelled", () => {
		const tagged = tagDuplicates(EVENT_STREAM);
		expect(tagged.filter((event) => event.duplicate)).toHaveLength(3);
		const { unique, duplicates } = dedupe(EVENT_STREAM);
		expect(duplicates.map((event) => event.id)).toEqual([
			"evt-1",
			"evt-2",
			"evt-3",
		]);
		expect(unique).toHaveLength(8);
	});
});

describe("rate limiting", () => {
	it("counts unique events per user and blocks the excess", () => {
		const counts = countByUser(dedupe(EVENT_STREAM).unique);
		expect(counts).toEqual({ ada: 4, linus: 2, grace: 2 });
		const rates = rateLimit(counts, RATE_LIMIT);
		expect(rates[0]).toEqual({
			user: "ada",
			count: 4,
			remaining: 0,
			blocked: 1,
		});
		expect(rates.filter((rate) => rate.blocked > 0)).toHaveLength(1);
	});
});
