import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { HeaderCompressionDemo } from "../components/http-versions/HeaderCompressionDemo";
import { HeadOfLineDemo } from "../components/http-versions/HeadOfLineDemo";
import { HttpSummaryDemo } from "../components/http-versions/HttpSummaryDemo";
import { MultiplexingDemo } from "../components/http-versions/MultiplexingDemo";
import { ServerPushDemo } from "../components/http-versions/ServerPushDemo";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/http-versions")({
	component: HttpVersionsPage,
});

function HttpVersionsPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-8">
			<PageHeader
				topic={{ label: "Network", color: "teal" }}
				title="HTTP/1.1 vs HTTP/2"
				subtitle="How HTTP/2 multiplexing, header compression, and binary framing solve the fundamental performance bottlenecks of HTTP/1.1."
				gradient={{ from: "teal-400", to: "cyan-400" }}
				explanation={{
					content: (
						<div className="space-y-2 text-sm text-zinc-300">
							<p>
								HTTP/1.1's fundamental constraint is{" "}
								<span className="text-teal-300 font-medium">
									head-of-line blocking
								</span>
								: on a single TCP connection, responses must be returned in
								request order. Browsers work around this by opening up to 6
								parallel connections per domain — a fragile hack that wastes
								TCP/TLS handshakes and makes domain sharding (splitting assets
								across subdomains) a common anti-pattern.
							</p>
							<p>
								<span className="text-cyan-300 font-medium">HTTP/2</span>{" "}
								replaces HTTP/1.1's text framing with binary frames and
								multiplexes all requests over a single connection using stream
								IDs. A slow response on stream 3 does not block stream 7. HPACK
								header compression eliminates redundant headers sent on every
								request — particularly impactful for cookie-heavy APIs. The
								result: fewer connections, lower latency, no domain sharding.
							</p>
							<p className="text-zinc-400">
								The demos below cover head-of-line blocking, multiplexing, HPACK
								header compression, server push with Early Hints, and a summary
								protocol comparison.
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
				<HeadOfLineDemo />
				<MultiplexingDemo />
				<HeaderCompressionDemo />
				<ServerPushDemo />
				<HttpSummaryDemo />
			</motion.div>
		</div>
	);
}
