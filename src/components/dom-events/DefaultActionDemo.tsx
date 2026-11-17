import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

export function DefaultActionDemo() {
	const [preventDefault, setPreventDefault] = useState(false);
	const [stopPropagation, setStopPropagation] = useState(false);
	const [message, setMessage] = useState(
		"Click the link to test its browser default.",
	);
	const [parentEvents, setParentEvents] = useState(0);
	const [hash, setHash] = useState(() => window.location.hash);

	return (
		<DemoSection
			title="Demo 3: Default action vs propagation"
			description="Preventing a browser action and stopping an event from bubbling are separate operations."
		>
			<div className="space-y-4">
				<div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-300">
					<label className="flex items-center gap-2">
						<input
							type="checkbox"
							checked={preventDefault}
							onChange={(event) => setPreventDefault(event.target.checked)}
							className="accent-orange-400"
						/>
						preventDefault()
					</label>
					<label className="flex items-center gap-2">
						<input
							type="checkbox"
							checked={stopPropagation}
							onChange={(event) => setStopPropagation(event.target.checked)}
							className="accent-amber-400"
						/>
						stopPropagation()
					</label>
				</div>
				{/* biome-ignore lint/a11y/noStaticElementInteractions: The parent observes whether the link click bubbles. */}
				{/* biome-ignore lint/a11y/useKeyWithClickEvents: Activating the nested link with a keyboard also dispatches click. */}
				<div
					id="event-default-demo"
					onClick={() => setParentEvents((count) => count + 1)}
					className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-5"
				>
					<div className="text-xs uppercase tracking-wider text-zinc-500">
						Parent · has click listener
					</div>
					<p className="mt-3 text-sm text-zinc-400">
						Parent received clicks:{" "}
						<strong className="text-white">{parentEvents}</strong>
					</p>
					<div className="mt-3 text-xs uppercase tracking-wider text-zinc-500">
						Child · the link
					</div>
					{/* biome-ignore lint/a11y/useValidAnchor: This link intentionally demonstrates native fragment navigation. */}
					<a
						href="#event-default-demo"
						onClick={(event) => {
							setMessage(
								preventDefault
									? "Default prevented: the page did not follow the fragment link."
									: "Default allowed: the URL now points to #event-default-demo.",
							);
							if (preventDefault) event.preventDefault();
							if (stopPropagation) event.stopPropagation();
							// Fragment navigation applies after the handler returns, not during it.
							setTimeout(() => setHash(window.location.hash), 0);
						}}
						className="mt-2 inline-block rounded-md border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-sm text-orange-300 hover:bg-orange-500/20"
					>
						Follow fragment link
					</a>
					<p className="mt-3 text-xs text-zinc-400" aria-live="polite">
						{message}
					</p>
					<p className="mt-1 text-xs text-zinc-500">
						URL hash: <code className="text-orange-300">{hash || "—"}</code>
					</p>
				</div>
				<div className="grid gap-2 text-xs sm:grid-cols-2">
					<p className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 text-zinc-400">
						<code className="text-orange-300">preventDefault()</code> cancels
						the link navigation. The click still bubbles to the parent.
					</p>
					<p className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 text-zinc-400">
						<code className="text-amber-300">stopPropagation()</code> blocks the
						parent handler. The link's default action still occurs.
					</p>
				</div>

				<ShikiCode
					language="javascript"
					showLineNumbers={false}
					className="text-xs"
					code={`// Frontend validation: cancel the form submission, keep the event flowing
form.addEventListener("submit", (event) => {
  if (!form.checkValidity()) event.preventDefault();
});

// A close button inside a card: keep the card's other behavior, hush its ancestors
tray.addEventListener("click", (event) => {
  event.stopPropagation();

  // If a checkbox must not close anything: cancel BOTH
  if (event.target.matches("input")) {
    event.preventDefault();
    event.stopPropagation();
  }
});`}
				/>
			</div>
		</DemoSection>
	);
}
