import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ShikiCode } from "../shared/ShikiCode";

interface Server {
	id: number;
	name: string;
	color: string;
	virtualNodes: number[];
}

interface HashRingNode {
	hash: number;
	serverId: number;
	label: string;
}

interface RequestKey {
	id: number;
	key: string;
	hash: number;
	assignedServerId: number;
	cacheHit: boolean;
}

const RING_SIZE = 360;

function simpleHash(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return Math.abs(hash) % RING_SIZE;
}

export function ConsistentHashingDemo() {
	const [virtualNodeCount, setVirtualNodeCount] = useState(3);
	const [servers, setServers] = useState<Server[]>([
		{
			id: 1,
			name: "Server A",
			color: "emerald",
			virtualNodes: [0, 1, 2],
		},
		{
			id: 2,
			name: "Server B",
			color: "cyan",
			virtualNodes: [0, 1, 2],
		},
		{
			id: 3,
			name: "Server C",
			color: "violet",
			virtualNodes: [0, 1, 2],
		},
	]);
	const [requestKey, setRequestKey] = useState("user-123");
	const [requestHistory, setRequestHistory] = useState<RequestKey[]>([]);
	const [requestIdCounter, setRequestIdCounter] = useState(0);

	const buildHashRing = (): HashRingNode[] => {
		const nodes: HashRingNode[] = [];
		for (const server of servers) {
			for (let i = 0; i < virtualNodeCount; i++) {
				const hash = simpleHash(`${server.name}-vnode-${i}`);
				nodes.push({
					hash,
					serverId: server.id,
					label: `${server.name}-v${i}`,
				});
			}
		}
		return nodes.sort((a, b) => a.hash - b.hash);
	};

	const findServer = (key: string): number => {
		const keyHash = simpleHash(key);
		const ring = buildHashRing();

		if (ring.length === 0) {
			return servers[0]?.id ?? 0;
		}

		for (const node of ring) {
			if (node.hash >= keyHash) {
				return node.serverId;
			}
		}

		return ring[0].serverId;
	};

	const handleLookup = () => {
		const hash = simpleHash(requestKey);
		const serverId = findServer(requestKey);

		const previousRequest = requestHistory.find((r) => r.key === requestKey);
		const cacheHit = previousRequest
			? previousRequest.assignedServerId === serverId
			: false;

		const newRequest: RequestKey = {
			id: requestIdCounter,
			key: requestKey,
			hash,
			assignedServerId: serverId,
			cacheHit,
		};

		setRequestHistory((prev) => [...prev, newRequest]);
		setRequestIdCounter((prev) => prev + 1);
	};

	const addServer = () => {
		const nextId = Math.max(...servers.map((s) => s.id)) + 1;
		const colors = ["amber", "rose", "indigo", "pink"];
		const color = colors[nextId % colors.length];

		setServers((prev) => [
			...prev,
			{
				id: nextId,
				name: `Server ${String.fromCharCode(64 + nextId)}`,
				color,
				virtualNodes: Array.from({ length: virtualNodeCount }, (_, i) => i),
			},
		]);
	};

	const removeServer = (serverId: number) => {
		if (servers.length <= 2) return;
		setServers((prev) => prev.filter((s) => s.id !== serverId));
	};

	const ring = buildHashRing();
	const currentHash = simpleHash(requestKey);

	const getColorClass = (
		color: string,
	): { bg: string; border: string; text: string } => {
		const colors: Record<string, { bg: string; border: string; text: string }> =
			{
				emerald: {
					bg: "bg-emerald-500",
					border: "border-emerald-500",
					text: "text-accent-emerald-soft",
				},
				cyan: {
					bg: "bg-cyan-500",
					border: "border-cyan-500",
					text: "text-accent-cyan-soft",
				},
				violet: {
					bg: "bg-violet-500",
					border: "border-violet-500",
					text: "text-accent-violet-soft",
				},
				amber: {
					bg: "bg-amber-500",
					border: "border-amber-500",
					text: "text-accent-amber-soft",
				},
				rose: {
					bg: "bg-rose-500",
					border: "border-rose-500",
					text: "text-accent-rose-soft",
				},
				indigo: {
					bg: "bg-indigo-500",
					border: "border-indigo-500",
					text: "text-accent-indigo-soft",
				},
				pink: {
					bg: "bg-pink-500",
					border: "border-pink-500",
					text: "text-accent-pink-soft",
				},
			};
		return (
			colors[color] || {
				bg: "bg-text-muted",
				border: "border-text-muted",
				text: "text-text-tertiary",
			}
		);
	};

	return (
		<div className="space-y-8">
			{/* Controls */}
			<div className="space-y-4">
				<div className="flex flex-wrap gap-3 items-center">
					<input
						type="text"
						value={requestKey}
						onChange={(e) => setRequestKey(e.target.value)}
						placeholder="Enter request key (e.g., user-123)"
						className="px-4 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-text-primary placeholder-text-muted focus:border-amber-500 focus:outline-none flex-1 max-w-xs"
					/>
					<button
						type="button"
						onClick={handleLookup}
						className="px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg font-medium transition-colors"
					>
						Lookup Server
					</button>
					<button
						type="button"
						onClick={addServer}
						className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-colors"
					>
						Add Server
					</button>
				</div>

				<div className="flex items-center gap-4">
					<label
						htmlFor="virtual-nodes-slider"
						className="text-sm text-text-tertiary font-medium"
					>
						Virtual Nodes per Server:
					</label>
					<input
						id="virtual-nodes-slider"
						type="range"
						min="1"
						max="5"
						value={virtualNodeCount}
						onChange={(e) => setVirtualNodeCount(Number(e.target.value))}
						className="w-32 accent-amber-500"
					/>
					<span className="text-text-primary font-mono">
						{virtualNodeCount}
					</span>
				</div>
			</div>

			{/* Hash Ring Visualization */}
			<div className="bg-surface-primary border border-border-primary rounded-xl p-8">
				<div className="relative w-full aspect-square max-w-2xl mx-auto">
					{/* Ring Circle */}
					<div className="absolute inset-0 border-2 border-amber-400/30 rounded-full" />

					{/* Virtual Nodes on Ring */}
					{ring.map((node) => {
						const angle = (node.hash / RING_SIZE) * 2 * Math.PI - Math.PI / 2;
						const radius = 45;
						const x = 50 + radius * Math.cos(angle);
						const y = 50 + radius * Math.sin(angle);

						const server = servers.find((s) => s.id === node.serverId);
						if (!server) return null;

						const colorClass = getColorClass(server.color);

						return (
							<motion.div
								key={node.label}
								className={`absolute w-3 h-3 rounded-full ${colorClass.bg}`}
								style={{
									left: `${x}%`,
									top: `${y}%`,
									transform: "translate(-50%, -50%)",
								}}
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								exit={{ scale: 0 }}
								title={`${node.label} (hash: ${node.hash})`}
							/>
						);
					})}

					{/* Request Key Position */}
					<AnimatePresence mode="wait">
						{requestKey && (
							<motion.div
								key={currentHash}
								className="absolute"
								style={{
									left: `${50 + 45 * Math.cos((currentHash / RING_SIZE) * 2 * Math.PI - Math.PI / 2)}%`,
									top: `${50 + 45 * Math.sin((currentHash / RING_SIZE) * 2 * Math.PI - Math.PI / 2)}%`,
									transform: "translate(-50%, -50%)",
								}}
								initial={{ scale: 0, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								exit={{ scale: 0, opacity: 0 }}
							>
								<div className="w-5 h-5 bg-white rounded-full shadow-lg shadow-white/50 ring-2 ring-amber-400" />
								<div className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-text-primary font-mono bg-surface-primary px-2 py-1 rounded border border-amber-400">
									{requestKey}
								</div>
							</motion.div>
						)}
					</AnimatePresence>

					{/* Center Info */}
					<div className="absolute inset-0 flex items-center justify-center">
						<div className="text-center">
							<div className="text-xs text-text-muted mb-1">Hash Ring</div>
							<div className="text-sm text-text-tertiary">
								{ring.length} virtual nodes
							</div>
						</div>
					</div>
				</div>

				{/* Server Legend */}
				<div className="mt-8 flex flex-wrap gap-3 justify-center">
					{servers.map((server) => {
						const colorClass = getColorClass(server.color);
						return (
							<div
								key={server.id}
								className={`flex items-center gap-2 px-3 py-2 bg-surface-secondary border ${colorClass.border} rounded-lg`}
							>
								<div className={`w-3 h-3 rounded-full ${colorClass.bg}`} />
								<span className="text-sm font-medium text-text-primary">
									{server.name}
								</span>
								{servers.length > 2 && (
									<button
										type="button"
										onClick={() => removeServer(server.id)}
										className="ml-2 text-xs text-accent-red-soft hover:text-accent-red"
									>
										✕
									</button>
								)}
							</div>
						);
					})}
				</div>
			</div>

			{/* Request History with Cache Hits */}
			{requestHistory.length > 0 && (
				<div className="bg-surface-primary border border-border-primary rounded-xl p-6">
					<h4 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
						<span>📊</span>
						Request History (Cache Affinity)
					</h4>
					<div className="space-y-2 max-h-48 overflow-y-auto">
						{requestHistory
							.slice()
							.reverse()
							.map((req) => {
								const server = servers.find(
									(s) => s.id === req.assignedServerId,
								);
								const colorClass = server
									? getColorClass(server.color)
									: getColorClass("zinc");

								return (
									<div
										key={req.id}
										className="flex items-center gap-4 p-3 bg-surface-secondary rounded-lg text-sm"
									>
										<span className="font-mono text-text-tertiary">
											{req.key}
										</span>
										<span className="text-text-faint">→</span>
										<span className={`font-medium ${colorClass.text}`}>
											{server?.name}
										</span>
										{req.cacheHit && (
											<span className="ml-auto text-xs bg-emerald-500/20 text-accent-emerald-soft px-2 py-1 rounded">
												Cache Hit ✓
											</span>
										)}
									</div>
								);
							})}
					</div>
				</div>
			)}

			{/* Code Example */}
			<ShikiCode
				language="javascript"
				code={`class ConsistentHash {
  constructor(virtualNodes = 3) {
    this.ring = new Map();
    this.virtualNodes = virtualNodes;
  }

  hash(key) {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash) + key.charCodeAt(i);
    }
    return Math.abs(hash);
  }

  addServer(server) {
    for (let i = 0; i < this.virtualNodes; i++) {
      const hash = this.hash(\`\${server}-vnode-\${i}\`);
      this.ring.set(hash, server);
    }
  }

  getServer(key) {
    const keyHash = this.hash(key);
    const sortedHashes = Array.from(this.ring.keys()).sort((a, b) => a - b);

    // Find first server clockwise from key hash
    for (const hash of sortedHashes) {
      if (hash >= keyHash) {
        return this.ring.get(hash);
      }
    }

    // Wrap around to first server
    return this.ring.get(sortedHashes[0]);
  }
}`}
				showLineNumbers={true}
				className="text-sm"
			/>

			{/* Key Insight */}
			<div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
				<div className="flex items-start gap-3">
					<div className="text-2xl">💡</div>
					<div>
						<h4 className="font-semibold text-accent-amber mb-1">
							Key Insight
						</h4>
						<p className="text-sm text-text-secondary mb-2">
							When adding or removing a server, only ~1/N keys need to be
							remapped (where N = number of servers). With modulo hashing, ~100%
							of keys would be remapped.
						</p>
						<p className="text-sm text-text-secondary">
							Virtual nodes distribute keys more evenly across servers and
							reduce the impact of server additions/removals. This preserves
							cache locality.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
