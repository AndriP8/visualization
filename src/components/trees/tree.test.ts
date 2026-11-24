import { describe, expect, it } from "vitest";
import {
	buildBalanced,
	collectRange,
	height,
	insert,
	type Node,
	remove,
	traverse,
} from "./tree";

function build(values: number[]): Node | null {
	return values.reduce<Node | null>((tree, value) => insert(tree, value), null);
}

describe("insert", () => {
	it("keeps the in-order traversal sorted", () => {
		expect(traverse(build([8, 4, 12, 2, 6, 10, 14]))).toEqual([
			2, 4, 6, 8, 10, 12, 14,
		]);
		expect(traverse(build([5, 3, 7, 1, 9]))).toEqual([1, 3, 5, 7, 9]);
	});
});

describe("remove", () => {
	it("removes a leaf by unlinking it", () => {
		expect(traverse(remove(build([8, 4, 12]), 4))).toEqual([8, 12]);
	});

	it("moves the single left child up", () => {
		expect(traverse(remove(build([8, 4, 12, 2]), 4))).toEqual([2, 8, 12]);
	});

	it("moves the single right child up", () => {
		expect(traverse(remove(build([8, 4, 12, 14]), 12))).toEqual([4, 8, 14]);
	});

	it("moves the smallest larger node up for two children", () => {
		expect(traverse(remove(build([8, 4, 12, 2, 6, 10, 14]), 4))).toEqual([
			2, 6, 8, 10, 12, 14,
		]);
	});
});

describe("collectRange", () => {
	const tree = buildBalanced([2, 4, 6, 8, 10, 12, 14, 16, 18]);

	it("returns only the values inside the range, in sorted order", () => {
		expect(collectRange(tree, 5, 13)).toEqual([6, 8, 10, 12]);
	});

	it("returns an empty list when nothing matches", () => {
		expect(collectRange(tree, 20, 30)).toEqual([]);
		expect(collectRange(tree, 13, 5)).toEqual([]);
	});

	it("returns every value for the full range", () => {
		expect(collectRange(tree, 0, 100)).toEqual([
			2, 4, 6, 8, 10, 12, 14, 16, 18,
		]);
	});
});

describe("height", () => {
	it("is 0 for an empty tree", () => {
		expect(height(null)).toBe(0);
	});

	it("counts one level per node on the longest branch", () => {
		expect(height(build([1, 2, 3, 4, 5, 6, 7]))).toBe(7);
	});
});

describe("buildBalanced", () => {
	it("builds a short, balanced search tree from sorted values", () => {
		const tree = buildBalanced([1, 2, 3, 4, 5, 6, 7]);
		expect(traverse(tree)).toEqual([1, 2, 3, 4, 5, 6, 7]);
		expect(height(tree)).toBe(3);
	});
});
