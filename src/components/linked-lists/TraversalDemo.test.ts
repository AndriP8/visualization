import { describe, expect, it } from "vitest";
import { CYCLE_FAST, CYCLE_SLOW } from "./TraversalDemo";

// A → B → C → D, then D points back to B: position 3 is followed by position 1.
function nextStep(pos: number): number {
	return pos === 3 ? 1 : pos + 1;
}

describe("cycle demo pointer data", () => {
	it("slow advances one node per step", () => {
		for (let i = 1; i < CYCLE_SLOW.length; i++) {
			expect(CYCLE_SLOW[i]).toBe(nextStep(CYCLE_SLOW[i - 1]));
		}
	});

	it("fast advances two nodes per step", () => {
		for (let i = 1; i < CYCLE_FAST.length; i++) {
			expect(CYCLE_FAST[i]).toBe(nextStep(nextStep(CYCLE_FAST[i - 1])));
		}
	});

	it("the pointers meet on step 3", () => {
		expect(CYCLE_SLOW[3]).toBe(CYCLE_FAST[3]);
	});
});
