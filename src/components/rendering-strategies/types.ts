export type RenderingStrategy = "CSR" | "SSR" | "SSG" | "ISR" | "Streaming SSR";

export interface TimelineEvent {
	label: string;
	color: string;
	description?: string;
}

export interface StrategyTimeline {
	strategy: RenderingStrategy;
	description: string;
	events: TimelineEvent[];
	// Relative timing in ms (will be scaled logarithmically)
	timings: number[];
	icon: string;
	color: string;
}

export interface TradeoffMetric {
	label: string;
	description: string;
}

export interface StrategyTradeoffs {
	strategy: RenderingStrategy;
	ttfb: number; // 1-5 scale
	fcp: number;
	tti: number;
	seo: number;
	personalization: number;
	cost: number; // 1=cheap, 5=expensive
	buildTime: number; // 1=fast, 5=slow
}
