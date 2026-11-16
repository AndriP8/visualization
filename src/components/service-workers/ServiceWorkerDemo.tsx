import { useRef, useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

type Strategy = "cache-first" | "network-first" | "stale-while-revalidate";
type WorkerState = "not-installed" | "installed" | "activated";

const STRATEGIES: { id: Strategy; label: string; description: string }[] = [
	{
		id: "cache-first",
		label: "Cache first",
		description: "Fast repeat visits; update cache when missing.",
	},
	{
		id: "network-first",
		label: "Network first",
		description: "Fresh when online; use cache after a network failure.",
	},
	{
		id: "stale-while-revalidate",
		label: "Stale while revalidate",
		description: "Return cached content now and refresh it in the background.",
	},
];

export function ServiceWorkerDemo() {
	const [worker, setWorker] = useState<WorkerState>("not-installed");
	const [online, setOnline] = useState(true);
	const [strategy, setStrategy] = useState<Strategy>("cache-first");
	const [cached, setCached] = useState(false);
	const [result, setResult] = useState(
		"Install and activate the worker, then request a page.",
	);
	const [log, setLog] = useState<{ id: number; message: string }[]>([]);
	const [appVersion, setAppVersion] = useState(1);
	const [pendingVersion, setPendingVersion] = useState<number | null>(null);
	const [cacheNames, setCacheNames] = useState<string[]>([]);
	const nextLogId = useRef(0);

	const addLog = (message: string) =>
		setLog((previous) =>
			[...previous, { id: nextLogId.current++, message }].slice(-6),
		);
	const advanceWorker = () => {
		if (worker === "not-installed") {
			setWorker("installed");
			setCacheNames([`shell-v${appVersion}`]);
			setResult("Worker installed. It will take control after activation.");
			addLog("install event → cache.addAll(['/', '/app.js']) → shell-v1");
		} else if (worker === "installed") {
			setWorker("activated");
			setResult("Worker activated and ready to intercept eligible requests.");
			addLog("activate event → clients.claim()");
		} else {
			setWorker("not-installed");
			setCached(false);
			setLog([]);
			setCacheNames([]);
			setPendingVersion(null);
			setAppVersion(1);
			setResult("Worker removed. Install and activate it to begin.");
		}
	};

	const shipVersion = () => {
		if (!cacheNames.length) {
			setResult(
				"Install the worker first so there is a shell cache to replace.",
			);
			return;
		}
		const next = appVersion + 1;
		setPendingVersion(next);
		setCacheNames((previous) => [...previous, `shell-v${next}`]);
		addLog(
			`install v${next} → shell-v${next} added beside shell-v${appVersion}`,
		);
	};

	const activateVersion = () => {
		if (pendingVersion === null) return;
		setCacheNames([`shell-v${pendingVersion}`]);
		addLog(`activate → caches.delete("shell-v${appVersion}")`);
		setAppVersion(pendingVersion);
		setPendingVersion(null);
		setResult(`Version ${pendingVersion} active; old cache removed.`);
	};

	const requestPage = () => {
		if (worker !== "activated") {
			setResult(
				"No active worker: the browser makes a regular network request.",
			);
			addLog("request bypassed service worker");
			return;
		}
		if (strategy === "cache-first") {
			if (cached) {
				setResult("Served instantly from Cache Storage.");
				addLog("fetch event → cache hit");
			} else if (online) {
				setCached(true);
				setResult("Cache miss: fetched from network, then saved a copy.");
				addLog("fetch event → network → cache.put()");
			} else {
				setResult("Offline and no cached copy: request fails.");
				addLog("fetch event → cache miss → network unavailable");
			}
			return;
		}
		if (strategy === "network-first") {
			if (online) {
				setCached(true);
				setResult(
					"Fetched the latest page from the network and updated the cache.",
				);
				addLog("fetch event → network → cache.put()");
			} else if (cached) {
				setResult("Network failed: served the cached page as a fallback.");
				addLog("fetch event → network failure → cache hit");
			} else {
				setResult("Offline and no cached copy: request fails.");
				addLog("fetch event → network failure → cache miss");
			}
			return;
		}
		if (cached) {
			setResult(
				online
					? "Returned cached content immediately; refreshed the cache in the background."
					: "Returned cached content. Offline, so no background refresh ran.",
			);
			addLog(
				online
					? "fetch event → cache response + background refresh"
					: "fetch event → cache response; offline",
			);
			if (online) setCached(true);
		} else if (online) {
			setCached(true);
			setResult(
				"No cached copy: fetched from the network and cached the response.",
			);
			addLog("fetch event → cache miss → network → cache.put()");
		} else {
			setResult("Offline and no cached copy: request fails.");
			addLog("fetch event → cache miss → network unavailable");
		}
	};

	return (
		<DemoSection
			title="Demo 1: Service worker lifecycle & offline caching"
			description="Installing caches the app shell, but the new worker waits to activate so the old version keeps serving pages. Once active, the fetch handler applies a strategy — cache first for speed, network first for freshness, stale-while-revalidate for both."
		>
			<div className="space-y-5">
				<div className="grid grid-cols-3 gap-2">
					{(["not-installed", "installed", "activated"] as const).map(
						(step, index) => {
							const currentIndex =
								worker === "not-installed" ? 0 : worker === "installed" ? 1 : 2;
							return (
								<div
									key={step}
									className={`rounded-lg border p-3 text-center ${index <= currentIndex ? "border-orange-500/30 bg-orange-500/10 text-orange-300" : "border-zinc-800 bg-zinc-950/50 text-zinc-600"}`}
								>
									<div className="text-[10px] uppercase tracking-wider">
										Step {index + 1}
									</div>
									<div className="mt-1 text-xs font-semibold">
										{step.replaceAll("-", " ")}
									</div>
								</div>
							);
						},
					)}
				</div>

				<div className="flex flex-wrap gap-2">
					<button
						type="button"
						onClick={advanceWorker}
						className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-orange-400"
					>
						{worker === "not-installed"
							? "Install worker"
							: worker === "installed"
								? "Activate worker"
								: "Reset worker"}
					</button>
					<button
						type="button"
						onClick={() => setOnline((value) => !value)}
						className={`rounded-lg border px-4 py-2 text-sm ${online ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-rose-500/30 bg-rose-500/10 text-rose-300"}`}
					>
						{online ? "● Online" : "○ Offline"}
					</button>
					<button
						type="button"
						onClick={requestPage}
						className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-white hover:border-zinc-600"
					>
						Request /articles
					</button>
				</div>

				<div className="grid gap-4 md:grid-cols-3">
					{STRATEGIES.map((item) => (
						<button
							key={item.id}
							type="button"
							onClick={() => setStrategy(item.id)}
							className={`rounded-lg border p-3 text-left transition-colors ${strategy === item.id ? "border-orange-500/40 bg-orange-500/10" : "border-zinc-800 bg-zinc-950/50 hover:border-zinc-700"}`}
						>
							<span
								className={`text-sm font-semibold ${strategy === item.id ? "text-orange-300" : "text-zinc-300"}`}
							>
								{item.label}
							</span>
							<span className="mt-1 block text-xs leading-relaxed text-zinc-500">
								{item.description}
							</span>
						</button>
					))}
				</div>

				<div className="grid gap-4 md:grid-cols-2">
					<div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
						<div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
							<span>Response</span>
							<span>
								{cached ? "Cache Storage: /articles ✓" : "Cache Storage: empty"}
							</span>
						</div>
						<p className="text-sm text-zinc-200" aria-live="polite">
							{result}
						</p>
					</div>
					<div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
						<div className="mb-2 text-xs text-zinc-500">Worker activity</div>
						{log.length ? (
							<ol className="space-y-1 font-mono text-xs text-orange-300">
								{log.map((entry) => (
									<li key={entry.id}>{entry.message}</li>
								))}
							</ol>
						) : (
							<p className="text-xs text-zinc-600">No events yet.</p>
						)}
					</div>
				</div>

				<div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
					<div className="mb-3 flex flex-wrap items-center justify-between gap-2">
						<span className="text-xs text-zinc-500">
							Cache Storage ·{" "}
							{cacheNames.length ? cacheNames.join(", ") : "empty"}
						</span>
						<div className="flex flex-wrap gap-2">
							<button
								type="button"
								onClick={shipVersion}
								className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-600"
							>
								Ship new build
							</button>
							<button
								type="button"
								disabled={pendingVersion === null}
								onClick={activateVersion}
								className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-xs text-orange-300 disabled:cursor-not-allowed disabled:opacity-40"
							>
								Activate v{pendingVersion ?? appVersion}
							</button>
						</div>
					</div>
					<p className="text-xs text-zinc-400">
						Caches are named per build. A new install adds a cache beside the
						old one, and activation deletes every name outside the current
						version — otherwise old assets stay on disk forever.
					</p>
					<ShikiCode
						language="javascript"
						className="mt-3"
						code={`// sw.js
const KEEP = new Set(['shell-v${pendingVersion ?? appVersion}']);

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((name) => !KEEP.has(name))
          .map((name) => caches.delete(name)),
      ),
    ),
  );
});`}
					/>
				</div>

				<div className="grid gap-4 md:grid-cols-2">
					<div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
						<div className="mb-2 text-xs text-zinc-500">
							Fetch handler mechanics
						</div>
						<ul className="space-y-2 text-xs text-zinc-400">
							<li>
								<code className="rounded bg-zinc-800 px-1 py-0.5 text-orange-300">
									event.respondWith()
								</code>{" "}
								hands the browser a promise for the response instead of letting
								the network answer.
							</li>
							<li>
								<code className="rounded bg-zinc-800 px-1 py-0.5 text-orange-300">
									event.waitUntil()
								</code>{" "}
								keeps the worker alive until a cache write or cleanup settles.
							</li>
							<li>
								<code className="rounded bg-zinc-800 px-1 py-0.5 text-amber-300">
									request.mode === "navigate"
								</code>{" "}
								separates page loads from subresources, so fallbacks do not
								hijack every asset.
							</li>
						</ul>
					</div>
					<ShikiCode
						language="javascript"
						code={`// sw.js
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(event));
    return;
  }

  if (request.destination === 'image') {
    event.respondWith(cacheFirst(event));
  }
});

async function cacheFirst(event) {
  const cache = await caches.open('shell-v1');
  const hit = await cache.match(event.request);
  if (hit) return hit;

  const response = await fetch(event.request);
  event.waitUntil(cache.put(event.request, response.clone()));
  return response;
}`}
					/>
				</div>

				<p className="text-xs text-zinc-500">
					This is a lifecycle simulation: the browser is not registering a real
					service worker or changing network access.
				</p>
			</div>
		</DemoSection>
	);
}
