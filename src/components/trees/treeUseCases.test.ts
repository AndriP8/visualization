import { describe, expect, it } from "vitest";
import {
	FILE_SYSTEM,
	findPath,
	flatten,
	formatPath,
	JSON_DOCUMENT,
	leaves,
} from "./treeUseCases";

describe("findPath", () => {
	it("walks from the file-system root to a nested file", () => {
		const path = findPath(
			FILE_SYSTEM,
			"/projects/visualizer/src/routes/trees.tsx",
		);
		expect(path.map((node) => node.label)).toEqual([
			"~",
			"projects",
			"visualizer",
			"src",
			"routes",
			"trees.tsx",
		]);
	});

	it("returns an empty path for an unknown id", () => {
		expect(findPath(FILE_SYSTEM, "/missing")).toEqual([]);
	});

	it("reaches array items through their parent key", () => {
		const path = findPath(JSON_DOCUMENT, "orders[0].items[1]");
		expect(formatPath(path, "json")).toBe("orders[0].items[1]");
	});
});

describe("formatPath", () => {
	it("renders file-system segments with slashes", () => {
		const path = findPath(FILE_SYSTEM, "/projects/visualizer/package.json");
		expect(formatPath(path, "filesystem")).toBe(
			"~/projects/visualizer/package.json",
		);
	});

	it("renders JSON keys with dots and array indices without them", () => {
		const path = findPath(JSON_DOCUMENT, "users[0].roles[0]");
		expect(formatPath(path, "json")).toBe("users[0].roles[0]");
	});
});

describe("leaves", () => {
	it("returns only nodes with no children", () => {
		expect(
			leaves(FILE_SYSTEM).every((node) => node.children.length === 0),
		).toBe(true);
		expect(leaves(JSON_DOCUMENT).map((node) => node.id)).toContain(
			"orders[0].items[1]",
		);
	});

	it("visits every node exactly once", () => {
		const ids = flatten(JSON_DOCUMENT).map((node) => node.id);
		expect(new Set(ids).size).toBe(ids.length);
	});
});
