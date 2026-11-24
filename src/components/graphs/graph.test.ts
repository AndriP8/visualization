import { describe, expect, it } from "vitest";
import {
	bfsLevels,
	CYCLE_GRAPH,
	GRAPH,
	shortestPath,
	TREE_GRAPH,
	walkSteps,
} from "./graph";

describe("walkSteps", () => {
	it("visits nodes in BFS order from A", () => {
		const last = walkSteps(GRAPH, "A", false).at(-1);
		expect(last?.visited).toEqual(["A", "B", "D", "C", "E", "F"]);
	});

	it("visits nodes in DFS order from A", () => {
		const last = walkSteps(GRAPH, "A", true).at(-1);
		expect(last?.visited).toEqual(["A", "B", "C", "E", "F", "D"]);
	});

	it("keeps only genuinely waiting nodes in the frontier", () => {
		for (const steps of [
			walkSteps(GRAPH, "A", false),
			walkSteps(GRAPH, "A", true),
		]) {
			for (const step of steps) {
				expect(new Set(step.frontier).size).toBe(step.frontier.length);
				for (const id of step.frontier) {
					expect(step.visited).not.toContain(id);
				}
			}
		}
	});

	it("never flags the edge back to where the walk came from on a tree", () => {
		for (const steps of [
			walkSteps(TREE_GRAPH, "A", false),
			walkSteps(TREE_GRAPH, "A", true),
		]) {
			for (const step of steps) {
				expect(step.cycleEdge).toBeUndefined();
			}
		}
	});

	it("flags the edge that closes a loop in a cyclic graph", () => {
		expect(walkSteps(CYCLE_GRAPH, "A", false).some((s) => s.cycleEdge)).toBe(
			true,
		);
		expect(walkSteps(CYCLE_GRAPH, "A", true).some((s) => s.cycleEdge)).toBe(
			true,
		);
	});

	it("detects the A–B–D loop that GRAPH itself contains", () => {
		// GRAPH has a cycle, which is why the loop-free preset is TREE_GRAPH
		expect(walkSteps(GRAPH, "A", false).some((s) => s.cycleEdge)).toBe(true);
	});
});

describe("shortestPath", () => {
	it("finds A → F in three hops via B and C", () => {
		expect(shortestPath("A", "F")).toEqual(["A", "B", "C", "F"]);
	});
});

describe("bfsLevels", () => {
	it("groups nodes into hops-from-start rings", () => {
		expect(bfsLevels("A")).toEqual([["A"], ["B", "D"], ["C", "E"], ["F"]]);
	});
});
