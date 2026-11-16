import { DemoSection } from "../shared/DemoSection";

const metrics = [
	{
		name: "Squared Euclidean (L2²)",
		use: "Euclidean distance without the square root. It ranks results exactly like Euclidean, costs less to compute, and is what FAISS reports for an L2 index.",
	},
	{
		name: "Manhattan (L1)",
		use: "Adds up the difference in each dimension. Useful when each dimension is a separate measurable amount and one big difference should not dominate.",
	},
	{
		name: "Chebyshev (L∞)",
		use: "Takes the largest single difference across dimensions. Sensitive to one outlier dimension and rarely used for text embeddings.",
	},
	{
		name: "Hamming",
		use: "Counts how many positions differ in two binary vectors. This is the metric for binarized embeddings, where each number is stored as a single bit.",
	},
	{
		name: "Jaccard",
		use: "Measures overlap between two sets: shared items divided by all items seen. Common for keyword vectors, tags, and other sparse or binary data.",
	},
	{
		name: "Mahalanobis",
		use: "Adjusts for dimensions that have different scales or are correlated. It needs a covariance estimate from the data, so it is not a drop-in default.",
	},
	{
		name: "Poincaré (hyperbolic)",
		use: "Designed for data with levels or branches, such as categories arranged in a tree. Used when hierarchy matters more than flat proximity.",
	},
];

export function UncommonDistanceMetricsDemo() {
	return (
		<DemoSection
			title="Demo 5: Other metrics (for reference)"
			description="Everyday text search leans on the big three, but these show up in a library's metric options for specific data shapes. A quick glossary so the names feel familiar when you meet them."
		>
			<div className="grid sm:grid-cols-2 gap-3">
				{metrics.map((metric) => (
					<div
						key={metric.name}
						className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-2"
					>
						<h4 className="text-sm font-semibold text-zinc-200">
							{metric.name}
						</h4>
						<p className="text-xs text-zinc-400 leading-relaxed">
							{metric.use}
						</p>
					</div>
				))}
			</div>
		</DemoSection>
	);
}
