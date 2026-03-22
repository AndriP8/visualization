import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ShikiCode } from "../shared/ShikiCode";

interface Message {
	id: number;
	direction: "to-worker" | "to-main";
	data: unknown;
	timestamp: number;
	status: "sending" | "delivered";
}

export function PostMessageDemo() {
	const [messages, setMessages] = useState<Message[]>([]);
	const [inputValue, setInputValue] = useState("");
	const [testType, setTestType] = useState<
		"primitive" | "object" | "function" | "dom"
	>("primitive");
	const workerRef = useRef<Worker | null>(null);
	const messageIdRef = useRef(0);

	const addMessage = useCallback((msg: Message) => {
		setMessages((prev) => [...prev.slice(-5), msg]); // Keep last 6 messages
	}, []);

	useEffect(() => {
		const workerCode = `
			self.onmessage = (event) => {
				const { type, payload } = event.data;

				if (type === 'ECHO') {
					// Echo back with processed data
					self.postMessage({
						type: 'ECHO_RESPONSE',
						original: payload,
						processed: typeof payload === 'string' ? payload.toUpperCase() : payload,
						timestamp: Date.now()
					});
				} else if (type === 'PROCESS_ARRAY') {
					const sum = payload.reduce((a, b) => a + b, 0);
					const avg = sum / payload.length;
					self.postMessage({
						type: 'ARRAY_RESULT',
						sum,
						average: avg
					});
				}
			};
		`;

		const blob = new Blob([workerCode], { type: "application/javascript" });
		workerRef.current = new Worker(URL.createObjectURL(blob));

		workerRef.current.onmessage = (event) => {
			const msgId = messageIdRef.current++;
			addMessage({
				id: msgId,
				direction: "to-main",
				data: event.data,
				timestamp: Date.now(),
				status: "sending",
			});

			// Animate delivery
			setTimeout(() => {
				setMessages((prev) =>
					prev.map((msg) =>
						msg.id === msgId ? { ...msg, status: "delivered" as const } : msg,
					),
				);
			}, 500);
		};

		return () => {
			workerRef.current?.terminate();
		};
	}, [addMessage]);

	const sendMessage = (data: unknown) => {
		const msgId = messageIdRef.current++;
		addMessage({
			id: msgId,
			direction: "to-worker",
			data,
			timestamp: Date.now(),
			status: "sending",
		});

		setTimeout(() => {
			workerRef.current?.postMessage(data);
			setMessages((prev) =>
				prev.map((msg) =>
					msg.id === msgId ? { ...msg, status: "delivered" as const } : msg,
				),
			);
		}, 500);
	};

	const handleCustomSend = () => {
		if (!inputValue.trim()) return;
		sendMessage({ type: "ECHO", payload: inputValue });
		setInputValue("");
	};

	const handleTestSend = () => {
		switch (testType) {
			case "primitive":
				sendMessage({ type: "ECHO", payload: 42 });
				return;
			case "object":
				sendMessage({ type: "PROCESS_ARRAY", payload: [1, 2, 3, 4, 5] });
				return;
		}

		// Function and DOM types will throw DataCloneError
		let testData: unknown;
		if (testType === "function") {
			testData = { type: "ECHO", payload: () => console.log("test") };
		} else if (typeof document !== "undefined") {
			testData = { type: "ECHO", payload: document.createElement("div") };
		}

		try {
			workerRef.current?.postMessage(testData);
		} catch (err) {
			const msgId = messageIdRef.current++;
			addMessage({
				id: msgId,
				direction: "to-worker",
				data: {
					error: `DataCloneError: ${err instanceof Error ? err.message : "Failed to clone"}`,
				},
				timestamp: Date.now(),
				status: "delivered",
			});
		}
	};

	return (
		<div className="space-y-8">
			{/* Thread visualization */}
			<div className="relative">
				<p className="text-xs text-zinc-500 text-center mb-4">
					Messages travel between threads via{" "}
					<code className="text-cyan-400">postMessage</code>
				</p>
				<div className="grid grid-cols-2 gap-12">
					{/* Main Thread */}
					<div className="bg-zinc-900 border border-violet-500 rounded-lg p-6">
						<div className="flex items-center gap-3 mb-4">
							<div className="w-3 h-3 rounded-full bg-violet-500 animate-pulse" />
							<h3 className="text-lg font-semibold text-violet-300">
								Main Thread
							</h3>
						</div>
						<div className="text-sm text-zinc-400 space-y-2">
							<p>• Has DOM access</p>
							<p>• Handles UI events</p>
							<p>• Can create workers</p>
						</div>
					</div>

					{/* Worker Thread */}
					<div className="bg-zinc-900 border border-emerald-500 rounded-lg p-6">
						<div className="flex items-center gap-3 mb-4">
							<div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
							<h3 className="text-lg font-semibold text-emerald-300">
								Worker Thread
							</h3>
						</div>
						<div className="text-sm text-zinc-400 space-y-2">
							<p>• No DOM access</p>
							<p>• Runs in isolation</p>
							<p>• Receives messages</p>
						</div>
					</div>
				</div>

				{/* Channel label */}
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-10">
					<span className="text-[10px] text-zinc-600 whitespace-nowrap">
						postMessage channel
					</span>
				</div>

				{/* Message visualization */}
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24">
					<AnimatePresence>
						{messages.map((msg) => (
							<motion.div
								key={msg.id}
								initial={{
									x: msg.direction === "to-worker" ? -200 : 200,
									opacity: 0,
								}}
								animate={{
									x: msg.direction === "to-worker" ? 200 : -200,
									opacity: msg.status === "sending" ? 1 : 0,
								}}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.5 }}
								className="absolute top-1/2 -translate-y-1/2"
							>
								<div className="w-4 h-4 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50" />
							</motion.div>
						))}
					</AnimatePresence>
				</div>
			</div>

			{/* Interactive controls */}
			<div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
				<h4 className="text-sm font-semibold text-zinc-300">
					Send Message to Worker
				</h4>

				<div className="flex gap-2">
					<input
						type="text"
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && handleCustomSend()}
						placeholder="Type a message..."
						className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm focus:outline-none focus:border-cyan-500"
					/>
					<button
						type="button"
						onClick={handleCustomSend}
						className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded text-sm font-medium transition-colors"
					>
						Send
					</button>
				</div>

				<div>
					<label
						htmlFor="test-cloning"
						className="block text-xs text-zinc-400 mb-2"
					>
						Test Structured Cloning:
					</label>
					<div className="flex gap-2">
						<select
							id="test-cloning"
							value={testType}
							onChange={(e) =>
								setTestType(
									e.target.value as "primitive" | "object" | "function" | "dom",
								)
							}
							className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm focus:outline-none focus:border-cyan-500"
						>
							<option value="primitive">✅ Primitive (number)</option>
							<option value="object">✅ Object (array)</option>
							<option value="function">❌ Function</option>
							<option value="dom">❌ DOM Node</option>
						</select>
						<button
							type="button"
							onClick={handleTestSend}
							className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded text-sm font-medium transition-colors"
						>
							Test
						</button>
					</div>
				</div>
			</div>

			{/* Message log */}
			<div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
				<h4 className="text-sm font-semibold text-zinc-300 mb-4">
					Message Log
				</h4>
				<div className="space-y-2 font-mono text-xs">
					{messages.length === 0 ? (
						<p className="text-zinc-600 text-center py-4">
							No messages yet. Send one above!
						</p>
					) : (
						messages.map((msg) => (
							<motion.div
								key={msg.id}
								initial={{ opacity: 0, x: -10 }}
								animate={{ opacity: 1, x: 0 }}
								className={`p-3 rounded border ${
									msg.direction === "to-worker"
										? "bg-violet-500/10 border-violet-500/30 text-violet-300"
										: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
								}`}
							>
								<div className="flex items-center justify-between mb-1">
									<span className="text-[10px] text-zinc-500">
										{msg.direction === "to-worker"
											? "→ To Worker"
											: "← From Worker"}
									</span>
									<span className="text-[10px] text-zinc-600">
										{new Date(msg.timestamp).toLocaleTimeString()}
									</span>
								</div>
								<pre className="text-xs overflow-x-auto">
									{JSON.stringify(msg.data, null, 2)}
								</pre>
							</motion.div>
						))
					)}
				</div>
			</div>

			{/* Code examples */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div>
					<h4 className="text-sm font-semibold text-zinc-400 mb-3">
						Main Thread → Worker
					</h4>
					<ShikiCode
						language="javascript"
						code={`// main.js
const worker = new Worker('worker.js');

// Send data to worker
worker.postMessage({
  type: 'PROCESS',
  payload: [1, 2, 3, 4, 5]
});

// Receive from worker
worker.onmessage = (event) => {
  console.log('Result:', event.data);
  // { type: 'RESULT', value: 15 }
};`}
						className="text-xs"
					/>
				</div>

				<div>
					<h4 className="text-sm font-semibold text-zinc-400 mb-3">
						Worker → Main Thread
					</h4>
					<ShikiCode
						language="javascript"
						code={`// worker.js
self.onmessage = (event) => {
  const { type, payload } = event.data;

  if (type === 'PROCESS') {
    const sum = payload.reduce((a, b) => a + b, 0);

    // Send back to main thread
    self.postMessage({
      type: 'RESULT',
      value: sum
    });
  }
};`}
						className="text-xs"
					/>
				</div>
			</div>

			{/* Structured cloning rules */}
			<div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
				<h4 className="text-sm font-semibold text-zinc-300 mb-4">
					Structured Cloning Rules
				</h4>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
					<div>
						<h5 className="text-emerald-400 font-medium mb-2">
							✅ Can Be Cloned
						</h5>
						<ul className="space-y-1 text-zinc-400">
							<li>• Primitives (number, string, boolean)</li>
							<li>• Arrays and Objects</li>
							<li>• Date, RegExp</li>
							<li>• Typed Arrays (Uint8Array, etc.)</li>
							<li>• ArrayBuffer, Blob</li>
							<li>• Map, Set</li>
						</ul>
					</div>
					<div>
						<h5 className="text-red-400 font-medium mb-2">
							❌ Cannot Be Cloned
						</h5>
						<ul className="space-y-1 text-zinc-400">
							<li>• Functions</li>
							<li>• DOM nodes</li>
							<li>• Symbols</li>
							<li>• Prototype chains</li>
							<li>• Class instances (lose prototype)</li>
							<li>• WeakMap, WeakSet</li>
						</ul>
					</div>
				</div>

				<div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded">
					<p className="text-xs text-cyan-300">
						<strong>⚡ Transferable Objects:</strong> ArrayBuffer and
						MessagePort can be transferred with zero-copy using the transfer
						list (see next demo)
					</p>
				</div>
			</div>
		</div>
	);
}
