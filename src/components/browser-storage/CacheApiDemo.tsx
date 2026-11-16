import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { match } from "ts-pattern";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

const CACHE_NAME = "under-the-hood-cache-demo";

interface CacheEntry {
	url: string;
	status: string;
	bodyPreview: string;
}

interface LogEntry {
	id: number;
	text: string;
	tone: "info" | "success" | "error";
}

let logCounter = 0;

const SAMPLE_RESPONSES: { url: string; body: string }[] = [
	{ url: "/index.html", body: "<!doctype html><title>App shell</title>" },
	{ url: "/assets/app.js", body: "console.log('app booted');" },
	{ url: "/api/user", body: '{"id":7,"name":"Ada"}' },
];

function isCacheApiAvailable(): boolean {
	return typeof caches !== "undefined";
}

export function CacheApiDemo() {
	const [entries, setEntries] = useState<CacheEntry[]>([]);
	const [log, setLog] = useState<LogEntry[]>([]);
	const [lookupUrl, setLookupUrl] = useState("/index.html");
	const [lookupResult, setLookupResult] = useState<string | null>(null);
	const [available, setAvailable] = useState(true);

	const append = useCallback(
		(text: string, tone: LogEntry["tone"] = "info") => {
			logCounter += 1;
			setLog((current) =>
				[{ id: logCounter, text, tone }, ...current].slice(0, 6),
			);
		},
		[],
	);

	const refreshEntries = useCallback(async () => {
		if (!isCacheApiAvailable()) return;
		const cache = await caches.open(CACHE_NAME);
		const keys = await cache.keys();
		const rows: CacheEntry[] = [];
		for (const request of keys) {
			const response = await cache.match(request);
			if (!response) continue;
			const body = await response.clone().text();
			rows.push({
				url: new URL(request.url).pathname,
				status: String(response.status),
				bodyPreview: body.length > 40 ? `${body.slice(0, 40)}…` : body,
			});
		}
		setEntries(rows);
	}, []);

	useEffect(() => {
		if (!isCacheApiAvailable()) {
			setAvailable(false);
			return;
		}
		refreshEntries().catch(() => {
			setAvailable(false);
		});
	}, [refreshEntries]);

	const putEntries = async () => {
		if (!isCacheApiAvailable()) return;
		try {
			const cache = await caches.open(CACHE_NAME);
			for (const item of SAMPLE_RESPONSES) {
				const response = new Response(item.body, {
					status: 200,
					headers: { "Content-Type": "text/plain" },
				});
				await cache.put(item.url, response);
			}
			await refreshEntries();
			append(
				`cache.put() → stored ${SAMPLE_RESPONSES.length} responses.`,
				"success",
			);
		} catch (error) {
			append(
				error instanceof Error ? error.message : "The write failed.",
				"error",
			);
		}
	};

	const lookup = async () => {
		if (!isCacheApiAvailable()) return;
		try {
			const cache = await caches.open(CACHE_NAME);
			const response = await cache.match(lookupUrl);
			if (!response) {
				setLookupResult("No cached response for that URL.");
				append("cache.match() → miss", "info");
				return;
			}
			const body = await response.text();
			setLookupResult(`Hit → ${response.status} · ${body}`);
			append("cache.match() → hit", "success");
		} catch (error) {
			append(
				error instanceof Error ? error.message : "The lookup failed.",
				"error",
			);
		}
	};

	const deleteCache = async () => {
		if (!isCacheApiAvailable()) return;
		await caches.delete(CACHE_NAME);
		await refreshEntries();
		setLookupResult(null);
		append("caches.delete() → removed the whole cache.", "info");
	};

	const entriesState = match(entries.length)
		.with(0, () => "The cache is empty.")
		.otherwise(() => `${entries.length} cached responses.`);

	return (
		<DemoSection
			title="Demo 8: Cache API as a storage bucket"
			description="The Cache API stores whole responses keyed by request URL. This demo uses your browser's real cache: store some responses, then look one up by its URL."
		>
			<div className="space-y-5">
				{!available ? (
					<p className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-300">
						This browser does not expose the Cache API. The example below still
						shows how it works.
					</p>
				) : null}

				<div className="grid gap-4 md:grid-cols-2">
					<div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
						<div className="flex items-center justify-between">
							<span className="font-mono text-xs text-emerald-300">
								caches.open("{CACHE_NAME}")
							</span>
							<span className="text-[11px] text-zinc-500">{entriesState}</span>
						</div>

						<div className="mt-3 space-y-1.5">
							{entries.length === 0 ? (
								<p className="text-xs text-zinc-600">Nothing cached yet.</p>
							) : (
								entries.map((entry) => (
									<motion.div
										key={entry.url}
										initial={{ opacity: 0, y: -6 }}
										animate={{ opacity: 1, y: 0 }}
										className="rounded-md border border-zinc-800 bg-zinc-900/60 px-2 py-1.5"
									>
										<div className="font-mono text-[11px] text-emerald-200">
											{entry.url}
										</div>
										<div className="mt-0.5 truncate font-mono text-[10px] text-zinc-500">
											{entry.status} · {entry.bodyPreview}
										</div>
									</motion.div>
								))
							)}
						</div>

						<div className="mt-3 flex flex-wrap gap-2">
							<button
								type="button"
								onClick={putEntries}
								className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-300 transition-colors hover:bg-emerald-500/20"
							>
								Store 3 responses
							</button>
							<button
								type="button"
								onClick={deleteCache}
								className="rounded-md border border-zinc-800 px-2 py-1 text-[11px] text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
							>
								Delete the cache
							</button>
						</div>
					</div>

					<div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
						<div className="text-xs uppercase tracking-wider text-zinc-500">
							Look up a URL
						</div>
						<label className="mt-2 block text-xs text-zinc-400">
							Request URL
							<input
								type="text"
								value={lookupUrl}
								onChange={(event) => setLookupUrl(event.target.value)}
								className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1.5 font-mono text-xs text-zinc-100 outline-none focus:border-emerald-500/40"
							/>
						</label>
						<button
							type="button"
							onClick={lookup}
							className="mt-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-300 transition-colors hover:bg-emerald-500/20"
						>
							cache.match()
						</button>
						{lookupResult ? (
							<p className="mt-2 rounded-md border border-zinc-800 bg-zinc-900/60 px-2 py-1.5 font-mono text-[11px] text-zinc-300">
								{lookupResult}
							</p>
						) : null}
					</div>
				</div>

				{log.length > 0 ? (
					<ul className="space-y-1">
						{log.map((entry) => (
							<motion.li
								key={entry.id}
								initial={{ opacity: 0, x: -8 }}
								animate={{ opacity: 1, x: 0 }}
								className={`font-mono text-[11px] ${
									entry.tone === "error"
										? "text-rose-300"
										: entry.tone === "success"
											? "text-emerald-300"
											: "text-zinc-500"
								}`}
							>
								{entry.text}
							</motion.li>
						))}
					</ul>
				) : null}

				<div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs leading-relaxed text-zinc-400">
					<strong className="text-emerald-300">Not a key/value store.</strong>{" "}
					The Cache API is built for network traffic. A key is a{" "}
					<code className="font-mono text-zinc-200">Request</code>, and a value
					is a <code className="font-mono text-zinc-200">Response</code> with
					its status, headers, and body. You cannot ask it for a value by an
					arbitrary string key. It also shares one disk-backed pool with
					IndexedDB, so the two are not separate budgets.
				</div>

				<ShikiCode
					language="javascript"
					showLineNumbers={false}
					className="text-xs"
					code={`const cache = await caches.open("app-shell-v1");

// The key is a request URL, the value is a whole response.
await cache.put("/index.html", await fetch("/index.html"));

// Look it up by URL.
const hit = await cache.match("/index.html");

// Ignore the query string when matching.
const exact = await cache.match("/api/user", { ignoreSearch: true });`}
				/>

				<p className="text-xs text-zinc-500">
					Caches are origin-scoped and survive restarts. The service worker page
					covers the strategies for deciding when to read from a cache; this
					demo covers the cache itself as a place to put data.
				</p>
			</div>
		</DemoSection>
	);
}
