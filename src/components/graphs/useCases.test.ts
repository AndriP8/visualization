/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, expect, it } from "vitest";
import {
	bfsPath,
	friendSuggestions,
	ROAD_MAP,
	SOCIAL_GRAPH,
	toAdjacency,
	toWeights,
	weightedShortestPath,
} from "./useCases";

const roads = toWeights(ROAD_MAP);
const social = toAdjacency(SOCIAL_GRAPH);

describe("weightedShortestPath", () => {
	it("picks the cheap back road over the obvious highway", () => {
		const { path, total } = weightedShortestPath(roads, "Home", "Beach");
		expect(path).toEqual(["Home", "Park", "Airport", "Beach"]);
		expect(total).toBe(15);
	});

	it("returns an empty path when the target is unreachable", () => {
		const { path, total } = weightedShortestPath({ A: {}, B: {} }, "A", "B");
		expect(path).toEqual([]);
		expect(total).toBe(0);
	});
});

describe("bfsPath", () => {
	it("finds You → Fay in three hops via Dev", () => {
		expect(bfsPath(social, "You", "Fay")).toEqual(["You", "Ben", "Dev", "Fay"]);
	});

	it("returns an empty path when disconnected", () => {
		expect(bfsPath({ A: [] }, "A", "B")).toEqual([]);
	});
});

describe("friendSuggestions", () => {
	it("ranks friends-of-friends by mutual count and skips direct friends", () => {
		const suggestions = friendSuggestions(social, "You");
		expect(suggestions[0]).toEqual({ id: "Cara", mutuals: ["Ana", "Ben"] });
		const ids = suggestions.map((s) => s.id);
		expect(ids).toContain("Dev");
		expect(ids).not.toContain("Ela");
		expect(ids).not.toContain("Fay");
		expect(ids).not.toContain("Ana");
	});
});
