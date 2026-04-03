import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ShikiCode } from "../shared/ShikiCode";

type UseCase = "image" | "csv" | "crypto";

export function UseCasesDemo() {
	const [activeCase, setActiveCase] = useState<UseCase>("image");

	return (
		<div className="space-y-8">
			{/* Case selector */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<button
					type="button"
					onClick={() => setActiveCase("image")}
					className={`p-4 rounded-lg border-2 transition-all text-left ${
						activeCase === "image"
							? "border-violet-500 bg-violet-500/20"
							: "border-border-secondary bg-surface-secondary hover:border-border-tertiary"
					}`}
				>
					<div className="text-lg mb-1">🎨 Image Processing</div>
					<div className="text-xs text-text-tertiary">
						Apply filters without blocking UI
					</div>
				</button>

				<button
					type="button"
					onClick={() => setActiveCase("csv")}
					className={`p-4 rounded-lg border-2 transition-all text-left ${
						activeCase === "csv"
							? "border-emerald-500 bg-emerald-500/20"
							: "border-border-secondary bg-surface-secondary hover:border-border-tertiary"
					}`}
				>
					<div className="text-lg mb-1">📊 Data Parsing</div>
					<div className="text-xs text-text-tertiary">
						Parse large CSV/JSON in background
					</div>
				</button>

				<button
					type="button"
					onClick={() => setActiveCase("crypto")}
					className={`p-4 rounded-lg border-2 transition-all text-left ${
						activeCase === "crypto"
							? "border-cyan-500 bg-cyan-500/20"
							: "border-border-secondary bg-surface-secondary hover:border-border-tertiary"
					}`}
				>
					<div className="text-lg mb-1">🔐 Cryptography</div>
					<div className="text-xs text-text-tertiary">
						Hash passwords without freezing form
					</div>
				</button>
			</div>

			{/* Demo content */}
			{activeCase === "image" && <ImageProcessingDemo />}
			{activeCase === "csv" && <CSVParsingDemo />}
			{activeCase === "crypto" && <CryptoDemo />}

			{/* Decision matrix */}
			<div className="bg-surface-primary/50 border border-border-primary rounded-lg p-6">
				<h4 className="text-sm font-semibold text-text-secondary mb-4">
					When to Use Web Workers
				</h4>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-border-primary">
								<th className="text-left py-2 text-text-tertiary font-medium">
									Task Type
								</th>
								<th className="text-center py-2 text-text-tertiary font-medium">
									Use Worker?
								</th>
								<th className="text-left py-2 text-text-tertiary font-medium">
									Reason
								</th>
							</tr>
						</thead>
						<tbody className="text-text-tertiary">
							<tr className="border-b border-border-primary/50">
								<td className="py-3">Heavy computation (&gt;50ms)</td>
								<td className="text-center">
									<span className="text-accent-emerald-soft">✅ Yes</span>
								</td>
								<td>Prevents UI jank</td>
							</tr>
							<tr className="border-b border-border-primary/50">
								<td className="py-3">Quick DOM updates</td>
								<td className="text-center">
									<span className="text-accent-red-soft">❌ No</span>
								</td>
								<td>postMessage overhead &gt; task cost</td>
							</tr>
							<tr className="border-b border-border-primary/50">
								<td className="py-3">Real-time data processing</td>
								<td className="text-center">
									<span className="text-accent-emerald-soft">✅ Yes</span>
								</td>
								<td>Stream processing in background</td>
							</tr>
							<tr className="border-b border-border-primary/50">
								<td className="py-3">Simple calculations (&lt;16ms)</td>
								<td className="text-center">
									<span className="text-accent-red-soft">❌ No</span>
								</td>
								<td>requestAnimationFrame sufficient</td>
							</tr>
							<tr>
								<td className="py-3">User input handling</td>
								<td className="text-center">
									<span className="text-accent-red-soft">❌ No</span>
								</td>
								<td>Must happen on main thread</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>

			{/* Trade-offs */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-6">
					<h4 className="text-sm font-semibold text-accent-emerald mb-3">
						✅ Advantages
					</h4>
					<ul className="space-y-2 text-sm text-text-tertiary">
						<li>• Non-blocking - better UX</li>
						<li>• True parallelism on multi-core CPUs</li>
						<li>• Isolates crashes (worker failure won't crash main thread)</li>
						<li>• Better perceived performance</li>
					</ul>
				</div>

				<div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
					<h4 className="text-sm font-semibold text-accent-red mb-3">
						❌ Trade-offs
					</h4>
					<ul className="space-y-2 text-sm text-text-tertiary">
						<li>• No DOM access (must use postMessage)</li>
						<li>• Serialization overhead for non-transferable data</li>
						<li>• Debugging complexity (separate contexts)</li>
						<li>• Memory overhead (separate heap per worker)</li>
					</ul>
				</div>
			</div>
		</div>
	);
}

function drawInitialImage(ctx: CanvasRenderingContext2D) {
	const gradient = ctx.createLinearGradient(0, 0, 600, 600);
	gradient.addColorStop(0, "#ff006e");
	gradient.addColorStop(0.5, "#8338ec");
	gradient.addColorStop(1, "#3a86ff");

	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, 600, 600);

	ctx.fillStyle = "#ffbe0b";
	ctx.fillRect(150, 150, 300, 300);

	ctx.fillStyle = "#06ffa5";
	ctx.beginPath();
	ctx.arc(300, 300, 120, 0, Math.PI * 2);
	ctx.fill();
}

function ImageProcessingDemo() {
	const [filter, setFilter] = useState<"grayscale" | "blur" | "sepia">(
		"grayscale",
	);
	const [processing, setProcessing] = useState(false);
	const [progress, setProgress] = useState(0);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const workerRef = useRef<Worker | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		drawInitialImage(ctx);

		const workerCode = `
			self.onmessage = (event) => {
				const { imageData, filter, width, height } = event.data;
				const data = imageData.data;

				// Send progress
				self.postMessage({ type: 'progress', value: 0 });

				if (filter === 'grayscale') {
					for (let i = 0; i < data.length; i += 4) {
						const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
						data[i] = data[i + 1] = data[i + 2] = avg;

						if (i % 100000 === 0) {
							self.postMessage({ type: 'progress', value: (i / data.length) * 100 });
						}
					}
				} else if (filter === 'blur') {
					// Multi-pass 3x3 box blur (3 passes approximates Gaussian blur)
					const passes = 3;
					for (let pass = 0; pass < passes; pass++) {
						const copy = new Uint8ClampedArray(data);
						for (let y = 0; y < height; y++) {
							for (let x = 0; x < width; x++) {
								let r = 0, g = 0, b = 0, count = 0;
								for (let dy = -1; dy <= 1; dy++) {
									for (let dx = -1; dx <= 1; dx++) {
										const nx = x + dx, ny = y + dy;
										if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
											const idx = (ny * width + nx) * 4;
											r += copy[idx];
											g += copy[idx + 1];
											b += copy[idx + 2];
											count++;
										}
									}
								}
								const idx = (y * width + x) * 4;
								data[idx] = r / count;
								data[idx + 1] = g / count;
								data[idx + 2] = b / count;
							}
							if (y % 100 === 0) {
								const passProgress = (pass / passes) * 100 + (y / height) * (100 / passes);
								self.postMessage({ type: 'progress', value: passProgress });
							}
						}
					}
				} else if (filter === 'sepia') {
					for (let i = 0; i < data.length; i += 4) {
						const r = data[i], g = data[i + 1], b = data[i + 2];
						data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
						data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
						data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);

						if (i % 100000 === 0) {
							self.postMessage({ type: 'progress', value: (i / data.length) * 100 });
						}
					}
				}

				self.postMessage({ type: 'result', imageData });
			};
		`;

		const blob = new Blob([workerCode], { type: "application/javascript" });
		workerRef.current = new Worker(URL.createObjectURL(blob));

		workerRef.current.onmessage = (e) => {
			if (e.data.type === "progress") {
				setProgress(e.data.value);
			} else if (e.data.type === "result") {
				ctx.putImageData(e.data.imageData, 0, 0);
				setProcessing(false);
				setProgress(100);
			}
		};

		return () => {
			workerRef.current?.terminate();
		};
	}, []);

	const applyFilter = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		setProcessing(true);
		setProgress(0);

		const imageData = ctx.getImageData(0, 0, 600, 600);
		workerRef.current?.postMessage(
			{ imageData, filter, width: 600, height: 600 },
			[imageData.data.buffer],
		);
	};

	const resetImage = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		drawInitialImage(ctx);
		setProgress(0);
	};

	return (
		<div className="space-y-6">
			<div className="bg-surface-primary border border-border-primary rounded-lg p-6">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<h4 className="text-sm font-semibold text-text-secondary mb-4">
							Image Preview
						</h4>
						<canvas
							ref={canvasRef}
							width={600}
							height={600}
							className="border border-border-secondary rounded w-full max-w-[300px]"
						/>
					</div>

					<div className="space-y-4">
						<div>
							<label
								htmlFor="filter-select"
								className="block text-sm text-text-tertiary mb-2"
							>
								Select Filter:
							</label>
							<select
								id="filter-select"
								value={filter}
								onChange={(e) =>
									setFilter(e.target.value as "grayscale" | "blur" | "sepia")
								}
								disabled={processing}
								className="w-full px-3 py-2 bg-surface-secondary border border-border-secondary rounded text-sm focus:outline-none focus:border-violet-500"
							>
								<option value="grayscale">Grayscale</option>
								<option value="blur">Blur</option>
								<option value="sepia">Sepia</option>
							</select>
						</div>

						<div className="flex gap-2">
							<button
								type="button"
								onClick={applyFilter}
								disabled={processing}
								className="flex-1 px-4 py-2 bg-violet-500 hover:bg-violet-600 disabled:bg-surface-tertiary disabled:text-text-muted rounded text-sm font-medium transition-colors"
							>
								{processing ? "Processing..." : "Apply Filter"}
							</button>
							<button
								type="button"
								onClick={resetImage}
								disabled={processing}
								className="px-4 py-2 bg-surface-tertiary hover:bg-surface-tertiary disabled:bg-surface-secondary disabled:text-text-muted rounded text-sm font-medium transition-colors"
							>
								Reset
							</button>
						</div>

						{processing && (
							<div className="space-y-2">
								<div className="flex justify-between text-xs text-text-tertiary">
									<span>Progress</span>
									<span>{Math.round(progress)}%</span>
								</div>
								<div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
									<motion.div
										className="h-full bg-violet-500"
										initial={{ width: 0 }}
										animate={{ width: `${progress}%` }}
									/>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>

			<ShikiCode
				language="javascript"
				code={`// image-worker.js
self.onmessage = async (e) => {
  const { imageData, filter } = e.data;

  // Apply filter to pixel data
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    if (filter === 'grayscale') {
      const avg = (data[i] + data[i+1] + data[i+2]) / 3;
      data[i] = data[i+1] = data[i+2] = avg;
    }

    // Send progress updates
    if (i % 10000 === 0) {
      self.postMessage({ type: 'progress', value: i / data.length });
    }
  }

  self.postMessage({ type: 'result', imageData });
};`}
				className="text-xs"
			/>
		</div>
	);
}

function CSVParsingDemo() {
	const [parsing, setParsing] = useState(false);
	const [progress, setProgress] = useState(0);
	const [result, setResult] = useState<{
		rows: number;
		avgValue: number;
	} | null>(null);
	const workerRef = useRef<Worker | null>(null);

	useEffect(() => {
		const workerCode = `
			self.onmessage = (event) => {
				const { csvData } = event.data;
				const lines = csvData.split('\\n');
				const rows = [];

				for (let i = 1; i < lines.length; i++) {
					const values = lines[i].split(',');
					rows.push({
						id: values[0],
						value: parseFloat(values[1])
					});

					if (i % 1000 === 0) {
						self.postMessage({ type: 'progress', value: (i / lines.length) * 100 });
					}
				}

				const avgValue = rows.reduce((sum, row) => sum + row.value, 0) / rows.length;

				self.postMessage({
					type: 'result',
					data: { rows: rows.length, avgValue }
				});
			};
		`;

		const blob = new Blob([workerCode], { type: "application/javascript" });
		workerRef.current = new Worker(URL.createObjectURL(blob));

		workerRef.current.onmessage = (e) => {
			if (e.data.type === "progress") {
				setProgress(e.data.value);
			} else if (e.data.type === "result") {
				setResult(e.data.data);
				setParsing(false);
				setProgress(100);
			}
		};

		return () => {
			workerRef.current?.terminate();
		};
	}, []);

	const parseCSV = () => {
		setParsing(true);
		setProgress(0);
		setResult(null);

		// Generate sample CSV data
		const rows = Array.from(
			{ length: 10000 },
			(_, i) => `${i},${Math.random() * 100}`,
		);
		const csvData = `id,value\n${rows.join("\n")}`;

		workerRef.current?.postMessage({ csvData });
	};

	return (
		<div className="space-y-6">
			<div className="bg-surface-primary border border-border-primary rounded-lg p-6">
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<h4 className="text-sm font-semibold text-text-secondary">
								Parse 10,000 Row CSV
							</h4>
							<p className="text-xs text-text-muted">
								Process large datasets without blocking UI
							</p>
						</div>
						<button
							type="button"
							onClick={parseCSV}
							disabled={parsing}
							className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-surface-tertiary disabled:text-text-muted rounded text-sm font-medium transition-colors"
						>
							{parsing ? "Parsing..." : "Parse CSV"}
						</button>
					</div>

					{parsing && (
						<div className="space-y-2">
							<div className="flex justify-between text-xs text-text-tertiary">
								<span>Progress</span>
								<span>{Math.round(progress)}%</span>
							</div>
							<div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
								<motion.div
									className="h-full bg-emerald-500"
									initial={{ width: 0 }}
									animate={{ width: `${progress}%` }}
								/>
							</div>
						</div>
					)}

					{result && (
						<motion.div
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded"
						>
							<div className="grid grid-cols-2 gap-4 text-center">
								<div>
									<div className="text-2xl font-bold text-accent-emerald">
										{result.rows.toLocaleString()}
									</div>
									<div className="text-xs text-text-tertiary">Rows Parsed</div>
								</div>
								<div>
									<div className="text-2xl font-bold text-accent-emerald">
										{result.avgValue.toFixed(2)}
									</div>
									<div className="text-xs text-text-tertiary">
										Average Value
									</div>
								</div>
							</div>
						</motion.div>
					)}
				</div>
			</div>

			<ShikiCode
				language="javascript"
				code={`// csv-worker.js
self.onmessage = (event) => {
  const { csvData } = event.data;
  const lines = csvData.split('\\n');
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    rows.push({
      id: values[0],
      value: parseFloat(values[1])
    });

    // Send real-time progress
    if (i % 1000 === 0) {
      self.postMessage({
        type: 'progress',
        value: (i / lines.length) * 100
      });
    }
  }

  // Calculate aggregates
  const avgValue = rows.reduce((sum, row) => sum + row.value, 0) / rows.length;

  self.postMessage({ type: 'result', data: { rows: rows.length, avgValue } });
};`}
				className="text-xs"
			/>
		</div>
	);
}

function CryptoDemo() {
	const [password, setPassword] = useState("");
	const [hashing, setHashing] = useState(false);
	const [hash, setHash] = useState<string | null>(null);
	const workerRef = useRef<Worker | null>(null);

	useEffect(() => {
		const workerCode = `
			async function hashPassword(password) {
				const encoder = new TextEncoder();
				let data = encoder.encode(password);

				// Iteratively hash 10,000 times (PBKDF2-like key stretching)
				for (let i = 0; i < 10000; i++) {
					data = new Uint8Array(await crypto.subtle.digest('SHA-256', data));
				}

				return Array.from(data).map(b => b.toString(16).padStart(2, '0')).join('');
			}

			self.onmessage = async (event) => {
				const { password } = event.data;
				const hash = await hashPassword(password);
				self.postMessage({ hash });
			};
		`;

		const blob = new Blob([workerCode], { type: "application/javascript" });
		workerRef.current = new Worker(URL.createObjectURL(blob));

		workerRef.current.onmessage = (e) => {
			setHash(e.data.hash);
			setHashing(false);
		};

		return () => {
			workerRef.current?.terminate();
		};
	}, []);

	const handleHash = () => {
		if (!password) return;
		setHashing(true);
		setHash(null);
		workerRef.current?.postMessage({ password });
	};

	return (
		<div className="space-y-6">
			<div className="bg-surface-primary border border-border-primary rounded-lg p-6">
				<div className="space-y-4">
					<div>
						<label
							htmlFor="password-input"
							className="block text-sm text-text-tertiary mb-2"
						>
							Enter Password:
						</label>
						<input
							id="password-input"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleHash()}
							placeholder="Type a password..."
							disabled={hashing}
							className="w-full px-3 py-2 bg-surface-secondary border border-border-secondary rounded text-sm focus:outline-none focus:border-cyan-500"
						/>
					</div>

					<button
						type="button"
						onClick={handleHash}
						disabled={hashing || !password}
						className="w-full px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-surface-tertiary disabled:text-text-muted rounded text-sm font-medium transition-colors"
					>
						{hashing ? "Hashing (10,000 iterations)..." : "Hash Password"}
					</button>

					{hash && (
						<motion.div
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded"
						>
							<div className="text-xs text-text-tertiary mb-1">
								Hashed Result:
							</div>
							<div className="font-mono text-sm text-accent-cyan break-all">
								{hash}
							</div>
						</motion.div>
					)}

					<div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded">
						<p className="text-xs text-accent-amber">
							💡 Form remains interactive during hashing. Try typing while
							hashing runs!
						</p>
					</div>
				</div>
			</div>

			<ShikiCode
				language="javascript"
				code={`// crypto-worker.js
self.onmessage = async (event) => {
  const { password } = event.data;

  // Use Web Crypto API for real hashing
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  self.postMessage({ hash });
};

// Main thread stays responsive!`}
				className="text-xs"
			/>
		</div>
	);
}
