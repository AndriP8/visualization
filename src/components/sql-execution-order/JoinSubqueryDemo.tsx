import { ChevronDown, ChevronRight, FastForward, Play } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

// ============================================================================
// JOIN DEMO DATA
// ============================================================================

type Order = {
	order_id: number;
	user_id: number;
	amount: number;
};

type User = {
	user_id: number;
	name: string;
	country: string;
};

const ORDERS: Order[] = [
	{ order_id: 1, user_id: 101, amount: 250 },
	{ order_id: 2, user_id: 102, amount: 180 },
	{ order_id: 3, user_id: 101, amount: 420 },
	{ order_id: 4, user_id: 105, amount: 90 },
	{ order_id: 5, user_id: 103, amount: 310 },
];

const USERS: User[] = [
	{ user_id: 101, name: "Alice", country: "USA" },
	{ user_id: 102, name: "Bob", country: "Canada" },
	{ user_id: 103, name: "Charlie", country: "UK" },
	{ user_id: 104, name: "Diana", country: "USA" },
];

type JoinType = "INNER" | "LEFT" | "RIGHT" | "CROSS";

type JoinedRow = {
	order_id: number | null;
	user_id: number | null;
	amount: number | null;
	name: string | null;
	country: string | null;
};

// ============================================================================
// SUBQUERY DEMO DATA
// ============================================================================

type Employee = {
	id: number;
	name: string;
	dept: string;
	salary: number;
};

const EMPLOYEES: Employee[] = [
	{ id: 1, name: "Alice", dept: "Engineering", salary: 110000 },
	{ id: 2, name: "Bob", dept: "Engineering", salary: 95000 },
	{ id: 3, name: "Charlie", dept: "Sales", salary: 125000 },
	{ id: 4, name: "Diana", dept: "Sales", salary: 105000 },
	{ id: 5, name: "Evan", dept: "Marketing", salary: 85000 },
	{ id: 6, name: "Fiona", dept: "Marketing", salary: 90000 },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function JoinSubqueryDemo() {
	const [expandedSection, setExpandedSection] = useState<
		"join" | "subquery" | null
	>("join");

	return (
		<div className="space-y-6">
			{/* JOIN Section */}
			<SubSection
				title="A. JOIN Visualization"
				isExpanded={expandedSection === "join"}
				onToggle={() =>
					setExpandedSection(expandedSection === "join" ? null : "join")
				}
			>
				<JoinVisualization />
			</SubSection>

			{/* Subquery Section */}
			<SubSection
				title="B. Subquery Execution"
				isExpanded={expandedSection === "subquery"}
				onToggle={() =>
					setExpandedSection(expandedSection === "subquery" ? null : "subquery")
				}
			>
				<SubqueryVisualization />
			</SubSection>
		</div>
	);
}

// ============================================================================
// SUB-SECTION WRAPPER
// ============================================================================

function SubSection({
	title,
	isExpanded,
	onToggle,
	children,
}: {
	title: string;
	isExpanded: boolean;
	onToggle: () => void;
	children: React.ReactNode;
}) {
	return (
		<div className="border border-zinc-800 rounded-lg bg-zinc-900/50">
			<button
				type="button"
				onClick={onToggle}
				className="w-full px-6 py-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
			>
				<h3 className="text-lg font-semibold text-blue-400">{title}</h3>
				{isExpanded ? (
					<ChevronDown className="w-5 h-5 text-gray-400" />
				) : (
					<ChevronRight className="w-5 h-5 text-gray-400" />
				)}
			</button>

			<AnimatePresence>
				{isExpanded && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.3 }}
						className="overflow-hidden"
					>
						<div className="px-6 pb-6">{children}</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

// ============================================================================
// JOIN VISUALIZATION
// ============================================================================

function JoinVisualization() {
	const [joinType, setJoinType] = useState<JoinType>("INNER");
	const [isAnimating, setIsAnimating] = useState(false);
	const [currentLeftIdx, setCurrentLeftIdx] = useState<number>(-1);
	const [currentRightIdx, setCurrentRightIdx] = useState<number>(-1);
	const [resultRows, setResultRows] = useState<JoinedRow[]>([]);
	const [scannedLeft, setScannedLeft] = useState(0);
	const [scannedRight, setScannedRight] = useState(0);
	const [animSpeed, setAnimSpeed] = useState<0.5 | 1 | 2>(1);
	const abortRef = useRef(false);

	useEffect(() => {
		return () => {
			abortRef.current = true;
		};
	}, []);

	const computeJoinResult = useCallback((): JoinedRow[] => {
		const result: JoinedRow[] = [];

		if (joinType === "CROSS") {
			for (const order of ORDERS) {
				for (const user of USERS) {
					result.push({
						order_id: order.order_id,
						user_id: order.user_id,
						amount: order.amount,
						name: user.name,
						country: user.country,
					});
				}
			}
			return result;
		}

		if (joinType === "INNER") {
			for (const order of ORDERS) {
				const matchingUser = USERS.find((u) => u.user_id === order.user_id);
				if (matchingUser) {
					result.push({
						order_id: order.order_id,
						user_id: order.user_id,
						amount: order.amount,
						name: matchingUser.name,
						country: matchingUser.country,
					});
				}
			}
			return result;
		}

		if (joinType === "LEFT") {
			for (const order of ORDERS) {
				const matchingUser = USERS.find((u) => u.user_id === order.user_id);
				result.push({
					order_id: order.order_id,
					user_id: order.user_id,
					amount: order.amount,
					name: matchingUser?.name ?? null,
					country: matchingUser?.country ?? null,
				});
			}
			return result;
		}

		if (joinType === "RIGHT") {
			for (const user of USERS) {
				const matchingOrders = ORDERS.filter((o) => o.user_id === user.user_id);
				if (matchingOrders.length === 0) {
					result.push({
						order_id: null,
						user_id: user.user_id,
						amount: null,
						name: user.name,
						country: user.country,
					});
				} else {
					for (const order of matchingOrders) {
						result.push({
							order_id: order.order_id,
							user_id: order.user_id,
							amount: order.amount,
							name: user.name,
							country: user.country,
						});
					}
				}
			}
			return result;
		}

		return result;
	}, [joinType]);

	const animateJoin = async () => {
		abortRef.current = false;
		setIsAnimating(true);
		setResultRows([]);
		setScannedLeft(0);
		setScannedRight(0);
		setCurrentLeftIdx(-1);
		setCurrentRightIdx(-1);

		const delay = (ms: number) =>
			new Promise((resolve) => setTimeout(resolve, ms / animSpeed));
		const aborted = () => abortRef.current;

		if (joinType === "CROSS") {
			// CROSS JOIN: show first 3 combinations, then skip
			let count = 0;
			for (let li = 0; li < ORDERS.length; li++) {
				if (aborted()) return;
				setCurrentLeftIdx(li);
				setScannedLeft(li + 1);
				await delay(300);

				for (let ri = 0; ri < USERS.length; ri++) {
					if (aborted()) return;
					if (count >= 3) {
						// Skip animation, just add remaining rows
						const remaining = computeJoinResult();
						setResultRows(remaining);
						setScannedRight(USERS.length * ORDERS.length);
						setCurrentRightIdx(-1);
						setCurrentLeftIdx(-1);
						setIsAnimating(false);
						return;
					}

					setCurrentRightIdx(ri);
					setScannedRight(count + 1);
					await delay(400);

					if (aborted()) return;
					const newRow: JoinedRow = {
						order_id: ORDERS[li].order_id,
						user_id: ORDERS[li].user_id,
						amount: ORDERS[li].amount,
						name: USERS[ri].name,
						country: USERS[ri].country,
					};
					setResultRows((prev) => [...prev, newRow]);
					count++;
					await delay(200);
				}
			}
		} else if (joinType === "RIGHT") {
			// RIGHT JOIN: iterate users (right table) as primary
			for (let ri = 0; ri < USERS.length; ri++) {
				if (aborted()) return;
				setCurrentRightIdx(ri);
				setScannedRight(ri + 1);
				await delay(300);

				if (aborted()) return;
				const matchingOrders = ORDERS.filter(
					(o) => o.user_id === USERS[ri].user_id,
				);

				if (matchingOrders.length === 0) {
					// No match, add NULL row
					const newRow: JoinedRow = {
						order_id: null,
						user_id: USERS[ri].user_id,
						amount: null,
						name: USERS[ri].name,
						country: USERS[ri].country,
					};
					setResultRows((prev) => [...prev, newRow]);
					await delay(400);
				} else {
					for (const order of matchingOrders) {
						if (aborted()) return;
						const newRow: JoinedRow = {
							order_id: order.order_id,
							user_id: order.user_id,
							amount: order.amount,
							name: USERS[ri].name,
							country: USERS[ri].country,
						};
						setResultRows((prev) => [...prev, newRow]);
						await delay(400);
					}
				}
			}
		} else {
			// INNER or LEFT JOIN: iterate orders (left table) as primary
			for (let li = 0; li < ORDERS.length; li++) {
				if (aborted()) return;
				setCurrentLeftIdx(li);
				setScannedLeft(li + 1);
				await delay(300);

				if (aborted()) return;
				const matchingUser = USERS.find(
					(u) => u.user_id === ORDERS[li].user_id,
				);
				const matchingIdx = USERS.findIndex(
					(u) => u.user_id === ORDERS[li].user_id,
				);

				if (matchingIdx >= 0 && matchingUser) {
					setCurrentRightIdx(matchingIdx);
					setScannedRight((prev) => prev + 1);
					await delay(400);

					if (aborted()) return;
					const newRow: JoinedRow = {
						order_id: ORDERS[li].order_id,
						user_id: ORDERS[li].user_id,
						amount: ORDERS[li].amount,
						name: matchingUser.name,
						country: matchingUser.country,
					};
					setResultRows((prev) => [...prev, newRow]);
					await delay(200);
				} else if (joinType === "LEFT") {
					// LEFT JOIN: keep unmatched left rows with NULL
					await delay(400);
					if (aborted()) return;
					const newRow: JoinedRow = {
						order_id: ORDERS[li].order_id,
						user_id: ORDERS[li].user_id,
						amount: ORDERS[li].amount,
						name: null,
						country: null,
					};
					setResultRows((prev) => [...prev, newRow]);
					await delay(200);
				}

				setCurrentRightIdx(-1);
			}
		}

		if (aborted()) return;
		setCurrentLeftIdx(-1);
		setCurrentRightIdx(-1);
		setIsAnimating(false);
	};

	const skipToResult = () => {
		abortRef.current = true;
		setIsAnimating(false);
		setCurrentLeftIdx(-1);
		setCurrentRightIdx(-1);
		const finalResult = computeJoinResult();
		setResultRows(finalResult);
		setScannedLeft(ORDERS.length);
		setScannedRight(
			joinType === "CROSS" ? ORDERS.length * USERS.length : USERS.length,
		);
	};

	return (
		<div className="space-y-6">
			{/* Controls */}
			<div className="flex flex-wrap items-center gap-4">
				<div className="flex items-center gap-2">
					<span className="text-sm text-gray-400">JOIN Type:</span>
					<select
						value={joinType}
						onChange={(e) => {
							setJoinType(e.target.value as JoinType);
							setResultRows([]);
							setCurrentLeftIdx(-1);
							setCurrentRightIdx(-1);
							setScannedLeft(0);
							setScannedRight(0);
						}}
						disabled={isAnimating}
						className="px-3 py-1.5 rounded bg-zinc-800 border border-zinc-700 text-gray-300 text-sm focus:outline-none focus:border-blue-500"
					>
						<option value="INNER">INNER JOIN</option>
						<option value="LEFT">LEFT JOIN</option>
						<option value="RIGHT">RIGHT JOIN</option>
						<option value="CROSS">CROSS JOIN</option>
					</select>
				</div>

				<div className="flex items-center gap-2">
					<span className="text-sm text-gray-400">Speed:</span>
					<div className="flex gap-1">
						{([0.5, 1, 2] as const).map((speed) => (
							<button
								key={speed}
								type="button"
								onClick={() => setAnimSpeed(speed)}
								disabled={isAnimating}
								className={`px-2 py-1 rounded text-xs ${
									animSpeed === speed
										? "bg-blue-500 text-white"
										: "bg-zinc-800 text-gray-400 hover:bg-zinc-700"
								}`}
							>
								{speed}x
							</button>
						))}
					</div>
				</div>

				<button
					type="button"
					onClick={animateJoin}
					disabled={isAnimating}
					className="flex items-center gap-2 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium"
				>
					<Play className="w-4 h-4" />
					Animate JOIN
				</button>

				<button
					type="button"
					onClick={skipToResult}
					disabled={!isAnimating}
					className="flex items-center gap-2 px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium"
				>
					<FastForward className="w-4 h-4" />
					Skip to Result
				</button>
			</div>

			{/* Tables Side by Side */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Orders Table */}
				<div>
					<h4 className="text-sm font-semibold text-emerald-400 mb-2">
						Orders (Left Table)
					</h4>
					<div className="border border-zinc-700 rounded-lg overflow-hidden">
						<table className="w-full text-sm">
							<thead className="bg-zinc-800">
								<tr>
									<th className="px-3 py-2 text-left text-gray-400 font-mono">
										order_id
									</th>
									<th className="px-3 py-2 text-left text-gray-400 font-mono">
										user_id
									</th>
									<th className="px-3 py-2 text-left text-gray-400 font-mono">
										amount
									</th>
								</tr>
							</thead>
							<tbody>
								{ORDERS.map((order, idx) => (
									<motion.tr
										key={order.order_id}
										className={`border-t border-zinc-700 ${
											currentLeftIdx === idx
												? "bg-blue-500/20"
												: "bg-zinc-900/50"
										}`}
										animate={{
											backgroundColor:
												currentLeftIdx === idx
													? "rgba(59, 130, 246, 0.2)"
													: "rgba(24, 24, 27, 0.5)",
										}}
									>
										<td className="px-3 py-2 font-mono">{order.order_id}</td>
										<td className="px-3 py-2 font-mono">{order.user_id}</td>
										<td className="px-3 py-2 font-mono">${order.amount}</td>
									</motion.tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				{/* Users Table */}
				<div>
					<h4 className="text-sm font-semibold text-purple-400 mb-2">
						Users (Right Table)
					</h4>
					<div className="border border-zinc-700 rounded-lg overflow-hidden">
						<table className="w-full text-sm">
							<thead className="bg-zinc-800">
								<tr>
									<th className="px-3 py-2 text-left text-gray-400 font-mono">
										user_id
									</th>
									<th className="px-3 py-2 text-left text-gray-400 font-mono">
										name
									</th>
									<th className="px-3 py-2 text-left text-gray-400 font-mono">
										country
									</th>
								</tr>
							</thead>
							<tbody>
								{USERS.map((user, idx) => (
									<motion.tr
										key={user.user_id}
										className={`border-t border-zinc-700 ${
											currentRightIdx === idx
												? "bg-emerald-500/20"
												: "bg-zinc-900/50"
										}`}
										animate={{
											backgroundColor:
												currentRightIdx === idx
													? "rgba(16, 185, 129, 0.2)"
													: "rgba(24, 24, 27, 0.5)",
										}}
									>
										<td className="px-3 py-2 font-mono">{user.user_id}</td>
										<td className="px-3 py-2 font-mono">{user.name}</td>
										<td className="px-3 py-2 font-mono">{user.country}</td>
									</motion.tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			{/* Metrics */}
			<div className="flex items-center gap-6 text-sm">
				<div className="text-gray-400">
					<span className="text-emerald-400 font-semibold">Scanned:</span>{" "}
					{scannedLeft} orders × {scannedRight}{" "}
					{joinType === "CROSS" ? "combinations" : "users"}
				</div>
				<div className="text-gray-400">
					<span className="text-blue-400 font-semibold">Result:</span>{" "}
					{resultRows.length} rows
				</div>
			</div>

			{/* Result Table */}
			{resultRows.length > 0 && (
				<div>
					<h4 className="text-sm font-semibold text-blue-400 mb-2">
						Result ({joinType} JOIN)
					</h4>
					<div className="border border-zinc-700 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
						<table className="w-full text-sm">
							<thead className="bg-zinc-800 sticky top-0">
								<tr>
									<th className="px-3 py-2 text-left text-gray-400 font-mono">
										order_id
									</th>
									<th className="px-3 py-2 text-left text-gray-400 font-mono">
										user_id
									</th>
									<th className="px-3 py-2 text-left text-gray-400 font-mono">
										amount
									</th>
									<th className="px-3 py-2 text-left text-gray-400 font-mono">
										name
									</th>
									<th className="px-3 py-2 text-left text-gray-400 font-mono">
										country
									</th>
								</tr>
							</thead>
							<tbody>
								<AnimatePresence>
									{resultRows.map((row, idx) => (
										<motion.tr
											key={`${row.order_id}-${row.user_id}-${idx}`}
											initial={{ opacity: 0, x: -20 }}
											animate={{ opacity: 1, x: 0 }}
											className="border-t border-zinc-700 bg-zinc-900/50"
										>
											<td className="px-3 py-2 font-mono">
												{row.order_id ?? (
													<span className="text-gray-600">NULL</span>
												)}
											</td>
											<td className="px-3 py-2 font-mono">{row.user_id}</td>
											<td className="px-3 py-2 font-mono">
												{row.amount !== null ? (
													`$${row.amount}`
												) : (
													<span className="text-gray-600">NULL</span>
												)}
											</td>
											<td className="px-3 py-2 font-mono">
												{row.name ?? (
													<span className="text-gray-600">NULL</span>
												)}
											</td>
											<td className="px-3 py-2 font-mono">
												{row.country ?? (
													<span className="text-gray-600">NULL</span>
												)}
											</td>
										</motion.tr>
									))}
								</AnimatePresence>
							</tbody>
						</table>
					</div>
					{joinType === "CROSS" && resultRows.length === 3 && isAnimating && (
						<p className="text-xs text-gray-500 mt-2 italic">
							... {ORDERS.length * USERS.length - 3} more rows (animation
							skipped for brevity)
						</p>
					)}
				</div>
			)}
		</div>
	);
}

// ============================================================================
// SUBQUERY VISUALIZATION
// ============================================================================

function SubqueryVisualization() {
	const [activeDemo, setActiveDemo] = useState<"non-correlated" | "correlated">(
		"non-correlated",
	);
	const [isAnimating, setIsAnimating] = useState(false);
	const [subqueryExecCount, setSubqueryExecCount] = useState(0);
	const [cachedAvg, setCachedAvg] = useState<number | null>(null);
	const [currentOuterIdx, setCurrentOuterIdx] = useState(-1);
	const [currentDept, setCurrentDept] = useState<string | null>(null);
	const [deptAvg, setDeptAvg] = useState<number | null>(null);
	const [resultRows, setResultRows] = useState<Employee[]>([]);
	const abortRef = useRef(false);

	useEffect(() => {
		return () => {
			abortRef.current = true;
		};
	}, []);

	const computeGlobalAvg = () => {
		const total = EMPLOYEES.reduce((sum, emp) => sum + emp.salary, 0);
		return Math.round(total / EMPLOYEES.length);
	};

	const computeDeptAvg = (dept: string) => {
		const deptEmps = EMPLOYEES.filter((e) => e.dept === dept);
		const total = deptEmps.reduce((sum, emp) => sum + emp.salary, 0);
		return Math.round(total / deptEmps.length);
	};

	const animateNonCorrelated = async () => {
		abortRef.current = false;
		setIsAnimating(true);
		setSubqueryExecCount(0);
		setCachedAvg(null);
		setCurrentOuterIdx(-1);
		setResultRows([]);

		const delay = (ms: number) =>
			new Promise((resolve) => setTimeout(resolve, ms));
		const aborted = () => abortRef.current;

		// Step 1: Execute subquery ONCE
		await delay(500);
		if (aborted()) return;
		setSubqueryExecCount(1);
		await delay(700);
		if (aborted()) return;
		const avg = computeGlobalAvg();
		setCachedAvg(avg);
		await delay(700);

		// Step 2: Scan outer query
		for (let i = 0; i < EMPLOYEES.length; i++) {
			if (aborted()) return;
			setCurrentOuterIdx(i);
			await delay(600);

			if (aborted()) return;
			if (EMPLOYEES[i].salary > avg) {
				setResultRows((prev) => [...prev, EMPLOYEES[i]]);
			}
			await delay(400);
		}

		if (aborted()) return;
		setCurrentOuterIdx(-1);
		setIsAnimating(false);
	};

	const animateCorrelated = async () => {
		abortRef.current = false;
		setIsAnimating(true);
		setSubqueryExecCount(0);
		setCurrentOuterIdx(-1);
		setCurrentDept(null);
		setDeptAvg(null);
		setResultRows([]);

		const delay = (ms: number) =>
			new Promise((resolve) => setTimeout(resolve, ms));
		const aborted = () => abortRef.current;

		// Step: For each outer row, execute subquery
		for (let i = 0; i < EMPLOYEES.length; i++) {
			if (aborted()) return;
			setCurrentOuterIdx(i);
			setCurrentDept(EMPLOYEES[i].dept);
			await delay(500);

			if (aborted()) return;
			// Execute subquery for this department
			setSubqueryExecCount((prev) => prev + 1);
			await delay(700);
			if (aborted()) return;
			const avg = computeDeptAvg(EMPLOYEES[i].dept);
			setDeptAvg(avg);
			await delay(700);

			if (aborted()) return;
			if (EMPLOYEES[i].salary > avg) {
				setResultRows((prev) => [...prev, EMPLOYEES[i]]);
			}
			await delay(400);

			setDeptAvg(null);
		}

		if (aborted()) return;
		setCurrentOuterIdx(-1);
		setCurrentDept(null);
		setIsAnimating(false);
	};

	return (
		<div className="space-y-6">
			{/* Toggle Demo Type */}
			<div className="flex items-center gap-2">
				<button
					type="button"
					onClick={() => {
						setActiveDemo("non-correlated");
						setSubqueryExecCount(0);
						setCachedAvg(null);
						setResultRows([]);
						setCurrentOuterIdx(-1);
					}}
					disabled={isAnimating}
					className={`px-4 py-2 rounded text-sm font-medium ${
						activeDemo === "non-correlated"
							? "bg-blue-600 text-white"
							: "bg-zinc-800 text-gray-400 hover:bg-zinc-700"
					}`}
				>
					Non-Correlated Subquery
				</button>
				<button
					type="button"
					onClick={() => {
						setActiveDemo("correlated");
						setSubqueryExecCount(0);
						setDeptAvg(null);
						setResultRows([]);
						setCurrentOuterIdx(-1);
					}}
					disabled={isAnimating}
					className={`px-4 py-2 rounded text-sm font-medium ${
						activeDemo === "correlated"
							? "bg-purple-600 text-white"
							: "bg-zinc-800 text-gray-400 hover:bg-zinc-700"
					}`}
				>
					Correlated Subquery
				</button>
			</div>

			{/* Non-Correlated Demo */}
			{activeDemo === "non-correlated" && (
				<div className="space-y-4">
					<div className="border border-zinc-700 rounded-lg p-4 bg-zinc-900/50">
						<pre className="text-sm text-gray-300 font-mono">
							<span className="text-blue-400">SELECT</span> name, salary{"\n"}
							<span className="text-blue-400">FROM</span> employees{"\n"}
							<span className="text-blue-400">WHERE</span> salary {">"}{" "}
							<span className="text-purple-400">
								(SELECT AVG(salary) FROM employees)
							</span>
							;
						</pre>
					</div>

					<button
						type="button"
						onClick={animateNonCorrelated}
						disabled={isAnimating}
						className="flex items-center gap-2 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium"
					>
						<Play className="w-4 h-4" />
						Animate Execution
					</button>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
						{/* Employees Table */}
						<div>
							<h4 className="text-sm font-semibold text-emerald-400 mb-2">
								Employees Table
							</h4>
							<div className="border border-zinc-700 rounded-lg overflow-hidden">
								<table className="w-full text-sm">
									<thead className="bg-zinc-800">
										<tr>
											<th className="px-3 py-2 text-left text-gray-400 font-mono">
												name
											</th>
											<th className="px-3 py-2 text-left text-gray-400 font-mono">
												dept
											</th>
											<th className="px-3 py-2 text-left text-gray-400 font-mono">
												salary
											</th>
										</tr>
									</thead>
									<tbody>
										{EMPLOYEES.map((emp, idx) => (
											<motion.tr
												key={emp.id}
												className={`border-t border-zinc-700 ${
													currentOuterIdx === idx
														? "bg-blue-500/20"
														: "bg-zinc-900/50"
												}`}
											>
												<td className="px-3 py-2 font-mono">{emp.name}</td>
												<td className="px-3 py-2 font-mono">{emp.dept}</td>
												<td className="px-3 py-2 font-mono">
													${emp.salary.toLocaleString()}
												</td>
											</motion.tr>
										))}
									</tbody>
								</table>
							</div>
						</div>

						{/* Execution Info */}
						<div className="space-y-4">
							<div className="border border-zinc-700 rounded-lg p-4 bg-zinc-900/50">
								<div className="text-sm space-y-2">
									<div className="flex items-center justify-between">
										<span className="text-gray-400">Subquery Executions:</span>
										<span className="text-emerald-400 font-bold text-lg">
											{subqueryExecCount}
										</span>
									</div>
									{cachedAvg !== null && (
										<div className="flex items-center justify-between">
											<span className="text-gray-400">AVG(salary):</span>
											<span className="text-purple-400 font-mono">
												${cachedAvg.toLocaleString()}
											</span>
										</div>
									)}
								</div>
							</div>

							{resultRows.length > 0 && (
								<div>
									<h4 className="text-sm font-semibold text-blue-400 mb-2">
										Result
									</h4>
									<div className="border border-zinc-700 rounded-lg overflow-hidden">
										<table className="w-full text-sm">
											<thead className="bg-zinc-800">
												<tr>
													<th className="px-3 py-2 text-left text-gray-400 font-mono">
														name
													</th>
													<th className="px-3 py-2 text-left text-gray-400 font-mono">
														salary
													</th>
												</tr>
											</thead>
											<tbody>
												<AnimatePresence>
													{resultRows.map((emp) => (
														<motion.tr
															key={emp.id}
															initial={{ opacity: 0, x: -20 }}
															animate={{ opacity: 1, x: 0 }}
															className="border-t border-zinc-700 bg-zinc-900/50"
														>
															<td className="px-3 py-2 font-mono">
																{emp.name}
															</td>
															<td className="px-3 py-2 font-mono">
																${emp.salary.toLocaleString()}
															</td>
														</motion.tr>
													))}
												</AnimatePresence>
											</tbody>
										</table>
									</div>
								</div>
							)}
						</div>
					</div>

					<div className="text-xs text-gray-500 italic border-l-2 border-blue-500 pl-3">
						✓ Subquery executed once, result cached and reused for each row
					</div>
				</div>
			)}

			{/* Correlated Demo */}
			{activeDemo === "correlated" && (
				<div className="space-y-4">
					<div className="border border-zinc-700 rounded-lg p-4 bg-zinc-900/50">
						<pre className="text-sm text-gray-300 font-mono">
							<span className="text-blue-400">SELECT</span> name, salary{"\n"}
							<span className="text-blue-400">FROM</span> employees e1{"\n"}
							<span className="text-blue-400">WHERE</span> salary {">"}{" "}
							<span className="text-purple-400">
								(SELECT AVG(salary) FROM employees e2 WHERE e2.dept = e1.dept)
							</span>
							;
						</pre>
					</div>

					<button
						type="button"
						onClick={animateCorrelated}
						disabled={isAnimating}
						className="flex items-center gap-2 px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium"
					>
						<Play className="w-4 h-4" />
						Animate Execution
					</button>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
						{/* Employees Table */}
						<div>
							<h4 className="text-sm font-semibold text-emerald-400 mb-2">
								Employees Table
							</h4>
							<div className="border border-zinc-700 rounded-lg overflow-hidden">
								<table className="w-full text-sm">
									<thead className="bg-zinc-800">
										<tr>
											<th className="px-3 py-2 text-left text-gray-400 font-mono">
												name
											</th>
											<th className="px-3 py-2 text-left text-gray-400 font-mono">
												dept
											</th>
											<th className="px-3 py-2 text-left text-gray-400 font-mono">
												salary
											</th>
										</tr>
									</thead>
									<tbody>
										{EMPLOYEES.map((emp, idx) => (
											<motion.tr
												key={emp.id}
												className={`border-t border-zinc-700 ${
													currentOuterIdx === idx
														? "bg-purple-500/20"
														: "bg-zinc-900/50"
												}`}
											>
												<td className="px-3 py-2 font-mono">{emp.name}</td>
												<td className="px-3 py-2 font-mono">{emp.dept}</td>
												<td className="px-3 py-2 font-mono">
													${emp.salary.toLocaleString()}
												</td>
											</motion.tr>
										))}
									</tbody>
								</table>
							</div>
						</div>

						{/* Execution Info */}
						<div className="space-y-4">
							<div className="border border-zinc-700 rounded-lg p-4 bg-zinc-900/50">
								<div className="text-sm space-y-2">
									<div className="flex items-center justify-between">
										<span className="text-gray-400">Subquery Executions:</span>
										<span className="text-rose-400 font-bold text-lg">
											{subqueryExecCount}
										</span>
									</div>
									{currentDept && (
										<div className="flex items-center justify-between">
											<span className="text-gray-400">Current Dept:</span>
											<span className="text-purple-400 font-mono">
												{currentDept}
											</span>
										</div>
									)}
									{deptAvg !== null && (
										<div className="flex items-center justify-between">
											<span className="text-gray-400">Dept AVG(salary):</span>
											<span className="text-purple-400 font-mono">
												${deptAvg.toLocaleString()}
											</span>
										</div>
									)}
								</div>
							</div>

							{resultRows.length > 0 && (
								<div>
									<h4 className="text-sm font-semibold text-purple-400 mb-2">
										Result
									</h4>
									<div className="border border-zinc-700 rounded-lg overflow-hidden">
										<table className="w-full text-sm">
											<thead className="bg-zinc-800">
												<tr>
													<th className="px-3 py-2 text-left text-gray-400 font-mono">
														name
													</th>
													<th className="px-3 py-2 text-left text-gray-400 font-mono">
														salary
													</th>
												</tr>
											</thead>
											<tbody>
												<AnimatePresence>
													{resultRows.map((emp) => (
														<motion.tr
															key={emp.id}
															initial={{ opacity: 0, x: -20 }}
															animate={{ opacity: 1, x: 0 }}
															className="border-t border-zinc-700 bg-zinc-900/50"
														>
															<td className="px-3 py-2 font-mono">
																{emp.name}
															</td>
															<td className="px-3 py-2 font-mono">
																${emp.salary.toLocaleString()}
															</td>
														</motion.tr>
													))}
												</AnimatePresence>
											</tbody>
										</table>
									</div>
								</div>
							)}
						</div>
					</div>

					<div className="text-xs text-gray-500 italic border-l-2 border-rose-500 pl-3">
						⚠ Subquery re-executed for each outer row — potentially expensive!
						Modern databases may optimize with semi-joins or materialization.
					</div>
				</div>
			)}
		</div>
	);
}
