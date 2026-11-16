import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";

export function OfflineFallbackDemo() {
	const [online, setOnline] = useState(true);
	const [fallbackCached, setFallbackCached] = useState(false);
	const [response, setResponse] = useState(
		"Try a navigation or image request.",
	);

	const navigate = () => {
		if (online) setResponse("/account loaded from the network.");
		else if (fallbackCached)
			setResponse(
				"Network failed; the worker returned the cached /offline.html fallback.",
			);
		else setResponse("Network failed and no offline fallback is cached.");
	};
	const requestImage = () =>
		setResponse(
			online
				? "avatar.png loaded from the network."
				: "avatar.png is unavailable offline; navigation fallback does not replace arbitrary assets.",
		);

	return (
		<DemoSection
			title="Demo 5: Offline navigation fallback"
			description="A worker can return a cached offline page for failed navigations while letting unrelated asset requests fail normally."
		>
			<div className="space-y-5">
				<div className="flex flex-wrap gap-2">
					<button
						type="button"
						onClick={() => setOnline((value) => !value)}
						className={`rounded-lg border px-3 py-2 text-xs font-medium ${online ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-rose-500/30 bg-rose-500/10 text-rose-300"}`}
					>
						{online ? "● Network online" : "○ Network offline"}
					</button>
					<button
						type="button"
						onClick={() => setFallbackCached((value) => !value)}
						className={`rounded-lg border px-3 py-2 text-xs ${fallbackCached ? "border-orange-500/30 bg-orange-500/10 text-orange-300" : "border-zinc-700 bg-zinc-900 text-zinc-400"}`}
					>
						{fallbackCached ? "✓ /offline.html cached" : "Cache offline page"}
					</button>
				</div>
				<div className="grid gap-3 sm:grid-cols-2">
					<button
						type="button"
						onClick={navigate}
						className="rounded-lg border border-zinc-700 bg-zinc-900 p-4 text-left hover:border-orange-500/40"
					>
						<span className="block font-mono text-sm text-white">
							GET /account
						</span>
						<span className="mt-1 block text-xs text-zinc-500">
							navigation request
						</span>
					</button>
					<button
						type="button"
						onClick={requestImage}
						className="rounded-lg border border-zinc-700 bg-zinc-900 p-4 text-left hover:border-orange-500/40"
					>
						<span className="block font-mono text-sm text-white">
							GET /avatar.png
						</span>
						<span className="mt-1 block text-xs text-zinc-500">
							image subresource
						</span>
					</button>
				</div>
				<div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
					<div className="mb-1 text-xs uppercase tracking-wider text-zinc-500">
						Response
					</div>
					<p className="text-sm text-zinc-200" aria-live="polite">
						{response}
					</p>
				</div>
				<p className="text-xs text-zinc-500">
					Offline fallbacks are an app decision. The worker must cache the
					fallback page and check that the request is a navigation before
					returning it.
				</p>
			</div>
		</DemoSection>
	);
}
