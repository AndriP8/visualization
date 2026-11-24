import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { match } from "ts-pattern";
import { insertSteps, removeSteps } from "./heap";

const NAMES = ["Maya", "Otto", "Lena", "Ada", "Ben", "Cleo", "Dora", "Eli"];

const SEVERITIES = [
	{ value: "1", label: "1 — most urgent" },
	{ value: "2", label: "2" },
	{ value: "3", label: "3" },
	{ value: "4", label: "4" },
	{ value: "5", label: "5 — mildest" },
];

interface Patient {
	id: number;
	name: string;
	severity: number;
}

type Tone = "amber" | "emerald" | "cyan";

interface Frame {
	patients: Patient[];
	highlight: number[];
	tone: Tone;
	message: string;
}

const INITIAL_PATIENTS: Patient[] = [
	{ id: 0, name: "Maya", severity: 2 },
	{ id: 1, name: "Otto", severity: 5 },
	{ id: 2, name: "Lena", severity: 3 },
];

function slotClass(index: number, highlight: number[], tone: Tone) {
	return match({
		highlighted: highlight.includes(index),
		tone,
		root: index === 0,
	})
		.with(
			{ highlighted: true, tone: "amber" },
			() => "border-amber-500/60 bg-amber-500/20 text-amber-200",
		)
		.with(
			{ highlighted: true, tone: "emerald" },
			() => "border-emerald-500/60 bg-emerald-500/20 text-emerald-200",
		)
		.with(
			{ highlighted: true, tone: "cyan" },
			() => "border-cyan-500/60 bg-cyan-500/20 text-cyan-200",
		)
		.with(
			{ root: true },
			() => "border-violet-500/40 bg-violet-500/15 text-violet-200",
		)
		.otherwise(() => "border-zinc-700 bg-zinc-800/60 text-zinc-200");
}

function formatLog(list: Patient[]) {
	if (list.length === 0) return "—";
	return list.map((p) => `${p.name} (S${p.severity})`).join(", ");
}

export function PriorityQueueDemo() {
	const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
	const [arrived, setArrived] = useState<Patient[]>(INITIAL_PATIENTS);
	const [treated, setTreated] = useState<Patient[]>([]);
	const [highlight, setHighlight] = useState<number[]>([]);
	const [tone, setTone] = useState<Tone>("cyan");
	const [message, setMessage] = useState("");
	const [playing, setPlaying] = useState(false);
	const [name, setName] = useState(NAMES[3]);
	const [severity, setSeverity] = useState("3");
	const nextId = useRef(INITIAL_PATIENTS.length);
	const timer = useRef<number | null>(null);

	useEffect(
		() => () => {
			if (timer.current !== null) clearTimeout(timer.current);
		},
		[],
	);

	// Severity is the heap key; the patients array applies the same swap
	// indices heap.ts records for the keys.
	function playFrames(frames: Frame[]) {
		if (timer.current !== null) clearTimeout(timer.current);
		setPlaying(true);
		let index = 0;
		const step = () => {
			const frame = frames[index];
			if (!frame) {
				setPlaying(false);
				return;
			}
			setPatients(frame.patients);
			setHighlight(frame.highlight);
			setTone(frame.tone);
			setMessage(frame.message);
			index += 1;
			timer.current = window.setTimeout(step, index === 1 ? 900 : 600);
		};
		step();
	}

	function arrive() {
		if (playing) return;
		const level = Number(severity);
		const patient = { id: nextId.current, name, severity: level };
		nextId.current += 1;
		const { swaps } = insertSteps(
			patients.map((p) => p.severity),
			level,
		);
		let working = [...patients, patient];
		const frames: Frame[] = [
			{
				patients: working,
				highlight: [working.length - 1],
				tone: "cyan",
				message:
					swaps.length > 0
						? `${patient.name} (severity ${level}) takes the next free slot, index ${working.length - 1}.`
						: `${patient.name} (severity ${level}) is not more urgent than the parent — the slot is final.`,
			},
		];
		for (const { a, b } of swaps) {
			const parent = working[b];
			working = [...working];
			[working[a], working[b]] = [working[b], working[a]];
			frames.push({
				patients: working,
				highlight: [a, b],
				tone: "amber",
				message: `Severity ${level} beats severity ${parent.severity} — swap up.`,
			});
		}
		if (swaps.length > 0) {
			const settled = swaps[swaps.length - 1].b;
			frames.push({
				patients: working,
				highlight: [],
				tone: "cyan",
				message: `${patient.name} settled at index ${settled}. The root still holds the most urgent patient.`,
			});
		}
		setArrived((prev) => [...prev, patient]);
		playFrames(frames);
	}

	function treatNext() {
		if (patients.length === 0 || playing) return;
		const keys = patients.map((p) => p.severity);
		const { removed, swaps } = removeSteps(keys);
		if (removed === null) return;
		const treatedPatient = patients[0];
		const frames: Frame[] = [
			{
				patients,
				highlight: [0],
				tone: "emerald",
				message: `${treatedPatient.name} (severity ${treatedPatient.severity}) is the most urgent — treat them.`,
			},
		];
		if (patients.length === 1) {
			frames.push({
				patients: [],
				highlight: [],
				tone: "emerald",
				message: `Treated ${treatedPatient.name}. The waiting room is empty.`,
			});
			setTreated((prev) => [...prev, treatedPatient]);
			playFrames(frames);
			return;
		}
		const last = patients[patients.length - 1];
		const afterMove = patients.slice(0, -1);
		afterMove[0] = last;
		frames.push({
			patients: afterMove,
			highlight: [0],
			tone: "cyan",
			message: `${last.name} (severity ${last.severity}) moves from the last slot to the root.`,
		});
		let working = afterMove;
		for (const { a, b } of swaps) {
			const parent = working[a];
			const child = working[b];
			working = [...working];
			[working[a], working[b]] = [working[b], working[a]];
			frames.push({
				patients: working,
				highlight: [a, b],
				tone: "amber",
				message: `Severity ${child.severity} is more urgent than severity ${parent.severity} — swap down.`,
			});
		}
		frames.push({
			patients: working,
			highlight: [],
			tone: "emerald",
			message:
				working.length > 0
					? `Treated ${treatedPatient.name}. ${working[0].name} (severity ${working[0].severity}) is next.`
					: `Treated ${treatedPatient.name}. The waiting room is empty.`,
		});
		setTreated((prev) => [...prev, treatedPatient]);
		playFrames(frames);
	}

	function reset() {
		if (timer.current !== null) clearTimeout(timer.current);
		setPlaying(false);
		setPatients(INITIAL_PATIENTS);
		setArrived(INITIAL_PATIENTS);
		setTreated([]);
		setHighlight([]);
		setMessage("");
	}

	return (
		<div className="space-y-5">
			<div className="flex flex-wrap items-center gap-2">
				<select
					aria-label="Patient name"
					value={name}
					onChange={(event) => setName(event.target.value)}
					className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200"
				>
					{NAMES.map((option) => (
						<option key={option} value={option}>
							{option}
						</option>
					))}
				</select>
				<select
					aria-label="Severity, 1 is the most urgent"
					value={severity}
					onChange={(event) => setSeverity(event.target.value)}
					className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200"
				>
					{SEVERITIES.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
				<button
					type="button"
					disabled={playing}
					onClick={arrive}
					className="rounded-lg border border-violet-500/30 bg-violet-600/20 px-3 py-1.5 text-sm text-violet-300 disabled:opacity-50"
				>
					Arrive
				</button>
				<button
					type="button"
					disabled={playing || patients.length === 0}
					onClick={treatNext}
					className="rounded-lg border border-rose-500/30 bg-rose-600/20 px-3 py-1.5 text-sm text-rose-300 disabled:opacity-50"
				>
					Treat next patient
				</button>
				<button
					type="button"
					onClick={reset}
					className="rounded-lg border border-zinc-600/40 bg-zinc-700/30 px-3 py-1.5 text-sm text-zinc-300"
				>
					Reset
				</button>
			</div>
			<p className="text-xs text-zinc-500">
				Severity is the heap key:{" "}
				<span className="text-cyan-300">1 is the most urgent</span>, so the
				smallest severity always sits at the root. Every swap below is the same
				sift-up and sift-down you saw above.
			</p>
			{message && (
				<output aria-live="polite" className="block text-sm text-zinc-300">
					{message}
				</output>
			)}
			<div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
				<p className="mb-3 text-xs text-zinc-500">
					Waiting room — the heap array, root first
				</p>
				<div className="flex flex-wrap gap-2">
					<AnimatePresence initial={false}>
						{patients.map((patient, index) => (
							<motion.span
								key={patient.id}
								layout
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, scale: 0.6 }}
								transition={{ duration: 0.35 }}
								className={`rounded-md border px-3 py-2 text-sm ${slotClass(index, highlight, tone)}`}
							>
								<span className="font-medium">{patient.name}</span>
								<span className="ml-2 font-mono text-xs">
									S{patient.severity}
								</span>
								<span className="ml-2 text-xs text-zinc-600">[{index}]</span>
							</motion.span>
						))}
					</AnimatePresence>
					{patients.length === 0 && (
						<span className="text-sm text-zinc-600">Empty waiting room</span>
					)}
				</div>
			</div>
			<p className="text-sm text-zinc-400">
				Next up:{" "}
				<span className="font-medium text-violet-300">
					{patients[0] ? `${patients[0].name} (S${patients[0].severity})` : "—"}
				</span>
			</p>
			<div className="space-y-1">
				<p className="text-sm text-zinc-400">
					Arrived: <span className="text-zinc-300">{formatLog(arrived)}</span>
				</p>
				<p className="text-sm text-zinc-400">
					Treated: <span className="text-zinc-300">{formatLog(treated)}</span>
				</p>
				<p className="text-xs text-zinc-500">
					The queue serves the most urgent patient, not the earliest one —
					compare the two lines above.
				</p>
			</div>
		</div>
	);
}
