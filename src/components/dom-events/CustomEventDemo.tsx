import { useEffect, useRef, useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";
import {
	type CartEventDetail,
	defineCartWidget,
	EVENT_NAME,
} from "./cartWidget";

defineCartWidget();

interface Hit {
	id: number;
	node: string;
}

export function CustomEventDemo() {
	const [bubbles, setBubbles] = useState(true);
	const [composed, setComposed] = useState(true);
	const [hits, setHits] = useState<Hit[]>([]);
	const [items, setItems] = useState<string[]>([]);
	const widgetRef = useRef<HTMLElement>(null);
	const middleRef = useRef<HTMLDivElement>(null);
	const outerRef = useRef<HTMLDivElement>(null);
	const nextId = useRef(0);

	// Keep the custom element's options in sync with the toggles.
	useEffect(() => {
		const widget = widgetRef.current as
			| (HTMLElement & {
					setOptions?: (options: {
						bubbles: boolean;
						composed: boolean;
					}) => void;
			  })
			| null;
		widget?.setOptions?.({ bubbles, composed });
	}, [bubbles, composed]);

	useEffect(() => {
		const middle = middleRef.current;
		const outer = outerRef.current;
		if (!middle || !outer) return;

		const record = (node: string) => {
			setHits((previous) =>
				[...previous, { id: nextId.current++, node }].slice(-6),
			);
		};

		const onMiddle = (event: Event) => {
			const detail = (event as CustomEvent<CartEventDetail>).detail;
			setItems((previous) => [...previous, detail.item].slice(-4));
			record("middle");
		};

		const onOuter = () => record("outer");

		middle.addEventListener(EVENT_NAME, onMiddle);
		outer.addEventListener(EVENT_NAME, onOuter);
		return () => {
			middle.removeEventListener(EVENT_NAME, onMiddle);
			outer.removeEventListener(EVENT_NAME, onOuter);
		};
	}, []);

	const reset = () => {
		setHits([]);
		setItems([]);
	};

	return (
		<DemoSection
			title="Demo 4: Custom events"
			description="A custom element dispatches a named event. Two options decide who hears it: bubbles sends it up the tree, composed lets it cross a shadow boundary."
		>
			<div className="space-y-5">
				<div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-300">
					<label className="flex items-center gap-2">
						<input
							type="checkbox"
							checked={bubbles}
							onChange={(event) => setBubbles(event.target.checked)}
							className="accent-orange-400"
						/>
						bubbles
					</label>
					<label className="flex items-center gap-2">
						<input
							type="checkbox"
							checked={composed}
							onChange={(event) => setComposed(event.target.checked)}
							className="accent-amber-400"
						/>
						composed
					</label>
					<button
						type="button"
						onClick={reset}
						className="ml-auto rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-900"
					>
						Reset
					</button>
				</div>

				<div
					ref={outerRef}
					className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4"
				>
					<div className="mb-2 text-xs uppercase tracking-wider text-zinc-500">
						OUTER · listens for "{EVENT_NAME}"
					</div>
					<div
						ref={middleRef}
						className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-4"
					>
						<div className="mb-2 text-xs uppercase tracking-wider text-zinc-500">
							MIDDLE · listens and records the item
						</div>
						<div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
							<div className="mb-2 text-xs uppercase tracking-wider text-zinc-500">
								SENDER · custom element, no React
							</div>
							<cart-widget ref={widgetRef} />
						</div>
					</div>
				</div>

				<div className="grid gap-4 md:grid-cols-2">
					<div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
						<div className="mb-3 text-xs uppercase tracking-wider text-zinc-500">
							Who received the event
						</div>
						{hits.length ? (
							<ol className="space-y-1 font-mono text-xs" aria-live="polite">
								{hits.map((hit) => (
									<li key={hit.id} className="text-orange-300">
										{hit.node}
									</li>
								))}
							</ol>
						) : (
							<p className="text-xs text-zinc-500">
								Add a latte to see which ancestors hear it.
							</p>
						)}
					</div>
					<div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
						<div className="mb-3 text-xs uppercase tracking-wider text-zinc-500">
							Items received
						</div>
						{items.length ? (
							<ol className="space-y-1 font-mono text-xs" aria-live="polite">
								{items.map((item) => (
									<li key={item} className="text-emerald-300">
										{item}
									</li>
								))}
							</ol>
						) : (
							<p className="text-xs text-zinc-500">Nothing yet.</p>
						)}
					</div>
				</div>

				<div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4 text-xs leading-relaxed text-zinc-400">
					<strong className="text-orange-300">bubbles</strong> decides how far
					the event travels up the tree. Turn it off and the event stops at the
					sender: neither the middle nor the outer box hears it.{" "}
					<strong className="text-amber-300">composed</strong> decides whether
					the event may cross a shadow DOM boundary. It only matters for
					elements inside a shadow root, so on this page you will not see a
					difference — the web components page shows that case.
				</div>

				<ShikiCode
					language="javascript"
					showLineNumbers={false}
					className="text-xs"
					code={`this.dispatchEvent(
  new CustomEvent("cart:add", {
    bubbles: true,    // travel up the tree to ancestors
    composed: true,   // may cross a shadow DOM boundary
    detail: { item: "Latte" },
  }),
);

// An ancestor listens for the event by name
middle.addEventListener("cart:add", (event) => {
  console.log(event.detail.item); // "Latte"
});`}
				/>
			</div>
		</DemoSection>
	);
}
