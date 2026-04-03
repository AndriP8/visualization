import { createFileRoute } from "@tanstack/react-router";
import { HeaderCompressionDemo } from "../components/http-versions/HeaderCompressionDemo";
import { HeadOfLineDemo } from "../components/http-versions/HeadOfLineDemo";
import { MultiplexingDemo } from "../components/http-versions/MultiplexingDemo";
import { ServerPushDemo } from "../components/http-versions/ServerPushDemo";
import { DemoSection } from "../components/shared/DemoSection";
import { PageHeader } from "../components/shared/PageHeader";

export const Route = createFileRoute("/http-versions")({
	component: HttpVersionsPage,
});

function HttpVersionsPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-12 pb-20">
			<PageHeader
				topic={{ label: "Network", color: "blue" }}
				title="HTTP/1.1 vs HTTP/2"
				subtitle="How HTTP/2 multiplexing, header compression, and binary framing solve the fundamental performance bottlenecks of HTTP/1.1."
				gradient={{ from: "blue-400", via: "cyan-400", to: "teal-400" }}
			/>

			<div className="space-y-16">
				<DemoSection
					title="1. Head-of-Line Blocking (HTTP/1.1)"
					description="On a single TCP connection, HTTP/1.1 must process responses in order. A slow resource blocks everything queued behind it. Browsers work around this by opening up to 6 parallel connections per domain — a hack that HTTP/2 makes obsolete."
				>
					<HeadOfLineDemo />
				</DemoSection>

				<DemoSection
					title="2. Multiplexing (HTTP/2)"
					description="HTTP/2 sends all requests over a single TCP connection as interleaved binary frames. Each request gets its own stream — a slow CSS file has zero impact on image downloads happening in parallel."
				>
					<MultiplexingDemo />
				</DemoSection>

				<DemoSection
					title="3. Header Compression (HPACK)"
					description="HTTP/1.1 resends all headers verbatim on every request. HTTP/2 uses HPACK — a static table of common headers plus a dynamic table built per-connection. Subsequent requests send only integer indexes instead of full strings."
				>
					<HeaderCompressionDemo />
				</DemoSection>

				<DemoSection
					title="4. Server Push & Early Hints"
					description="Traditional loading requires 3+ round trips as the client discovers sub-resources. HTTP/2 Server Push and the modern 103 Early Hints response both let the server hint at resources before the client discovers them."
				>
					<ServerPushDemo />
				</DemoSection>

				{/* Comparison table */}
				<DemoSection
					title="Summary: HTTP/1.1 vs HTTP/2"
					description="Key differences and when HTTP/2's improvements actually matter."
				>
					<div className="space-y-6">
						<div className="overflow-x-auto">
							<table className="w-full text-sm border-collapse">
								<thead>
									<tr className="border-b border-border-secondary">
										<th className="text-left py-3 px-4 text-text-tertiary font-semibold">
											Feature
										</th>
										<th className="text-left py-3 px-4 text-accent-orange-soft font-semibold">
											HTTP/1.1
										</th>
										<th className="text-left py-3 px-4 text-accent-cyan-soft font-semibold">
											HTTP/2
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-border-primary">
									{[
										["Connections per domain", "6 parallel", "1 (multiplexed)"],
										[
											"HOL blocking",
											"Yes — per connection",
											"No — stream isolation",
										],
										["Header compression", "None", "HPACK (50-90% savings)"],
										["Protocol format", "Text-based", "Binary frames"],
										["Server Push", "No", "Yes (deprecated in Chrome)"],
										["TLS required", "Optional", "Required in practice"],
										["Browser support", "100%", "~99% (IE11 is EOL)"],
									].map(([feature, h1, h2]) => (
										<tr
											key={feature}
											className="hover:bg-surface-secondary/30 transition-colors"
										>
											<td className="py-3 px-4 text-text-secondary font-medium">
												{feature}
											</td>
											<td className="py-3 px-4 text-text-tertiary">{h1}</td>
											<td className="py-3 px-4 text-text-secondary">{h2}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20 space-y-2">
								<p className="text-sm font-semibold text-accent-cyan">
									HTTP/2 helps most when:
								</p>
								<ul className="text-sm text-text-tertiary space-y-1">
									<li className="flex gap-2">
										<span className="text-accent-cyan-soft shrink-0">•</span>{" "}
										High-latency networks (mobile, international)
									</li>
									<li className="flex gap-2">
										<span className="text-accent-cyan-soft shrink-0">•</span>{" "}
										Pages with many small files (CSS, JS, images)
									</li>
									<li className="flex gap-2">
										<span className="text-accent-cyan-soft shrink-0">•</span>{" "}
										Cookie/auth-heavy APIs (HPACK shines)
									</li>
									<li className="flex gap-2">
										<span className="text-accent-cyan-soft shrink-0">•</span>{" "}
										Chatty REST APIs (many small requests)
									</li>
								</ul>
							</div>
							<div className="p-4 rounded-xl bg-surface-secondary/50 border border-border-secondary space-y-2">
								<p className="text-sm font-semibold text-text-secondary">
									HTTP/2 doesn't help when:
								</p>
								<ul className="text-sm text-text-tertiary space-y-1">
									<li className="flex gap-2">
										<span className="text-text-muted shrink-0">•</span> Single
										large resource (video streaming)
									</li>
									<li className="flex gap-2">
										<span className="text-text-muted shrink-0">•</span>{" "}
										Low-latency local/CDN networks
									</li>
									<li className="flex gap-2">
										<span className="text-text-muted shrink-0">•</span> High
										packet loss (TCP HOL still applies)
									</li>
									<li className="flex gap-2">
										<span className="text-text-muted shrink-0">•</span>{" "}
										Already-optimized single-request pages
									</li>
								</ul>
							</div>
						</div>
					</div>
				</DemoSection>
			</div>
		</div>
	);
}
