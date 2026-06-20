const ENTRIES = [
	{
		term: "NAT",
		expand: "Network Address Translation",
		accent: "text-zinc-200",
		body: "Your router rewrites many private LAN addresses to one public IP. Inbound packets without a matching outbound flow are dropped — which is exactly why two browsers can't just open a socket to each other.",
	},
	{
		term: "STUN",
		expand: "Session Traversal Utilities for NAT",
		accent: "text-amber-300",
		body: "A tiny stateless server peers ask: “what public IP and port do you see me from?” The answer becomes the srflx (server reflexive) candidate. Cheap to run, no traffic flows through it.",
	},
	{
		term: "TURN",
		expand: "Traversal Using Relays around NAT",
		accent: "text-rose-300",
		body: "A relay server that forwards every packet between peers when direct paths fail — symmetric NATs, strict corporate firewalls. All media/data flows through it, so bandwidth costs come out of your pocket. Used only as fallback.",
	},
	{
		term: "ICE",
		expand: "Interactive Connectivity Establishment",
		accent: "text-cyan-300",
		body: "The algorithm tying it all together: gather every candidate address (host, srflx via STUN, relay via TURN), exchange them via signaling, probe pairs from both ends, and pick the best path that actually works.",
	},
];

export function Glossary() {
	return (
		<div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
			<h3 className="text-sm font-semibold text-zinc-300 mb-1">
				Acronyms, up front
			</h3>
			<p className="text-xs text-zinc-500 mb-4">
				These four terms come up in every demo below.
			</p>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
				{ENTRIES.map((entry) => (
					<div
						key={entry.term}
						className="bg-zinc-950/40 border border-zinc-800 rounded-lg p-4"
					>
						<div className="flex items-baseline gap-2 mb-1">
							<span className={`font-mono text-sm font-bold ${entry.accent}`}>
								{entry.term}
							</span>
							<span className="text-[11px] text-zinc-500">{entry.expand}</span>
						</div>
						<p className="text-xs text-zinc-400 leading-relaxed">
							{entry.body}
						</p>
					</div>
				))}
			</div>
		</div>
	);
}
