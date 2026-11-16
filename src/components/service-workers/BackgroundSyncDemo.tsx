import { useRef, useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

interface QueuedRequest {
	id: number;
	label: string;
}

export function BackgroundSyncDemo() {
	const [online, setOnline] = useState(true);
	const [queue, setQueue] = useState<QueuedRequest[]>([]);
	const [delivered, setDelivered] = useState<QueuedRequest[]>([]);
	const [syncRegistered, setSyncRegistered] = useState(false);
	const [log, setLog] = useState<{ id: number; message: string }[]>([]);
	const nextId = useRef(0);

	const addLog = (message: string) =>
		setLog((previous) =>
			[...previous, { id: nextId.current++, message }].slice(-5),
		);

	const submitOrder = () => {
		const id = nextId.current++;
		const request = { id, label: `POST /orders #${id + 1}` };

		if (online) {
			setDelivered((previous) => [...previous, request]);
			addLog(`fetch → 201 for ${request.label}`);
			return;
		}

		setQueue((previous) => [...previous, request]);
		setSyncRegistered(true);
		addLog(`${request.label} failed → stored in IndexedDB`);
		addLog('sync.register("sync-orders")');
	};

	const toggleNetwork = () => {
		if (online) {
			setOnline(false);
			addLog("offline: fetches now reject");
			return;
		}

		setOnline(true);
		if (!queue.length) {
			addLog("online: nothing queued");
			return;
		}

		setDelivered((previous) => [...previous, ...queue]);
		addLog(`sync event → replayed ${queue.length} queued request(s)`);
		setQueue([]);
		setSyncRegistered(false);
	};

	const reset = () => {
		setOnline(true);
		setQueue([]);
		setDelivered([]);
		setSyncRegistered(false);
		setLog([]);
	};

	return (
		<DemoSection
			title="Demo 4: Background sync queue"
			description="A failed write is stored durably and replayed by the worker when the browser fires a sync event. The queue must live in IndexedDB because an idle worker can be terminated, losing module state."
		>
			<div className="space-y-5">
				<div className="flex flex-wrap gap-2">
					<button
						type="button"
						onClick={toggleNetwork}
						className={`rounded-lg border px-3 py-2 text-xs font-medium ${online ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-rose-500/30 bg-rose-500/10 text-rose-300"}`}
					>
						{online ? "● Network online" : "○ Network offline"}
					</button>
					<button
						type="button"
						onClick={submitOrder}
						className="rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-zinc-950 hover:bg-orange-400"
					>
						Submit order
					</button>
					<button
						type="button"
						onClick={reset}
						className="rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:border-zinc-600"
					>
						Reset
					</button>
				</div>

				<div className="grid gap-4 md:grid-cols-2">
					<div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
						<div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
							<span>IndexedDB queue</span>
							<span
								className={syncRegistered ? "text-amber-300" : "text-zinc-600"}
							>
								{syncRegistered ? "sync registered" : "no sync pending"}
							</span>
						</div>
						{queue.length ? (
							<ol className="space-y-1 font-mono text-xs text-amber-300">
								{queue.map((request) => (
									<li key={request.id}>queued · {request.label}</li>
								))}
							</ol>
						) : (
							<p className="text-xs text-zinc-600">Queue empty.</p>
						)}
					</div>
					<div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
						<div className="mb-2 text-xs text-zinc-500">Server received</div>
						{delivered.length ? (
							<ol className="space-y-1 font-mono text-xs text-emerald-300">
								{delivered.map((request) => (
									<li key={request.id}>201 · {request.label}</li>
								))}
							</ol>
						) : (
							<p className="text-xs text-zinc-600">Nothing delivered yet.</p>
						)}
					</div>
				</div>

				<div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
					<div className="mb-2 text-xs text-zinc-500">Activity</div>
					{log.length ? (
						<ol className="space-y-1 font-mono text-xs text-orange-300">
							{log.map((entry) => (
								<li key={entry.id}>{entry.message}</li>
							))}
						</ol>
					) : (
						<p className="text-xs text-zinc-600">
							Go offline, then submit an order.
						</p>
					)}
				</div>

				<div className="grid gap-4 md:grid-cols-2">
					<div>
						<h4 className="mb-2 text-xs font-semibold text-zinc-400">Page</h4>
						<ShikiCode
							language="javascript"
							code={`// page.js
async function submitOrder(order) {
  try {
    await fetch('/orders', { method: 'POST', body: order });
  } catch {
    await saveToIndexedDb(order); // durable queue

    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('sync-orders');
  }
}`}
						/>
					</div>
					<div>
						<h4 className="mb-2 text-xs font-semibold text-zinc-400">
							Service worker
						</h4>
						<ShikiCode
							language="javascript"
							code={`// sw.js
self.addEventListener('sync', (event) => {
  if (event.tag !== 'sync-orders') return;
  event.waitUntil(replayQueue());
});

async function replayQueue() {
  for (const order of await readQueue()) {
    await fetch('/orders', { method: 'POST', body: order });
    await removeFromQueue(order.id);
  }
}`}
						/>
					</div>
				</div>
				<p className="text-xs text-zinc-500">
					The browser decides when to fire sync and retries with backoff, so
					queued writes must be idempotent. Background Sync is unsupported in
					Safari; there, replay on the page's <code>online</code> event instead.
				</p>
			</div>
		</DemoSection>
	);
}
