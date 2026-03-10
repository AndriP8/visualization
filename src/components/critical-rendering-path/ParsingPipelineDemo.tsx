import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { DemoSection } from "../shared/DemoSection";

const HTML_SNIPPET = `<html>
  <head>
    <title>Hi</title>
  </head>
  <body>
    <h1>Hello</h1>
    <p>World</p>
  </body>
</html>`;

const BYTES_HEX = [
	{ hex: "3C", key: "b0" },
	{ hex: "68", key: "b1" },
	{ hex: "74", key: "b2" },
	{ hex: "6D", key: "b3" },
	{ hex: "6C", key: "b4" },
	{ hex: "3E", key: "b5" },
	{ hex: "0A", key: "b6" },
	{ hex: "20", key: "b7" },
	{ hex: "3C", key: "b8" },
	{ hex: "68", key: "b9" },
	{ hex: "65", key: "b10" },
	{ hex: "61", key: "b11" },
	{ hex: "64", key: "b12" },
	{ hex: "3E", key: "b13" },
	{ hex: "0A", key: "b14" },
	{ hex: "20", key: "b15" },
	{ hex: "20", key: "b16" },
	{ hex: "3C", key: "b17" },
	{ hex: "74", key: "b18" },
	{ hex: "69", key: "b19" },
	{ hex: "74", key: "b20" },
	{ hex: "6C", key: "b21" },
	{ hex: "65", key: "b22" },
	{ hex: "3E", key: "b23" },
	{ hex: "48", key: "b24" },
	{ hex: "69", key: "b25" },
	{ hex: "3C", key: "b26" },
	{ hex: "2F", key: "b27" },
	{ hex: "74", key: "b28" },
	{ hex: "69", key: "b29" },
	{ hex: "74", key: "b30" },
	{ hex: "6C", key: "b31" },
];

const HTML_CHARS: { char: string; key: string }[] = [];
for (let i = 0; i < HTML_SNIPPET.length; i++) {
	HTML_CHARS.push({ char: HTML_SNIPPET[i], key: `c${i}` });
}

interface Token {
	type: "open" | "close" | "text";
	value: string;
	color: string;
}

const TOKENS: Token[] = [
	{ type: "open", value: "<html>", color: "#f59e0b" },
	{ type: "open", value: "<head>", color: "#f59e0b" },
	{ type: "open", value: "<title>", color: "#f59e0b" },
	{ type: "text", value: "Hi", color: "#a78bfa" },
	{ type: "close", value: "</title>", color: "#ef4444" },
	{ type: "close", value: "</head>", color: "#ef4444" },
	{ type: "open", value: "<body>", color: "#f59e0b" },
	{ type: "open", value: "<h1>", color: "#f59e0b" },
	{ type: "text", value: "Hello", color: "#a78bfa" },
	{ type: "close", value: "</h1>", color: "#ef4444" },
	{ type: "open", value: "<p>", color: "#f59e0b" },
	{ type: "text", value: "World", color: "#a78bfa" },
	{ type: "close", value: "</p>", color: "#ef4444" },
	{ type: "close", value: "</body>", color: "#ef4444" },
	{ type: "close", value: "</html>", color: "#ef4444" },
];

interface DomNode {
	tag: string;
	text?: string;
	children?: DomNode[];
}

const DOM_NODES: DomNode[] = [
	{ tag: "html" },
	{ tag: "head" },
	{ tag: "title", text: "Hi" },
	{ tag: "body" },
	{ tag: "h1", text: "Hello" },
	{ tag: "p", text: "World" },
];

interface TreeNode {
	tag: string;
	text?: string;
	children?: TreeNode[];
	x: number;
	y: number;
}

const DOM_TREE: TreeNode = {
	tag: "html",
	x: 200,
	y: 30,
	children: [
		{
			tag: "head",
			x: 100,
			y: 100,
			children: [{ tag: "title", text: "Hi", x: 100, y: 170 }],
		},
		{
			tag: "body",
			x: 300,
			y: 100,
			children: [
				{ tag: "h1", text: "Hello", x: 240, y: 170 },
				{ tag: "p", text: "World", x: 360, y: 170 },
			],
		},
	],
};

interface StageInfo {
	title: string;
	description: string;
	color: string;
}

const STAGES: StageInfo[] = [
	{
		title: "1. Bytes",
		description:
			"The browser receives raw bytes over the network (e.g. Content-Type: text/html).",
		color: "#ef4444",
	},
	{
		title: "2. Characters",
		description:
			"Bytes are converted to characters based on the document encoding (UTF-8).",
		color: "#f59e0b",
	},
	{
		title: "3. Tokens",
		description:
			"The tokenizer breaks characters into meaningful tokens: start tags, end tags, and text content.",
		color: "#22d3ee",
	},
	{
		title: "4. Nodes",
		description:
			"Tokens are converted into Node objects with properties and relationships.",
		color: "#a78bfa",
	},
	{
		title: "5. DOM Tree",
		description:
			"Nodes are linked into a tree data structure representing the document hierarchy.",
		color: "#34d399",
	},
];

function renderTreeSvg(node: TreeNode, parentX?: number, parentY?: number) {
	const elements: React.ReactNode[] = [];

	if (parentX !== undefined && parentY !== undefined) {
		elements.push(
			<motion.line
				key={`edge-${node.tag}-${node.x}-${node.y}`}
				x1={parentX}
				y1={parentY + 16}
				x2={node.x}
				y2={node.y - 4}
				stroke="#3f3f46"
				strokeWidth={2}
				initial={{ pathLength: 0, opacity: 0 }}
				animate={{ pathLength: 1, opacity: 1 }}
				transition={{ duration: 0.4 }}
			/>,
		);
	}

	elements.push(
		<motion.g
			key={`node-${node.tag}-${node.x}-${node.y}`}
			initial={{ opacity: 0, scale: 0.5 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: 0.3 }}
		>
			<rect
				x={node.x - 32}
				y={node.y - 12}
				width={64}
				height={28}
				rx={6}
				fill="#18181b"
				stroke="#34d399"
				strokeWidth={1.5}
			/>
			<text
				x={node.x}
				y={node.y + 4}
				textAnchor="middle"
				fill="#34d399"
				fontSize={11}
				fontFamily="monospace"
			>
				{node.text ? `${node.tag} "${node.text}"` : node.tag}
			</text>
		</motion.g>,
	);

	if (node.children) {
		for (const child of node.children) {
			elements.push(...renderTreeSvg(child, node.x, node.y));
		}
	}

	return elements;
}

export function ParsingPipelineDemo() {
	const [stage, setStage] = useState(-1);

	const next = () => {
		if (stage < STAGES.length - 1) setStage(stage + 1);
	};
	const prev = () => {
		if (stage > -1) setStage(stage - 1);
	};
	const reset = () => setStage(-1);

	return (
		<DemoSection
			title="Demo 1: Parsing Pipeline"
			description="Step through the stages: HTML Bytes → Characters → Tokens → Nodes → DOM Tree."
		>
			{/* Stage indicators */}
			<div className="flex gap-1.5 mb-5 flex-wrap">
				{STAGES.map((s, i) => (
					<button
						key={s.title}
						type="button"
						onClick={() => setStage(i)}
						className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
							i === stage
								? "border-white/20 bg-zinc-800 text-white scale-105"
								: i < stage
									? "border-zinc-700/50 bg-zinc-800/50 text-zinc-400"
									: "border-zinc-800 bg-zinc-900/50 text-zinc-600"
						}`}
					>
						<span
							className="inline-block w-2 h-2 rounded-full mr-1.5"
							style={{
								backgroundColor: i <= stage ? s.color : "#3f3f46",
							}}
						/>
						{s.title}
					</button>
				))}
			</div>

			{/* Controls */}
			<div className="flex gap-3 mb-5">
				<button
					type="button"
					onClick={prev}
					disabled={stage <= -1}
					className="px-4 py-2 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-zinc-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
				>
					← Back
				</button>
				<button
					type="button"
					onClick={next}
					disabled={stage >= STAGES.length - 1}
					className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
				>
					{stage === -1 ? "▶ Start" : "Next →"}
				</button>
				<button
					type="button"
					onClick={reset}
					className="px-4 py-2 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-zinc-300 transition-colors"
				>
					↺ Reset
				</button>
			</div>

			{/* Stage content */}
			<AnimatePresence mode="wait">
				{stage === -1 && (
					<motion.div
						key="idle"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						className="p-6 rounded-lg bg-zinc-800/30 border border-zinc-800 text-center"
					>
						<p className="text-zinc-500 text-sm">
							Click <strong className="text-amber-400">Start</strong> to begin
							the parsing pipeline.
						</p>
						<pre className="mt-4 p-4 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-left text-zinc-400 font-mono overflow-x-auto">
							{HTML_SNIPPET}
						</pre>
					</motion.div>
				)}

				{stage === 0 && (
					<motion.div
						key="bytes"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						className="space-y-3"
					>
						<div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
							<p className="text-xs text-zinc-400 mb-3">
								{STAGES[0].description}
							</p>
							<div className="flex flex-wrap gap-1">
								{BYTES_HEX.map((item) => (
									<motion.span
										key={item.key}
										initial={{ opacity: 0, scale: 0.5 }}
										animate={{ opacity: 1, scale: 1 }}
										className="px-1.5 py-0.5 text-xs font-mono rounded bg-red-500/10 text-red-400 border border-red-500/20"
									>
										0x{item.hex}
									</motion.span>
								))}
								<span className="px-1.5 py-0.5 text-xs font-mono text-zinc-600">
									…
								</span>
							</div>
						</div>
					</motion.div>
				)}

				{stage === 1 && (
					<motion.div
						key="chars"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						className="space-y-3"
					>
						<div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
							<p className="text-xs text-zinc-400 mb-3">
								{STAGES[1].description}
							</p>
							<pre className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono overflow-x-auto">
								{HTML_CHARS.map((item) => (
									<motion.span
										key={item.key}
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										style={{ color: "#f59e0b" }}
									>
										{item.char}
									</motion.span>
								))}
							</pre>
						</div>
					</motion.div>
				)}

				{stage === 2 && (
					<motion.div
						key="tokens"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						className="space-y-3"
					>
						<div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
							<p className="text-xs text-zinc-400 mb-3">
								{STAGES[2].description}
							</p>
							<div className="flex flex-wrap gap-1.5">
								{TOKENS.map((token, i) => (
									<motion.span
										key={`${token.value}-${i}`}
										initial={{ opacity: 0, x: -10 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: i * 0.05 }}
										className="px-2 py-1 text-xs font-mono rounded border"
										style={{
											borderColor: `${token.color}44`,
											backgroundColor: `${token.color}11`,
											color: token.color,
										}}
									>
										<span className="text-zinc-600 mr-1">{token.type}:</span>
										{token.value}
									</motion.span>
								))}
							</div>
						</div>
						<div className="flex gap-3 text-xs text-zinc-500">
							<span>
								<span
									className="inline-block w-2 h-2 rounded-full mr-1"
									style={{ backgroundColor: "#f59e0b" }}
								/>
								Start tag
							</span>
							<span>
								<span
									className="inline-block w-2 h-2 rounded-full mr-1"
									style={{ backgroundColor: "#ef4444" }}
								/>
								End tag
							</span>
							<span>
								<span
									className="inline-block w-2 h-2 rounded-full mr-1"
									style={{ backgroundColor: "#a78bfa" }}
								/>
								Text
							</span>
						</div>
					</motion.div>
				)}

				{stage === 3 && (
					<motion.div
						key="nodes"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						className="space-y-3"
					>
						<div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
							<p className="text-xs text-zinc-400 mb-3">
								{STAGES[3].description}
							</p>
							<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
								{DOM_NODES.map((node, i) => (
									<motion.div
										key={node.tag}
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: i * 0.08 }}
										className="p-3 rounded-lg bg-zinc-900 border border-violet-500/20"
									>
										<div className="text-xs text-zinc-500 mb-1">
											{node.text ? "Text Node" : "Element Node"}
										</div>
										<div className="text-sm font-mono text-violet-400">
											{node.tag}
										</div>
										{node.text && (
											<div className="text-xs text-zinc-400 mt-1">
												text: "{node.text}"
											</div>
										)}
									</motion.div>
								))}
							</div>
						</div>
					</motion.div>
				)}

				{stage === 4 && (
					<motion.div
						key="tree"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						className="space-y-3"
					>
						<div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
							<p className="text-xs text-zinc-400 mb-3">
								{STAGES[4].description}
							</p>
							<svg
								viewBox="0 0 460 210"
								className="w-full max-w-lg mx-auto"
								role="img"
								aria-labelledby="dom-tree-title"
							>
								<title id="dom-tree-title">DOM Tree visualization</title>
								{renderTreeSvg(DOM_TREE)}
							</svg>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Current stage description */}
			{stage >= 0 && (
				<motion.div
					key={stage}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="mt-4 p-3 rounded-lg border text-sm"
					style={{
						borderColor: `${STAGES[stage].color}33`,
						backgroundColor: `${STAGES[stage].color}08`,
						color: STAGES[stage].color,
					}}
				>
					<strong>{STAGES[stage].title}:</strong> {STAGES[stage].description}
				</motion.div>
			)}
		</DemoSection>
	);
}
