import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

interface SSEEvent {
	id: number;
	raw: string;
	delta: string;
	done?: boolean;
}

const TOKENS = [
	"The",
	" KV",
	" cache",
	" stores",
	" Key",
	" and",
	" Value",
	" vectors",
	".",
];

function buildEvent(delta: string, id: number): string {
	return `data: ${JSON.stringify({
		id: `chatcmpl-${id}`,
		object: "chat.completion.chunk",
		choices: [{ delta: { content: delta }, index: 0, finish_reason: null }],
	})}`;
}

export function SSEWireFormatDemo() {
	const [events, setEvents] = useState<SSEEvent[]>([]);
	const [running, setRunning] = useState(false);
	const [finished, setFinished] = useState(false);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	function start() {
		setEvents([]);
		setFinished(false);
		setRunning(true);

		let idx = 0;
		intervalRef.current = setInterval(() => {
			if (idx < TOKENS.length) {
				const delta = TOKENS[idx];
				setEvents((prev) => [
					...prev,
					{ id: idx, raw: buildEvent(delta, idx), delta },
				]);
				idx++;
			} else {
				setEvents((prev) => [
					...prev,
					{ id: idx, raw: "data: [DONE]", delta: "", done: true },
				]);
				if (intervalRef.current) clearInterval(intervalRef.current);
				setRunning(false);
				setFinished(true);
			}
		}, 450);
	}

	function reset() {
		if (intervalRef.current) clearInterval(intervalRef.current);
		setEvents([]);
		setRunning(false);
		setFinished(false);
	}

	useEffect(
		() => () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		},
		[],
	);

	const renderedText = events
		.filter((e) => !e.done)
		.map((e) => e.delta)
		.join("");

	return (
		<DemoSection
			title="Demo 1: SSE Wire Format"
			description="An LLM streaming response is a sequence of newline-delimited `data:` lines over a single long-lived HTTP response. Each line carries a JSON delta with the next token(s); the stream terminates with `data: [DONE]`."
		>
			<div className="space-y-5">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
					{/* Wire panel */}
					<div className="rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden">
						<div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
							<span className="text-xs text-zinc-500 uppercase tracking-wider">
								Network · text/event-stream
							</span>
							<motion.span
								animate={
									running
										? { opacity: [0.4, 1, 0.4] }
										: { opacity: finished ? 0.4 : 0.6 }
								}
								transition={
									running
										? { repeat: Number.POSITIVE_INFINITY, duration: 1 }
										: {}
								}
								className={`text-[10px] font-mono ${
									running
										? "text-emerald-400"
										: finished
											? "text-zinc-500"
											: "text-zinc-500"
								}`}
							>
								{running ? "● OPEN" : finished ? "○ CLOSED" : "○ IDLE"}
							</motion.span>
						</div>
						<div className="p-3 text-[11px] font-mono space-y-1 min-h-[14rem] max-h-[18rem] overflow-y-auto">
							<AnimatePresence initial={false}>
								{events.map((ev) => (
									<motion.div
										key={ev.id}
										initial={{ opacity: 0, x: -8 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ duration: 0.2 }}
										className={`break-all ${
											ev.done ? "text-rose-400" : "text-zinc-300"
										}`}
									>
										<span className="text-zinc-600">→ </span>
										{ev.raw}
									</motion.div>
								))}
							</AnimatePresence>
							{events.length === 0 && (
								<p className="text-zinc-600 italic">
									Press start — events will appear here.
								</p>
							)}
						</div>
					</div>

					{/* Rendered panel */}
					<div className="rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden">
						<div className="px-3 py-2 border-b border-zinc-800">
							<span className="text-xs text-zinc-500 uppercase tracking-wider">
								Rendered output · delta.content concatenated
							</span>
						</div>
						<div className="p-4 min-h-[14rem]">
							<p className="text-zinc-100 text-sm leading-relaxed">
								{renderedText}
								{running && (
									<span className="ml-0.5 animate-pulse text-cyan-400">▌</span>
								)}
							</p>
							{finished && (
								<motion.p
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									className="text-xs text-zinc-500 mt-3 pt-3 border-t border-zinc-800"
								>
									Stream closed after{" "}
									<span className="text-rose-400 font-mono">[DONE]</span>. The
									full response is the concatenation of every{" "}
									<span className="text-cyan-300 font-mono">delta.content</span>
									.
								</motion.p>
							)}
						</div>
					</div>
				</div>

				<div className="flex gap-3">
					<button
						type="button"
						onClick={start}
						disabled={running}
						className="px-4 py-2 rounded-lg bg-violet-700 hover:bg-violet-600 disabled:opacity-40 text-white text-sm font-medium transition-colors"
					>
						{running ? "Streaming…" : "Start stream"}
					</button>
					{(running || finished) && (
						<button
							type="button"
							onClick={reset}
							className="px-4 py-2 rounded-lg border border-zinc-700 hover:border-zinc-500 text-zinc-300 text-sm transition-colors"
						>
							Reset
						</button>
					)}
				</div>

				<div>
					<p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">
						Minimal client parser
					</p>
					<ShikiCode
						language="typescript"
						showLineNumbers={false}
						code={`const res = await fetch("/v1/chat/completions", { method: "POST", body });
const reader = res.body!.getReader();
const decoder = new TextDecoder();
let buffer = "";

while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });

  // SSE frames are separated by a blank line — split, keep the tail.
  const lines = buffer.split("\\n");
  buffer = lines.pop() ?? "";

  for (const line of lines) {
    if (!line.startsWith("data:")) continue;
    // Strip the "data:" prefix (5 chars) to extract the event payload
    const payload = line.slice(5).trim();
    if (payload === "[DONE]") return;
    const { choices } = JSON.parse(payload);
    onDelta(choices[0].delta.content ?? "");
  }
}`}
					/>
				</div>

				<div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-3 text-xs text-zinc-400">
					<span className="text-violet-300 font-medium">
						Why SSE, not WebSocket:
					</span>{" "}
					Generation is unidirectional (server → client). SSE runs over plain
					HTTP, traverses proxies cleanly, and gets automatic compression and
					auth headers for free. WebSocket is over-engineered for one-way token
					push.
				</div>
			</div>
		</DemoSection>
	);
}
