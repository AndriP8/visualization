import { motion } from "motion/react";
import type { ReactNode } from "react";

type TopicColor =
	| "orange"
	| "emerald"
	| "violet"
	| "amber"
	| "blue"
	| "rose"
	| "purple"
	| "indigo"
	| "cyan"
	| "teal"
	| "sky"
	| "yellow";

interface PageHeaderProps {
	topic: {
		label: string;
		color: TopicColor;
	};
	title: string;
	subtitle: string;
	gradient: {
		from: string;
		via?: string;
		to: string;
	};
	explanation?: {
		content: ReactNode;
	};
}

const TOPIC_COLORS: Record<
	TopicColor,
	{ bg: string; text: string; dot: string; border: string }
> = {
	orange: {
		bg: "bg-orange-500/10",
		text: "text-orange-400",
		dot: "bg-orange-400",
		border: "border-orange-500/20",
	},
	emerald: {
		bg: "bg-emerald-500/10",
		text: "text-emerald-400",
		dot: "bg-emerald-400",
		border: "border-emerald-500/20",
	},
	violet: {
		bg: "bg-violet-500/10",
		text: "text-violet-400",
		dot: "bg-violet-400",
		border: "border-violet-500/20",
	},
	amber: {
		bg: "bg-amber-500/10",
		text: "text-amber-400",
		dot: "bg-amber-400",
		border: "border-amber-500/20",
	},
	yellow: {
		bg: "bg-yellow-500/10",
		text: "text-yellow-400",
		dot: "bg-yellow-400",
		border: "border-yellow-500/20",
	},
	blue: {
		bg: "bg-blue-500/10",
		text: "text-blue-400",
		dot: "bg-blue-400",
		border: "border-blue-500/20",
	},
	rose: {
		bg: "bg-rose-500/10",
		text: "text-rose-400",
		dot: "bg-rose-400",
		border: "border-rose-500/20",
	},
	purple: {
		bg: "bg-purple-500/10",
		text: "text-purple-400",
		dot: "bg-purple-400",
		border: "border-purple-500/20",
	},
	indigo: {
		bg: "bg-indigo-500/10",
		text: "text-indigo-400",
		dot: "bg-indigo-400",
		border: "border-indigo-500/20",
	},
	cyan: {
		bg: "bg-cyan-500/10",
		text: "text-cyan-400",
		dot: "bg-cyan-400",
		border: "border-cyan-500/20",
	},
	sky: {
		bg: "bg-sky-500/10",
		text: "text-sky-400",
		dot: "bg-sky-400",
		border: "border-sky-500/20",
	},
	teal: {
		bg: "bg-teal-500/10",
		text: "text-teal-400",
		dot: "bg-teal-400",
		border: "border-teal-500/20",
	},
};

// Map Tailwind color names to hex values for gradients
const COLOR_MAP: Record<string, string> = {
	"amber-400": "#fbbf24",
	"orange-400": "#fb923c",
	"red-400": "#f87171",
	"rose-400": "#fb7185",
	"pink-400": "#f472b6",
	"violet-400": "#a78bfa",
	"purple-400": "#c084fc",
	"fuchsia-400": "#e879f9",
	"cyan-400": "#22d3ee",
	"emerald-400": "#34d399",
	"blue-400": "#60a5fa",
	"indigo-400": "#818cf8",
	"teal-400": "#2dd4bf",
	"yellow-400": "#facc15",
	"sky-400": "#38bdf8",
	"lime-400": "#a3e635",
	"green-400": "#4ade80",
	"amber-500": "#f59e0b",
	"orange-500": "#f97316",
	"red-500": "#ef4444",
	"rose-500": "#f43f5e",
	"pink-500": "#ec4899",
	"violet-500": "#8b5cf6",
	"purple-500": "#a855f7",
	"fuchsia-500": "#d946ef",
	"cyan-500": "#06b6d4",
	"emerald-500": "#10b981",
	"blue-500": "#3b82f6",
	"indigo-500": "#6366f1",
	"teal-500": "#14b8a6",
	"yellow-500": "#eab308",
	"sky-500": "#0ea5e9",
};

export function PageHeader({
	topic,
	title,
	subtitle,
	gradient,
	explanation,
}: PageHeaderProps) {
	const colors = TOPIC_COLORS[topic.color];

	// Build gradient style inline using hex colors
	const fromColor =
		COLOR_MAP[gradient.from] ||
		(gradient.from.startsWith("#") ? gradient.from : "#60a5fa");
	const viaColor = gradient.via
		? COLOR_MAP[gradient.via] ||
			(gradient.via.startsWith("#") ? gradient.via : null)
		: null;
	const toColor =
		COLOR_MAP[gradient.to] ||
		(gradient.to.startsWith("#") ? gradient.to : "#38bdf8");

	const gradientStyle = {
		backgroundImage: viaColor
			? `linear-gradient(to right, ${fromColor}, ${viaColor}, ${toColor})`
			: `linear-gradient(to right, ${fromColor}, ${toColor})`,
		backgroundClip: "text",
		WebkitBackgroundClip: "text",
		color: "transparent",
	} as const;

	return (
		<div className="mb-12">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="mb-6"
			>
				<div
					className={`inline-flex items-center gap-2 px-4 py-2 ${colors.bg} ${colors.text} rounded-full text-sm font-medium border ${colors.border}`}
				>
					<span
						className={`w-2 h-2 ${colors.dot} rounded-full animate-pulse`}
					/>
					{topic.label}
				</div>
			</motion.div>

			<motion.h1
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.1 }}
				className="text-4xl lg:text-5xl font-bold mb-4"
				style={gradientStyle}
			>
				{title}
			</motion.h1>

			<motion.p
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.2 }}
				className="text-lg text-gray-400 mb-8"
			>
				{subtitle}
			</motion.p>

			{explanation && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.3 }}
					className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 mb-8 text-sm text-zinc-300 leading-relaxed"
				>
					{explanation.content}
				</motion.div>
			)}
		</div>
	);
}
