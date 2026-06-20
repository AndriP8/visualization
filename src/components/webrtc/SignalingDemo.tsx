import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { match } from "ts-pattern";
import { ShikiCode } from "../shared/ShikiCode";

type Step =
	| "idle"
	| "create-offer"
	| "send-offer"
	| "set-remote-offer"
	| "create-answer"
	| "send-answer"
	| "set-remote-answer"
	| "done";

const STEP_ORDER: Step[] = [
	"create-offer",
	"send-offer",
	"set-remote-offer",
	"create-answer",
	"send-answer",
	"set-remote-answer",
	"done",
];

function summarizeSdp(sdp: string): string {
	const lines = sdp.split("\r\n");
	const kept = lines.filter((line) =>
		/^(v=|o=|s=|t=|m=|a=mid|a=ice-ufrag|a=ice-pwd|a=fingerprint|a=setup|a=group|a=sctp-port)/.test(
			line,
		),
	);
	return kept.slice(0, 14).join("\n");
}

export function SignalingDemo() {
	const [step, setStep] = useState<Step>("idle");
	const [offerSdp, setOfferSdp] = useState<string>("");
	const [answerSdp, setAnswerSdp] = useState<string>("");
	const [showFull, setShowFull] = useState(false);
	const pcARef = useRef<RTCPeerConnection | null>(null);
	const pcBRef = useRef<RTCPeerConnection | null>(null);

	const reset = useCallback(() => {
		pcARef.current?.close();
		pcBRef.current?.close();
		pcARef.current = null;
		pcBRef.current = null;
		setOfferSdp("");
		setAnswerSdp("");
		setStep("idle");
	}, []);

	useEffect(() => reset, [reset]);

	const nextStep = useCallback(async () => {
		const currentIndex = STEP_ORDER.indexOf(step);
		const next = step === "idle" ? STEP_ORDER[0] : STEP_ORDER[currentIndex + 1];
		if (!next) return;

		if (next === "create-offer") {
			const pcA = new RTCPeerConnection();
			const pcB = new RTCPeerConnection();
			pcARef.current = pcA;
			pcBRef.current = pcB;
			pcA.createDataChannel("chat");
			const offer = await pcA.createOffer();
			await pcA.setLocalDescription(offer);
			setOfferSdp(offer.sdp ?? "");
		} else if (next === "set-remote-offer") {
			const pcB = pcBRef.current;
			const pcA = pcARef.current;
			if (pcB && pcA?.localDescription) {
				await pcB.setRemoteDescription(pcA.localDescription);
			}
		} else if (next === "create-answer") {
			const pcB = pcBRef.current;
			if (pcB) {
				const answer = await pcB.createAnswer();
				await pcB.setLocalDescription(answer);
				setAnswerSdp(answer.sdp ?? "");
			}
		} else if (next === "set-remote-answer") {
			const pcA = pcARef.current;
			const pcB = pcBRef.current;
			if (pcA && pcB?.localDescription) {
				await pcA.setRemoteDescription(pcB.localDescription);
			}
		}

		setStep(next);
	}, [step]);

	const peerState = (which: "A" | "B") =>
		match({ step, which })
			.with({ step: "idle" }, () => "—")
			.with({ which: "A", step: "create-offer" }, () => "have-local-offer")
			.with({ which: "A", step: "send-offer" }, () => "have-local-offer")
			.with({ which: "A", step: "set-remote-offer" }, () => "have-local-offer")
			.with({ which: "A", step: "create-answer" }, () => "have-local-offer")
			.with({ which: "A", step: "send-answer" }, () => "have-local-offer")
			.with({ which: "A", step: "set-remote-answer" }, () => "stable")
			.with({ which: "A", step: "done" }, () => "stable")
			.with({ which: "B", step: "create-offer" }, () => "—")
			.with({ which: "B", step: "send-offer" }, () => "—")
			.with({ which: "B", step: "set-remote-offer" }, () => "have-remote-offer")
			.with({ which: "B", step: "create-answer" }, () => "stable")
			.with({ which: "B", step: "send-answer" }, () => "stable")
			.with({ which: "B", step: "set-remote-answer" }, () => "stable")
			.with({ which: "B", step: "done" }, () => "stable")
			.otherwise(() => "—");

	const stepLabel = match(step)
		.with("idle", () => "Click Step to begin")
		.with("create-offer", () => "1. A: createOffer() + setLocalDescription")
		.with("send-offer", () => "2. Signaling: send offer A → B")
		.with("set-remote-offer", () => "3. B: setRemoteDescription(offer)")
		.with("create-answer", () => "4. B: createAnswer() + setLocalDescription")
		.with("send-answer", () => "5. Signaling: send answer B → A")
		.with("set-remote-answer", () => "6. A: setRemoteDescription(answer)")
		.with("done", () => "✓ Negotiation complete — both peers in 'stable'")
		.exhaustive();

	const arrowActive = step === "send-offer" || step === "send-answer";
	const arrowDirection: "A-to-B" | "B-to-A" =
		step === "send-answer" ? "B-to-A" : "A-to-B";

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<p className="text-sm text-zinc-300 font-medium">{stepLabel}</p>
				<div className="flex gap-2">
					<button
						type="button"
						onClick={nextStep}
						disabled={step === "done"}
						className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-zinc-700 disabled:text-zinc-500 rounded text-sm font-medium transition-colors"
					>
						Step →
					</button>
					<button
						type="button"
						onClick={reset}
						className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded text-sm font-medium transition-colors"
					>
						Reset
					</button>
				</div>
			</div>

			<div className="relative">
				<div className="grid grid-cols-2 gap-12">
					<div className="bg-zinc-900 border border-sky-500/40 rounded-lg p-5">
						<div className="flex items-center gap-3 mb-3">
							<div className="w-3 h-3 rounded-full bg-sky-400 animate-pulse" />
							<h4 className="text-base font-semibold text-sky-300">Peer A</h4>
							<span className="ml-auto text-[10px] uppercase tracking-wide text-zinc-500">
								signalingState
							</span>
						</div>
						<code className="block text-xs text-sky-200 bg-sky-500/10 border border-sky-500/30 rounded px-2 py-1 mb-3">
							{peerState("A")}
						</code>
						<p className="text-xs text-zinc-500">
							Initiator. Creates the offer first.
						</p>
					</div>

					<div className="bg-zinc-900 border border-teal-500/40 rounded-lg p-5">
						<div className="flex items-center gap-3 mb-3">
							<div className="w-3 h-3 rounded-full bg-teal-400 animate-pulse" />
							<h4 className="text-base font-semibold text-teal-300">Peer B</h4>
							<span className="ml-auto text-[10px] uppercase tracking-wide text-zinc-500">
								signalingState
							</span>
						</div>
						<code className="block text-xs text-teal-200 bg-teal-500/10 border border-teal-500/30 rounded px-2 py-1 mb-3">
							{peerState("B")}
						</code>
						<p className="text-xs text-zinc-500">
							Receives offer, sends answer back.
						</p>
					</div>
				</div>

				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
					<span className="text-[10px] text-zinc-500 whitespace-nowrap mb-1">
						signaling channel
					</span>
					<span className="text-[10px] text-amber-400/80 whitespace-nowrap">
						(your problem, not WebRTC's)
					</span>
				</div>

				<AnimatePresence>
					{arrowActive && (
						<motion.div
							key={arrowDirection}
							initial={{
								x: arrowDirection === "A-to-B" ? -160 : 160,
								opacity: 0,
							}}
							animate={{
								x: arrowDirection === "A-to-B" ? 160 : -160,
								opacity: 1,
							}}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.8 }}
							className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-8"
						>
							<div className="px-2 py-1 bg-amber-400/20 border border-amber-400/50 rounded text-[10px] text-amber-200 whitespace-nowrap">
								{arrowDirection === "A-to-B" ? "offer →" : "← answer"}
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div>
					<div className="flex items-center justify-between mb-2">
						<h5 className="text-xs font-semibold text-sky-300">
							Offer (A → B)
						</h5>
						<button
							type="button"
							onClick={() => setShowFull((v) => !v)}
							className="text-[10px] text-zinc-500 hover:text-zinc-300"
						>
							{showFull ? "show curated" : "show full"}
						</button>
					</div>
					{offerSdp ? (
						<ShikiCode
							language="yaml"
							code={showFull ? offerSdp : summarizeSdp(offerSdp)}
							showLineNumbers={false}
							className="text-[10px]"
						/>
					) : (
						<div className="text-[10px] text-zinc-600 bg-zinc-900/60 border border-zinc-800 rounded p-4">
							Not yet created.
						</div>
					)}
				</div>
				<div>
					<h5 className="text-xs font-semibold text-teal-300 mb-2">
						Answer (B → A)
					</h5>
					{answerSdp ? (
						<ShikiCode
							language="yaml"
							code={showFull ? answerSdp : summarizeSdp(answerSdp)}
							showLineNumbers={false}
							className="text-[10px]"
						/>
					) : (
						<div className="text-[10px] text-zinc-600 bg-zinc-900/60 border border-zinc-800 rounded p-4">
							Not yet created.
						</div>
					)}
				</div>
			</div>

			<div className="bg-amber-500/5 border border-amber-500/30 rounded-lg p-4 text-xs text-amber-100/90">
				<strong className="text-amber-300">Key insight:</strong> the signaling
				channel is not part of WebRTC. The spec defines what to exchange (SDP,
				ICE), not how. You build it with WebSocket, HTTP long-polling, or even
				QR codes — anything that gets bytes from A to B.
			</div>

			<ShikiCode
				language="javascript"
				code={`// A (initiator)
const pcA = new RTCPeerConnection();
pcA.createDataChannel("chat"); // needed so offer has an m-section

const offer = await pcA.createOffer();
await pcA.setLocalDescription(offer);
signaling.send({ type: "offer", sdp: offer.sdp });

// B (receiver)
signaling.on("offer", async (msg) => {
  const pcB = new RTCPeerConnection();
  await pcB.setRemoteDescription({ type: "offer", sdp: msg.sdp });

  const answer = await pcB.createAnswer();
  await pcB.setLocalDescription(answer);
  signaling.send({ type: "answer", sdp: answer.sdp });
});

// A receives answer
signaling.on("answer", async (msg) => {
  await pcA.setRemoteDescription({ type: "answer", sdp: msg.sdp });
});`}
				className="text-xs"
			/>
		</div>
	);
}
