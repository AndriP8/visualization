import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ShikiCode } from "../shared/ShikiCode";

interface Tab {
	id: string;
	name: string;
}

export function SharedWorkerDemo() {
	const [connected, setConnected] = useState(false);
	const [tabs, setTabs] = useState<Tab[]>([]);
	const [localCount, setLocalCount] = useState(0);
	const [message, setMessage] = useState("");
	const [messages, setMessages] = useState<
		{ from: string; text: string; timestamp: number }[]
	>([]);
	const channelRef = useRef<BroadcastChannel | null>(null);
	const tabIdRef = useRef(`Tab-${Math.random().toString(36).substring(2, 11)}`);
	const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const knownTabsRef = useRef<Map<string, number>>(new Map());

	const updateTabsList = useCallback(() => {
		const tabsList: Tab[] = [];
		for (const [id] of knownTabsRef.current.entries()) {
			tabsList.push({ id, name: id });
		}
		setTabs(tabsList);
	}, []);

	useEffect(() => {
		const channel = new BroadcastChannel("shared-worker-demo");
		channelRef.current = channel;

		// Track this tab
		knownTabsRef.current.set(tabIdRef.current, Date.now());
		updateTabsList();

		channel.onmessage = (event) => {
			const { type, data } = event.data;

			if (type === "HEARTBEAT") {
				knownTabsRef.current.set(data.id, Date.now());
				updateTabsList();
			} else if (type === "DISCONNECT") {
				knownTabsRef.current.delete(data.id);
				updateTabsList();
			} else if (type === "COUNTER_UPDATE") {
				setLocalCount(data.value);
			} else if (type === "MESSAGE") {
				setMessages((prev) => [...prev.slice(-4), data]);
			}
		};

		// Announce presence
		channel.postMessage({
			type: "HEARTBEAT",
			data: { id: tabIdRef.current, name: tabIdRef.current },
		});

		// Periodic heartbeat to detect closed tabs
		heartbeatRef.current = setInterval(() => {
			const now = Date.now();
			// Remove tabs not seen in 4 seconds
			for (const [id, lastSeen] of knownTabsRef.current.entries()) {
				if (id !== tabIdRef.current && now - lastSeen > 4000) {
					knownTabsRef.current.delete(id);
				}
			}
			updateTabsList();

			channel.postMessage({
				type: "HEARTBEAT",
				data: { id: tabIdRef.current, name: tabIdRef.current },
			});
		}, 2000);

		setConnected(true);

		return () => {
			channel.postMessage({
				type: "DISCONNECT",
				data: { id: tabIdRef.current },
			});
			channel.close();
			if (heartbeatRef.current) clearInterval(heartbeatRef.current);
		};
	}, [updateTabsList]);

	const handleIncrement = () => {
		const newCount = localCount + 1;
		setLocalCount(newCount);
		channelRef.current?.postMessage({
			type: "COUNTER_UPDATE",
			data: { value: newCount },
		});
	};

	const handleSendMessage = () => {
		if (!message.trim()) return;

		const msgData = {
			from: tabIdRef.current,
			text: message,
			timestamp: Date.now(),
		};

		channelRef.current?.postMessage({
			type: "MESSAGE",
			data: msgData,
		});

		// Also show locally
		setMessages((prev) => [...prev.slice(-4), msgData]);
		setMessage("");
	};

	return (
		<div className="space-y-8">
			{/* Implementation note */}
			<div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
				<p className="text-xs text-accent-amber">
					<strong>Note:</strong> This demo uses BroadcastChannel for cross-tab
					communication (works in all modern browsers). In production,
					SharedWorker provides the same cross-tab coordination with additional
					capabilities like persistent state and WebSocket sharing. SharedWorker
					is supported in Chrome, Edge, and Firefox desktop, but NOT in Safari
					or iOS browsers.
				</p>
			</div>

			{/* Connection status */}
			<div className="bg-surface-primary border border-border-primary rounded-lg p-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div
							className={`w-3 h-3 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-surface-tertiary"}`}
						/>
						<div>
							<h3 className="text-sm font-semibold text-text-secondary">
								{connected ? "Connected" : "Disconnected"}
							</h3>
							<p className="text-xs text-text-muted">
								Tab ID: {tabIdRef.current}
							</p>
						</div>
					</div>
					<div className="text-right">
						<div className="text-2xl font-bold text-text-primary">
							{tabs.length}
						</div>
						<div className="text-xs text-text-tertiary">Active Tabs</div>
					</div>
				</div>
			</div>

			{/* Shared counter */}
			<div className="bg-surface-primary border border-border-primary rounded-lg p-6">
				<h4 className="text-sm font-semibold text-text-secondary mb-4">
					Shared Counter (Across All Tabs)
				</h4>
				<div className="flex items-center justify-between">
					<div>
						<div className="text-4xl font-bold text-accent-cyan">
							{localCount}
						</div>
						<div className="text-xs text-text-muted mt-1">
							Click from any tab to increment
						</div>
					</div>
					<button
						type="button"
						onClick={handleIncrement}
						className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-sm font-medium transition-colors"
					>
						Increment
					</button>
				</div>
			</div>

			{/* Active tabs visualization */}
			<div className="bg-surface-primary border border-border-primary rounded-lg p-6">
				<h4 className="text-sm font-semibold text-text-secondary mb-4">
					Active Tabs ({tabs.length})
				</h4>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
					<AnimatePresence mode="popLayout">
						{tabs.map((tab) => (
							<motion.div
								key={tab.id}
								initial={{ scale: 0.8, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								exit={{ scale: 0.8, opacity: 0 }}
								className={`p-3 rounded-lg border-2 ${
									tab.id === tabIdRef.current
										? "border-emerald-500 bg-emerald-500/20"
										: "border-border-secondary bg-surface-secondary"
								}`}
							>
								<div className="flex items-center gap-2">
									<div
										className={`w-2 h-2 rounded-full ${
											tab.id === tabIdRef.current
												? "bg-emerald-500"
												: "bg-surface-tertiary"
										}`}
									/>
									<div className="text-xs font-mono">
										{tab.id === tabIdRef.current
											? `${tab.name} (You)`
											: tab.name}
									</div>
								</div>
							</motion.div>
						))}
					</AnimatePresence>

					{tabs.length <= 1 && (
						<div className="col-span-full text-center py-4 text-text-faint text-sm">
							Open this page in another tab to see cross-tab communication!
						</div>
					)}
				</div>
			</div>

			{/* Cross-tab messaging */}
			<div className="bg-surface-primary border border-border-primary rounded-lg p-6">
				<h4 className="text-sm font-semibold text-text-secondary mb-4">
					Broadcast Messages
				</h4>

				<div className="space-y-4">
					<div className="flex gap-2">
						<input
							type="text"
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
							placeholder="Type a message to all tabs..."
							className="flex-1 px-3 py-2 bg-surface-secondary border border-border-secondary rounded text-sm focus:outline-none focus:border-cyan-500"
						/>
						<button
							type="button"
							onClick={handleSendMessage}
							className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded text-sm font-medium transition-colors"
						>
							Broadcast
						</button>
					</div>

					<div className="space-y-2">
						{messages.length === 0 ? (
							<p className="text-text-faint text-center py-4 text-xs">
								No messages yet. Send one above!
							</p>
						) : (
							messages.map((msg) => (
								<motion.div
									key={`${msg.from}-${msg.timestamp}`}
									initial={{ opacity: 0, x: -10 }}
									animate={{ opacity: 1, x: 0 }}
									className={`p-3 rounded border ${
										msg.from === tabIdRef.current
											? "bg-emerald-500/10 border-emerald-500/30"
											: "bg-violet-500/10 border-violet-500/30"
									}`}
								>
									<div className="flex items-center justify-between mb-1">
										<span className="text-xs font-mono text-text-tertiary">
											{msg.from === tabIdRef.current ? "You" : msg.from}
										</span>
										<span className="text-[10px] text-text-faint">
											{new Date(msg.timestamp).toLocaleTimeString()}
										</span>
									</div>
									<div className="text-sm text-text-secondary">{msg.text}</div>
								</motion.div>
							))
						)}
					</div>
				</div>
			</div>

			{/* Code examples */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div>
					<h4 className="text-sm font-semibold text-text-tertiary mb-3">
						Creating Shared Worker
					</h4>
					<ShikiCode
						language="javascript"
						code={`// main.js (same code in all tabs)
const worker = new SharedWorker('shared-worker.js');

worker.port.onmessage = (event) => {
  const { type, data } = event.data;

  if (type === 'COUNTER_UPDATE') {
    counterDisplay.textContent = data;
  }
};

// Send message to shared worker
worker.port.postMessage({
  type: 'INCREMENT'
});`}
						className="text-xs"
					/>
				</div>

				<div>
					<h4 className="text-sm font-semibold text-text-tertiary mb-3">
						Shared Worker Script
					</h4>
					<ShikiCode
						language="javascript"
						code={`// shared-worker.js
const connections = new Set();
let counter = 0;

self.onconnect = (event) => {
  const port = event.ports[0];
  connections.add(port);

  port.onmessage = (e) => {
    if (e.data.type === 'INCREMENT') {
      counter++;
      broadcast({ type: 'COUNTER_UPDATE', data: counter });
    }
  };
};

function broadcast(message) {
  connections.forEach(port => port.postMessage(message));
}`}
						className="text-xs"
					/>
				</div>
			</div>

			{/* Comparison: Dedicated vs Shared */}
			<div className="bg-surface-primary/50 border border-border-primary rounded-lg p-6">
				<h4 className="text-sm font-semibold text-text-secondary mb-4">
					Dedicated Worker vs Shared Worker
				</h4>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-border-primary">
								<th className="text-left py-2 text-text-tertiary font-medium">
									Feature
								</th>
								<th className="text-left py-2 text-accent-violet font-medium">
									Dedicated Worker
								</th>
								<th className="text-left py-2 text-accent-emerald font-medium">
									Shared Worker
								</th>
							</tr>
						</thead>
						<tbody className="text-text-tertiary">
							<tr className="border-b border-border-primary/50">
								<td className="py-3">Scope</td>
								<td>Single tab/window</td>
								<td className="text-accent-emerald-soft">
									Multiple tabs/windows (same origin)
								</td>
							</tr>
							<tr className="border-b border-border-primary/50">
								<td className="py-3">Communication</td>
								<td>postMessage</td>
								<td>port.postMessage</td>
							</tr>
							<tr className="border-b border-border-primary/50">
								<td className="py-3">Lifetime</td>
								<td>Terminates when tab closes</td>
								<td className="text-accent-emerald-soft">
									Persists while any tab is open
								</td>
							</tr>
							<tr className="border-b border-border-primary/50">
								<td className="py-3">Use Case</td>
								<td>Heavy computation</td>
								<td className="text-accent-emerald-soft">
									Shared state, coordination
								</td>
							</tr>
							<tr>
								<td className="py-3">Browser Support</td>
								<td className="text-accent-emerald-soft">
									Excellent (all browsers)
								</td>
								<td className="text-accent-amber-soft">
									Chrome, Edge, Firefox — not Safari
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>

			{/* Use cases */}
			<div className="bg-surface-primary/50 border border-border-primary rounded-lg p-6">
				<h4 className="text-sm font-semibold text-text-secondary mb-4">
					Shared Worker Use Cases
				</h4>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
					<div className="space-y-2">
						<div className="flex items-start gap-2">
							<span className="text-accent-emerald-soft">✅</span>
							<div>
								<div className="font-medium text-text-secondary">
									WebSocket Connection Sharing
								</div>
								<div className="text-xs text-text-muted">
									Single WebSocket shared across tabs
								</div>
							</div>
						</div>
						<div className="flex items-start gap-2">
							<span className="text-accent-emerald-soft">✅</span>
							<div>
								<div className="font-medium text-text-secondary">
									IndexedDB Coordination
								</div>
								<div className="text-xs text-text-muted">
									Prevent concurrent write conflicts
								</div>
							</div>
						</div>
						<div className="flex items-start gap-2">
							<span className="text-accent-emerald-soft">✅</span>
							<div>
								<div className="font-medium text-text-secondary">
									Resource Pooling
								</div>
								<div className="text-xs text-text-muted">
									Share expensive resources (cache, auth tokens)
								</div>
							</div>
						</div>
					</div>
					<div className="space-y-2">
						<div className="flex items-start gap-2">
							<span className="text-accent-emerald-soft">✅</span>
							<div>
								<div className="font-medium text-text-secondary">
									Cross-Tab Notifications
								</div>
								<div className="text-xs text-text-muted">
									Sync state changes between tabs
								</div>
							</div>
						</div>
						<div className="flex items-start gap-2">
							<span className="text-accent-emerald-soft">✅</span>
							<div>
								<div className="font-medium text-text-secondary">
									Centralized Logging
								</div>
								<div className="text-xs text-text-muted">
									Aggregate logs from all tabs
								</div>
							</div>
						</div>
						<div className="flex items-start gap-2">
							<span className="text-accent-emerald-soft">✅</span>
							<div>
								<div className="font-medium text-text-secondary">
									Session Management
								</div>
								<div className="text-xs text-text-muted">
									Single logout affects all tabs
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
