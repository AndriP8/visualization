import { describe, expect, it } from "vitest";
import { canDelegate, EVENT_TRAITS } from "./eventModel";

describe("event bubbling traits", () => {
	it("knows which event types bubble", () => {
		expect(canDelegate("click")).toBe(true);
		expect(canDelegate("focusin")).toBe(true);
		expect(canDelegate("focus")).toBe(false);
		expect(canDelegate("blur")).toBe(false);
		expect(canDelegate("mouseenter")).toBe(false);
	});

	it("describes every event type it knows about", () => {
		for (const trait of EVENT_TRAITS) {
			expect(canDelegate(trait.type)).toBe(trait.bubbles);
		}
	});

	it("assumes unknown event types bubble", () => {
		expect(canDelegate("some-custom-event")).toBe(true);
	});

	it("gives every event a note explaining the consequence", () => {
		for (const trait of EVENT_TRAITS) {
			expect(trait.note.length).toBeGreaterThan(0);
		}
	});
});
