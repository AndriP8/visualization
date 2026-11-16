import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";

const formulas = `const dot = (a, b) => a.reduce((sum, x, i) => sum + x * b[i], 0);
const length = (a) => Math.sqrt(dot(a, a));

const cosineSimilarity = (a, b) => dot(a, b) / (length(a) * length(b));
const cosineDistance = (a, b) => 1 - cosineSimilarity(a, b);

const euclidean = (a, b) =>
  Math.sqrt(a.reduce((sum, x, i) => sum + (x - b[i]) ** 2, 0));`;

const databases = [
	{
		system: "pgvector",
		option: "<->",
		returns: "Euclidean distance",
		sort: "ascending",
	},
	{
		system: "pgvector",
		option: "<#>",
		returns: "Negative inner product",
		sort: "ascending",
	},
	{
		system: "pgvector",
		option: "<=>",
		returns: "Cosine distance",
		sort: "ascending",
	},
	{
		system: "FAISS",
		option: "IndexFlatL2",
		returns: "Squared Euclidean distance",
		sort: "ascending",
	},
	{
		system: "FAISS",
		option: "IndexFlatIP",
		returns: "Inner product",
		sort: "descending",
	},
	{
		system: "Qdrant",
		option: "Cosine / Dot / Euclid",
		returns: "Configured per collection",
		sort: "depends",
	},
	{
		system: "Pinecone",
		option: "cosine / dotproduct / euclidean",
		returns: "Configured per index",
		sort: "depends",
	},
];

const guidance = [
	{
		name: "Match the model",
		description:
			"Use the metric the embedding model was trained with. A model trained on cosine can lose ranking quality when served with raw dot product.",
		color: "text-violet-300",
	},
	{
		name: "Match the index",
		description:
			"A vector index fixes its distance function at build time. Rebuilding with a different metric is required to change it later.",
		color: "text-amber-300",
	},
	{
		name: "Normalize once",
		description:
			"If the model outputs unit vectors, dot product, cosine, and Euclidean all rank the same. Normalize when you write and query, not in your head.",
		color: "text-emerald-300",
	},
];

export function MetricChoiceDemo() {
	return (
		<DemoSection
			title="Demo 6: Which metric, and what does your database call it?"
			description="Start from the model's recommendation, then confirm the index was built with the same metric. The names below are the ones you will type in real queries."
		>
			<div className="space-y-5">
				<div className="grid sm:grid-cols-3 gap-3">
					{guidance.map((item) => (
						<div
							key={item.name}
							className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-2"
						>
							<h4 className={`text-sm font-semibold ${item.color}`}>
								{item.name}
							</h4>
							<p className="text-xs text-zinc-400 leading-relaxed">
								{item.description}
							</p>
						</div>
					))}
				</div>

				<div className="grid gap-4 lg:grid-cols-2">
					<div className="space-y-2">
						<p className="text-xs font-semibold text-zinc-200">
							The formulas, in code
						</p>
						<ShikiCode
							language="typescript"
							code={formulas}
							showLineNumbers={false}
							className="text-[11px]"
						/>
					</div>

					<div className="space-y-2">
						<p className="text-xs font-semibold text-zinc-200">
							How the tools name them
						</p>
						<div className="overflow-x-auto rounded-lg border border-zinc-800">
							<table className="w-full min-w-[360px] border-collapse text-xs">
								<thead>
									<tr className="border-b border-zinc-800 bg-zinc-950 text-left text-zinc-400">
										<th className="py-2 px-3 font-medium">System</th>
										<th className="py-2 px-3 font-medium">Option</th>
										<th className="py-2 px-3 font-medium">Returns</th>
										<th className="py-2 px-3 font-medium">Sort</th>
									</tr>
								</thead>
								<tbody>
									{databases.map((row) => (
										<tr
											key={`${row.system}-${row.option}`}
											className="border-b border-zinc-900 bg-zinc-950/60 last:border-0"
										>
											<td className="py-2 px-3 text-zinc-300">{row.system}</td>
											<td className="py-2 px-3 font-mono text-violet-300">
												{row.option}
											</td>
											<td className="py-2 px-3 text-zinc-400">{row.returns}</td>
											<td className="py-2 px-3 text-zinc-500">{row.sort}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						<p className="text-xs text-zinc-500">
							pgvector's <code className="text-zinc-300">{"<#>"}</code> negates
							the inner product so all three operators can be sorted ascending.
							A "bigger is better" inner product becomes "smaller is closer".
						</p>
					</div>
				</div>

				<div className="rounded-lg border border-cyan-900/40 bg-cyan-950/20 p-3 text-xs text-zinc-300">
					Try a few searches you understand and check that the closest matches
					make sense. If they do not, check the metric before tuning anything
					else. A metric mismatch silently degrades ranking without throwing an
					error.
				</div>
			</div>
		</DemoSection>
	);
}
