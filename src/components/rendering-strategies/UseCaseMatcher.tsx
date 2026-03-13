import { motion } from "motion/react";
import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";
import type { RenderingStrategy } from "./types";

interface Question {
	id: string;
	text: string;
	options: {
		label: string;
		value: boolean;
		eliminates?: RenderingStrategy[];
		prefers?: RenderingStrategy[];
	}[];
}

const QUESTIONS: Question[] = [
	{
		id: "seo",
		text: "Is SEO critical for this page?",
		options: [
			{
				label: "Yes, must be crawlable",
				value: true,
				eliminates: ["CSR"],
			},
			{ label: "No, it's behind auth", value: false },
		],
	},
	{
		id: "personalization",
		text: "Does the page need user-specific data?",
		options: [
			{
				label: "Yes, highly personalized",
				value: true,
				eliminates: ["SSG"],
				prefers: ["SSR", "Streaming SSR", "CSR"],
			},
			{
				label: "No, same for all users",
				value: false,
				prefers: ["SSG", "ISR"],
			},
		],
	},
	{
		id: "freshness",
		text: "How often does content change?",
		options: [
			{
				label: "Real-time (every second)",
				value: true,
				eliminates: ["SSG", "ISR"],
				prefers: ["SSR", "Streaming SSR"],
			},
			{
				label: "Frequently (minutes/hours)",
				value: false,
				prefers: ["ISR", "SSR"],
			},
			{ label: "Rarely (days/weeks)", value: false, prefers: ["SSG", "ISR"] },
		],
	},
	{
		id: "performance",
		text: "Is sub-second FCP critical?",
		options: [
			{
				label: "Yes, must be instant",
				value: true,
				prefers: ["SSG", "ISR", "Streaming SSR"],
			},
			{ label: "No, 1-2s is fine", value: false },
		],
	},
];

const HYBRID_RECOMMENDATIONS = [
	{
		pattern: "mixed-content",
		name: "Hybrid Static + Dynamic",
		description:
			"Use SSG for marketing pages, SSR for user dashboards, CSR for admin panels",
		example: "E-commerce: product pages (SSG) + cart (CSR) + checkout (SSR)",
	},
	{
		pattern: "islands",
		name: "Islands Architecture",
		description:
			"Mostly static (SSG) with interactive islands (CSR) for dynamic widgets",
		example: "Blog (SSG) with live comment section (CSR)",
	},
	{
		pattern: "progressive",
		name: "Progressive Enhancement",
		description: "Start with SSG/ISR, add client-side features progressively",
		example: "Landing page (SSG) → authenticated app (CSR after login)",
	},
];

export function UseCaseMatcher() {
	const [answers, setAnswers] = useState<Record<string, boolean | null>>({});
	const [showResults, setShowResults] = useState(false);

	const allStrategies: RenderingStrategy[] = [
		"CSR",
		"SSR",
		"SSG",
		"ISR",
		"Streaming SSR",
	];

	const handleAnswer = (questionId: string, value: boolean) => {
		setAnswers({ ...answers, [questionId]: value });
		setShowResults(false);
	};

	const handleReset = () => {
		setAnswers({});
		setShowResults(false);
	};

	const handleCalculate = () => {
		setShowResults(true);
	};

	// Calculate which strategies are eliminated
	const eliminated = new Set<RenderingStrategy>();
	const preferred = new Map<RenderingStrategy, number>();

	// Initialize preferences
	for (const strategy of allStrategies) {
		preferred.set(strategy, 0);
	}

	// Process answers
	for (const question of QUESTIONS) {
		const answer = answers[question.id];
		if (answer === null || answer === undefined) continue;

		const selectedOption = question.options.find((opt) => opt.value === answer);
		if (!selectedOption) continue;

		// Mark eliminated strategies
		if (selectedOption.eliminates) {
			for (const strategy of selectedOption.eliminates) {
				eliminated.add(strategy);
			}
		}

		// Increment preference scores
		if (selectedOption.prefers) {
			for (const strategy of selectedOption.prefers) {
				preferred.set(strategy, (preferred.get(strategy) || 0) + 1);
			}
		}
	}

	// Sort by preference (highest first), filter out eliminated
	const recommendedStrategies = Array.from(preferred.entries())
		.filter(([strategy]) => !eliminated.has(strategy))
		.sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
		.map(([strategy]) => strategy);

	const shouldShowHybrid = recommendedStrategies.length > 1;

	return (
		<DemoSection
			title="Use Case Matcher"
			description="Answer a few questions about your requirements to find the best rendering strategy (or hybrid approach)."
		>
			{/* Questions */}
			<div className="space-y-6">
				{QUESTIONS.map((question, idx) => (
					<motion.div
						key={question.id}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: idx * 0.1 }}
						className="p-4 rounded-lg bg-zinc-800/30 border border-zinc-700/50"
					>
						<h4 className="text-sm font-semibold text-white mb-3">
							{question.text}
						</h4>
						<div className="flex flex-wrap gap-2">
							{question.options.map((option) => (
								<button
									key={option.label}
									type="button"
									onClick={() => handleAnswer(question.id, option.value)}
									className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
										answers[question.id] === option.value
											? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
											: "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-zinc-300"
									}`}
								>
									{option.label}
								</button>
							))}
						</div>
					</motion.div>
				))}
			</div>

			{/* Action Buttons */}
			<div className="flex gap-3 mt-6">
				<button
					type="button"
					onClick={handleCalculate}
					disabled={Object.keys(answers).length === 0}
					className="px-6 py-2.5 rounded-lg bg-violet-500 text-white text-sm font-semibold hover:bg-violet-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Get Recommendation
				</button>
				<button
					type="button"
					onClick={handleReset}
					className="px-6 py-2.5 rounded-lg bg-zinc-800 text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-colors border border-zinc-700"
				>
					Reset
				</button>
			</div>

			{/* Results */}
			{showResults && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="mt-6 space-y-4"
				>
					{/* Eliminated Strategies */}
					{eliminated.size > 0 && (
						<div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
							<h5 className="text-sm font-semibold text-red-300 mb-2">
								❌ Eliminated:
							</h5>
							<div className="flex gap-2 flex-wrap">
								{Array.from(eliminated).map((strategy) => (
									<span
										key={strategy}
										className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-medium opacity-50 line-through"
									>
										{strategy}
									</span>
								))}
							</div>
						</div>
					)}

					{/* Recommended Strategies */}
					{recommendedStrategies.length > 0 ? (
						<div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
							<h5 className="text-sm font-semibold text-green-300 mb-3">
								✅ Recommended Strategies:
							</h5>
							<div className="space-y-2">
								{recommendedStrategies.slice(0, 3).map((strategy, idx) => (
									<div
										key={strategy}
										className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50"
									>
										<span className="text-2xl">
											{idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
										</span>
										<span className="font-semibold text-white">{strategy}</span>
									</div>
								))}
							</div>
						</div>
					) : (
						<div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-sm text-yellow-300">
							All strategies eliminated! Review your requirements.
						</div>
					)}

					{/* Hybrid Architecture Suggestions */}
					{shouldShowHybrid && (
						<div className="p-4 rounded-lg bg-violet-500/10 border border-violet-500/20">
							<h5 className="text-sm font-semibold text-violet-300 mb-2">
								💡 Consider Hybrid Architecture:
							</h5>
							<p className="text-xs text-zinc-400 mb-3">
								Real applications often mix strategies. Here are common hybrid
								patterns:
							</p>
							<div className="space-y-3">
								{HYBRID_RECOMMENDATIONS.map((hybrid) => (
									<div
										key={hybrid.pattern}
										className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50"
									>
										<h6 className="text-sm font-semibold text-white mb-1">
											{hybrid.name}
										</h6>
										<p className="text-xs text-zinc-400 mb-1">
											{hybrid.description}
										</p>
										<p className="text-xs text-violet-300 italic">
											Example: {hybrid.example}
										</p>
									</div>
								))}
							</div>
						</div>
					)}
				</motion.div>
			)}
		</DemoSection>
	);
}
