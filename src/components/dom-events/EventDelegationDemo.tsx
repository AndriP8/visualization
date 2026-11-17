import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

const INITIAL_ITEMS = ["Inbox", "Drafts", "Archive"];

export function EventDelegationDemo() {
	const [items, setItems] = useState(INITIAL_ITEMS);
	const [selected, setSelected] = useState("Nothing selected");
	const [targetLabel, setTargetLabel] = useState("—");
	const [handled, setHandled] = useState(0);

	return (
		<DemoSection
			title="Demo 2: Event delegation"
			description="One listener on the list handles clicks from every item, including items added later, because new items need no new listener."
		>
			<div className="space-y-5">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<p className="text-sm text-zinc-400">
						Click a row or add another one.
					</p>
					<button
						type="button"
						onClick={() =>
							setItems((previous) => [
								...previous,
								`New folder ${previous.length - 2}`,
							])
						}
						className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-xs font-medium text-orange-300 hover:bg-orange-500/20"
					>
						＋ Add item
					</button>
				</div>
				<div className="grid gap-4 md:grid-cols-2">
					<div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
						<div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wider text-zinc-500">
							<span>Single listener on &lt;ul&gt;</span>
							<span className="text-orange-300">1 listener</span>
						</div>
						{/* biome-ignore lint/a11y/useKeyWithClickEvents: Keyboard activation on the child buttons also bubbles as click. */}
						<ul
							onClick={(event) => {
								const item = (
									event.target as HTMLElement
								).closest<HTMLButtonElement>("[data-item]");
								if (!item) return;
								setSelected(item.dataset.item ?? "Unknown item");
								setTargetLabel(
									(event.target as HTMLElement).tagName.toLowerCase(),
								);
								setHandled((count) => count + 1);
							}}
							className="space-y-2"
						>
							{items.map((item) => (
								<li key={item}>
									<button
										type="button"
										data-item={item}
										className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-left text-sm text-zinc-200 hover:border-orange-500/40"
									>
										<span className="mr-2 text-orange-300">▸</span>
										{item}
									</button>
								</li>
							))}
						</ul>
					</div>
					<div className="flex flex-col justify-center rounded-lg border border-orange-500/20 bg-orange-500/5 p-4">
						<div className="text-xs uppercase tracking-wider text-zinc-500">
							Listener result
						</div>
						<div className="mt-2 text-lg font-semibold text-orange-300">
							{selected}
						</div>
						<p className="mt-2 text-xs text-zinc-500">
							event.target: <code>{targetLabel}</code> · event.currentTarget:{" "}
							<code>ul</code>
						</p>
						<div className="mt-4 grid grid-cols-2 gap-2 text-center">
							<div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
								<div className="text-xs text-zinc-400">With delegation</div>
								<div className="mt-1 text-xl font-semibold text-emerald-300">
									1
								</div>
								<div className="text-xs text-zinc-500">listener</div>
							</div>
							<div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
								<div className="text-xs text-zinc-400">Without delegation</div>
								<div className="mt-1 text-xl font-semibold text-rose-300">
									{items.length}
								</div>
								<div className="text-xs text-zinc-500">
									listeners for {items.length} rows
								</div>
							</div>
						</div>
						<p className="mt-3 text-xs text-zinc-400">
							That single listener has handled{" "}
							<strong className="text-orange-300">{handled}</strong> click
							{handled === 1 ? "" : "s"} so far. Add a row and the left count
							stays at 1, while the right count grows.
						</p>
						<p className="mt-2 text-xs text-zinc-400">
							<code className="text-orange-300">closest()</code> walks up from
							where the click landed to the row that owns it, so hitting the{" "}
							<code>▸</code> icon still selects the right item.
						</p>
					</div>
				</div>
				<ShikiCode
					language="javascript"
					showLineNumbers={false}
					className="text-xs"
					code={`list.addEventListener("click", (event) => {
  const item = event.target.closest("[data-item]");
  if (!item) return;
  openFolder(item.dataset.item);
});`}
				/>
			</div>
		</DemoSection>
	);
}
