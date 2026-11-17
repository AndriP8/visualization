import { useEffect, useRef, useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";
import { EVENT_TRAITS } from "./eventModel";

type FocusEvent = "focus" | "focusin" | "blur" | "focusout";

interface LogEntry {
	id: number;
	type: FocusEvent;
}

export function NonBubblingDemo() {
	const [received, setReceived] = useState<LogEntry[]>([]);
	const [typed, setTyped] = useState<string | null>(null);
	const formRef = useRef<HTMLFormElement>(null);
	const nextId = useRef(0);

	// Native listeners, so the demo shows what the browser actually delivers.
	useEffect(() => {
		const form = formRef.current;
		if (!form) return;

		const events: FocusEvent[] = ["focus", "focusin", "blur", "focusout"];
		const handlers = events.map((type) => {
			const handler = () => {
				setReceived((previous) =>
					[...previous, { id: nextId.current++, type }].slice(-8),
				);
			};
			form.addEventListener(type, handler);
			return { type, handler };
		});

		return () => {
			for (const { type, handler } of handlers) {
				form.removeEventListener(type, handler);
			}
		};
	}, []);

	return (
		<DemoSection
			title="Demo 5: Events that do not bubble"
			description="Not every event travels up the tree. Focus and blur stop at the element that fired them, so a delegated listener on a form never sees them."
		>
			<div className="space-y-5">
				<div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
					<div className="mb-3 flex items-center justify-between">
						<h4 className="text-sm font-medium text-zinc-300">
							Form with four delegated listeners
						</h4>
						<button
							type="button"
							onClick={() => setReceived([])}
							className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-900"
						>
							Reset
						</button>
					</div>
					<form
						ref={formRef}
						className="space-y-3"
						onSubmit={(event) => event.preventDefault()}
					>
						{["Name", "Email"].map((field) => (
							<label
								key={field}
								className="flex flex-col gap-1 text-xs text-zinc-400"
							>
								{field}
								<input
									type="text"
									onChange={(event) => setTyped(event.target.value)}
									className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-orange-500/40 focus:outline-none"
								/>
							</label>
						))}
						<p className="text-xs text-zinc-500">
							{typed
								? `Typed into: ${typed}`
								: "Focus a field, then click the other one."}
						</p>
					</form>
				</div>

				<div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
					<div className="mb-3 flex items-center justify-between">
						<h4 className="text-sm font-medium text-zinc-300">
							What the form's listeners received
						</h4>
						<span className="text-xs text-zinc-500">Delegated</span>
					</div>
					{received.length ? (
						<ol className="space-y-1 font-mono text-xs" aria-live="polite">
							{received.map((entry) => (
								<li
									key={entry.id}
									className={
										entry.type === "focus" || entry.type === "blur"
											? "text-rose-300"
											: "text-emerald-300"
									}
								>
									{entry.type}
								</li>
							))}
						</ol>
					) : (
						<p className="text-xs text-zinc-500">
							Focus a field to record which events reach the form.
						</p>
					)}
					<p className="mt-3 text-xs text-zinc-400">
						Only <code className="text-emerald-300">focusin</code> and{" "}
						<code className="text-emerald-300">focusout</code> arrive.{" "}
						<code className="text-rose-300">focus</code> and{" "}
						<code className="text-rose-300">blur</code> fire on the input itself
						and never travel up, so the form's listeners stay silent.
					</p>
				</div>

				<div className="overflow-x-auto rounded-lg border border-zinc-800">
					<table className="w-full min-w-[520px] text-left text-xs">
						<thead className="bg-zinc-900 text-zinc-400">
							<tr>
								{["Event", "Bubbles?", "What that means"].map((heading) => (
									<th key={heading} className="px-3 py-3 font-medium">
										{heading}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{EVENT_TRAITS.map((trait) => (
								<tr
									key={trait.type}
									className="border-t border-zinc-800/80 bg-zinc-950/40"
								>
									<td className="px-3 py-3 font-mono text-orange-300">
										{trait.type}
									</td>
									<td className="px-3 py-3">
										<span
											className={
												trait.bubbles ? "text-emerald-300" : "text-rose-300"
											}
										>
											{trait.bubbles ? "Yes" : "No"}
										</span>
									</td>
									<td className="px-3 py-3 text-zinc-400">{trait.note}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				<p className="text-xs text-zinc-500">
					<code className="text-rose-300">mouseenter</code> and{" "}
					<code className="text-rose-300">mouseleave</code> also stay put, and
					they fire only once instead of once per descendant. That is why
					frameworks offer <code className="text-orange-300">onMouseEnter</code>{" "}
					alongside <code className="text-orange-300">onMouseOver</code>.
				</p>

				<ShikiCode
					language="javascript"
					showLineNumbers={false}
					className="text-xs"
					code={`// focus and blur do not bubble: this form handler never runs
form.addEventListener("focus", markField);

// focusin and focusout do bubble: this one works
form.addEventListener("focusin", markField);`}
				/>
			</div>
		</DemoSection>
	);
}
