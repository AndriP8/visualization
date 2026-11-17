import { useEffect, useRef, useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

type Option = "once" | "passive" | "signal";

export function ListenerOptionsDemo() {
	const [option, setOption] = useState<Option>("once");
	const [hits, setHits] = useState(0);
	const [aborted, setAborted] = useState(false);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const controllerRef = useRef<AbortController | null>(null);

	// The listener is attached once and re-armed by the demo controls below.
	useEffect(() => {
		const button = buttonRef.current;
		if (!button) return;

		setHits(0);
		setAborted(false);

		const controller = new AbortController();
		controllerRef.current = controller;

		const handle = () => setHits((count) => count + 1);

		if (option === "once") {
			button.addEventListener("click", handle, { once: true });
		} else if (option === "passive") {
			button.addEventListener("click", handle, { passive: true });
		} else {
			button.addEventListener("click", handle, {
				signal: controller.signal,
			});
		}

		return () => {
			controller.abort();
			button.removeEventListener("click", handle);
		};
	}, [option]);

	const abort = () => {
		controllerRef.current?.abort();
		setAborted(true);
	};

	const descriptions: Record<Option, string> = {
		once: "once: true removes the listener after its first call. Click the button twice — the second click does nothing.",
		passive:
			"passive: true promises the handler never calls preventDefault(), so the browser can scroll without waiting for JavaScript.",
		signal:
			"signal ties the listener to an AbortSignal. Calling abort() detaches it, and it detaches itself when the component unmounts.",
	};

	return (
		<DemoSection
			title="Demo 6: Listener options"
			description="addEventListener takes an options object. These three flags decide how long a listener lives and what it is allowed to do."
		>
			<div className="space-y-5">
				<fieldset className="flex flex-wrap gap-2">
					<legend className="sr-only">Choose a listener option</legend>
					{(Object.keys(descriptions) as Option[]).map((key) => (
						<button
							key={key}
							type="button"
							onClick={() => setOption(key)}
							className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${option === key ? "border-orange-500/40 bg-orange-500/10 text-orange-300" : "border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:border-zinc-700"}`}
						>
							{key}
						</button>
					))}
				</fieldset>

				<div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-5">
					<div className="flex flex-wrap items-center justify-between gap-4">
						<button
							type="button"
							ref={buttonRef}
							className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-300 hover:bg-amber-500/20"
						>
							Click me
						</button>
						<div className="flex items-center gap-3 text-xs">
							<span className="text-zinc-400">
								Handler ran <strong className="text-white">{hits}</strong> time
								{hits === 1 ? "" : "s"}
							</span>
							{option === "signal" && (
								<button
									type="button"
									onClick={abort}
									disabled={aborted}
									className="rounded-md border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-rose-300 hover:bg-rose-500/20 disabled:opacity-40"
								>
									{aborted ? "Aborted" : "controller.abort()"}
								</button>
							)}
						</div>
					</div>
					<p className="mt-4 text-xs leading-relaxed text-zinc-400">
						{descriptions[option]}
					</p>
				</div>

				<div className="grid gap-2 text-xs sm:grid-cols-2">
					<p className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 text-zinc-400">
						<code className="text-amber-300">once</code> is about{" "}
						<strong className="text-zinc-300">how many times</strong> the
						listener may run. It self-removes after the first call, so a
						re-attach is needed to fire again.
					</p>
					<p className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 text-zinc-400">
						<code className="text-amber-300">passive</code> is about{" "}
						<strong className="text-zinc-300">what the handler promises</strong>
						. Calling preventDefault() inside a passive listener does nothing
						and logs a warning.
					</p>
					<p className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 text-zinc-400">
						<code className="text-amber-300">signal</code> is about{" "}
						<strong className="text-zinc-300">how the listener ends</strong>.
						One AbortController can tear down many listeners at once.
					</p>
					<p className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 text-zinc-400">
						<code className="text-amber-300">capture</code> decides{" "}
						<strong className="text-zinc-300">which phase</strong> runs the
						listener. It was covered in Demo 1.
					</p>
				</div>

				<ShikiCode
					language="javascript"
					showLineNumbers={false}
					className="text-xs"
					code={`// once: runs a single time, then detaches itself
button.addEventListener("click", handle, { once: true });

// passive: the browser may scroll without waiting for this handler
window.addEventListener("wheel", handle, { passive: true });

// signal: one controller can tear down many listeners at once
const controller = new AbortController();
window.addEventListener("resize", handle, { signal: controller.signal });
window.addEventListener("keydown", handle, { signal: controller.signal });

controller.abort(); // both listeners are removed`}
				/>
			</div>
		</DemoSection>
	);
}
