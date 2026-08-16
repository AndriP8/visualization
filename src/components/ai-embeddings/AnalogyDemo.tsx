import { motion } from "motion/react";
import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import { ANALOGY_RESULTS } from "./embeddingsData";

export function AnalogyDemo() {
	const [selected, setSelected] = useState(0);
	const r = ANALOGY_RESULTS[selected];
	const top1 = r.top[0];
	const top2 = r.top[1];
	const hit = top1.word === r.expected;
	const gap = top1.score - top2.score;
	const maxScore = r.top[0].score;

	return (
		<DemoSection
			title="Demo 3: Analogy arithmetic — and why it's less reliable than you've been told"
			description="The classic 'king − man + woman ≈ queen' result was discovered on word2vec (2013). It became the iconic example of embedding geometry. The question: does it still hold on modern sentence-transformer embeddings? Pre-computed below using all-MiniLM-L6-v2."
		>
			<div className="space-y-4">
				<div className="flex flex-wrap gap-2">
					{ANALOGY_RESULTS.map((a, idx) => (
						<button
							key={`${a.a}-${a.b}-${a.c}`}
							type="button"
							onClick={() => setSelected(idx)}
							className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
								selected === idx
									? "bg-violet-500/20 border-violet-500/60 text-violet-200"
									: "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-600"
							}`}
						>
							{a.a} − {a.b} + {a.c}
						</button>
					))}
				</div>

				<div className="bg-zinc-950 border border-zinc-800 rounded-lg p-5">
					<div className="flex flex-wrap items-baseline gap-2 text-lg font-mono mb-4">
						<span className="text-violet-300">{r.a}</span>
						<span className="text-zinc-500">−</span>
						<span className="text-rose-300">{r.b}</span>
						<span className="text-zinc-500">+</span>
						<span className="text-cyan-300">{r.c}</span>
						<span className="text-zinc-500">≈ ?</span>
					</div>

					<p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
						Top 5 nearest neighbors of the resulting vector
					</p>
					<div className="space-y-1.5">
						{r.top.map((t, i) => {
							const isExpected = t.word === r.expected;
							const widthPct = (t.score / maxScore) * 100;
							return (
								<div key={t.word} className="flex items-center gap-3">
									<span className="w-6 text-xs font-mono text-zinc-600">
										#{i + 1}
									</span>
									<div className="flex-1 relative">
										<div className="h-7 bg-zinc-900 rounded overflow-hidden">
											<motion.div
												initial={{ width: 0 }}
												animate={{ width: `${widthPct}%` }}
												transition={{ delay: i * 0.05, duration: 0.4 }}
												className={
													isExpected
														? "h-full bg-emerald-500/40"
														: "h-full bg-zinc-700/60"
												}
											/>
										</div>
										<div className="absolute inset-0 flex items-center px-3">
											<span
												className={`text-sm font-mono ${
													isExpected
														? "text-emerald-300 font-medium"
														: "text-zinc-300"
												}`}
											>
												{t.word}
												{isExpected && (
													<span className="ml-2 text-[10px] text-emerald-400/80 uppercase tracking-wider">
														expected
													</span>
												)}
											</span>
										</div>
									</div>
									<span className="w-16 text-right text-xs font-mono text-zinc-500">
										{t.score.toFixed(3)}
									</span>
								</div>
							);
						})}
					</div>

					<div className="mt-4 pt-4 border-t border-zinc-800 grid sm:grid-cols-3 gap-3 text-center">
						<div>
							<p className="text-xs text-zinc-500 uppercase tracking-wider">
								Top-1 result
							</p>
							<p
								className={`text-lg font-mono mt-1 ${hit ? "text-emerald-300" : "text-rose-300"}`}
							>
								{top1.word} {hit ? "✓" : "✗"}
							</p>
						</div>
						<div>
							<p className="text-xs text-zinc-500 uppercase tracking-wider">
								Top-1 cosine
							</p>
							<p className="text-lg font-mono mt-1 text-cyan-300">
								{top1.score.toFixed(3)}
							</p>
						</div>
						<div>
							<p className="text-xs text-zinc-500 uppercase tracking-wider">
								Gap to #2
							</p>
							<p
								className={`text-lg font-mono mt-1 ${gap > 0.15 ? "text-emerald-300" : "text-amber-300"}`}
							>
								{gap.toFixed(3)}
							</p>
						</div>
					</div>
				</div>

				<div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-3 text-xs text-zinc-400 space-y-1">
					<p>
						<span className="text-violet-300 font-medium">
							What's really happening:
						</span>{" "}
						MiniLM does often put the expected word at #1 — but with a top-1
						cosine of ~0.58, not ~0.99. The runner-ups (mother, actress,
						princess) sit only 0.05–0.15 below. On word2vec, the geometry was
						sharp and the gap was huge; on contextual sentence-embeddings, the
						signal is real but blurry.
					</p>
					<p>
						<span className="text-violet-300 font-medium">
							Why this matters in practice:
						</span>{" "}
						"king − man + woman ≈ queen" is true here as a hand-picked example,
						not a generalizable algorithm. Linear analogy arithmetic on modern
						embeddings is unreliable on arbitrary triples — small differences in
						surface form (case, plural, surrounding context) shift the result.
						Treat analogy as folklore, not as a tool you'd build on.
					</p>
				</div>
			</div>
		</DemoSection>
	);
}
