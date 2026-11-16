import { describe, expect, it } from "vitest";
import { DOCUMENTS, QUERY } from "./vectorDistanceData";
import {
	cosineDistance,
	cosineSimilarity,
	magnitude,
	normalize,
	rankDocuments,
} from "./vectorMetrics";

function ids(ranking: { id: string }[]): string[] {
	return ranking.map((document) => document.id);
}

describe("vector metric helpers", () => {
	it("treats identical vectors as a cosine similarity of 1", () => {
		expect(cosineSimilarity([1, 2], [1, 2])).toBeCloseTo(1);
		expect(cosineDistance([1, 2], [1, 2])).toBeCloseTo(0);
	});

	it("returns null cosine for a zero-length vector", () => {
		expect(cosineSimilarity([0, 0], [1, 2])).toBeNull();
		expect(cosineDistance([0, 0], [1, 2])).toBeNull();
	});

	it("normalizes vectors to unit length", () => {
		expect(magnitude(normalize([3, 4]))).toBeCloseTo(1);
	});

	it("keeps cosine unchanged after normalization", () => {
		const before = cosineSimilarity([2, 1], [3, 5]);
		const after = cosineSimilarity(normalize([2, 1]), normalize([3, 5]));
		expect(after).toBeCloseTo(before ?? Number.NaN);
	});
});

describe("ranking over the demo dataset", () => {
	it("ranks the short relevant document first by cosine", () => {
		const ranking = rankDocuments({
			documents: DOCUMENTS,
			query: QUERY,
			metric: "cosine",
		});
		expect(ids(ranking)).toEqual(["a", "b", "e", "c", "d"]);
	});

	it("lets long documents win on raw dot product and raw L2", () => {
		const dot = rankDocuments({
			documents: DOCUMENTS,
			query: QUERY,
			metric: "dot",
		});
		const l2 = rankDocuments({
			documents: DOCUMENTS,
			query: QUERY,
			metric: "euclidean",
		});

		expect(ids(dot)).toEqual(["b", "e", "c", "a", "d"]);
		expect(ids(l2)).toEqual(["a", "e", "c", "d", "b"]);
	});

	it("agrees across all metrics once vectors are normalized", () => {
		const expected = ["a", "b", "e", "c", "d"];
		const metrics = [
			"cosine",
			"cosine-distance",
			"dot",
			"euclidean",
			"squared-euclidean",
		] as const;

		for (const metric of metrics) {
			const ranking = rankDocuments({
				documents: DOCUMENTS,
				query: QUERY,
				metric,
				normalized: true,
			});
			expect(ids(ranking)).toEqual(expected);
		}
	});
});
