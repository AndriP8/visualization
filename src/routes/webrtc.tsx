import { createFileRoute } from "@tanstack/react-router";
import { DemoSection } from "../components/shared/DemoSection";
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
		<div className="max-w-6xl mx-auto space-y-12 pb-20">
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

			<Glossary />

			<DemoSection
				title="Demo 1: Signaling & SDP Offer/Answer"
				description="Step through the handshake with two real RTCPeerConnections in this tab. Notice that the signaling channel is your responsibility — WebRTC only defines what to exchange."
			>
				<SignalingDemo />
			</DemoSection>

			<DemoSection
				title="Demo 2: ICE Candidates & NAT Traversal"
				description="Watch ICE gather candidate addresses and probe pairs. host candidates come from your network interfaces; srflx from STUN; relay from TURN as a fallback."
			>
				<IceNatDemo />
			</DemoSection>

			<DemoSection
				title="Demo 3: Data Channels (RTCDataChannel)"
				description="Bidirectional messaging between two peers in the same tab. Toggle SCTP reliability to see TCP-like vs UDP-like semantics."
			>
				<DataChannelDemo />
			</DemoSection>

			<DemoSection
				title="Demo 4: Media Tracks vs Data Channels"
				description="When to use a media track vs a data channel. The sender is a canvas (no camera prompt) so you can see both paths side by side."
			>
				<MediaVsDataDemo />
			</DemoSection>

			<DemoSection
				title="Demo 5: Connection Lifecycle & ICE Restart"
				description="iceConnectionState and connectionState transitions, driven by real events. Simulate a drop and trigger ICE restart to see recovery."
			>
				<ConnectionLifecycleDemo />
			</DemoSection>
		</div>
	);
}
