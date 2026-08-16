// Chunking strategy implementations for the demo.
// These are simplified but mechanically faithful versions of what LangChain /
// LlamaIndex ship — enough to make the differences observable, not a library.

export interface Chunk {
	id: number;
	text: string;
	start: number;
	end: number;
	tokens: number;
}

// Rough token estimate: ~4 chars per token for English. Real tokenizers vary
// (see /ai-tokenization), but this is the standard back-of-envelope used in
// chunking guides and is good enough for size targets.
export function estimateTokens(text: string): number {
	return Math.max(1, Math.ceil(text.length / 4));
}

// ---------- Strategy 1: Fixed-size character chunking ----------
export function fixedSizeChunks(
	text: string,
	chunkChars: number,
	overlapChars = 0,
): Chunk[] {
	const chunks: Chunk[] = [];
	const stride = Math.max(1, chunkChars - overlapChars);
	let i = 0;
	let id = 0;
	while (i < text.length) {
		const end = Math.min(i + chunkChars, text.length);
		const slice = text.slice(i, end);
		chunks.push({
			id: id++,
			text: slice,
			start: i,
			end,
			tokens: estimateTokens(slice),
		});
		if (end === text.length) break;
		i += stride;
	}
	return chunks;
}

// ---------- Strategy 2: Recursive character splitting ----------
// LangChain's default. Walks a hierarchy of separators (paragraph → sentence
// → word) so chunks land on natural boundaries while staying under the limit.
const RECURSIVE_SEPARATORS = ["\n\n", "\n", ". ", " ", ""];

function recursiveSplit(
	text: string,
	chunkChars: number,
	sepIndex = 0,
): string[] {
	if (text.length <= chunkChars) return [text];
	const sep = RECURSIVE_SEPARATORS[sepIndex] ?? "";
	const parts = sep === "" ? Array.from(text) : text.split(sep);
	const out: string[] = [];
	let buf = "";
	for (const part of parts) {
		const piece = buf.length === 0 ? part : buf + sep + part;
		if (piece.length <= chunkChars) {
			buf = piece;
		} else {
			if (buf) out.push(buf);
			if (part.length > chunkChars) {
				for (const sub of recursiveSplit(part, chunkChars, sepIndex + 1)) {
					out.push(sub);
				}
				buf = "";
			} else {
				buf = part;
			}
		}
	}
	if (buf) out.push(buf);
	return out;
}

export function recursiveChunks(text: string, chunkChars: number): Chunk[] {
	const pieces = recursiveSplit(text, chunkChars);
	const chunks: Chunk[] = [];
	let cursor = 0;
	let id = 0;
	for (const piece of pieces) {
		const found = text.indexOf(piece, cursor);
		const start = found === -1 ? cursor : found;
		const end = start + piece.length;
		chunks.push({
			id: id++,
			text: piece,
			start,
			end,
			tokens: estimateTokens(piece),
		});
		cursor = end;
	}
	return chunks;
}

// ---------- Strategy 3: Sentence-similarity ("semantic") chunking ----------
// Real semantic chunkers embed each sentence and break when cosine similarity
// drops below a threshold. We don't ship an embedding model in the browser,
// so we approximate with Jaccard overlap of content-word sets — same shape
// (similarity drops at topic shifts), no embedding dependency. The UI labels
// this as a lexical proxy, not embeddings.
const STOPWORDS = new Set([
	"the",
	"a",
	"an",
	"and",
	"or",
	"but",
	"of",
	"in",
	"on",
	"at",
	"to",
	"for",
	"is",
	"are",
	"was",
	"were",
	"be",
	"been",
	"being",
	"this",
	"that",
	"these",
	"those",
	"it",
	"its",
	"as",
	"by",
	"with",
	"from",
	"into",
	"than",
	"then",
	"so",
	"if",
	"not",
	"no",
	"do",
	"does",
	"did",
	"has",
	"have",
	"had",
	"will",
	"would",
	"can",
	"could",
	"may",
	"might",
	"should",
	"we",
	"you",
	"they",
	"them",
	"their",
	"our",
	"your",
	"his",
	"her",
	"i",
	"he",
	"she",
]);

function contentWords(sentence: string): Set<string> {
	const words = sentence.toLowerCase().match(/[a-z][a-z'-]+/g) ?? [];
	return new Set(words.filter((w) => w.length > 2 && !STOPWORDS.has(w)));
}

function jaccard(a: Set<string>, b: Set<string>): number {
	if (a.size === 0 && b.size === 0) return 1;
	let intersection = 0;
	for (const x of a) if (b.has(x)) intersection++;
	const union = a.size + b.size - intersection;
	return union === 0 ? 0 : intersection / union;
}

export function splitSentences(
	text: string,
): { text: string; start: number }[] {
	const out: { text: string; start: number }[] = [];
	const pattern = /(?<=[.!?])\s+/g;
	let lastIndex = 0;
	while (true) {
		const m = pattern.exec(text);
		if (!m) break;
		const raw = text.slice(lastIndex, m.index);
		const trimmed = raw.trim();
		if (trimmed.length > 0) {
			const leadingWs = raw.length - raw.trimStart().length;
			out.push({ text: trimmed, start: lastIndex + leadingWs });
		}
		lastIndex = pattern.lastIndex;
	}
	const tail = text.slice(lastIndex);
	const trimmedTail = tail.trim();
	if (trimmedTail.length > 0) {
		const leadingWs = tail.length - tail.trimStart().length;
		out.push({ text: trimmedTail, start: lastIndex + leadingWs });
	}
	return out;
}

export function semanticChunks(
	text: string,
	similarityThreshold: number,
): Chunk[] {
	const sentences = splitSentences(text);
	if (sentences.length === 0) return [];

	const wordSets = sentences.map((s) => contentWords(s.text));
	const chunks: Chunk[] = [];
	let bufStart = sentences[0].start;
	let bufEnd = sentences[0].start + sentences[0].text.length;
	let id = 0;

	for (let i = 1; i < sentences.length; i++) {
		const sim = jaccard(wordSets[i - 1], wordSets[i]);
		if (sim < similarityThreshold) {
			const slice = text.slice(bufStart, bufEnd);
			chunks.push({
				id: id++,
				text: slice.trim(),
				start: bufStart,
				end: bufEnd,
				tokens: estimateTokens(slice),
			});
			bufStart = sentences[i].start;
		}
		bufEnd = sentences[i].start + sentences[i].text.length;
	}

	const tail = text.slice(bufStart, bufEnd);
	if (tail.trim().length > 0) {
		chunks.push({
			id: id++,
			text: tail.trim(),
			start: bufStart,
			end: bufEnd,
			tokens: estimateTokens(tail),
		});
	}
	return chunks;
}

// ---------- Sentence boundary analysis ----------
// Counts how many chunks end mid-sentence (no terminal punctuation and not at
// end of doc). This is the concrete failure mode of fixed-size chunking.
export function midSentenceBreaks(chunks: Chunk[], docLength: number): number {
	let broken = 0;
	for (const c of chunks) {
		if (c.end >= docLength) continue;
		const last = c.text.trimEnd().slice(-1);
		if (!/[.!?]/.test(last)) broken++;
	}
	return broken;
}

// ---------- Sample document used across demos ----------
// Designed to have clear topic shifts so semantic chunking visibly differs
// from fixed-size. Three topics: BTrees, then HTTP caching, then OAuth.
export const SAMPLE_DOC = `B-Trees are the workhorse data structure of relational database indexes. They are balanced search trees where each node holds many keys and many children, keeping the tree shallow even for billions of rows. A typical B-Tree has a fanout of several hundred, meaning lookups complete in three or four disk reads. Databases use them because the dominant cost is I/O, and shallow trees mean fewer page fetches.

HTTP caching is governed by response headers that tell intermediaries how to store and reuse a response. Cache-Control is the modern directive, with values like max-age, no-store, and stale-while-revalidate. ETag and Last-Modified enable conditional requests so the client can revalidate a cached copy without re-downloading the body. A correct caching policy can cut origin load by an order of magnitude and dramatically improve perceived performance.

OAuth 2.0 is an authorization framework, not an authentication protocol — a distinction that catches teams off guard. The authorization code flow with PKCE is the standard for public clients like mobile and single-page apps. The access token grants API access; the refresh token mints new access tokens without re-prompting the user. Scopes constrain what the token can do, but enforcement happens at the resource server, not the authorization server.`;
