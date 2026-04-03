import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ShikiCode } from "../shared/ShikiCode";

type Answer = "yes" | "no" | null;

interface Question {
	id: string;
	text: string;
	yesNext: string | "result";
	noNext: string | "result";
	yesResult?: string;
	noResult?: string;
}

interface Result {
	technology: string;
	icon: string;
	color: string;
	description: string;
	useCases: string[];
}

const QUESTIONS: Record<string, Question> = {
	start: {
		id: "start",
		text: "Do you need bidirectional communication (client ↔ server)?",
		yesNext: "result",
		noNext: "latency",
		yesResult: "websocket",
		noResult: undefined,
	},
	latency: {
		id: "latency",
		text: "Do you need real-time updates (<1 second latency)?",
		yesNext: "frequency",
		noNext: "result",
		yesResult: undefined,
		noResult: "polling",
	},
	frequency: {
		id: "frequency",
		text: "Do updates happen frequently (more than 1/minute)?",
		yesNext: "result",
		noNext: "result",
		yesResult: "sse",
		noResult: "polling",
	},
};

const RESULTS: Record<string, Result> = {
	websocket: {
		technology: "WebSocket",
		icon: "⚡",
		color: "green",
		description: "Full-duplex bidirectional communication",
		useCases: [
			"Real-time chat applications",
			"Multiplayer games",
			"Collaborative editing (Google Docs)",
			"Live trading platforms",
			"IoT device control",
		],
	},
	sse: {
		technology: "Server-Sent Events (SSE)",
		icon: "📡",
		color: "cyan",
		description: "Server → client streaming over HTTP",
		useCases: [
			"Live notifications",
			"Server logs streaming",
			"Social media feeds",
			"Stock price tickers",
			"Progress indicators",
		],
	},
	polling: {
		technology: "HTTP Polling",
		icon: "🔄",
		color: "amber",
		description: "Periodic REST requests",
		useCases: [
			"Email inbox checks",
			"Background sync",
			"Weather updates",
			"Low-frequency dashboards",
			"Batch job status",
		],
	},
};

export function DecisionTreeDemo() {
	const [currentQuestion, setCurrentQuestion] = useState("start");
	const [answers, setAnswers] = useState<Record<string, Answer>>({});
	const [finalResult, setFinalResult] = useState<string | null>(null);

	const handleAnswer = (answer: Answer) => {
		if (!answer) return;

		const question = QUESTIONS[currentQuestion];
		setAnswers((prev) => ({ ...prev, [currentQuestion]: answer }));

		const nextKey = answer === "yes" ? question.yesNext : question.noNext;

		if (nextKey === "result") {
			const resultKey =
				answer === "yes" ? question.yesResult : question.noResult;
			if (resultKey) {
				setFinalResult(resultKey);
			}
		} else {
			setCurrentQuestion(nextKey);
		}
	};

	const reset = () => {
		setCurrentQuestion("start");
		setAnswers({});
		setFinalResult(null);
	};

	const question = QUESTIONS[currentQuestion];
	const result = finalResult ? RESULTS[finalResult] : null;

	return (
		<div className="space-y-6">
			{/* Decision tree visualization */}
			<div className="bg-surface-primary border border-border-secondary rounded-xl p-6 min-h-[400px] flex flex-col items-center justify-center">
				<AnimatePresence mode="wait">
					{!finalResult ? (
						<motion.div
							key={currentQuestion}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -20 }}
							className="w-full max-w-2xl"
						>
							{/* Progress breadcrumbs */}
							<div className="flex items-center justify-center gap-2 mb-8">
								{Object.keys(QUESTIONS).map((qId, idx) => {
									const isAnswered = answers[qId] !== undefined;
									const isCurrent = qId === currentQuestion;

									return (
										<div key={qId} className="flex items-center gap-2">
											<div
												className={`w-2 h-2 rounded-full transition-colors ${
													isAnswered
														? "bg-green-400"
														: isCurrent
															? "bg-violet-400 animate-pulse"
															: "bg-surface-tertiary"
												}`}
											/>
											{idx < Object.keys(QUESTIONS).length - 1 && (
												<div className="w-8 h-0.5 bg-surface-tertiary" />
											)}
										</div>
									);
								})}
							</div>

							{/* Question */}
							<div className="text-center mb-8">
								<h3 className="text-2xl font-semibold text-text-primary mb-2">
									{question.text}
								</h3>
							</div>

							{/* Answer buttons */}
							<div className="grid grid-cols-2 gap-4">
								<button
									type="button"
									onClick={() => handleAnswer("yes")}
									className="px-8 py-6 bg-green-500/10 hover:bg-green-500/20 border-2 border-green-500/40 hover:border-green-500/60 rounded-xl text-accent-green font-semibold text-lg transition-all"
								>
									✓ Yes
								</button>
								<button
									type="button"
									onClick={() => handleAnswer("no")}
									className="px-8 py-6 bg-rose-500/10 hover:bg-rose-500/20 border-2 border-rose-500/40 hover:border-rose-500/60 rounded-xl text-accent-rose font-semibold text-lg transition-all"
								>
									✗ No
								</button>
							</div>
						</motion.div>
					) : (
						<motion.div
							key="result"
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							className="w-full max-w-2xl"
						>
							{/* Result */}
							<div className="text-center mb-8">
								<div className="text-6xl mb-4">{result?.icon}</div>
								<h3 className="text-3xl font-bold text-text-primary mb-2">
									{result?.technology}
								</h3>
								<p className="text-text-tertiary">{result?.description}</p>
							</div>

							{/* Architecture diagram */}
							<div className="bg-surface-secondary/50 rounded-xl p-6 mb-6">
								<div className="flex items-center justify-center gap-8">
									<div className="flex flex-col items-center">
										<div className="w-16 h-16 bg-violet-500/20 border-2 border-violet-500/40 rounded-lg flex items-center justify-center text-2xl mb-2">
											💻
										</div>
										<span className="text-xs text-text-muted">Client</span>
									</div>

									<div className="flex flex-col items-center gap-2">
										{finalResult === "websocket" ? (
											<>
												<div className="flex items-center gap-2">
													<span className="text-accent-green-soft">→</span>
													<div className="w-24 h-1 bg-green-400 rounded" />
													<span className="text-accent-green-soft">→</span>
												</div>
												<div className="flex items-center gap-2">
													<span className="text-accent-cyan-soft">←</span>
													<div className="w-24 h-1 bg-cyan-400 rounded" />
													<span className="text-accent-cyan-soft">←</span>
												</div>
												<span className="text-xs text-text-muted">
													Bidirectional
												</span>
											</>
										) : finalResult === "sse" ? (
											<>
												<div className="w-24 h-1 bg-surface-tertiary rounded" />
												<div className="flex items-center gap-2">
													<span className="text-accent-cyan-soft">←</span>
													<div className="w-24 h-1 bg-cyan-400 rounded" />
													<span className="text-accent-cyan-soft">←</span>
												</div>
												<span className="text-xs text-text-muted">
													Server → Client
												</span>
											</>
										) : (
											<>
												<div className="flex items-center gap-2">
													<span className="text-accent-amber-soft">→</span>
													<div className="w-24 h-1 bg-amber-400 rounded animate-pulse" />
												</div>
												<div className="flex items-center gap-2">
													<span className="text-accent-cyan-soft">←</span>
													<div className="w-24 h-1 bg-cyan-400 rounded animate-pulse" />
												</div>
												<span className="text-xs text-text-muted">
													Periodic Requests
												</span>
											</>
										)}
									</div>

									<div className="flex flex-col items-center">
										<div className="w-16 h-16 bg-cyan-500/20 border-2 border-cyan-500/40 rounded-lg flex items-center justify-center text-2xl mb-2">
											🖥️
										</div>
										<span className="text-xs text-text-muted">Server</span>
									</div>
								</div>
							</div>

							{/* Use cases */}
							<div className="mb-6">
								<h4 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-3">
									Common Use Cases
								</h4>
								<div className="space-y-2">
									{result?.useCases.map((useCase, idx) => (
										<motion.div
											key={useCase}
											initial={{ opacity: 0, x: -10 }}
											animate={{ opacity: 1, x: 0 }}
											transition={{ delay: idx * 0.1 }}
											className="flex items-center gap-2 text-sm text-text-secondary"
										>
											<span className="text-accent-green-soft">•</span>
											<span>{useCase}</span>
										</motion.div>
									))}
								</div>
							</div>

							<button
								type="button"
								onClick={reset}
								className="w-full py-3 bg-violet-600 hover:bg-violet-500 rounded-lg text-text-primary font-semibold transition-colors"
							>
								↺ Start Over
							</button>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* Code examples (shown after result) */}
			{finalResult && result && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="space-y-4"
				>
					<h4 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider">
						Implementation Example
					</h4>

					{finalResult === "websocket" && (
						<ShikiCode
							language="typescript"
							code={`// Client
const ws = new WebSocket('ws://localhost:3000');

ws.onopen = () => {
  ws.send(JSON.stringify({ type: 'join', room: 'chat' }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  displayMessage(message);
};

// Server (Node.js)
const wss = new WebSocketServer({ port: 3000 });

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    // Broadcast to all clients
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  });
});`}
							showLineNumbers={false}
							className="text-xs"
						/>
					)}

					{finalResult === "sse" && (
						<ShikiCode
							language="typescript"
							code={`// Client
const eventSource = new EventSource('/api/notifications');

eventSource.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  showNotification(notification);
};

eventSource.addEventListener('customEvent', (event) => {
  console.log('Custom event:', event.data);
});

// Server (Express)
app.get('/api/notifications', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendNotification = (data) => {
    res.write(\`data: \${JSON.stringify(data)}\\n\\n\`);
  };

  // Send updates as they arrive
  notificationEmitter.on('new', sendNotification);
});`}
							showLineNumbers={false}
							className="text-xs"
						/>
					)}

					{finalResult === "polling" && (
						<ShikiCode
							language="typescript"
							code={`// Simple polling
async function pollForUpdates() {
  try {
    const response = await fetch('/api/status');
    const data = await response.json();
    updateUI(data);
  } catch (error) {
    console.error('Poll failed:', error);
  }
}

// Poll every 30 seconds
setInterval(pollForUpdates, 30000);

// Server
app.get('/api/status', async (req, res) => {
  const status = await db.getStatus();
  res.json(status);
});`}
							showLineNumbers={false}
							className="text-xs"
						/>
					)}
				</motion.div>
			)}

			{/* Decision summary */}
			{!finalResult && (
				<div className="bg-surface-secondary/30 border border-border-secondary rounded-lg p-5">
					<h4 className="text-sm font-semibold text-text-primary mb-3">
						Quick Guide
					</h4>
					<div className="space-y-2 text-sm text-text-tertiary">
						<div className="flex gap-2">
							<span className="text-accent-green-soft">⚡</span>
							<span>
								<strong className="text-text-primary">WebSocket:</strong> Chat,
								gaming, collaborative tools, or any bidirectional real-time
								communication
							</span>
						</div>
						<div className="flex gap-2">
							<span className="text-accent-cyan-soft">📡</span>
							<span>
								<strong className="text-text-primary">SSE:</strong>{" "}
								Notifications, logs, dashboards - when server pushes updates to
								client only
							</span>
						</div>
						<div className="flex gap-2">
							<span className="text-accent-amber-soft">🔄</span>
							<span>
								<strong className="text-text-primary">Polling:</strong>{" "}
								Background sync, email checks - when updates are infrequent
								(&lt;1/min)
							</span>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
