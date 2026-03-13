export type Strategy = "CSR" | "SSR" | "SSG" | "ISR" | "Streaming SSR";

export const STRATEGY_COLORS: Record<Strategy, string> = {
	CSR: "#f87171", // red-400
	SSR: "#fbbf24", // amber-400
	SSG: "#4ade80", // green-400
	ISR: "#22d3ee", // cyan-400
	"Streaming SSR": "#a78bfa", // violet-400
};

export const ALL_STRATEGIES: Strategy[] = [
	"CSR",
	"SSR",
	"SSG",
	"ISR",
	"Streaming SSR",
];
