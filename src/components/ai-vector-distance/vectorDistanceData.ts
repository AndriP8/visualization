import type { Document, Vector } from "./vectorMetrics";

export const QUERY_LABEL = "How do I reset my password?";

export const QUERY: Vector = [1, 0.2];

export const DOCUMENTS: readonly Document[] = [
	{
		id: "a",
		label: "Reset your password",
		vector: [0.8, 0.1],
	},
	{
		id: "b",
		label: "Password reset steps for your account",
		vector: [5, 2],
	},
	{
		id: "e",
		label: "Change your account email",
		vector: [0.5, 3],
	},
	{
		id: "c",
		label: "Refund policy and returns",
		vector: [0.2, 4],
	},
	{
		id: "d",
		label: "How to bake sourdough bread",
		vector: [-3, -0.5],
	},
];
