/**
 * Pre-bake embedding vectors for the /ai-embeddings visualization.
 *
 * Run: pnpm tsx scripts/generate-embeddings.ts
 *
 * Output: src/components/ai-engineering/embeddingsData.ts
 *
 * Models:
 *   - Xenova/all-MiniLM-L6-v2   (384d) — primary
 *   - Xenova/bge-small-en-v1.5  (384d) — for cross-model comparison demo
 *     (Xenova's all-mpnet-base-v2 ONNX export produces near-zero cosines
 *      and isn't usable; bge-small is a clean drop-in from a different family.)
 *
 * The script downloads model weights on first run (~200MB total) and caches
 * them in ~/.cache/huggingface. Re-runs are instant.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { env, pipeline } from "@xenova/transformers";

env.allowLocalModels = false;
env.useBrowserCache = false;

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

type Category = "animals" | "foods" | "programming" | "emotions" | "countries";

const CONCEPTS: { text: string; category: Category }[] = [
	// animals
	{ text: "dog", category: "animals" },
	{ text: "cat", category: "animals" },
	{ text: "horse", category: "animals" },
	{ text: "elephant", category: "animals" },
	{ text: "dolphin", category: "animals" },
	{ text: "eagle", category: "animals" },
	// foods
	{ text: "pizza", category: "foods" },
	{ text: "sushi", category: "foods" },
	{ text: "pasta", category: "foods" },
	{ text: "burger", category: "foods" },
	{ text: "salad", category: "foods" },
	{ text: "sandwich", category: "foods" },
	// programming languages
	{ text: "Python", category: "programming" },
	{ text: "JavaScript", category: "programming" },
	{ text: "Rust", category: "programming" },
	{ text: "TypeScript", category: "programming" },
	{ text: "Go", category: "programming" },
	{ text: "Haskell", category: "programming" },
	// emotions
	{ text: "joy", category: "emotions" },
	{ text: "sadness", category: "emotions" },
	{ text: "anger", category: "emotions" },
	{ text: "fear", category: "emotions" },
	{ text: "love", category: "emotions" },
	{ text: "surprise", category: "emotions" },
	// countries
	{ text: "France", category: "countries" },
	{ text: "Japan", category: "countries" },
	{ text: "Brazil", category: "countries" },
	{ text: "Germany", category: "countries" },
	{ text: "Egypt", category: "countries" },
	{ text: "Canada", category: "countries" },
];

const SENTENCE_POOL: string[] = [
	"The cat sat on the warm windowsill watching birds.",
	"A kitten napped in the sunny window.",
	"The dog chased a ball across the park.",
	"Puppies love to play fetch outside.",
	"Python is a popular language for data science.",
	"JavaScript runs in every modern web browser.",
	"Rust offers memory safety without garbage collection.",
	"The compiler caught a type error at build time.",
	"She felt overwhelming joy at the news.",
	"He was deeply saddened by the loss.",
	"The recipe calls for flour, sugar, and eggs.",
	"I ordered a pepperoni pizza for dinner.",
	"Tokyo is the capital of Japan.",
	"Paris is the capital of France.",
	"The train arrived twenty minutes late.",
	"My flight was delayed by half an hour.",
	"Quantum computing uses qubits instead of classical bits.",
	"Neural networks learn patterns from large datasets.",
	"The stock market closed higher on Friday.",
	"Interest rates rose by a quarter point.",
];

// Analogy demo: classic word2vec quadruple + a few more.
// We compute (a - b + c) and find nearest neighbor in a candidate set.
const ANALOGY_VOCAB: string[] = [
	"king",
	"queen",
	"man",
	"woman",
	"prince",
	"princess",
	"boy",
	"girl",
	"father",
	"mother",
	"actor",
	"actress",
	"uncle",
	"aunt",
	"Paris",
	"France",
	"Tokyo",
	"Japan",
	"Berlin",
	"Germany",
	"Rome",
	"Italy",
];

const ANALOGIES: { a: string; b: string; c: string; expected: string }[] = [
	{ a: "king", b: "man", c: "woman", expected: "queen" },
	{ a: "father", b: "man", c: "woman", expected: "mother" },
	{ a: "Paris", b: "France", c: "Japan", expected: "Tokyo" },
];

// Cross-model comparison set
const COMPARISON_SENTENCES: string[] = [
	"The cat slept on the mat.",
	"A dog barked at the mailman.",
	"Python is a programming language.",
	"JavaScript runs in the browser.",
	"I love eating pizza on Fridays.",
	"Sushi is my favorite Japanese food.",
	"Tokyo is a vibrant city.",
	"Paris has beautiful architecture.",
	"She felt deep happiness today.",
	"He was angry about the delay.",
	"Machine learning needs large datasets.",
	"The compiler reported a syntax error.",
	"Eagles soar high above the mountains.",
	"Elephants are highly intelligent animals.",
	"The recipe needs fresh basil leaves.",
];

// ---------------------------------------------------------------------------
// Math helpers
// ---------------------------------------------------------------------------

function dot(a: number[], b: number[]): number {
	let s = 0;
	for (let i = 0; i < a.length; i++) s += a[i] * b[i];
	return s;
}

function norm(a: number[]): number {
	return Math.sqrt(dot(a, a));
}

function normalize(a: number[]): number[] {
	const n = norm(a) || 1;
	return a.map((x) => x / n);
}

function cosine(a: number[], b: number[]): number {
	return dot(a, b) / (norm(a) * norm(b) || 1);
}

function add(a: number[], b: number[]): number[] {
	return a.map((x, i) => x + b[i]);
}

function sub(a: number[], b: number[]): number[] {
	return a.map((x, i) => x - b[i]);
}

function mean(vectors: number[][]): number[] {
	const d = vectors[0].length;
	const m = new Array(d).fill(0);
	for (const v of vectors) for (let i = 0; i < d; i++) m[i] += v[i];
	return m.map((x) => x / vectors.length);
}

// Power iteration to find top eigenvector of covariance matrix implicitly.
// We use the data matrix X (centered, rows=samples) and iterate v ← X^T X v.
function powerIteration(
	centered: number[][],
	excludeDirections: number[][],
	iters = 200,
): number[] {
	const d = centered[0].length;
	let v = new Array(d).fill(0).map(() => Math.random() - 0.5);
	v = normalize(v);

	for (let it = 0; it < iters; it++) {
		// Deflate against previously-found directions
		for (const u of excludeDirections) {
			const proj = dot(v, u);
			for (let i = 0; i < d; i++) v[i] -= proj * u[i];
		}
		// Apply X^T X v
		// First Xv (n-dim), then X^T (Xv) (d-dim)
		const Xv = centered.map((row) => dot(row, v));
		const next = new Array(d).fill(0);
		for (let n = 0; n < centered.length; n++) {
			const xv = Xv[n];
			const row = centered[n];
			for (let i = 0; i < d; i++) next[i] += row[i] * xv;
		}
		v = normalize(next);
	}
	return v;
}

function pca2d(vectors: number[][]): { points: [number, number][] } {
	const m = mean(vectors);
	const centered = vectors.map((v) => sub(v, m));
	const pc1 = powerIteration(centered, []);
	const pc2 = powerIteration(centered, [pc1]);
	const points: [number, number][] = centered.map((row) => [
		dot(row, pc1),
		dot(row, pc2),
	]);
	return { points };
}

// ---------------------------------------------------------------------------
// Embedding
// ---------------------------------------------------------------------------

type Embedder = (texts: string[]) => Promise<number[][]>;

async function makeEmbedder(model: string): Promise<Embedder> {
	console.log(`Loading ${model}...`);
	const extractor = await pipeline("feature-extraction", model);
	return async (texts: string[]) => {
		const out: number[][] = [];
		for (const t of texts) {
			const result = await extractor(t, { pooling: "mean", normalize: true });
			out.push(Array.from(result.data as Float32Array));
		}
		return out;
	};
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
	const miniLM = await makeEmbedder("Xenova/all-MiniLM-L6-v2");
	const bge = await makeEmbedder("Xenova/bge-small-en-v1.5");

	console.log("Embedding concepts (MiniLM)...");
	const conceptVecs = await miniLM(CONCEPTS.map((c) => c.text));
	const conceptPCA = pca2d(conceptVecs);

	console.log("Embedding sentence pool (MiniLM)...");
	const sentenceVecs = await miniLM(SENTENCE_POOL);
	const sentenceCosines: number[][] = SENTENCE_POOL.map((_, i) =>
		SENTENCE_POOL.map((_, j) => cosine(sentenceVecs[i], sentenceVecs[j])),
	);

	console.log("Embedding analogy vocab (MiniLM)...");
	const analogyVecs = await miniLM(ANALOGY_VOCAB);
	const analogyLookup: Record<string, number[]> = Object.fromEntries(
		ANALOGY_VOCAB.map((w, i) => [w, analogyVecs[i]]),
	);

	// Compute analogy results: top-3 nearest to (a - b + c), excluding {a, b, c}
	const analogyResults = ANALOGIES.map(({ a, b, c, expected }) => {
		const target = add(
			sub(analogyLookup[a], analogyLookup[b]),
			analogyLookup[c],
		);
		const scored = ANALOGY_VOCAB.filter((w) => w !== a && w !== b && w !== c)
			.map((w) => ({ word: w, score: cosine(target, analogyLookup[w]) }))
			.sort((x, y) => y.score - x.score)
			.slice(0, 5);
		return { a, b, c, expected, top: scored };
	});

	console.log("Embedding comparison set (MiniLM + bge)...");
	const cmpMiniLM = await miniLM(COMPARISON_SENTENCES);
	const cmpMpnet = await bge(COMPARISON_SENTENCES);
	const cmpMiniLMPCA = pca2d(cmpMiniLM);
	const cmpMpnetPCA = pca2d(cmpMpnet);

	// Nearest neighbors for each concept (top 3 by full-dim cosine, excl self)
	const conceptNeighbors = CONCEPTS.map((_, i) => {
		const scores = CONCEPTS.map((_, j) => ({
			j,
			score: i === j ? -Infinity : cosine(conceptVecs[i], conceptVecs[j]),
		}))
			.sort((a, b) => b.score - a.score)
			.slice(0, 3);
		return scores;
	});

	// Nearest neighbors for comparison sentences (per model)
	function neighborsFor(vecs: number[][]) {
		return vecs.map((_, i) =>
			vecs
				.map((_, j) => ({
					j,
					score: i === j ? -Infinity : cosine(vecs[i], vecs[j]),
				}))
				.sort((a, b) => b.score - a.score)
				.slice(0, 3),
		);
	}
	const cmpMiniLMNeighbors = neighborsFor(cmpMiniLM);
	const cmpMpnetNeighbors = neighborsFor(cmpMpnet);

	// ---------------------------------------------------------------------------
	// Emit TS file
	// ---------------------------------------------------------------------------
	const round = (n: number, p = 4) => Number.parseFloat(n.toFixed(p));
	const roundArr = (a: number[], p = 4) => a.map((n) => round(n, p));
	const roundPts = (pts: [number, number][]) =>
		pts.map(([x, y]) => [round(x), round(y)] as [number, number]);

	const ts = `// AUTO-GENERATED by scripts/generate-embeddings.ts — do not edit by hand.
// Models: Xenova/all-MiniLM-L6-v2 (384d), Xenova/bge-small-en-v1.5 (384d).
// All vectors are L2-normalized at encode time.
// biome-ignore-all lint/suspicious/noApproximativeNumericConstant: PCA coords may incidentally resemble math constants

export type ConceptCategory =
	| "animals"
	| "foods"
	| "programming"
	| "emotions"
	| "countries";

export interface Concept {
	text: string;
	category: ConceptCategory;
}

export const CONCEPTS: readonly Concept[] = ${JSON.stringify(CONCEPTS, null, 2)} as const;

export const CONCEPT_PCA_2D: readonly (readonly [number, number])[] = ${JSON.stringify(roundPts(conceptPCA.points))} as const;

// top-3 nearest neighbors per concept (indices into CONCEPTS), with cosine scores.
// Computed in full 384-d space (NOT from the 2-d projection).
export const CONCEPT_NEIGHBORS: readonly { j: number; score: number }[][] = ${JSON.stringify(
		conceptNeighbors.map((arr) =>
			arr.map((n) => ({ j: n.j, score: round(n.score) })),
		),
	)} as const;

export const SENTENCE_POOL: readonly string[] = ${JSON.stringify(SENTENCE_POOL, null, 2)} as const;

// pairwise cosine matrix for the sentence pool (full 384-d).
export const SENTENCE_COSINE: readonly (readonly number[])[] = ${JSON.stringify(
		sentenceCosines.map((row) => roundArr(row)),
	)} as const;

export interface AnalogyResult {
	a: string;
	b: string;
	c: string;
	expected: string;
	top: { word: string; score: number }[];
}

// (a - b + c) → top-5 nearest neighbors in ANALOGY_VOCAB (excluding a, b, c).
// Computed on Xenova/all-MiniLM-L6-v2 — a modern sentence-transformer.
// These results illustrate that linear analogy arithmetic DOES NOT
// reliably recover the expected word on contextual embeddings.
export const ANALOGY_RESULTS: readonly AnalogyResult[] = ${JSON.stringify(
		analogyResults.map((r) => ({
			...r,
			top: r.top.map((t) => ({ word: t.word, score: round(t.score) })),
		})),
		null,
		2,
	)} as const;

export const COMPARISON_SENTENCES: readonly string[] = ${JSON.stringify(COMPARISON_SENTENCES, null, 2)} as const;

export const COMPARISON_MINILM_PCA_2D: readonly (readonly [number, number])[] = ${JSON.stringify(roundPts(cmpMiniLMPCA.points))} as const;
export const COMPARISON_MPNET_PCA_2D: readonly (readonly [number, number])[] = ${JSON.stringify(roundPts(cmpMpnetPCA.points))} as const;

export const COMPARISON_MINILM_NEIGHBORS: readonly { j: number; score: number }[][] = ${JSON.stringify(
		cmpMiniLMNeighbors.map((arr) =>
			arr.map((n) => ({ j: n.j, score: round(n.score) })),
		),
	)} as const;
export const COMPARISON_MPNET_NEIGHBORS: readonly { j: number; score: number }[][] = ${JSON.stringify(
		cmpMpnetNeighbors.map((arr) =>
			arr.map((n) => ({ j: n.j, score: round(n.score) })),
		),
	)} as const;

export const MODEL_INFO = {
	minilm: { name: "all-MiniLM-L6-v2", dims: 384, family: "Sentence-Transformers" },
	bge: { name: "bge-small-en-v1.5", dims: 384, family: "BAAI" },
} as const;
`;

	const outPath = "src/components/ai-engineering/embeddingsData.ts";
	await mkdir(dirname(outPath), { recursive: true });
	await writeFile(outPath, ts);
	console.log(`Wrote ${outPath}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
