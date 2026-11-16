export type Vector = readonly number[];

export type MetricId =
	| "cosine"
	| "cosine-distance"
	| "dot"
	| "euclidean"
	| "squared-euclidean";

export interface Document {
	id: string;
	label: string;
	vector: Vector;
}

export interface ScoredDocument {
	id: string;
	label: string;
	score: number;
	rank: number;
}

export interface MetricDefinition {
	id: MetricId;
	label: string;
	shortLabel: string;
	higherIsBetter: boolean;
}

export const METRICS: readonly MetricDefinition[] = [
	{
		id: "cosine",
		label: "Cosine similarity",
		shortLabel: "cosine",
		higherIsBetter: true,
	},
	{
		id: "cosine-distance",
		label: "Cosine distance",
		shortLabel: "1 − cosine",
		higherIsBetter: false,
	},
	{
		id: "dot",
		label: "Dot product",
		shortLabel: "dot",
		higherIsBetter: true,
	},
	{
		id: "euclidean",
		label: "Euclidean distance",
		shortLabel: "L2",
		higherIsBetter: false,
	},
	{
		id: "squared-euclidean",
		label: "Squared Euclidean",
		shortLabel: "L2²",
		higherIsBetter: false,
	},
];

export function metricById(id: MetricId): MetricDefinition {
	const metric = METRICS.find((item) => item.id === id);
	if (!metric) throw new Error(`Unknown metric: ${id}`);
	return metric;
}

export function dot(a: Vector, b: Vector): number {
	let sum = 0;
	for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
	return sum;
}

export function magnitude(vector: Vector): number {
	return Math.sqrt(dot(vector, vector));
}

export function normalize(vector: Vector): number[] {
	const length = magnitude(vector);
	if (length === 0) return [...vector];
	return vector.map((value) => value / length);
}

export function cosineSimilarity(a: Vector, b: Vector): number | null {
	const lengthA = magnitude(a);
	const lengthB = magnitude(b);
	if (lengthA === 0 || lengthB === 0) return null;
	const similarity = dot(a, b) / (lengthA * lengthB);
	return Math.max(-1, Math.min(1, similarity));
}

export function cosineDistance(a: Vector, b: Vector): number | null {
	const similarity = cosineSimilarity(a, b);
	return similarity === null ? null : 1 - similarity;
}

export function euclideanDistance(a: Vector, b: Vector): number {
	return Math.sqrt(squaredEuclideanDistance(a, b));
}

export function squaredEuclideanDistance(a: Vector, b: Vector): number {
	let sum = 0;
	for (let i = 0; i < a.length; i++) {
		const difference = a[i] - b[i];
		sum += difference * difference;
	}
	return sum;
}

const SCORERS: Record<MetricId, (a: Vector, b: Vector) => number | null> = {
	cosine: cosineSimilarity,
	"cosine-distance": cosineDistance,
	dot,
	euclidean: euclideanDistance,
	"squared-euclidean": squaredEuclideanDistance,
};

export function scoreDocument(
	query: Vector,
	vector: Vector,
	metric: MetricId,
): number | null {
	return SCORERS[metric](query, vector);
}

interface RankDocumentsArgs {
	documents: readonly Document[];
	query: Vector;
	metric: MetricId;
	normalized?: boolean;
}

export function rankDocuments({
	documents,
	query,
	metric,
	normalized = false,
}: RankDocumentsArgs): ScoredDocument[] {
	const preparedQuery = normalized ? normalize(query) : query;
	const { higherIsBetter } = metricById(metric);

	return documents
		.map((document) => {
			const vector = normalized ? normalize(document.vector) : document.vector;
			return {
				id: document.id,
				label: document.label,
				score: scoreDocument(preparedQuery, vector, metric) ?? Number.NaN,
			};
		})
		.sort((a, b) => {
			if (Number.isNaN(a.score)) return 1;
			if (Number.isNaN(b.score)) return -1;
			return higherIsBetter ? b.score - a.score : a.score - b.score;
		})
		.map((document, index) => ({ ...document, rank: index + 1 }));
}
