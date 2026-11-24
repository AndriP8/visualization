import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { match } from "ts-pattern";
import { DemoSection } from "../shared/DemoSection";
import {
	type CacheEntry,
	historyBack,
	historyForward,
	historyNavigate,
	INITIAL_HISTORY,
	INITIAL_HISTORY_INDEX,
	LRU_CAPACITY,
	lruGet,
	lruPut,
	PAGES,
	PRESET_KEYS,
} from "./useCases";

type Tab = "lru" | "browser";

const linkClass = "underline text-indigo-300 hover:text-indigo-200";

export function LinkedListUseCasesDemo() {
	const [tab, setTab] = useState<Tab>("lru");

	// LRU cache
	const [cache, setCache] = useState<CacheEntry[]>([]);
	const [lastEvicted, setLastEvicted] = useState<string | null>(null);
	const [lastHit, setLastHit] = useState<string | null>(null);
	const [lastAction, setLastAction] = useState("");

	function put(key: string) {
		const result = lruPut(cache, key, key.charCodeAt(0), LRU_CAPACITY);
		setCache(result.cache);
		setLastEvicted(result.evicted);
		setLastHit(null);
		setLastAction(`put("${key}")`);
	}

	function get(key: string) {
		const result = lruGet(cache, key);
		setCache(result.cache);
		setLastEvicted(null);
		setLastHit(result.hit ? key : null);
		setLastAction(`get("${key}") → ${result.hit ? result.value : "miss"}`);
	}

	function resetCache() {
		setCache([]);
		setLastEvicted(null);
		setLastHit(null);
		setLastAction("");
	}

	// Browser history
	const [history, setHistory] = useState<string[]>(INITIAL_HISTORY);
	const [historyIdx, setHistoryIdx] = useState(INITIAL_HISTORY_INDEX);

	function goBack() {
		setHistoryIdx(historyBack(historyIdx));
	}

	function goForward() {
		setHistoryIdx(historyForward(historyIdx, history.length));
	}

	function goTo(page: string) {
		const result = historyNavigate(history, historyIdx, page);
		setHistory(result.history);
		setHistoryIdx(result.index);
	}

	return (
		<DemoSection
			title="Real-world use cases"
			description="Two everyday jobs where a linked list earns its place. An LRU cache drops the entry used longest ago when it runs out of room. Browser history moves backward and forward by following links between pages."
		>
			<div className="space-y-5">
				<div className="flex gap-2">
					<button
						type="button"
						onClick={() => setTab("lru")}
						className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
							tab === "lru"
								? "border-indigo-500/40 bg-indigo-600/20 text-indigo-300"
								: "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:text-zinc-200"
						}`}
					>
						LRU cache
					</button>
					<button
						type="button"
						onClick={() => setTab("browser")}
						className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
							tab === "browser"
								? "border-indigo-500/40 bg-indigo-600/20 text-indigo-300"
								: "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:text-zinc-200"
						}`}
					>
						Browser history
					</button>
				</div>

				<AnimatePresence mode="wait">
					{match(tab)
						.with("lru", () => (
							<motion.div
								key="lru"
								initial={{ opacity: 0, y: 6 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -6 }}
								className="space-y-4"
							>
								<div className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-3 text-xs text-zinc-400">
									<strong className="text-zinc-200">LRU cache</strong> keeps the
									most recently used entries and throws away the one used
									longest ago (LRU means least recently used). A doubly linked
									list stores the order, and a hash map points straight at each
									node. The map makes lookup fast, and the list makes moving or
									removing an entry cheap. Capacity is {LRU_CAPACITY} entries.
								</div>

								<div className="flex flex-wrap items-center gap-2">
									<span className="text-xs text-zinc-500">put</span>
									{PRESET_KEYS.map((key) => (
										<button
											key={`put-${key}`}
											type="button"
											onClick={() => put(key)}
											className="rounded-lg border border-indigo-500/30 bg-indigo-600/20 px-3 py-1.5 text-xs font-medium text-indigo-300 transition-colors hover:bg-indigo-600/30"
										>
											{key}
										</button>
									))}
									<span className="ml-2 text-xs text-zinc-500">get</span>
									{PRESET_KEYS.map((key) => (
										<button
											key={`get-${key}`}
											type="button"
											onClick={() => get(key)}
											className="rounded-lg border border-amber-500/30 bg-amber-600/20 px-3 py-1.5 text-xs font-medium text-amber-300 transition-colors hover:bg-amber-600/30"
										>
											{key}
										</button>
									))}
									<button
										type="button"
										onClick={resetCache}
										className="rounded-lg border border-zinc-600/30 bg-zinc-700/40 px-2 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-700/60"
									>
										reset
									</button>
								</div>

								<div>
									<div className="mb-1 flex items-center gap-2">
										<span className="text-xs text-zinc-500">
											Most recent → least recent
										</span>
										{lastEvicted && (
											<span className="rounded border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-xs text-red-400">
												dropped "{lastEvicted}"
											</span>
										)}
									</div>
									<div className="flex items-center gap-2">
										<AnimatePresence>
											{cache.map((entry, idx) => (
												<motion.div
													key={entry.key}
													initial={{ opacity: 0, x: -20 }}
													animate={{ opacity: 1, x: 0 }}
													exit={{ opacity: 0, x: 20 }}
													className={`flex min-w-12 flex-col items-center rounded-lg border p-2 text-xs font-mono transition-all ${
														lastHit === entry.key
															? "border-amber-400/50 bg-amber-500/20 text-amber-300"
															: idx === 0
																? "border-green-500/30 bg-green-500/15 text-green-300"
																: idx === cache.length - 1
																	? "border-red-500/20 bg-red-500/10 text-red-300"
																	: "border-zinc-600/50 bg-zinc-700/40 text-zinc-300"
													}`}
												>
													<span className="font-bold">{entry.key}</span>
													<span className="text-zinc-500">{entry.value}</span>
												</motion.div>
											))}
										</AnimatePresence>
										{cache.length === 0 && (
											<span className="text-xs text-zinc-600 italic">
												empty
											</span>
										)}
									</div>
									{cache.length > 0 && (
										<div className="mt-1 flex gap-2 text-xs text-zinc-600">
											<span className="text-green-600">newest</span>
											<span className="ml-auto text-red-600">
												oldest, dropped first
											</span>
										</div>
									)}
								</div>

								<output
									aria-live="polite"
									className="block text-sm text-zinc-400"
								>
									{lastAction || "Put an entry to start filling the cache."}
								</output>

								<p className="text-xs text-zinc-500">
									Related:{" "}
									<Link to="/caching-strategies" className={linkClass}>
										Caching strategies
									</Link>
								</p>
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
								<div className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-3 text-xs text-zinc-400">
									<strong className="text-zinc-200">Browser history</strong>{" "}
									behaves like a doubly linked list. Each page links to the page
									before it and the page after it. Back and forward just follow
									one link, so they stay cheap. Visiting a new page cuts off the
									pages ahead, because you can no longer reach them with
									forward.
								</div>

								<div className="flex flex-wrap items-center gap-2">
									<button
										type="button"
										onClick={goBack}
										disabled={historyIdx === 0}
										className="rounded-lg border border-zinc-600/30 bg-zinc-700/40 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-700/60 disabled:opacity-30"
									>
										← Back
									</button>
									<button
										type="button"
										onClick={goForward}
										disabled={historyIdx >= history.length - 1}
										className="rounded-lg border border-zinc-600/30 bg-zinc-700/40 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-700/60 disabled:opacity-30"
									>
										Forward →
									</button>
									<span className="ml-2 text-xs text-zinc-500">Go to</span>
									{PAGES.map((page) => (
										<button
											key={page}
											type="button"
											onClick={() => goTo(page)}
											className="rounded-lg border border-indigo-500/30 bg-indigo-600/20 px-2 py-1.5 text-xs text-indigo-300 transition-colors hover:bg-indigo-600/30"
										>
											{page}
										</button>
									))}
								</div>

								<div className="flex items-center gap-1.5 overflow-x-auto pb-1">
									{history.map((page, idx) => (
										<div
											// biome-ignore lint/suspicious/noArrayIndexKey: the same page can repeat, so position is part of the identity
											key={`${page}-${idx}`}
											className="flex items-center gap-1"
										>
											<div
												className={`whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-mono transition-all ${
													idx === historyIdx
														? "border-indigo-400/60 bg-indigo-500/25 font-bold text-indigo-300"
														: idx > historyIdx
															? "border-zinc-700/30 bg-zinc-800/30 text-zinc-600 opacity-50"
															: "border-zinc-600/50 bg-zinc-700/40 text-zinc-400"
												}`}
											>
												{page}
											</div>
											{idx < history.length - 1 && (
												<span className="text-xs text-zinc-600">↔</span>
											)}
										</div>
									))}
								</div>

								<output
									aria-live="polite"
									className="block text-sm text-zinc-400"
								>
									Current page:{" "}
									<span className="text-indigo-300">{history[historyIdx]}</span>
								</output>

								<p className="text-xs text-zinc-500">
									Related:{" "}
									<Link to="/event-loop" className={linkClass}>
										Event loop
									</Link>
								</p>
							</motion.div>
						))
						.exhaustive()}
				</AnimatePresence>

				<div className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-3 text-xs">
					<table className="w-full border-collapse">
						<thead>
							<tr className="border-b border-zinc-800 text-zinc-500">
								<th className="py-1.5 pr-3 text-left">Use case</th>
								<th className="py-1.5 px-3 text-left">Structure</th>
								<th className="py-1.5 pl-3 text-left">Why a linked list</th>
							</tr>
						</thead>
						<tbody className="text-zinc-400">
							{[
								{
									use: "LRU cache",
									struct: "Doubly linked list + hash map",
									why: "Move an entry to the front or drop the oldest in one step",
								},
								{
									use: "Browser history",
									struct: "Doubly linked list",
									why: "Back and forward follow one link each",
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
