import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { match } from "ts-pattern";
import { DemoSection } from "../shared/DemoSection";

// ── LRU Cache simulation ──────────────────────────────────────────────────────
interface LRUNode {
	id: number;
	key: string;
	value: number;
}

function useLRUCache(capacity: number) {
	const lruId = useRef(0);
	const [cache, setCache] = useState<LRUNode[]>([]);
	const [lastEvicted, setLastEvicted] = useState<string | null>(null);
	const [lastHit, setLastHit] = useState<string | null>(null);

	function get(key: string): number | null {
		const idx = cache.findIndex((n) => n.key === key);
		if (idx === -1) {
			setLastHit(null);
			return null;
		}
		// Move to front (most recently used)
		setLastHit(key);
		setCache((prev) => {
			const next = [...prev];
			const [node] = next.splice(idx, 1);
			return node ? [node, ...next] : next;
		});
		return cache[idx]?.value ?? null;
	}

	function put(key: string, value: number) {
		const id = lruId.current++;
		// Compute next state eagerly to derive eviction outside the updater
		const next = [...cache.filter((n) => n.key !== key)];
		next.unshift({ id, key, value });
		if (next.length > capacity) {
			setLastEvicted(next[next.length - 1]?.key ?? null);
			setCache(next.slice(0, capacity));
		} else {
			setLastEvicted(null);
			setCache(next);
		}
	}

	function reset() {
		setCache([]);
		setLastEvicted(null);
		setLastHit(null);
	}

	return { cache, lastEvicted, lastHit, get, put, reset };
}

type UseCase = "lru" | "browser" | "playlist";

const PRESET_KEYS = ["A", "B", "C", "D", "E"];

export function UseCasesDemo() {
	const [activeCase, setActiveCase] = useState<UseCase>("lru");
	const lru = useLRUCache(3);
	const [lruInput, setLruInput] = useState("A");

	// Browser history
	const [history, setHistory] = useState([
		"google.com",
		"github.com",
		"claude.ai",
	]);
	const [historyIdx, setHistoryIdx] = useState(2);
	const [newPage, setNewPage] = useState("reddit.com");

	// Playlist
	const [playlist] = useState(["Song A", "Song B", "Song C", "Song D"]);
	const [currentTrack, setCurrentTrack] = useState(0);

	function navBack() {
		setHistoryIdx((i) => Math.max(0, i - 1));
	}

	function navForward() {
		setHistoryIdx((i) => Math.min(history.length - 1, i + 1));
	}

	function navTo() {
		if (!newPage.trim()) return;
		setHistory((h) => [...h.slice(0, historyIdx + 1), newPage]);
		setHistoryIdx((i) => i + 1);
	}

	return (
		<DemoSection
			title="Demo 4: Use Cases & Trade-offs"
			description="Real-world data structures built on linked lists: LRU cache, browser history, and music playlists."
		>
			<div className="space-y-5">
				{/* Case selector */}
				<div className="flex flex-wrap gap-2">
					{(
						[
							{ id: "lru" as UseCase, label: "LRU Cache" },
							{ id: "browser" as UseCase, label: "Browser History" },
							{ id: "playlist" as UseCase, label: "Playlist" },
						] as const
					).map(({ id, label }) => (
						<button
							key={id}
							type="button"
							onClick={() => setActiveCase(id)}
							className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
								activeCase === id
									? "bg-indigo-600/30 text-indigo-300 border-indigo-500/50"
									: "bg-zinc-800/40 text-zinc-400 border-zinc-700/50 hover:bg-zinc-800/70"
							}`}
						>
							{label}
						</button>
					))}
				</div>

				{/* Case content */}
				<AnimatePresence mode="wait">
					{match(activeCase)
						.with("lru", () => (
							<motion.div
								key="lru"
								initial={{ opacity: 0, y: 6 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -6 }}
								className="space-y-4"
							>
								<div className="text-xs text-zinc-400 bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/50">
									<strong className="text-zinc-200">LRU Cache</strong> = Doubly
									linked list + Hash map. Get/put in{" "}
									<span className="text-green-300">O(1)</span>. The list keeps{" "}
									<span className="text-zinc-200">access order</span> (MRU at
									head, LRU at tail); the map gives O(1) lookup to a node
									reference. On get, move node to head. On eviction, remove from
									tail.
								</div>
								<div className="flex flex-wrap gap-2 items-center">
									{PRESET_KEYS.map((k) => (
										<button
											key={k}
											type="button"
											onClick={() => lru.put(k, k.charCodeAt(0))}
											className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 transition-colors"
										>
											put("{k}")
										</button>
									))}
									<div className="flex gap-1">
										<input
											type="text"
											value={lruInput}
											onChange={(e) => setLruInput(e.target.value)}
											maxLength={2}
											className="px-2 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-200 w-16 focus:outline-none"
										/>
										<button
											type="button"
											onClick={() => lru.get(lruInput)}
											className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30 transition-colors"
										>
											get
										</button>
									</div>
									<button
										type="button"
										onClick={lru.reset}
										className="px-2 py-1.5 rounded-lg text-xs bg-zinc-700/40 text-zinc-400 border border-zinc-600/30 hover:bg-zinc-700/60 transition-colors"
									>
										reset
									</button>
								</div>

								{/* Cache visualization */}
								<div>
									<div className="flex items-center gap-2 mb-1">
										<span className="text-xs text-zinc-500">
											Cache (capacity 3) — MRU → LRU
										</span>
										{lru.lastEvicted && (
											<span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
												evicted: "{lru.lastEvicted}"
											</span>
										)}
									</div>
									<div className="flex items-center gap-2">
										<AnimatePresence>
											{lru.cache.map((node, idx) => (
												<motion.div
													key={node.id}
													initial={{ opacity: 0, x: -20 }}
													animate={{ opacity: 1, x: 0 }}
													exit={{ opacity: 0, x: 20 }}
													className={`flex flex-col items-center rounded-lg border p-2 text-xs font-mono min-w-12 transition-all ${
														lru.lastHit === node.key
															? "bg-amber-500/20 border-amber-400/50 text-amber-300"
															: idx === 0
																? "bg-green-500/15 border-green-500/30 text-green-300"
																: idx === lru.cache.length - 1
																	? "bg-red-500/10 border-red-500/20 text-red-300"
																	: "bg-zinc-700/40 border-zinc-600/50 text-zinc-300"
													}`}
												>
													<span className="font-bold">{node.key}</span>
													<span className="text-zinc-500">{node.value}</span>
												</motion.div>
											))}
										</AnimatePresence>
										{lru.cache.length === 0 && (
											<span className="text-xs text-zinc-600 italic">
												empty
											</span>
										)}
									</div>
									{lru.cache.length > 0 && (
										<div className="flex gap-2 mt-1 text-xs text-zinc-600">
											<span className="text-green-600">^ MRU (head)</span>
											<span className="ml-auto text-red-600">LRU (tail) ^</span>
										</div>
									)}
								</div>
							</motion.div>
						))
						.with("browser", () => (
							<motion.div
								key="browser"
								initial={{ opacity: 0, y: 6 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -6 }}
								className="space-y-4"
							>
								<div className="text-xs text-zinc-400 bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/50">
									<strong className="text-zinc-200">Browser history</strong> as
									a doubly linked list: back/forward = O(1) pointer moves;
									navigate = insert after current, truncate forward history. In
									practice, engines like Chromium use a vector of entries
									(random access for tab restore, history UI), but the
									pointer-based model captures the core back/forward semantics
									cleanly.
								</div>

								{/* Browser bar */}
								<div className="flex gap-2 items-center">
									<button
										type="button"
										onClick={navBack}
										disabled={historyIdx === 0}
										className="px-3 py-1.5 rounded-lg text-sm font-medium bg-zinc-700/40 text-zinc-300 border border-zinc-600/30 hover:bg-zinc-700/60 transition-colors disabled:opacity-30"
									>
										← Back
									</button>
									<button
										type="button"
										onClick={navForward}
										disabled={historyIdx >= history.length - 1}
										className="px-3 py-1.5 rounded-lg text-sm font-medium bg-zinc-700/40 text-zinc-300 border border-zinc-600/30 hover:bg-zinc-700/60 transition-colors disabled:opacity-30"
									>
										Forward →
									</button>
									<input
										type="text"
										value={newPage}
										onChange={(e) => setNewPage(e.target.value)}
										className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-200 focus:outline-none"
									/>
									<button
										type="button"
										onClick={navTo}
										className="px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition-colors"
									>
										Go
									</button>
								</div>

								{/* History nodes */}
								<div className="flex items-center gap-1.5 overflow-x-auto pb-1">
									{history.map((page, idx) => (
										// biome-ignore lint/suspicious/noArrayIndexKey: history entries keyed by page+idx
										<div key={page + idx} className="flex items-center gap-1">
											<div
												className={`px-3 py-2 rounded-lg border text-xs font-mono whitespace-nowrap transition-all ${
													idx === historyIdx
														? "bg-indigo-500/25 border-indigo-400/60 text-indigo-300 font-bold"
														: idx > historyIdx
															? "bg-zinc-800/30 border-zinc-700/30 text-zinc-600 opacity-50"
															: "bg-zinc-700/40 border-zinc-600/50 text-zinc-400"
												}`}
											>
												{page}
											</div>
											{idx < history.length - 1 && (
												<span className="text-zinc-600 text-xs">↔</span>
											)}
										</div>
									))}
								</div>
								<div className="text-xs text-zinc-600">
									Current:{" "}
									<span className="text-indigo-300">{history[historyIdx]}</span>
								</div>
							</motion.div>
						))
						.with("playlist", () => (
							<motion.div
								key="playlist"
								initial={{ opacity: 0, y: 6 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -6 }}
								className="space-y-4"
							>
								<div className="text-xs text-zinc-400 bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/50">
									<strong className="text-zinc-200">Music playlist</strong> as a
									doubly linked list: prev/next track = O(1), inserting a song
									anywhere = O(1) given a node reference. Real streaming apps
									(Spotify, Apple Music) are array-backed for shuffle and
									jump-to-track, but the linked list model highlights the core
									advantage: O(1) insert/delete at a known position without
									shifting, which makes it a natural fit for ordered sequences
									where nearby elements are frequently reordered.
								</div>

								<div className="flex gap-2 items-center">
									<button
										type="button"
										onClick={() => setCurrentTrack((t) => Math.max(0, t - 1))}
										disabled={currentTrack === 0}
										className="px-3 py-1.5 rounded-lg text-sm bg-zinc-700/40 text-zinc-300 border border-zinc-600/30 hover:bg-zinc-700/60 transition-colors disabled:opacity-30"
									>
										⏮ Prev
									</button>
									<button
										type="button"
										onClick={() =>
											setCurrentTrack((t) =>
												Math.min(playlist.length - 1, t + 1),
											)
										}
										disabled={currentTrack === playlist.length - 1}
										className="px-3 py-1.5 rounded-lg text-sm bg-zinc-700/40 text-zinc-300 border border-zinc-600/30 hover:bg-zinc-700/60 transition-colors disabled:opacity-30"
									>
										Next ⏭
									</button>
								</div>

								<div className="space-y-1.5">
									<AnimatePresence>
										{playlist.map((track, idx) => (
											<motion.div
												key={track}
												initial={{ opacity: 0, x: -10 }}
												animate={{ opacity: 1, x: 0 }}
												exit={{ opacity: 0, x: 10 }}
												onClick={() => setCurrentTrack(idx)}
												className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border cursor-pointer transition-all ${
													idx === currentTrack
														? "bg-indigo-500/20 border-indigo-400/50 text-indigo-200"
														: "bg-zinc-800/30 border-zinc-700/40 text-zinc-400 hover:bg-zinc-800/60"
												}`}
											>
												<span className="text-sm">
													{idx === currentTrack ? "▶" : "♪"}
												</span>
												<span className="text-sm">{track}</span>
												{idx === currentTrack && (
													<span className="ml-auto text-xs text-indigo-400 animate-pulse">
														playing
													</span>
												)}
											</motion.div>
										))}
									</AnimatePresence>
								</div>
							</motion.div>
						))
						.exhaustive()}
				</AnimatePresence>

				{/* Summary table */}
				<div className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-700/50 text-xs">
					<table className="w-full border-collapse">
						<thead>
							<tr className="text-zinc-500 border-b border-zinc-800">
								<th className="py-1.5 pr-3 text-left">Use case</th>
								<th className="py-1.5 px-3 text-left">Structure</th>
								<th className="py-1.5 pl-3 text-left">Why linked list</th>
							</tr>
						</thead>
						<tbody className="text-zinc-400">
							{[
								{
									use: "LRU Cache",
									struct: "DLL + HashMap",
									why: "O(1) move-to-front, O(1) evict tail",
								},
								{
									use: "Browser history",
									struct: "Doubly linked (conceptual)",
									why: "O(1) back/forward; real engines use arrays",
								},
								{
									use: "Playlist",
									struct: "Doubly linked (conceptual)",
									why: "O(1) prev/next; real apps use arrays",
								},
								{
									use: "Undo/redo",
									struct: "Stack (array or list)",
									why: "O(1) push/pop; arrays dominate in practice",
								},
							].map(({ use, struct, why }) => (
								<tr key={use} className="border-b border-zinc-800/50">
									<td className="py-1.5 pr-3 text-zinc-300">{use}</td>
									<td className="py-1.5 px-3 font-mono text-indigo-300">
										{struct}
									</td>
									<td className="py-1.5 pl-3 text-zinc-500">{why}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</DemoSection>
	);
}
