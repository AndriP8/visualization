import { useCallback, useEffect, useRef, useState } from "react";
import { match } from "ts-pattern";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

type Mode = "media" | "data";

export function MediaVsDataDemo() {
	const [mode, setMode] = useState<Mode>("media");
	const [running, setRunning] = useState(false);
	const [stats, setStats] = useState<{ bytes: number; rate: number }>({
		bytes: 0,
		rate: 0,
	});
	const senderCanvasRef = useRef<HTMLCanvasElement | null>(null);
	const receiverVideoRef = useRef<HTMLVideoElement | null>(null);
	const receiverCanvasRef = useRef<HTMLCanvasElement | null>(null);
	const pcARef = useRef<RTCPeerConnection | null>(null);
	const pcBRef = useRef<RTCPeerConnection | null>(null);
	const dcARef = useRef<RTCDataChannel | null>(null);
	const rafRef = useRef<number | null>(null);
	const sampleRafRef = useRef<number | null>(null);
	const animationRef = useRef<number | null>(null);
	const bytesRef = useRef(0);
	const lastSampleRef = useRef(performance.now());

	const teardown = useCallback(() => {
		if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
		if (sampleRafRef.current !== null)
			cancelAnimationFrame(sampleRafRef.current);
		if (animationRef.current !== null)
			cancelAnimationFrame(animationRef.current);
		dcARef.current?.close();
		pcARef.current?.close();
		pcBRef.current?.close();
		dcARef.current = null;
		pcARef.current = null;
		pcBRef.current = null;
		setStats({ bytes: 0, rate: 0 });
		bytesRef.current = 0;
	}, []);

	useEffect(() => teardown, [teardown]);

	const drawSenderFrame = useCallback(() => {
		const canvas = senderCanvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		const t = performance.now() / 1000;
		ctx.fillStyle = "#0c0a09";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		for (let i = 0; i < 6; i++) {
			const phase = t + i * 0.4;
			const x = canvas.width / 2 + Math.cos(phase) * 80;
			const y = canvas.height / 2 + Math.sin(phase * 1.3) * 40;
			ctx.fillStyle = `hsl(${(i * 50 + t * 80) % 360}, 70%, 60%)`;
			ctx.beginPath();
			ctx.arc(x, y, 14, 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.fillStyle = "#e4e4e7";
		ctx.font = "12px monospace";
		ctx.fillText(`t=${t.toFixed(1)}s`, 8, 16);
		animationRef.current = requestAnimationFrame(drawSenderFrame);
	}, []);

	const drawDataFrame = useCallback((bitmap: ImageBitmap) => {
		const canvas = receiverCanvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
		bitmap.close();
	}, []);

	const start = useCallback(async () => {
		teardown();
		setRunning(true);
		await new Promise((r) => setTimeout(r, 0));

		drawSenderFrame();

		const pcA = new RTCPeerConnection();
		const pcB = new RTCPeerConnection();
		pcARef.current = pcA;
		pcBRef.current = pcB;
		pcA.onicecandidate = (e) =>
			e.candidate && pcB.addIceCandidate(e.candidate).catch(() => undefined);
		pcB.onicecandidate = (e) =>
			e.candidate && pcA.addIceCandidate(e.candidate).catch(() => undefined);

		if (mode === "media") {
			const senderCanvas = senderCanvasRef.current;
			if (!senderCanvas) return;
			const stream = senderCanvas.captureStream(30);
			for (const track of stream.getVideoTracks()) {
				pcA.addTrack(track, stream);
			}
			pcB.ontrack = (event) => {
				const video = receiverVideoRef.current;
				if (video) video.srcObject = event.streams[0];
			};
		} else {
			const dc = pcA.createDataChannel("frames", { ordered: true });
			dcARef.current = dc;
			pcB.ondatachannel = (event) => {
				const channel = event.channel;
				channel.binaryType = "arraybuffer";
				channel.onmessage = async (e: MessageEvent<ArrayBuffer>) => {
					try {
						const blob = new Blob([e.data], { type: "image/jpeg" });
						const bitmap = await createImageBitmap(blob);
						drawDataFrame(bitmap);
					} catch {
						/* ignore decode errors */
					}
				};
			};
			dc.onopen = () => {
				const sendLoop = async () => {
					if (dc.readyState !== "open") return;
					const senderCanvas = senderCanvasRef.current;
					if (senderCanvas) {
						const blob: Blob | null = await new Promise((resolve) =>
							senderCanvas.toBlob(resolve, "image/jpeg", 0.6),
						);
						if (blob && dc.readyState === "open") {
							const buf = await blob.arrayBuffer();
							dc.send(buf);
							bytesRef.current += buf.byteLength;
						}
					}
					rafRef.current = requestAnimationFrame(sendLoop);
				};
				sendLoop();
			};
		}

		const offer = await pcA.createOffer();
		await pcA.setLocalDescription(offer);
		await pcB.setRemoteDescription(offer);
		const answer = await pcB.createAnswer();
		await pcB.setLocalDescription(answer);
		await pcA.setRemoteDescription(answer);

		lastSampleRef.current = performance.now();
		const sampleRate = () => {
			const now = performance.now();
			const elapsed = (now - lastSampleRef.current) / 1000;
			if (elapsed >= 1) {
				const bytes = bytesRef.current;
				setStats({ bytes, rate: bytes / elapsed });
				bytesRef.current = 0;
				lastSampleRef.current = now;
			}
			if (pcARef.current)
				sampleRafRef.current = requestAnimationFrame(sampleRate);
		};
		sampleRate();
	}, [drawDataFrame, drawSenderFrame, mode, teardown]);

	const stop = useCallback(() => {
		teardown();
		setRunning(false);
	}, [teardown]);

	const helperLabel = match(mode)
		.with("media", () => "Media track via SRTP — encoder is the browser's job")
		.with(
			"data",
			() => "Manual JPEG frames over SCTP — every byte is your problem",
		)
		.exhaustive();

	return (
		<DemoSection
			title="Demo 4: Media Tracks vs Data Channels"
			description="When to use a media track vs a data channel. The sender is a canvas (no camera prompt) so you can see both paths side by side."
		>
			<div className="space-y-6">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex gap-2">
						{(["media", "data"] as const).map((m) => (
							<button
								key={m}
								type="button"
								onClick={() => {
									if (running) stop();
									setMode(m);
								}}
								className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
									mode === m
										? "bg-cyan-500 text-white"
										: "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
								}`}
							>
								{m === "media" ? "Media track" : "Data channel (JPEG)"}
							</button>
						))}
					</div>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={running ? stop : start}
							className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded text-sm font-medium transition-colors"
						>
							{running ? "Stop" : "Start"}
						</button>
					</div>
				</div>

				<p className="text-xs text-zinc-500">{helperLabel}</p>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
					<div className="bg-zinc-900 border border-sky-500/40 rounded-lg p-4">
						<h5 className="text-xs font-semibold text-sky-300 mb-3">
							Sender (canvas)
						</h5>
						<canvas
							ref={senderCanvasRef}
							width={320}
							height={180}
							className="w-full rounded border border-zinc-800 bg-zinc-950"
						/>
					</div>
					<div className="bg-zinc-900 border border-teal-500/40 rounded-lg p-4">
						<h5 className="text-xs font-semibold text-teal-300 mb-3">
							Receiver
						</h5>
						{mode === "media" ? (
							<video
								ref={receiverVideoRef}
								autoPlay
								playsInline
								muted
								className="w-full rounded border border-zinc-800 bg-zinc-950 aspect-video"
							/>
						) : (
							<canvas
								ref={receiverCanvasRef}
								width={320}
								height={180}
								className="w-full rounded border border-zinc-800 bg-zinc-950"
							/>
						)}
					</div>
				</div>

				<div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 grid grid-cols-2 gap-4 text-xs">
					<div>
						<p className="text-zinc-500">Last 1s bytes sent</p>
						<p className="text-zinc-200 font-mono">
							{(stats.rate / 1024).toFixed(1)} KB/s
						</p>
					</div>
					<div>
						<p className="text-zinc-500">Total this window</p>
						<p className="text-zinc-200 font-mono">
							{(stats.bytes / 1024).toFixed(1)} KB
						</p>
					</div>
				</div>

				<div className="overflow-x-auto">
					<table className="min-w-full text-xs">
						<thead>
							<tr className="text-zinc-500 border-b border-zinc-800">
								<th className="text-left py-2 pr-4">&nbsp;</th>
								<th className="text-left py-2 pr-4">Media (track)</th>
								<th className="text-left py-2">Data channel</th>
							</tr>
						</thead>
						<tbody className="text-zinc-300">
							{[
								{
									k: "Transport",
									a: "SRTP over UDP (DTLS keys)",
									b: "SCTP over DTLS over UDP",
								},
								{
									k: "Reliability",
									a: "Unreliable by design (drop late frames)",
									b: "Configurable: reliable or unreliable",
								},
								{
									k: "Ordering",
									a: "Unordered + jitter buffer",
									b: "Configurable",
								},
								{
									k: "Codec",
									a: "Browser-managed (VP8/VP9/H.264/Opus)",
									b: "None — you encode",
								},
								{
									k: "Congestion control",
									a: "GCC (Google congestion control)",
									b: "SCTP's own",
								},
								{
									k: "Use for",
									a: "Audio/video/screenshare",
									b: "Chat, files, game state, signaling-in-band",
								},
							].map((row) => (
								<tr key={row.k} className="border-b border-zinc-900">
									<td className="py-2 pr-4 text-zinc-500">{row.k}</td>
									<td className="py-2 pr-4">{row.a}</td>
									<td className="py-2">{row.b}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				<div className="bg-amber-500/5 border border-amber-500/30 rounded-lg p-4 text-xs text-amber-100/90">
					<strong className="text-amber-300">Rule of thumb:</strong> if it's
					audio/video, use a media track — the browser handles encoding, jitter,
					and adaptive bitrate. Use a data channel for anything else. Sending
					video as JPEGs over a data channel (like this demo's right mode)
					wastes bandwidth and loses adaptive bitrate.
				</div>

				<ShikiCode
					language="javascript"
					code={`// Media: let the browser handle codec + congestion control
const stream = await navigator.mediaDevices.getUserMedia({ video: true });
for (const track of stream.getTracks()) {
  pc.addTrack(track, stream);
}
pc.ontrack = ({ streams }) => {
  videoEl.srcObject = streams[0];
};

// Data: arbitrary bytes, you're on the hook for serialization
const dc = pc.createDataChannel("game");
dc.binaryType = "arraybuffer";
dc.send(new Uint8Array([0x42]));`}
					className="text-xs"
				/>
			</div>
		</DemoSection>
	);
}
