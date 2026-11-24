import { describe, expect, it } from "vitest";
import { heapifySteps, insertSteps, isValidHeap, removeSteps } from "./heap";

describe("insertSteps", () => {
	it("maintains the heap property after every insert", () => {
		let heap: number[] = [];
		for (const value of [5, 3, 8, 1, 9, 2, 7]) {
			heap = insertSteps(heap, value).heap;
			expect(isValidHeap(heap)).toBe(true);
		}
		expect(heap[0]).toBe(1);
	});

	it("records one swap per bubble-up level", () => {
		const { heap, swaps } = insertSteps([2, 5, 8, 9, 7, 12], 1);
		expect(isValidHeap(heap)).toBe(true);
		expect(swaps).toEqual([
			{ a: 6, b: 2 },
			{ a: 2, b: 0 },
		]);
	});
});

describe("removeSteps", () => {
	it("pops values in ascending order (heapsort by repeated pop)", () => {
		let { heap } = heapifySteps([9, 4, 7, 1, 6, 2, 8]);
		const out: number[] = [];
		while (heap.length > 0) {
			const result = removeSteps(heap);
			if (result.removed === null) break;
			out.push(result.removed);
			heap = result.heap;
			expect(isValidHeap(heap)).toBe(true);
		}
		expect(out).toEqual([1, 2, 4, 6, 7, 8, 9]);
	});

	it("handles the empty heap", () => {
		const result = removeSteps([]);
		expect(result.removed).toBeNull();
		expect(result.heap).toEqual([]);
	});

	it("handles a one-element heap", () => {
		const result = removeSteps([5]);
		expect(result.removed).toBe(5);
		expect(result.heap).toEqual([]);
		expect(result.movedLastToRoot).toBe(false);
	});
});

describe("heapifySteps", () => {
	it("builds a valid heap from a scrambled array", () => {
		const { heap } = heapifySteps([9, 4, 7, 1, 6, 2]);
		expect(isValidHeap(heap)).toBe(true);
		expect([...heap].sort((a, b) => a - b)).toEqual([1, 2, 4, 6, 7, 9]);
	});

	it("checks every parent from the middle to the front", () => {
		const { steps } = heapifySteps([9, 4, 7, 1, 6, 2]);
		expect(steps.map((step) => step.parent)).toEqual([2, 1, 0]);
	});

	it("leaves an already-valid heap untouched", () => {
		const { heap } = heapifySteps([2, 5, 8, 9, 7, 12]);
		expect(heap).toEqual([2, 5, 8, 9, 7, 12]);
	});
});
