import { DemoSection } from "../shared/DemoSection";

export function HttpSummaryDemo() {
	return (
		<DemoSection
			title="Demo 5: HTTP/1.1 vs HTTP/2 Summary"
			description="Key differences and when HTTP/2's improvements actually matter."
		>
			<div className="space-y-6">
				<div className="overflow-x-auto">
					<table className="w-full text-sm border-collapse">
						<thead>
							<tr className="border-b border-zinc-700">
								<th className="text-left py-3 px-4 text-zinc-400 font-semibold">
									Feature
								</th>
								<th className="text-left py-3 px-4 text-orange-400 font-semibold">
									HTTP/1.1
								</th>
								<th className="text-left py-3 px-4 text-cyan-400 font-semibold">
									HTTP/2
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-zinc-800">
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
									className="hover:bg-zinc-800/30 transition-colors"
								>
									<td className="py-3 px-4 text-zinc-300 font-medium">
										{feature}
									</td>
									<td className="py-3 px-4 text-zinc-400">{h1}</td>
									<td className="py-3 px-4 text-zinc-300">{h2}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20 space-y-2">
						<p className="text-sm font-semibold text-cyan-300">
							HTTP/2 helps most when:
						</p>
						<ul className="text-sm text-zinc-400 space-y-1">
							<li className="flex gap-2">
								<span className="text-cyan-400 shrink-0">•</span> High-latency
								networks (mobile, international)
							</li>
							<li className="flex gap-2">
								<span className="text-cyan-400 shrink-0">•</span> Pages with
								many small files (CSS, JS, images)
							</li>
							<li className="flex gap-2">
								<span className="text-cyan-400 shrink-0">•</span>{" "}
								Cookie/auth-heavy APIs (HPACK shines)
							</li>
							<li className="flex gap-2">
								<span className="text-cyan-400 shrink-0">•</span> Chatty REST
								APIs (many small requests)
							</li>
						</ul>
					</div>
					<div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 space-y-2">
						<p className="text-sm font-semibold text-zinc-300">
							HTTP/2 doesn't help when:
						</p>
						<ul className="text-sm text-zinc-400 space-y-1">
							<li className="flex gap-2">
								<span className="text-zinc-500 shrink-0">•</span> Single large
								resource (video streaming)
							</li>
							<li className="flex gap-2">
								<span className="text-zinc-500 shrink-0">•</span> Low-latency
								local/CDN networks
							</li>
							<li className="flex gap-2">
								<span className="text-zinc-500 shrink-0">•</span> High packet
								loss (TCP HOL still applies)
							</li>
							<li className="flex gap-2">
								<span className="text-zinc-500 shrink-0">•</span>{" "}
								Already-optimized single-request pages
							</li>
						</ul>
					</div>
				</div>
			</div>
		</DemoSection>
	);
}
