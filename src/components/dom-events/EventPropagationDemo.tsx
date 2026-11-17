import { useRef, useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

export function EventPropagationDemo() {
	const [stopAtTarget, setStopAtTarget] = useState(false);
	const [events, setEvents] = useState<{ id: number; label: string }[]>([]);
	const nextEventId = useRef(0);

	const record = (name: string, phase: "capture" | "bubble") => {
		setEvents((previous) =>
			[
				...previous,
				{ id: nextEventId.current++, label: `${name} · ${phase}` },
			].slice(-8),
		);
	};

	return (
		<DemoSection
			title="Demo 1: Capture, target & bubble"
			description="Click the target to see a real DOM click travel down through capture, reach its target, then bubble back up."
		>
			<div className="space-y-5">
				<label className="flex items-center gap-2 text-sm text-zinc-300">
					<input
						type="checkbox"
						checked={stopAtTarget}
						onChange={(event) => setStopAtTarget(event.target.checked)}
						className="accent-orange-400"
					/>
					Stop bubbling at target
				</label>

				{/* biome-ignore lint/a11y/noStaticElementInteractions: This listener observes clicks bubbling from the nested button. */}
				{/* biome-ignore lint/a11y/useKeyWithClickEvents: Keyboard activation on the nested button dispatches a click event. */}
				<div
					onClickCapture={() => {
						// First handler to fire in any click: reset so each click logs a clean sequence.
						setEvents([]);
						record("document", "capture");
					}}
					onClick={() => record("document", "bubble")}
					className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-4"
				>
					<div className="mb-3 flex items-center justify-between text-xs text-orange-300">
						<span>DOCUMENT</span>
						<span>1 · capture → 6 · bubble</span>
					</div>
					{/* biome-ignore lint/a11y/noStaticElementInteractions: This listener observes clicks bubbling from the nested button. */}
					{/* biome-ignore lint/a11y/useKeyWithClickEvents: Keyboard activation on the nested button dispatches a click event. */}
					<div
						onClickCapture={() => record("card", "capture")}
						onClick={() => record("card", "bubble")}
						className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4"
					>
						<div className="mb-3 text-xs text-amber-300">CARD</div>
						<button
							type="button"
							onClickCapture={() => record("target", "capture")}
							onClick={(event) => {
								record("target", "bubble");
								if (stopAtTarget) event.stopPropagation();
							}}
							className="w-full rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-5 text-left transition-colors hover:bg-emerald-500/20"
						>
							<span className="block text-xs text-emerald-300">TARGET</span>
							<span className="mt-1 block text-sm text-white">Click me</span>
						</button>
					</div>
				</div>

				<div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-4">
					<div className="mb-3 flex items-center justify-between">
						<h4 className="text-sm font-medium text-zinc-300">Event log</h4>
						<span className="text-xs text-zinc-500">Click order</span>
					</div>
					{events.length ? (
						<ol className="space-y-1 font-mono text-xs" aria-live="polite">
							{events.map((entry) => (
								<li
									key={entry.id}
									className={
										entry.label.endsWith("capture")
											? "text-orange-300"
											: "text-emerald-300"
									}
								>
									{entry.label}
								</li>
							))}
						</ol>
					) : (
						<p className="text-xs text-zinc-500">
							Click the green target to record a click event.
						</p>
					)}
				</div>

				<p className="text-xs text-zinc-500">
					Capture handlers run from the outer ancestor inward. The target
					handler runs next, then bubbling handlers run outward unless
					propagation is stopped. (
					<code className="text-orange-300">stopImmediatePropagation()</code> is
					stronger: it also blocks remaining listeners on the same element.)
				</p>

				<ShikiCode
					language="javascript"
					showLineNumbers={false}
					className="text-xs"
					code={`card.addEventListener("click", record, true); // capture: runs before the target
target.addEventListener("click", record, { once: true }); // detaches itself after the first call`}
				/>
			</div>
		</DemoSection>
	);
}
