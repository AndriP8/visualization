import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { match } from "ts-pattern";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

type CandidateType = "host" | "srflx" | "prflx" | "relay" | "unknown";

interface GatheredCandidate {
	id: number;
	peer: "A" | "B";
	type: CandidateType;
	protocol: string;
	addressMasked: string;
	priority: number;
}

interface SelectedPair {
	local: string;
	remote: string;
	localType: CandidateType;
	remoteType: CandidateType;
}

function parseType(candidate: string): CandidateType {
	const m = candidate.match(/typ (host|srflx|prflx|relay)/);
	return m ? (m[1] as CandidateType) : "unknown";
}

function maskAddress(candidate: string): string {
	const parts = candidate.split(" ");
	const ip = parts[4] ?? "?";
	const port = parts[5] ?? "?";
	return `${ip}:${port}`;
}

const TYPE_COLORS: Record<
	CandidateType,
	{ bg: string; border: string; text: string }
> = {
	host: {
		bg: "bg-emerald-500/10",
		border: "border-emerald-500/40",
		text: "text-emerald-300",
	},
	srflx: {
		bg: "bg-amber-500/10",
		border: "border-amber-500/40",
		text: "text-amber-300",
	},
	prflx: {
		bg: "bg-violet-500/10",
		border: "border-violet-500/40",
		text: "text-violet-300",
	},
	relay: {
		bg: "bg-rose-500/10",
		border: "border-rose-500/40",
		text: "text-rose-300",
	},
	unknown: {
		bg: "bg-zinc-500/10",
		border: "border-zinc-500/40",
		text: "text-zinc-300",
	},
};

const TYPE_DESCRIPTION: Record<CandidateType, string> = {
	host: "Local interface (LAN IP)",
	srflx: "Server reflexive (public IP via STUN)",
	prflx: "Peer reflexive (discovered during checks)",
	relay: "Through TURN server (last resort)",
	unknown: "Unknown",
};

export function IceNatDemo() {
	const [candidates, setCandidates] = useState<GatheredCandidate[]>([]);
	const [selected, setSelected] = useState<SelectedPair | null>(null);
	const [running, setRunning] = useState(false);
	const idRef = useRef(0);
	const pcARef = useRef<RTCPeerConnection | null>(null);
	const pcBRef = useRef<RTCPeerConnection | null>(null);

	const cleanup = useCallback(() => {
		pcARef.current?.close();
		pcBRef.current?.close();
		pcARef.current = null;
		pcBRef.current = null;
	}, []);

	useEffect(() => cleanup, [cleanup]);

	const start = useCallback(async () => {
		cleanup();
		setCandidates([]);
		setSelected(null);
		setRunning(true);

		const config: RTCConfiguration = {
			iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
		};
		const pcA = new RTCPeerConnection(config);
		const pcB = new RTCPeerConnection(config);
		pcARef.current = pcA;
		pcBRef.current = pcB;

		const pendingA: RTCIceCandidate[] = [];
		const pendingB: RTCIceCandidate[] = [];

		pcA.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
			const c = event.candidate;
			if (!c?.candidate) return;
			const id = idRef.current++;
			setCandidates((prev) => [
				...prev,
				{
					id,
					peer: "A",
					type: parseType(c.candidate),
					protocol: c.protocol ?? "udp",
					addressMasked: maskAddress(c.candidate),
					priority: c.priority ?? 0,
				},
			]);
			if (pcB.remoteDescription) {
				pcB.addIceCandidate(c).catch(() => undefined);
			} else {
				pendingB.push(c);
			}
		};

		pcB.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
			const c = event.candidate;
			if (!c?.candidate) return;
			const id = idRef.current++;
			setCandidates((prev) => [
				...prev,
				{
					id,
					peer: "B",
					type: parseType(c.candidate),
					protocol: c.protocol ?? "udp",
					addressMasked: maskAddress(c.candidate),
					priority: c.priority ?? 0,
				},
			]);
			if (pcA.remoteDescription) {
				pcA.addIceCandidate(c).catch(() => undefined);
			} else {
				pendingA.push(c);
			}
		};

		pcA.createDataChannel("probe");
		const offer = await pcA.createOffer();
		await pcA.setLocalDescription(offer);
		await pcB.setRemoteDescription(offer);
		for (const cand of pendingB) {
			await pcB.addIceCandidate(cand).catch(() => undefined);
		}
		pendingB.length = 0;

		const answer = await pcB.createAnswer();
		await pcB.setLocalDescription(answer);
		await pcA.setRemoteDescription(answer);
		for (const cand of pendingA) {
			await pcA.addIceCandidate(cand).catch(() => undefined);
		}
		pendingA.length = 0;

		const checkState = async () => {
			if (
				pcA.connectionState === "connected" ||
				pcA.iceConnectionState === "connected" ||
				pcA.iceConnectionState === "completed"
			) {
				const stats = await pcA.getStats();
				let pair: { local?: string; remote?: string } = {};
				stats.forEach((report) => {
					if (
						report.type === "candidate-pair" &&
						((report as RTCIceCandidatePairStats).nominated ||
							(report as RTCIceCandidatePairStats).selected) &&
						(report as RTCIceCandidatePairStats).state === "succeeded"
					) {
						pair = {
							local: (report as RTCIceCandidatePairStats).localCandidateId,
							remote: (report as RTCIceCandidatePairStats).remoteCandidateId,
						};
					}
				});
				let localCand: RTCIceCandidateStats | undefined;
				let remoteCand: RTCIceCandidateStats | undefined;
				stats.forEach((report) => {
					if (report.id === pair.local)
						localCand = report as RTCIceCandidateStats;
					if (report.id === pair.remote)
						remoteCand = report as RTCIceCandidateStats;
				});
				if (localCand && remoteCand) {
					setSelected({
						local: `${localCand.address ?? localCand.ip ?? "?"}:${localCand.port}`,
						remote: `${remoteCand.address ?? remoteCand.ip ?? "?"}:${remoteCand.port}`,
						localType: (localCand.candidateType as CandidateType) ?? "unknown",
						remoteType: (remoteCand.candidateType as CandidateType) ?? "unknown",
					});
				}
				setRunning(false);
			} else if (
				pcA.connectionState === "failed" ||
				pcA.iceConnectionState === "failed"
			) {
				setRunning(false);
			}
		};

		pcA.addEventListener("connectionstatechange", checkState);
		pcA.addEventListener("iceconnectionstatechange", checkState);
		checkState();
	}, [cleanup]);

	const candidatesByPeer = (peer: "A" | "B") =>
		candidates.filter((c) => c.peer === peer);

	const gatheringLabel = match({ running, count: candidates.length })
		.with({ running: true, count: 0 }, () => "Starting ICE agents…")
		.with({ running: true }, () => "Gathering candidates…")
		.with({ count: 0 }, () => "Click Start to gather ICE candidates")
		.otherwise(() => "Gathering complete");

	return (
		<DemoSection
			title="Demo 2: ICE Candidates & NAT Traversal"
			description="Watch ICE gather candidate addresses and probe pairs. host candidates come from your network interfaces; srflx from STUN; relay from TURN as a fallback."
		>
			<div className="space-y-6">
				<div className="flex items-center justify-between gap-3">
					<p className="text-sm text-zinc-300 font-medium">{gatheringLabel}</p>
					<button
						type="button"
						onClick={start}
						disabled={running}
						className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-zinc-700 disabled:text-zinc-500 rounded text-sm font-medium transition-colors"
					>
						{running ? "Gathering…" : "Start ICE"}
					</button>
				</div>

				<div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-5">
					<div className="grid grid-cols-5 items-center gap-3 text-[11px] text-zinc-400">
						<div className="text-center">
							<div className="mx-auto w-12 h-12 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-300">
								A
							</div>
							<p className="mt-1">Peer A</p>
						</div>
						<div className="text-center">
							<div className="mx-auto w-12 h-12 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center">
								NAT
							</div>
							<p className="mt-1 text-zinc-500">Home router</p>
						</div>
						<div className="text-center">
							<div className="mx-auto w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
								STUN
							</div>
							<p className="mt-1 text-amber-300/70">"What's my public IP?"</p>
							<div className="mx-auto mt-3 w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-300">
								TURN
							</div>
							<p className="mt-1 text-rose-300/70">Relay (fallback)</p>
						</div>
						<div className="text-center">
							<div className="mx-auto w-12 h-12 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center">
								NAT
							</div>
							<p className="mt-1 text-zinc-500">Other router</p>
						</div>
						<div className="text-center">
							<div className="mx-auto w-12 h-12 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300">
								B
							</div>
							<p className="mt-1">Peer B</p>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
					{(["A", "B"] as const).map((peer) => (
						<div
							key={peer}
							className="bg-zinc-900 border border-zinc-800 rounded-lg p-4"
						>
							<h5 className="text-xs font-semibold text-zinc-300 mb-3">
								Peer {peer} candidates
							</h5>
							<div className="space-y-2 min-h-[120px]">
								<AnimatePresence>
									{candidatesByPeer(peer).map((c) => {
										const colors = TYPE_COLORS[c.type];
										return (
											<motion.div
												key={c.id}
												initial={{ opacity: 0, x: -10 }}
												animate={{ opacity: 1, x: 0 }}
												className={`px-3 py-2 rounded border ${colors.bg} ${colors.border} flex items-center justify-between text-xs`}
											>
												<div className="flex items-center gap-2">
													<span
														className={`font-mono font-semibold ${colors.text}`}
													>
														{c.type}
													</span>
													<span className="text-zinc-400">{c.protocol}</span>
													<span className="text-zinc-500 font-mono">
														{c.addressMasked}
													</span>
												</div>
												<span className="text-[10px] text-zinc-500">
													prio {c.priority}
												</span>
											</motion.div>
										);
									})}
								</AnimatePresence>
								{candidatesByPeer(peer).length === 0 && (
									<p className="text-[11px] text-zinc-600 py-6 text-center">
										No candidates yet
									</p>
								)}
							</div>
						</div>
					))}
				</div>

				{selected && (
					<div className="bg-emerald-500/5 border border-emerald-500/30 rounded-lg p-4">
						<h5 className="text-xs font-semibold text-emerald-300 mb-2">
							Selected pair (winner)
						</h5>
						<div className="grid grid-cols-2 gap-4 text-xs font-mono">
							<div>
								<span className="text-emerald-400">local </span>
								<span className="text-zinc-300">
									{selected.local} ({selected.localType})
								</span>
							</div>
							<div>
								<span className="text-emerald-400">remote </span>
								<span className="text-zinc-300">
									{selected.remote} ({selected.remoteType})
								</span>
							</div>
						</div>
					</div>
				)}

				<div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 space-y-3">
					<h5 className="text-xs font-semibold text-zinc-300">
						Candidate types
					</h5>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
						{(["host", "srflx", "relay"] as const).map((t) => {
							const colors = TYPE_COLORS[t];
							return (
								<div
									key={t}
									className={`px-3 py-2 rounded border ${colors.bg} ${colors.border}`}
								>
									<span className={`font-mono font-semibold ${colors.text}`}>
										{t}
									</span>
									<span className="text-zinc-400 ml-2">
										{TYPE_DESCRIPTION[t]}
									</span>
								</div>
							);
						})}
					</div>
					<p className="text-[11px] text-amber-300/80 pt-1">
						Note: in this loopback demo both peers run in your browser, so all
						real candidates are <code>host</code>. In production you'd see{" "}
						<code>srflx</code> (your public IP from STUN) and, when symmetric
						NATs block direct connection, <code>relay</code> (forwarded through
						TURN — bandwidth comes out of your pocket).
					</p>
				</div>

				<ShikiCode
					language="javascript"
					code={`const pc = new RTCPeerConnection({
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    // TURN only when needed — it costs bandwidth
    {
      urls: "turn:turn.example.com:3478",
      username: "...",
      credential: "..."
    }
  ]
});

pc.onicecandidate = ({ candidate }) => {
  if (!candidate) return; // null = gathering done
  // candidate.candidate is the SDP line:
  // "candidate:1 1 udp 2113937151 192.168.1.5 51234 typ host"
  signaling.send({ type: "ice", candidate });
};

// Other peer adds them as they arrive (trickle ICE)
signaling.on("ice", ({ candidate }) => {
  pc.addIceCandidate(candidate);
});`}
					className="text-xs"
				/>
			</div>
		</DemoSection>
	);
}
