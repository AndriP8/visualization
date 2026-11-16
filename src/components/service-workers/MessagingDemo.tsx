import { useRef, useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

type TabId = "tab-a" | "tab-b";

const TABS: { id: TabId; label: string }[] = [
	{ id: "tab-a", label: "Tab A" },
	{ id: "tab-b", label: "Tab B" },
];

interface InboxEntry {
	id: number;
	message: string;
}

const EMPTY_INBOX: Record<TabId, InboxEntry[]> = { "tab-a": [], "tab-b": [] };

export function MessagingDemo() {
	const [activeTab, setActiveTab] = useState<TabId>("tab-a");
	const [controlled, setControlled] = useState(true);
	const [inbox, setInbox] = useState<Record<TabId, InboxEntry[]>>(EMPTY_INBOX);
	const [workerLog, setWorkerLog] = useState<{ id: number; message: string }[]>(
		[],
	);
	const [result, setResult] = useState(
		"Pick a tab, then send a message from the page.",
	);
	const nextId = useRef(0);

	const addLog = (message: string) =>
		setWorkerLog((previous) =>
			[...previous, { id: nextId.current++, message }].slice(-4),
		);

	const deliver = (tab: TabId, message: string) =>
		setInbox((previous) => ({
			...previous,
			[tab]: [...previous[tab], { id: nextId.current++, message }].slice(-3),
		}));

	const failUncontrolled = () => {
		setResult(
			"navigator.serviceWorker.controller is null on the first load, so there is no worker to post to.",
		);
	};

	const sendToWorker = () => {
		if (!controlled) {
			failUncontrolled();
			return;
		}
		addLog(`message from ${activeTab} → event.source`);
		deliver(activeTab, "SYNC_NOW acknowledged");
		setResult(`The worker replied only to ${activeTab} through event.source.`);
	};

	const broadcast = () => {
		if (!controlled) {
			failUncontrolled();
			return;
		}
		addLog('clients.matchAll({ type: "window" }) → 2 clients');
		deliver("tab-a", "UPDATE_READY");
		deliver("tab-b", "UPDATE_READY");
		setResult("The worker pushed the same message to every window client.");
	};

	const openChannel = () => {
		if (!controlled) {
			failUncontrolled();
			return;
		}
		addLog("MessageChannel → port2 transferred to the worker");
		deliver(activeTab, "stats: 42 KB cached");
		setResult(
			`A dedicated port answered ${activeTab}; no other client sees the reply.`,
		);
	};

	const reset = () => {
		setInbox(EMPTY_INBOX);
		setWorkerLog([]);
		setResult("Pick a tab, then send a message from the page.");
	};

	return (
		<DemoSection
			title="Demo 2: Page ↔ worker messaging"
			description="Pages talk to the controlling worker with postMessage. The worker can reply to one client through event.source, broadcast to every client found by clients.matchAll(), or answer over a dedicated MessageChannel."
		>
			<div className="space-y-5">
				<div className="flex flex-wrap gap-2">
					<button
						type="button"
						onClick={() => setControlled((value) => !value)}
						className={`rounded-lg border px-3 py-2 text-xs ${controlled ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-rose-500/30 bg-rose-500/10 text-rose-300"}`}
					>
						{controlled
							? "● Page controlled by worker"
							: "○ First load: controller is null"}
					</button>
					<button
						type="button"
						onClick={reset}
						className="rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:border-zinc-600"
					>
						Reset inboxes
					</button>
				</div>

				<div className="grid gap-3 sm:grid-cols-2">
					{TABS.map((tab) => (
						<button
							key={tab.id}
							type="button"
							onClick={() => setActiveTab(tab.id)}
							className={`rounded-lg border p-3 text-left ${activeTab === tab.id ? "border-orange-500/40 bg-orange-500/10" : "border-zinc-800 bg-zinc-950/50 hover:border-zinc-700"}`}
						>
							<div className="flex items-center justify-between">
								<span
									className={`text-sm font-semibold ${activeTab === tab.id ? "text-orange-300" : "text-zinc-300"}`}
								>
									{tab.label}
								</span>
								<span className="text-[10px] uppercase tracking-wider text-zinc-500">
									{activeTab === tab.id ? "sending from here" : "select"}
								</span>
							</div>
							<ol className="mt-2 space-y-1 font-mono text-[11px] text-zinc-400">
								{inbox[tab.id].length ? (
									inbox[tab.id].map((entry) => (
										<li key={entry.id} className="truncate">
											← {entry.message}
										</li>
									))
								) : (
									<li className="text-zinc-600">inbox empty</li>
								)}
							</ol>
						</button>
					))}
				</div>

				<div className="flex flex-wrap gap-2">
					<button
						type="button"
						onClick={sendToWorker}
						className="rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-zinc-950 hover:bg-orange-400"
					>
						postMessage SYNC_NOW
					</button>
					<button
						type="button"
						onClick={broadcast}
						className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-white hover:border-zinc-600"
					>
						Broadcast to all clients
					</button>
					<button
						type="button"
						onClick={openChannel}
						className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-xs text-orange-300 hover:border-orange-500/50"
					>
						Open a MessageChannel
					</button>
				</div>

				<div className="grid gap-4 md:grid-cols-2">
					<div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
						<div className="mb-2 text-xs text-zinc-500">Result</div>
						<p className="text-sm text-zinc-200" aria-live="polite">
							{result}
						</p>
					</div>
					<div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
						<div className="mb-2 text-xs text-zinc-500">Worker activity</div>
						{workerLog.length ? (
							<ol className="space-y-1 font-mono text-xs text-orange-300">
								{workerLog.map((entry) => (
									<li key={entry.id}>{entry.message}</li>
								))}
							</ol>
						) : (
							<p className="text-xs text-zinc-600">No worker events yet.</p>
						)}
					</div>
				</div>

				<div className="grid gap-4 md:grid-cols-2">
					<div>
						<h4 className="mb-2 text-xs font-semibold text-zinc-400">Page</h4>
						<ShikiCode
							language="javascript"
							code={`// page.js
const worker = navigator.serviceWorker.controller;
if (!worker) return; // first load is uncontrolled

worker.postMessage({ type: 'SYNC_NOW' });
worker.onmessage = (event) => {
  console.log(event.data);
};

// request/response over a dedicated channel
const channel = new MessageChannel();
channel.port1.onmessage = (event) => {
  console.log(event.data); // { cached: 42 }
};
worker.postMessage({ type: 'STATS' }, [channel.port2]);`}
						/>
					</div>
					<div>
						<h4 className="mb-2 text-xs font-semibold text-zinc-400">
							Service worker
						</h4>
						<ShikiCode
							language="javascript"
							code={`// sw.js
self.addEventListener('message', (event) => {
  if (event.data.type === 'SYNC_NOW') {
    // reply to the client that sent this message
    event.source.postMessage({ type: 'ACK', ok: true });
  }

  if (event.data.type === 'STATS') {
    // reply on the transferred port
    event.ports[0].postMessage({ cached: 42 });
  }
});

async function broadcast(data) {
  const clients = await self.clients.matchAll({ type: 'window' });
  for (const client of clients) client.postMessage(data);
}`}
						/>
					</div>
				</div>
				<p className="text-xs text-zinc-500">
					This is a simulation over one JS runtime. A real worker lives in its
					own global scope, and a page must be controlled by the worker before
					its messages arrive.
				</p>
			</div>
		</DemoSection>
	);
}
