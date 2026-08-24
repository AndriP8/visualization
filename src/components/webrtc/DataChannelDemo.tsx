import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

type Reliability = "reliable-ordered" | "unreliable-unordered";

interface ChatMessage {
	id: number;
	from: "A" | "B";
	text: string;
}

export function DataChannelDemo() {
	const [reliability, setReliability] =
		useState<Reliability>("reliable-ordered");
	const [readyA, setReadyA] = useState<RTCDataChannelState>("connecting");
	const [readyB, setReadyB] = useState<RTCDataChannelState>("connecting");
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [inputA, setInputA] = useState("");
	const [inputB, setInputB] = useState("");
	const [connecting, setConnecting] = useState(false);
	const idRef = useRef(0);
	const pcARef = useRef<RTCPeerConnection | null>(null);
	const pcBRef = useRef<RTCPeerConnection | null>(null);
	const dcARef = useRef<RTCDataChannel | null>(null);
	const dcBRef = useRef<RTCDataChannel | null>(null);

	const teardown = useCallback(() => {
		dcARef.current?.close();
		dcBRef.current?.close();
		pcARef.current?.close();
		pcBRef.current?.close();
		dcARef.current = null;
		dcBRef.current = null;
		pcARef.current = null;
		pcBRef.current = null;
	}, []);

	useEffect(() => teardown, [teardown]);

	const connect = useCallback(async () => {
		teardown();
		setMessages([]);
		setReadyA("connecting");
		setReadyB("connecting");
		setConnecting(true);

		const pcA = new RTCPeerConnection();
		const pcB = new RTCPeerConnection();
		pcARef.current = pcA;
		pcBRef.current = pcB;

		pcA.onicecandidate = (e) => {
			if (e.candidate) pcB.addIceCandidate(e.candidate).catch(() => undefined);
		};
		pcB.onicecandidate = (e) => {
			if (e.candidate) pcA.addIceCandidate(e.candidate).catch(() => undefined);
		};

		const channelOptions: RTCDataChannelInit =
			reliability === "reliable-ordered"
				? { ordered: true }
				: { ordered: false, maxRetransmits: 0 };

		const dcA = pcA.createDataChannel("chat", channelOptions);
		dcARef.current = dcA;
		dcA.onopen = () => setReadyA(dcA.readyState);
		dcA.onclose = () => setReadyA(dcA.readyState);
		dcA.onmessage = (e: MessageEvent<string>) => {
			setMessages((prev) => [
				...prev,
				{ id: idRef.current++, from: "B", text: e.data },
			]);
		};

		pcB.ondatachannel = (event) => {
			const dcB = event.channel;
			dcBRef.current = dcB;
			setReadyB(dcB.readyState);
			dcB.onopen = () => setReadyB(dcB.readyState);
			dcB.onclose = () => setReadyB(dcB.readyState);
			dcB.onmessage = (e: MessageEvent<string>) => {
				setMessages((prev) => [
					...prev,
					{ id: idRef.current++, from: "A", text: e.data },
				]);
			};
		};

		const offer = await pcA.createOffer();
		await pcA.setLocalDescription(offer);
		await pcB.setRemoteDescription(offer);
		const answer = await pcB.createAnswer();
		await pcB.setLocalDescription(answer);
		await pcA.setRemoteDescription(answer);
		setConnecting(false);
	}, [reliability, teardown]);

	const sendFromA = () => {
		if (!inputA.trim() || dcARef.current?.readyState !== "open") return;
		dcARef.current.send(inputA);
		setInputA("");
	};
	const sendFromB = () => {
		if (!inputB.trim() || dcBRef.current?.readyState !== "open") return;
		dcBRef.current.send(inputB);
		setInputB("");
	};

	const open = readyA === "open" && readyB === "open";

	return (
		<DemoSection
			title="Demo 3: Data Channels (RTCDataChannel)"
			description="Bidirectional messaging between two peers in the same tab. Toggle SCTP reliability to see TCP-like vs UDP-like semantics."
		>
			<div className="space-y-6">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<label
							htmlFor="reliability-mode"
							className="block text-xs text-zinc-400 mb-1"
						>
							Reliability mode
						</label>
						<select
							id="reliability-mode"
							value={reliability}
							onChange={(e) => setReliability(e.target.value as Reliability)}
							className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm focus:outline-none focus:border-cyan-500"
						>
							<option value="reliable-ordered">
								Reliable + ordered (default)
							</option>
							<option value="unreliable-unordered">
								Unreliable + unordered (UDP-like)
							</option>
						</select>
					</div>
					<button
						type="button"
						onClick={connect}
						disabled={connecting}
						className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-zinc-700 rounded text-sm font-medium transition-colors"
					>
						{open ? "Reconnect" : connecting ? "Connecting…" : "Connect"}
					</button>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
					{(["A", "B"] as const).map((peer) => {
						const state = peer === "A" ? readyA : readyB;
						const input = peer === "A" ? inputA : inputB;
						const setInput = peer === "A" ? setInputA : setInputB;
						const send = peer === "A" ? sendFromA : sendFromB;
						const palette =
							peer === "A"
								? {
										container: "border-sky-500/40",
										title: "text-sky-300",
										badge: "bg-sky-500/10 border-sky-500/30 text-sky-200",
										button: "bg-sky-500/30 hover:bg-sky-500/40",
									}
								: {
										container: "border-teal-500/40",
										title: "text-teal-300",
										badge: "bg-teal-500/10 border-teal-500/30 text-teal-200",
										button: "bg-teal-500/30 hover:bg-teal-500/40",
									};
						return (
							<div
								key={peer}
								className={`bg-zinc-900 border ${palette.container} rounded-lg p-4 flex flex-col`}
							>
								<div className="flex items-center justify-between mb-3">
									<h5 className={`text-sm font-semibold ${palette.title}`}>
										Peer {peer}
									</h5>
									<code
										className={`text-[10px] px-2 py-0.5 rounded border ${palette.badge}`}
									>
										readyState: {state}
									</code>
								</div>
								<div className="flex-1 min-h-[140px] bg-zinc-950/60 border border-zinc-800 rounded p-3 mb-3 overflow-y-auto space-y-1">
									<AnimatePresence>
										{messages.map((m) => (
											<motion.div
												key={m.id}
												initial={{ opacity: 0, y: 4 }}
												animate={{ opacity: 1, y: 0 }}
												className={`text-xs flex ${
													m.from === peer ? "justify-end" : "justify-start"
												}`}
											>
												<span
													className={`px-2 py-1 rounded ${
														m.from === peer
															? "bg-zinc-700 text-zinc-200"
															: m.from === "A"
																? "bg-sky-500/20 text-sky-200"
																: "bg-teal-500/20 text-teal-200"
													}`}
												>
													{m.text}
												</span>
											</motion.div>
										))}
									</AnimatePresence>
									{messages.length === 0 && (
										<p className="text-[11px] text-zinc-600 text-center py-6">
											No messages yet
										</p>
									)}
								</div>
								<div className="flex gap-2">
									<input
										type="text"
										value={input}
										onChange={(e) => setInput(e.target.value)}
										onKeyDown={(e) => e.key === "Enter" && send()}
										disabled={state !== "open"}
										placeholder={
											state === "open" ? "Type a message…" : "Channel not open"
										}
										className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-xs focus:outline-none focus:border-cyan-500 disabled:opacity-50"
									/>
									<button
										type="button"
										onClick={send}
										disabled={state !== "open"}
										className={`px-3 py-2 ${palette.button} disabled:bg-zinc-800 disabled:text-zinc-600 rounded text-xs font-medium transition-colors`}
									>
										Send
									</button>
								</div>
							</div>
						);
					})}
				</div>

				<div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 text-xs space-y-2">
					<h5 className="text-zinc-300 font-semibold">
						SCTP reliability modes
					</h5>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-zinc-400">
						<div>
							<p className="text-emerald-300 font-medium mb-1">
								Reliable + ordered (default)
							</p>
							<p>
								Like TCP. Use for chat, file transfer, signaling within the
								channel. <code>{"{ ordered: true }"}</code>
							</p>
						</div>
						<div>
							<p className="text-amber-300 font-medium mb-1">
								Unreliable + unordered
							</p>
							<p>
								Like UDP. Use for real-time game state, cursor positions —
								anything where stale data should be dropped, not retransmitted.{" "}
								<code>{"{ ordered: false, maxRetransmits: 0 }"}</code>
							</p>
						</div>
					</div>
				</div>

				<ShikiCode
					language="javascript"
					code={`// Initiator creates the channel BEFORE createOffer()
const dc = pc.createDataChannel("chat", {
  ordered: true,           // default
  // maxRetransmits: 0,    // unreliable
  // maxPacketLifeTime: 50 // unreliable with time budget (ms)
});

dc.onopen = () => console.log("ready");
dc.onmessage = (e) => console.log("got", e.data);

// Receiver listens for the channel
pc.ondatachannel = ({ channel }) => {
  channel.onmessage = (e) => console.log("got", e.data);
};

// Send any structured-cloneable value (string, ArrayBuffer, Blob)
dc.send("hello");
dc.send(new Uint8Array([1, 2, 3]));`}
					className="text-xs"
				/>
			</div>
		</DemoSection>
	);
}
