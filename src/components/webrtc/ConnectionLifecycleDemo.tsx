import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { match } from "ts-pattern";
import { ShikiCode } from "../shared/ShikiCode";

type IceState = RTCIceConnectionState;

interface LogEntry {
	id: number;
	at: number;
	kind: "ice" | "conn" | "action";
	value: string;
}

const ICE_NODES: { state: IceState; label: string; desc: string }[] = [
	{ state: "new", label: "new", desc: "Agent created, no checks yet" },
	{ state: "checking", label: "checking", desc: "Probing candidate pairs" },
	{ state: "connected", label: "connected", desc: "A pair works" },
	{
		state: "disconnected",
		label: "disconnected",
		desc: "Temporarily lost — may recover on real networks",
	},
	{ state: "failed", label: "failed", desc: "All pairs failed" },
	{ state: "closed", label: "closed", desc: "pc.close() called" },
];

export function ConnectionLifecycleDemo() {
	const [iceState, setIceState] = useState<IceState>("new");
	const [connState, setConnState] = useState<RTCPeerConnectionState>("new");
	const [log, setLog] = useState<LogEntry[]>([]);
	const pcARef = useRef<RTCPeerConnection | null>(null);
	const pcBRef = useRef<RTCPeerConnection | null>(null);
	const idRef = useRef(0);

	const push = useCallback((entry: Omit<LogEntry, "id" | "at">) => {
		setLog((prev) =>
			[...prev, { ...entry, id: idRef.current++, at: Date.now() }].slice(-12),
		);
	}, []);

	const teardown = useCallback(() => {
		pcARef.current?.close();
		pcBRef.current?.close();
		pcARef.current = null;
		pcBRef.current = null;
	}, []);

	useEffect(() => teardown, [teardown]);

	const connect = useCallback(async () => {
		teardown();
		setIceState("new");
		setConnState("new");
		setLog([]);
		push({ kind: "action", value: "connect()" });

		const pcA = new RTCPeerConnection({
			iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
		});
		const pcB = new RTCPeerConnection({
			iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
		});
		pcARef.current = pcA;
		pcBRef.current = pcB;

		pcA.oniceconnectionstatechange = () => {
			setIceState(pcA.iceConnectionState);
			push({ kind: "ice", value: pcA.iceConnectionState });
		};
		pcA.onconnectionstatechange = () => {
			setConnState(pcA.connectionState);
			push({ kind: "conn", value: pcA.connectionState });
		};

		pcA.onicecandidate = (e) =>
			e.candidate && pcB.addIceCandidate(e.candidate).catch(() => undefined);
		pcB.onicecandidate = (e) =>
			e.candidate && pcA.addIceCandidate(e.candidate).catch(() => undefined);

		pcA.createDataChannel("alive");
		const offer = await pcA.createOffer();
		await pcA.setLocalDescription(offer);
		await pcB.setRemoteDescription(offer);
		const answer = await pcB.createAnswer();
		await pcB.setLocalDescription(answer);
		await pcA.setRemoteDescription(answer);
	}, [push, teardown]);

	const closePeerB = useCallback(() => {
		const pcB = pcBRef.current;
		if (!pcB) return;
		push({
			kind: "action",
			value: "pcB.close() — permanent teardown, no recovery",
		});
		pcB.close();
	}, [push]);

	const showRestartFlow = useCallback(async () => {
		const pcA = pcARef.current;
		const pcB = pcBRef.current;
		if (!pcA || !pcB || pcA.connectionState === "closed") {
			push({
				kind: "action",
				value: "showRestartFlow() — click Connect first",
			});
			return;
		}
		push({
			kind: "action",
			value:
				"restartIce() on existing pcA — same channels, new ICE credentials",
		});
		// restartIce() schedules new ufrag/password; next createOffer picks them up.
		pcA.restartIce();
		const offer = await pcA.createOffer();
		await pcA.setLocalDescription(offer);
		await pcB.setRemoteDescription(offer);
		const answer = await pcB.createAnswer();
		await pcB.setLocalDescription(answer);
		await pcA.setRemoteDescription(answer);
		push({
			kind: "action",
			value: "renegotiation done — watch ICE cycle checking → connected",
		});
	}, [push]);

	const close = useCallback(() => {
		push({ kind: "action", value: "pc.close()" });
		teardown();
		setIceState("closed");
		setConnState("closed");
	}, [push, teardown]);

	const stateColor = (state: IceState | RTCPeerConnectionState) =>
		match(state)
			.with("new", () => "border-zinc-600 bg-zinc-800/40 text-zinc-300")
			.with(
				"checking",
				() => "border-amber-500/60 bg-amber-500/10 text-amber-300",
			)
			.with(
				"connecting",
				() => "border-amber-500/60 bg-amber-500/10 text-amber-300",
			)
			.with(
				"connected",
				() => "border-emerald-500/60 bg-emerald-500/10 text-emerald-300",
			)
			.with(
				"completed",
				() => "border-emerald-500/60 bg-emerald-500/10 text-emerald-300",
			)
			.with(
				"disconnected",
				() => "border-amber-500/60 bg-amber-500/10 text-amber-300",
			)
			.with("failed", () => "border-rose-500/60 bg-rose-500/10 text-rose-300")
			.with("closed", () => "border-zinc-700 bg-zinc-900 text-zinc-500")
			.exhaustive();

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex flex-wrap gap-2">
					<button
						type="button"
						onClick={connect}
						className="px-3 py-2 bg-cyan-500 hover:bg-cyan-600 rounded text-xs font-medium transition-colors"
					>
						Connect
					</button>
					<button
						type="button"
						onClick={closePeerB}
						disabled={iceState !== "connected" && iceState !== "completed"}
						className="px-3 py-2 bg-amber-500/30 hover:bg-amber-500/40 disabled:bg-zinc-800 disabled:text-zinc-600 rounded text-xs font-medium transition-colors"
					>
						Close peer B
					</button>
					<button
						type="button"
						onClick={showRestartFlow}
						className="px-3 py-2 bg-violet-500/30 hover:bg-violet-500/40 rounded text-xs font-medium transition-colors"
					>
						Show restart flow
					</button>
					<button
						type="button"
						onClick={close}
						className="px-3 py-2 bg-rose-500/30 hover:bg-rose-500/40 rounded text-xs font-medium transition-colors"
					>
						Close
					</button>
				</div>
				<div className="flex gap-4 text-xs">
					<div>
						<span className="text-zinc-500">iceConnectionState </span>
						<code
							className={`px-2 py-0.5 rounded border ${stateColor(iceState)}`}
						>
							{iceState}
						</code>
					</div>
					<div>
						<span className="text-zinc-500">connectionState </span>
						<code
							className={`px-2 py-0.5 rounded border ${stateColor(connState)}`}
						>
							{connState}
						</code>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
				{ICE_NODES.map((node) => {
					const active = iceState === node.state;
					return (
						<motion.div
							key={node.state}
							animate={{ scale: active ? 1.04 : 1 }}
							className={`rounded-lg border p-3 ${stateColor(node.state)} ${
								active ? "ring-2 ring-cyan-400/50" : "opacity-60"
							}`}
						>
							<p className="text-xs font-semibold font-mono">{node.label}</p>
							<p className="text-[10px] mt-1 opacity-80">{node.desc}</p>
						</motion.div>
					);
				})}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
					<h5 className="text-xs font-semibold text-zinc-300 mb-3">
						Event log (peer A)
					</h5>
					<div className="space-y-1 font-mono text-[11px] max-h-[200px] overflow-y-auto">
						{log.length === 0 && (
							<p className="text-zinc-600 text-center py-4">
								No events yet. Click Connect.
							</p>
						)}
						{log.map((entry) => (
							<div key={entry.id} className="flex gap-3">
								<span className="text-zinc-600 w-16">
									{new Date(entry.at).toLocaleTimeString([], {
										hour12: false,
									})}
								</span>
								<span
									className={
										entry.kind === "action"
											? "text-cyan-300"
											: entry.kind === "ice"
												? "text-amber-300"
												: "text-emerald-300"
									}
								>
									{entry.kind}
								</span>
								<span className="text-zinc-300">{entry.value}</span>
							</div>
						))}
					</div>
				</div>

				<div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 text-xs text-zinc-300 space-y-3">
					<div>
						<p className="text-zinc-200 font-semibold mb-1">
							Why two state machines?
						</p>
						<p className="text-zinc-400">
							<code>iceConnectionState</code> tracks the ICE agent's view of
							connectivity. <code>connectionState</code> aggregates ICE + DTLS;
							it's what app code should react to.
						</p>
					</div>
					<div>
						<p className="text-zinc-200 font-semibold mb-1">
							disconnected ≠ dead (in production)
						</p>
						<p className="text-zinc-400">
							On a real network, brief blips drop you to{" "}
							<code>disconnected</code> and the ICE agent may self-heal within
							seconds. This loopback demo can't show that — closing peer B is
							permanent. Don't tear down your app immediately on{" "}
							<code>disconnected</code>; wait for <code>failed</code> first.
						</p>
					</div>
					<div>
						<p className="text-zinc-200 font-semibold mb-1">ICE restart</p>
						<p className="text-zinc-400">
							When the network actually changes (Wi-Fi → cell, VPN flip), call{" "}
							<code>restartIce()</code> and renegotiate. New ufrag/password,
							fresh candidate gathering, same media/data channels.
						</p>
					</div>
					<div>
						<p className="text-zinc-200 font-semibold mb-1">failed → give up</p>
						<p className="text-zinc-400">
							<code>failed</code> means every candidate pair was exhausted. Show
							an error, optionally retry with a TURN server.
						</p>
					</div>
				</div>
			</div>

			<ShikiCode
				language="javascript"
				code={`pc.oniceconnectionstatechange = async () => {
  switch (pc.iceConnectionState) {
    case "disconnected":
      // brief blip — wait, maybe it heals
      scheduleReconnectTimer(5_000);
      break;
    case "failed":
      // network changed — restartIce() schedules new credentials,
      // then renegotiate normally (no { iceRestart } flag needed)
      pc.restartIce();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      signaling.send({ type: "offer", sdp: offer.sdp });
      break;
    case "closed":
      cleanup();
      break;
  }
};`}
				className="text-xs"
			/>
		</div>
	);
}
