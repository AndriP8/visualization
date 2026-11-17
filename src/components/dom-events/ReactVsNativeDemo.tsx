import { useEffect, useRef, useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

interface TraceEntry {
	id: number;
	label: string;
	source: "react" | "native";
}

export function ReactVsNativeDemo() {
	const [trace, setTrace] = useState<TraceEntry[]>([]);
	const [stopPropagation, setStopPropagation] = useState(false);
	const nextId = useRef(0);
	const midRef = useRef<HTMLDivElement>(null);
	const targetRef = useRef<HTMLButtonElement>(null);

	// Native listeners on the middle element. When "stop propagation" is on,
	// the bubble listener halts the event before it can reach the React root.
	useEffect(() => {
		const mid = midRef.current;
		if (!mid) return;

		const handleCapture = () => {
			setTrace((previous) => [
				...previous,
				{
					id: nextId.current++,
					label: "native capture mid",
					source: "native",
				},
			]);
		};

		const handleBubble = (event: Event) => {
			setTrace((previous) => [
				...previous,
				{
					id: nextId.current++,
					label: "native bubble mid",
					source: "native",
				},
			]);
			if (stopPropagation) {
				event.stopPropagation();
			}
		};

		mid.addEventListener("click", handleCapture, true);
		mid.addEventListener("click", handleBubble);
		return () => {
			mid.removeEventListener("click", handleCapture, true);
			mid.removeEventListener("click", handleBubble);
		};
	}, [stopPropagation]);

	const record = (label: string, source: "react" | "native") => {
		setTrace((previous) => [
			...previous,
			{ id: nextId.current++, label, source },
		]);
	};

	const run = () => {
		setTrace([]);
		targetRef.current?.dispatchEvent(
			new MouseEvent("click", { bubbles: true, cancelable: true }),
		);
	};

	return (
		<DemoSection
			title="Demo 7: React handlers vs native listeners"
			description="React attaches its listeners to the root container, so they run at a different moment than a native listener on the same element."
		>
			<div className="space-y-5">
				<label className="flex items-center gap-2 text-sm text-zinc-300">
					<input
						type="checkbox"
						checked={stopPropagation}
						onChange={(event) => setStopPropagation(event.target.checked)}
						className="accent-orange-400"
					/>
					Native listener calls stopPropagation()
				</label>

				<div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-5">
					{/* biome-ignore lint/a11y/noStaticElementInteractions: This listener observes clicks bubbling from the nested button. */}
					{/* biome-ignore lint/a11y/useKeyWithClickEvents: Keyboard activation on the nested button dispatches a click event. */}
					<div
						ref={midRef}
						onClickCapture={() => record("React capture mid", "react")}
						onClick={() => record("React bubble mid", "react")}
						className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4"
					>
						<div className="mb-3 text-xs uppercase tracking-wider text-zinc-500">
							MID
						</div>
						<button
							type="button"
							id="react-native-target"
							ref={targetRef}
							onClickCapture={() => record("React capture target", "react")}
							onClick={() => record("React bubble target", "react")}
							className="w-full rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-left transition-colors hover:bg-emerald-500/20"
						>
							<span className="block text-xs text-emerald-300">TARGET</span>
							<span className="mt-1 block text-sm text-white">Click me</span>
						</button>
					</div>

					<div className="mt-4 flex flex-wrap items-center gap-3">
						<button
							type="button"
							onClick={run}
							className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-xs font-medium text-orange-300 hover:bg-orange-500/20"
						>
							Dispatch a click
						</button>
						<span className="text-xs text-zinc-500">
							Or just click the green target above.
						</span>
					</div>
				</div>

				<div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
					<div className="mb-3 flex items-center justify-between">
						<h4 className="text-sm font-medium text-zinc-300">
							Listener order
						</h4>
						<span className="text-xs text-zinc-500">Actual, not predicted</span>
					</div>
					{trace.length ? (
						<ol className="space-y-1 font-mono text-xs" aria-live="polite">
							{trace.map((entry) => (
								<li
									key={entry.id}
									className={
										entry.source === "react"
											? "text-violet-300"
											: "text-amber-300"
									}
								>
									{entry.label}
								</li>
							))}
						</ol>
					) : (
						<p className="text-xs text-zinc-500">
							Click the target to record the real order.
						</p>
					)}
					<p className="mt-3 text-xs text-zinc-400">
						React capture handlers run first, then native capture, then native
						bubble, then React bubble. React collects its handlers at the root
						and replays them in tree order, so they never interleave with native
						listeners on the same element.
					</p>
					<div className="mt-3 flex flex-wrap gap-4 text-xs">
						<span className="text-violet-300">■ React handler</span>
						<span className="text-amber-300">■ Native listener</span>
					</div>
				</div>

				<div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-4">
					<div className="mb-2 text-xs uppercase tracking-wider text-rose-300">
						What happens when a native listener stops propagation
					</div>
					{stopPropagation ? (
						<>
							<p className="text-xs leading-relaxed text-zinc-400">
								With the box ticked, the native listener on the middle element
								calls stopPropagation(). React's capture handlers still ran,
								because React's capture listener sits on the root and fires
								during the capture phase. But the event never travels back up to
								the root, so{" "}
								<code className="text-rose-300">
									React bubble handlers never run at all
								</code>
								.
							</p>
							<p className="mt-2 text-xs leading-relaxed text-zinc-500">
								This is the trap in mixed code: one native listener can silence
								every React handler in the subtree below it.
							</p>
						</>
					) : (
						<p className="text-xs leading-relaxed text-zinc-400">
							Tick the box above to make the native listener call{" "}
							<code className="text-rose-300">stopPropagation()</code>, then
							click the target again to watch the React bubble handlers
							disappear.
						</p>
					)}
				</div>

				<ShikiCode
					language="javascript"
					showLineNumbers={false}
					className="text-xs"
					code={`// React attaches ONE listener per event type to the root container.
// The root is above this component, so a native listener here
// that stops propagation prevents React from ever seeing the event.

mid.addEventListener("click", (event) => {
  event.stopPropagation(); // React's onClick below never fires
});`}
				/>
			</div>
		</DemoSection>
	);
}
