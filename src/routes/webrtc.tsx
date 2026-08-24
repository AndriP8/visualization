import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { PageHeader } from "../components/shared/PageHeader";
import { ConnectionLifecycleDemo } from "../components/webrtc/ConnectionLifecycleDemo";
import { DataChannelDemo } from "../components/webrtc/DataChannelDemo";
import { Glossary } from "../components/webrtc/Glossary";
import { IceNatDemo } from "../components/webrtc/IceNatDemo";
import { MediaVsDataDemo } from "../components/webrtc/MediaVsDataDemo";
import { SignalingDemo } from "../components/webrtc/SignalingDemo";

export const Route = createFileRoute("/webrtc")({
	component: WebRTCPage,
});

function WebRTCPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-8">
			<PageHeader
				topic={{ label: "Network", color: "teal" }}
				title="WebRTC"
				subtitle="Browsers behind NATs can't directly address each other. WebRTC negotiates a peer-to-peer path through signaling, ICE, and SDP — then streams media or data without going through your server."
				gradient={{ from: "teal-400", to: "cyan-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								Two browsers behind NATs can't simply open a socket to each
								other. There are no public addresses to dial, and firewalls drop
								unsolicited inbound packets. The browsers need an out-of-band
								channel just to exchange the information required to start
								talking — that channel is{" "}
								<span className="text-amber-300 font-medium">your problem</span>
								, not WebRTC's.
							</p>
							<p>
								WebRTC defines the negotiation. A{" "}
								<span className="text-sky-300 font-medium">signaling</span>{" "}
								channel (WebSocket, HTTP — anything you build) carries{" "}
								<span className="text-cyan-300 font-medium">SDP</span> offers
								and answers. The{" "}
								<span className="text-cyan-300 font-medium">ICE</span> agent
								gathers candidate addresses (host, STUN-reflexive, TURN-relay)
								and probes pairs until one works. Once connected, media flows
								over <span className="text-teal-300 font-medium">SRTP</span> and
								data over{" "}
								<span className="text-teal-300 font-medium">SCTP/DTLS</span> —
								directly between peers when possible.
							</p>
							<p className="text-zinc-400">
								The demos below cover the offer/answer handshake, ICE candidate
								gathering and NAT traversal, data channels with reliability
								modes, media tracks vs data channels, and how to react to
								connection lifecycle events including ICE restart.
							</p>
						</div>
					),
				}}
			/>

			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.2, duration: 0.4 }}
				className="space-y-8"
			>
				<Glossary />
				<SignalingDemo />
				<IceNatDemo />
				<DataChannelDemo />
				<MediaVsDataDemo />
				<ConnectionLifecycleDemo />
			</motion.div>
		</div>
	);
}
