import { motion } from "motion/react";
import { useState } from "react";
import { ShikiCode } from "../shared/ShikiCode";

interface HeaderField {
	id: string;
	name: string;
	value: string;
	bytes: number;
	enabled: boolean;
	compressedBytes: number; // after HPACK on subsequent requests
}

const DEFAULT_HEADERS: HeaderField[] = [
	{
		id: "method",
		name: ":method",
		value: "GET",
		bytes: 12,
		enabled: true,
		compressedBytes: 1,
	},
	{
		id: "host",
		name: ":authority",
		value: "example.com",
		bytes: 28,
		enabled: true,
		compressedBytes: 1,
	},
	{
		id: "scheme",
		name: ":scheme",
		value: "https",
		bytes: 14,
		enabled: true,
		compressedBytes: 1,
	},
	{
		id: "accept",
		name: "accept",
		value: "application/json",
		bytes: 32,
		enabled: true,
		compressedBytes: 1,
	},
	{
		id: "useragent",
		name: "user-agent",
		value: "Mozilla/5.0 (Chrome/120)",
		bytes: 48,
		enabled: true,
		compressedBytes: 1,
	},
	{
		id: "cookie",
		name: "cookie",
		value: "session=abc123xyz; _ga=GA1.2...",
		bytes: 180,
		enabled: true,
		compressedBytes: 4,
	},
	{
		id: "auth",
		name: "authorization",
		value: "Bearer eyJ0eXAiOiJKV1Qi...",
		bytes: 320,
		enabled: false,
		compressedBytes: 4,
	},
	{
		id: "accept-enc",
		name: "accept-encoding",
		value: "gzip, deflate, br",
		bytes: 36,
		enabled: true,
		compressedBytes: 1,
	},
	{
		id: "accept-lang",
		name: "accept-language",
		value: "en-US,en;q=0.9",
		bytes: 36,
		enabled: false,
		compressedBytes: 1,
	},
];

const REQUEST_COUNT = 10;

export function HeaderCompressionDemo() {
	const [headers, setHeaders] = useState<HeaderField[]>(DEFAULT_HEADERS);
	const [showRequests, setShowRequests] = useState(false);

	const toggleHeader = (id: string) => {
		setHeaders((prev) =>
			prev.map((h) => (h.id === id ? { ...h, enabled: !h.enabled } : h)),
		);
	};

	const enabledHeaders = headers.filter((h) => h.enabled);
	const firstRequestBytes = enabledHeaders.reduce((sum, h) => sum + h.bytes, 0);
	const subsequentBytes = enabledHeaders.reduce(
		(sum, h) => sum + h.compressedBytes,
		0,
	);
	const http1Total = firstRequestBytes * REQUEST_COUNT;
	const http2Total = firstRequestBytes + subsequentBytes * (REQUEST_COUNT - 1);
	const savedBytes = http1Total - http2Total;
	const savingsPct =
		http1Total > 0 ? Math.round((savedBytes / http1Total) * 100) : 0;

	const maxBarBytes = firstRequestBytes;

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Left: Header toggles */}
				<div className="space-y-3">
					<div className="rounded-xl bg-zinc-900 border border-zinc-700 p-4 space-y-3">
						<div className="flex items-center justify-between">
							<span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
								Request Headers
							</span>
							<span className="text-xs text-zinc-500">
								toggle to include/exclude
							</span>
						</div>

						<div className="space-y-1.5">
							{headers.map((h) => (
								<button
									key={h.id}
									type="button"
									onClick={() => toggleHeader(h.id)}
									className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-all ${
										h.enabled
											? "bg-zinc-800 border-zinc-600 text-zinc-200"
											: "bg-zinc-900 border-zinc-800 text-zinc-600"
									}`}
								>
									<div className="flex items-center justify-between gap-2">
										<span
											className={`font-mono ${h.enabled ? "text-cyan-400" : "text-zinc-600"}`}
										>
											{h.name}
										</span>
										<div className="flex items-center gap-2 shrink-0">
											<span className="text-zinc-500">{h.bytes}B</span>
											<div
												className={`w-3 h-3 rounded-full border ${
													h.enabled
														? "bg-cyan-400 border-cyan-400"
														: "bg-transparent border-zinc-600"
												}`}
											/>
										</div>
									</div>
									{h.enabled && (
										<div className="text-zinc-500 mt-0.5 truncate">
											{h.value}
										</div>
									)}
								</button>
							))}
						</div>

						<div className="pt-2 border-t border-zinc-700 flex items-center justify-between">
							<span className="text-xs text-zinc-400">
								First request:{" "}
								<span className="text-white font-mono">
									{firstRequestBytes}B
								</span>
							</span>
							<span className="text-xs text-zinc-400">
								Subsequent (HPACK):{" "}
								<span className="text-cyan-300 font-mono">
									~{subsequentBytes}B
								</span>
							</span>
						</div>
					</div>
				</div>

				{/* Right: Comparison chart */}
				<div className="space-y-4">
					<div className="rounded-xl bg-zinc-900 border border-zinc-700 p-4 space-y-4">
						<div className="flex items-center justify-between">
							<span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
								Header bytes — {REQUEST_COUNT} requests
							</span>
							<button
								type="button"
								onClick={() => setShowRequests((v) => !v)}
								className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
							>
								{showRequests ? "Show chart" : "Show breakdown"}
							</button>
						</div>

						{!showRequests ? (
							<>
								{/* Bar chart */}
								<div className="space-y-3">
									{Array.from({ length: REQUEST_COUNT }, (_, i) => {
										const isFirst = i === 0;
										const http1Bytes = firstRequestBytes;
										const http2Bytes = isFirst
											? firstRequestBytes
											: subsequentBytes;
										const http1Pct = (http1Bytes / maxBarBytes) * 100;
										const http2Pct = Math.max(
											(http2Bytes / maxBarBytes) * 100,
											1,
										);

										return (
											<div
												key={`${
													// biome-ignore lint/suspicious/noArrayIndexKey: <no others data>
													i
												}-request`}
												className="space-y-1"
											>
												<div className="flex items-center gap-2">
													<span className="text-xs text-zinc-500 w-4 font-mono">
														{i + 1}
													</span>
													<div className="flex-1 space-y-0.5">
														{/* HTTP/1.1 bar */}
														<div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
															<motion.div
																className="h-full bg-orange-500 rounded-full"
																initial={{ width: 0 }}
																animate={{ width: `${http1Pct}%` }}
																transition={{ duration: 0.4, delay: i * 0.04 }}
															/>
														</div>
														{/* HTTP/2 bar */}
														<div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
															<motion.div
																className={`h-full rounded-full ${isFirst ? "bg-cyan-500" : "bg-cyan-700"}`}
																initial={{ width: 0 }}
																animate={{ width: `${http2Pct}%` }}
																transition={{
																	duration: 0.4,
																	delay: i * 0.04 + 0.1,
																}}
															/>
														</div>
													</div>
													{!isFirst && (
														<span className="text-xs text-cyan-400 font-mono w-8 text-right shrink-0">
															{subsequentBytes}B
														</span>
													)}
												</div>
											</div>
										);
									})}
								</div>

								{/* Legend */}
								<div className="flex items-center gap-4 text-xs text-zinc-400 pt-1">
									<div className="flex items-center gap-1.5">
										<div className="w-3 h-2 bg-orange-500 rounded-full" />
										HTTP/1.1
									</div>
									<div className="flex items-center gap-1.5">
										<div className="w-3 h-2 bg-cyan-500 rounded-full" />
										HTTP/2 (HPACK)
									</div>
								</div>
							</>
						) : (
							<div className="space-y-2 text-xs text-zinc-400">
								<div className="grid grid-cols-3 gap-2 text-zinc-500 font-semibold pb-1 border-b border-zinc-700">
									<span>Request</span>
									<span>HTTP/1.1</span>
									<span>HTTP/2</span>
								</div>
								{Array.from({ length: REQUEST_COUNT }, (_, i) => {
									const isFirst = i === 0;
									return (
										<div
											key={`${
												// biome-ignore lint/suspicious/noArrayIndexKey: <no others data>
												i
											}-request`}
											className="grid grid-cols-3 gap-2"
										>
											<span className="font-mono text-zinc-500">
												#{i + 1}
												{isFirst ? " (init)" : ""}
											</span>
											<span className="font-mono text-orange-400">
												{firstRequestBytes}B
											</span>
											<span
												className={`font-mono ${isFirst ? "text-cyan-400" : "text-cyan-600"}`}
											>
												{isFirst ? firstRequestBytes : subsequentBytes}B
												{!isFirst && (
													<span className="text-zinc-600 ml-1">(idx only)</span>
												)}
											</span>
										</div>
									);
								})}
								<div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-700 font-semibold">
									<span className="text-zinc-300">Total</span>
									<span className="text-orange-300 font-mono">
										{(http1Total / 1024).toFixed(1)}KB
									</span>
									<span className="text-cyan-300 font-mono">
										{(http2Total / 1024).toFixed(1)}KB
									</span>
								</div>
							</div>
						)}

						{/* Summary stats */}
						<div className="pt-2 border-t border-zinc-700 grid grid-cols-3 gap-3">
							<div className="text-center">
								<div className="text-base font-bold text-orange-400 font-mono">
									{(http1Total / 1024).toFixed(1)}KB
								</div>
								<div className="text-xs text-zinc-500">HTTP/1.1</div>
							</div>
							<div className="text-center">
								<div className="text-base font-bold text-cyan-400 font-mono">
									{(http2Total / 1024).toFixed(1)}KB
								</div>
								<div className="text-xs text-zinc-500">HTTP/2</div>
							</div>
							<div className="text-center">
								<div className="text-base font-bold text-emerald-400 font-mono">
									{savingsPct}%
								</div>
								<div className="text-xs text-zinc-500">saved</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* HPACK explanation */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<ShikiCode
					language="javascript"
					code={`// HTTP/2 HPACK — static + dynamic table

// Static table (61 predefined entries):
// index 2  → :method: GET
// index 7  → :scheme: https
// index 4  → :path: /

// Dynamic table (built per-connection):
// index 62 → user-agent: Mozilla/5.0...
// index 63 → cookie: session=abc123...
// index 64 → authorization: Bearer...

// Request 1: full headers (~${firstRequestBytes} bytes)
// Request 2: just [2, 62, 63] → ~${subsequentBytes} bytes!`}
					showLineNumbers={false}
					className="text-xs"
				/>

				<div className="p-4 rounded-xl bg-zinc-900 border border-zinc-700 space-y-3">
					<p className="text-xs font-semibold text-zinc-300">How HPACK works</p>
					<div className="space-y-2 text-xs text-zinc-400">
						<div className="flex gap-2">
							<span className="text-cyan-400 shrink-0">1.</span>
							<span>
								First request sends all headers in full and adds them to the
								dynamic table.
							</span>
						</div>
						<div className="flex gap-2">
							<span className="text-cyan-400 shrink-0">2.</span>
							<span>
								Subsequent requests reference static/dynamic table entries by
								integer index.
							</span>
						</div>
						<div className="flex gap-2">
							<span className="text-cyan-400 shrink-0">3.</span>
							<span>
								Only changed values (like{" "}
								<code className="text-violet-300">:path</code>) are transmitted
								in full.
							</span>
						</div>
						<div className="flex gap-2">
							<span className="text-cyan-400 shrink-0">4.</span>
							<span>
								Huffman encoding further reduces the size of literal strings.
							</span>
						</div>
					</div>
					<div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
						<p className="text-xs text-cyan-300">
							Cookie-heavy APIs benefit most — a 180-byte cookie header becomes
							~4 bytes on subsequent requests (index only).
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
