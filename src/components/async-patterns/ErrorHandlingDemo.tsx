import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ShikiCode } from "../shared/ShikiCode";

type ErrorStage = "none" | "fetch" | "parse" | "validate" | "transform";

interface AttemptState {
	attempt: number;
	status: "running" | "failed" | "success";
	waitMs: number;
}

const CHAIN_STAGES = ["fetch", "parse", "validate", "transform"] as const;

const STAGE_CODE: Record<ErrorStage, string> = {
	none: `// Happy path — no errors injected
async function pipeline(id: string) {
  const res = await fetch(\`/api/\${id}\`);    // fetch
  const json = await res.json();             // parse
  const valid = validate(json);              // validate
  return transform(valid);                   // transform
}`,
	fetch: `// Error at fetch — network failure
async function pipeline(id: string) {
  // throws TypeError: Failed to fetch
  const res = await fetch(\`/api/\${id}\`);

  // Lines below never run
  const json = await res.json();
  return transform(validate(json));
}`,
	parse: `// Error at parse — malformed JSON
async function pipeline(id: string) {
  const res = await fetch(\`/api/\${id}\`);

  // throws SyntaxError: Unexpected token
  const json = await res.json();

  return transform(validate(json));
}`,
	validate: `// Error at validate — business rule violation
async function pipeline(id: string) {
  const res = await fetch(\`/api/\${id}\`);
  const json = await res.json();

  // throws ValidationError: missing field 'name'
  const valid = validate(json);

  return transform(valid);
}`,
	transform: `// Error at transform — type mismatch
async function pipeline(id: string) {
  const res = await fetch(\`/api/\${id}\`);
  const json = await res.json();
  const valid = validate(json);

  // throws TypeError: Cannot read 'id' of undefined
  return transform(valid);
}`,
};

const RETRY_CODE = `async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelay = 1000,
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      const delay = baseDelay * 2 ** (attempt - 1); // 1s, 2s, 4s
      await sleep(delay);
    }
  }
  throw new Error("unreachable");
}`;

const BEST_PRACTICES = [
	{ good: true, text: "Wrap async entry points with try/catch" },
	{ good: true, text: "Use finally for cleanup (close DB, release lock)" },
	{
		good: true,
		text: "Distinguish retriable errors (network) from fatal (validation)",
	},
	{ good: true, text: "Add context to errors before re-throwing" },
	{ good: false, text: "Swallowing errors silently (.catch(() => {}))" },
	{ good: false, text: "Retrying on non-retriable errors (4xx responses)" },
	{ good: false, text: "Forgetting to handle unhandledRejection globally" },
];

export function ErrorHandlingDemo() {
	const [errorStage, setErrorStage] = useState<ErrorStage>("none");
	const [attempts, setAttempts] = useState<AttemptState[]>([]);
	const [retrying, setRetrying] = useState(false);

	const stageIndex =
		errorStage === "none"
			? 4
			: CHAIN_STAGES.indexOf(errorStage as (typeof CHAIN_STAGES)[number]);

	function runRetry() {
		setRetrying(true);
		setAttempts([]);

		const maxAttempts = 3;
		let attempt = 0;

		function doAttempt() {
			attempt++;
			const id = attempt;
			setAttempts((prev) => [
				...prev,
				{ attempt: id, status: "running", waitMs: 0 },
			]);

			setTimeout(() => {
				const succeeded = Math.random() < 0.4;
				if (succeeded) {
					setAttempts((prev) =>
						prev.map((a) =>
							a.attempt === id ? { ...a, status: "success", waitMs: 0 } : a,
						),
					);
					setRetrying(false);
				} else if (id < maxAttempts) {
					const waitMs = 1000 * 2 ** (id - 1);
					setAttempts((prev) =>
						prev.map((a) =>
							a.attempt === id ? { ...a, status: "failed", waitMs } : a,
						),
					);
					setTimeout(doAttempt, waitMs);
				} else {
					setAttempts((prev) =>
						prev.map((a) =>
							a.attempt === id ? { ...a, status: "failed", waitMs: 0 } : a,
						),
					);
					setRetrying(false);
				}
			}, 900);
		}

		doAttempt();
	}

	return (
		<div className="space-y-6">
			{/* Error propagation visualizer */}
			<div className="space-y-3">
				<div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
					Inject error at stage
				</div>
				<p className="text-xs text-zinc-500 mt-1">
					When an async function throws, every subsequent <code>await</code> in
					the chain is skipped. Select a stage to see where the error surfaces
					and what gets bypassed.
				</p>
				<div className="flex flex-wrap gap-2">
					{(["none", ...CHAIN_STAGES] as ErrorStage[]).map((stage) => (
						<button
							key={stage}
							type="button"
							onClick={() => setErrorStage(stage)}
							className={`px-3 py-1.5 rounded-lg text-sm font-mono border transition-colors ${
								errorStage === stage
									? stage === "none"
										? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
										: "bg-rose-500/20 text-rose-300 border-rose-500/30"
									: "bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200"
							}`}
						>
							{stage === "none" ? "No error" : stage}
						</button>
					))}
				</div>

				{/* Pipeline visualization */}
				<div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
					<div className="flex items-center gap-1 flex-wrap">
						{CHAIN_STAGES.map((stage, i) => {
							const isError = errorStage !== "none" && i === stageIndex;
							const isSkipped = errorStage !== "none" && i > stageIndex;
							const isSuccess = errorStage === "none" || i < stageIndex;

							return (
								<div key={stage} className="flex items-center gap-1">
									<motion.div
										animate={{
											scale: isError ? [1, 1.05, 1] : 1,
										}}
										transition={{
											repeat: isError ? Number.POSITIVE_INFINITY : 0,
											duration: 1.5,
										}}
										className={`px-3 py-2 rounded-lg text-xs font-mono border ${
											isError
												? "bg-rose-500/20 text-rose-300 border-rose-500/30"
												: isSkipped
													? "bg-zinc-800/50 text-zinc-600 border-zinc-800"
													: isSuccess
														? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
														: "bg-zinc-800 text-zinc-400 border-zinc-700"
										}`}
									>
										{stage}()
										{isError && " ✗"}
										{isSuccess && !isError && " ✓"}
									</motion.div>
									{i < CHAIN_STAGES.length - 1 && (
										<span
											className={`text-xs ${errorStage !== "none" && i + 1 >= stageIndex ? "text-zinc-700" : "text-zinc-500"}`}
										>
											→
										</span>
									)}
								</div>
							);
						})}
					</div>

					<AnimatePresence>
						{errorStage !== "none" && (
							<motion.div
								initial={{ opacity: 0, y: 4 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0 }}
								className="mt-3 text-xs text-rose-400 font-mono"
							>
								Error thrown at <strong>{errorStage}</strong> — bubbles up
								through the async chain
							</motion.div>
						)}
						{errorStage === "none" && (
							<motion.div
								initial={{ opacity: 0, y: 4 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0 }}
								className="mt-3 text-xs text-emerald-400 font-mono"
							>
								All stages pass — pipeline resolves successfully
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				<ShikiCode code={STAGE_CODE[errorStage]} language="typescript" />
			</div>

			{/* Retry with backoff */}
			<div className="space-y-3">
				<div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
					Retry with exponential backoff
				</div>
				<p className="text-xs text-zinc-500 mt-1">
					Transient failures (network timeouts, rate limits) can be retried
					safely — unlike deterministic errors (parse, validate) which will
					always fail again. Exponential backoff doubles the wait between
					attempts to avoid hammering the server.
				</p>
				<ShikiCode code={RETRY_CODE} language="typescript" />

				<div className="text-xs text-zinc-500">
					Simulating:{" "}
					<span className="text-amber-400 font-mono">
						transient network error
					</span>{" "}
					— e.g. timeout, 503
				</div>

				<button
					type="button"
					onClick={runRetry}
					disabled={retrying}
					className="px-5 py-2 rounded-lg text-sm font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{retrying ? "Running..." : "▶ Simulate retry sequence"}
				</button>

				<div className="space-y-2">
					<AnimatePresence>
						{attempts.map((a) => (
							<motion.div
								key={a.attempt}
								initial={{ opacity: 0, x: -10 }}
								animate={{ opacity: 1, x: 0 }}
								className="flex items-center gap-3 text-sm"
							>
								<span className="text-zinc-500 w-20 shrink-0">
									Attempt {a.attempt}
								</span>
								<div className="flex-1 h-6 bg-zinc-800 rounded overflow-hidden relative">
									<motion.div
										className={`absolute inset-y-0 left-0 ${
											a.status === "success"
												? "bg-emerald-500/60"
												: a.status === "failed"
													? "bg-rose-500/60"
													: "bg-amber-500/40"
										}`}
										initial={{ width: 0 }}
										animate={{ width: a.status === "running" ? "60%" : "100%" }}
										transition={{ duration: 0.8 }}
									/>
								</div>
								<span
									className={`w-28 shrink-0 text-right text-xs ${
										a.status === "success"
											? "text-emerald-400"
											: a.status === "failed"
												? "text-rose-400"
												: "text-amber-400"
									}`}
								>
									{a.status === "running"
										? "running..."
										: a.status === "failed"
											? `failed → wait ${a.waitMs}ms`
											: "success"}
								</span>
							</motion.div>
						))}
					</AnimatePresence>
				</div>
			</div>

			{/* Best practices */}
			<div className="space-y-3">
				<div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
					Best practices checklist
				</div>
				<p className="text-xs text-zinc-500 mt-1">
					Not all errors are equal — some should be retried, some re-thrown with
					context, and some indicate a fatal bug. These patterns separate robust
					async code from fragile code.
				</p>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
					{BEST_PRACTICES.map((item) => (
						<div
							key={item.text}
							className={`flex items-start gap-2 p-3 rounded-lg border text-sm ${
								item.good
									? "bg-emerald-500/5 border-emerald-500/20"
									: "bg-rose-500/5 border-rose-500/20"
							}`}
						>
							<span
								className={`mt-0.5 shrink-0 ${item.good ? "text-emerald-400" : "text-rose-400"}`}
							>
								{item.good ? "✓" : "✗"}
							</span>
							<span className={item.good ? "text-zinc-300" : "text-zinc-400"}>
								{item.text}
							</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
