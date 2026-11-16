import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

const LOCAL_KEY = "under-the-hood-cross-tab";

interface StorageEventRecord {
	id: number;
	key: string | null;
	oldValue: string | null;
	newValue: string | null;
}

let eventCounter = 0;

export function StorageEventDemo() {
	const [value, setValue] = useState<string | null>(null);
	const [events, setEvents] = useState<StorageEventRecord[]>([]);

	const readValue = useCallback(() => {
		setValue(window.localStorage.getItem(LOCAL_KEY));
	}, []);

	useEffect(() => {
		readValue();

		const onStorage = (event: StorageEvent) => {
			if (event.storageArea !== window.localStorage) return;
			if (event.key !== null && event.key !== LOCAL_KEY) return;

			eventCounter += 1;
			setEvents((current) =>
				[
					{
						id: eventCounter,
						key: event.key,
						oldValue: event.oldValue,
						newValue: event.newValue,
					},
					...current,
				].slice(0, 6),
			);
			readValue();
		};

		window.addEventListener("storage", onStorage);
		return () => window.removeEventListener("storage", onStorage);
	}, [readValue]);

	const writeValue = () => {
		const next = `v-${Math.floor(Math.random() * 900 + 100)}`;
		window.localStorage.setItem(LOCAL_KEY, next);
		setValue(next);
	};

	const clearValue = () => {
		window.localStorage.removeItem(LOCAL_KEY);
		setValue(null);
	};

	const openSecondTab = () => {
		window.open(window.location.href, "_blank", "noopener,noreferrer");
	};

	return (
		<DemoSection
			title="Demo 3: Cross-tab sync with the storage event"
			description="When one tab writes to localStorage, every other tab on the same origin receives a storage event. This demo listens for that real event, so open the page in a second tab and watch both update."
		>
			<div className="space-y-5">
				<div className="grid gap-4 md:grid-cols-2">
					<div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
						<span className="font-mono text-xs text-cyan-300">
							localStorage
						</span>
						<div className="mt-3 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-2">
							{value ? (
								<span className="font-mono text-xs text-zinc-200">{value}</span>
							) : (
								<span className="text-xs text-zinc-600">
									Nothing stored yet.
								</span>
							)}
						</div>
						<div className="mt-3 flex flex-wrap gap-2">
							<button
								type="button"
								onClick={writeValue}
								className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[11px] text-cyan-300 transition-colors hover:bg-cyan-500/20"
							>
								Write a value
							</button>
							<button
								type="button"
								onClick={clearValue}
								className="rounded-md border border-zinc-800 px-2 py-1 text-[11px] text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
							>
								Clear
							</button>
							<button
								type="button"
								onClick={openSecondTab}
								className="rounded-md border border-zinc-800 px-2 py-1 text-[11px] text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
							>
								Open a second tab
							</button>
						</div>
					</div>

					<div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
						<div className="text-xs uppercase tracking-wider text-zinc-500">
							storage events received
						</div>
						<ul className="mt-2 space-y-1.5">
							{events.length === 0 ? (
								<li className="text-xs text-zinc-600">
									Write in one tab to see the event arrive in the other.
								</li>
							) : (
								events.map((event) => (
									<motion.li
										key={event.id}
										initial={{ opacity: 0, x: -8 }}
										animate={{ opacity: 1, x: 0 }}
										className="rounded-md border border-cyan-500/20 bg-cyan-500/5 px-2 py-1.5 font-mono text-[11px] text-cyan-200"
									>
										key={event.key} · {event.oldValue ?? "null"} →{" "}
										{event.newValue ?? "null"}
									</motion.li>
								))
							)}
						</ul>
					</div>
				</div>

				<div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4 text-xs leading-relaxed text-zinc-400">
					<strong className="text-cyan-300">
						The rule that trips people up:
					</strong>{" "}
					the <code className="font-mono text-zinc-200">storage</code> event
					fires in other tabs, never in the tab that made the change. The tab
					that calls <code className="font-mono text-zinc-200">setItem</code>{" "}
					already knows the new value, so it is not told. If your UI only
					updates inside a storage handler, the tab the user is looking at will
					look broken.
				</div>

				<ShikiCode
					language="javascript"
					showLineNumbers={false}
					className="text-xs"
					code={`window.addEventListener("storage", (event) => {
  // Fires in OTHER tabs on the same origin, never in the writing tab.
  if (event.key === "theme") {
    applyTheme(event.newValue);
  }
});`}
				/>

				<p className="text-xs text-zinc-500">
					The event only fires in other tabs of the same origin. It does not
					fire for sessionStorage, and it does not fire when the value changes
					in a private window or a different profile. If you need to talk to
					workers or service workers, use a BroadcastChannel instead.
				</p>
			</div>
		</DemoSection>
	);
}
