import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { match } from "ts-pattern";
import { DemoSection } from "../shared/DemoSection";
import { ShikiCode } from "../shared/ShikiCode";
import {
	DB_NAME,
	getAllNotes,
	isIndexedDbAvailable,
	isQuotaError,
	type Note,
	openAppDb,
	putNote,
	STORE_NAME,
} from "./storageDb";

const LOCAL_KEY = "under-the-hood-demo";
const SESSION_KEY = "under-the-hood-session";

type PanelId = "localStorage" | "sessionStorage" | "indexedDB";

interface LogEntry {
	id: number;
	text: string;
	tone: "info" | "success" | "error";
}

let logCounter = 0;

function createLog(text: string, tone: LogEntry["tone"]): LogEntry {
	logCounter += 1;
	return { id: logCounter, text, tone };
}

export function LiveStorageDemo() {
	const [localValue, setLocalValue] = useState<string | null>(null);
	const [sessionValue, setSessionValue] = useState<string | null>(null);
	const [notes, setNotes] = useState<Note[]>([]);
	const [noteTitle, setNoteTitle] = useState("Shopping list");
	const [noteTags, setNoteTags] = useState("groceries, weekly");
	const [log, setLog] = useState<LogEntry[]>([]);
	const [dbError, setDbError] = useState<string | null>(null);
	const [panel, setPanel] = useState<PanelId>("localStorage");

	const append = useCallback((text: string, tone: LogEntry["tone"]) => {
		setLog((current) => [createLog(text, tone), ...current].slice(0, 8));
	}, []);

	const refreshLocal = useCallback(() => {
		const value = window.localStorage.getItem(LOCAL_KEY);
		setLocalValue(value);
	}, []);

	const refreshSession = useCallback(() => {
		const value = window.sessionStorage.getItem(SESSION_KEY);
		setSessionValue(value);
	}, []);

	const refreshNotes = useCallback(async (db: IDBDatabase) => {
		const all = await getAllNotes(db);
		setNotes(all);
	}, []);

	useEffect(() => {
		refreshLocal();
		refreshSession();

		if (!isIndexedDbAvailable()) {
			setDbError("This browser does not expose IndexedDB.");
			return;
		}

		let db: IDBDatabase | null = null;
		let cancelled = false;

		openAppDb(1)
			.then(async (opened) => {
				if (cancelled) {
					opened.close();
					return;
				}
				db = opened;
				await refreshNotes(opened);
				append("Opened the database and read the notes store.", "info");
			})
			.catch((error: unknown) => {
				setDbError(
					error instanceof Error ? error.message : "Could not open IndexedDB",
				);
			});

		return () => {
			cancelled = true;
			db?.close();
		};
	}, [append, refreshLocal, refreshNotes, refreshSession]);

	const writeLocal = () => {
		const value = `theme=dark · ${new Date().toLocaleTimeString()}`;
		try {
			window.localStorage.setItem(LOCAL_KEY, value);
			refreshLocal();
			append("localStorage.setItem → stored a string value.", "success");
		} catch (error) {
			append(
				isQuotaError(error)
					? "localStorage is full. The write was refused."
					: "localStorage.setItem failed.",
				"error",
			);
		}
	};

	const writeSession = () => {
		const value = `step=${Math.floor(Math.random() * 5) + 1}`;
		try {
			window.sessionStorage.setItem(SESSION_KEY, value);
			refreshSession();
			append(
				"sessionStorage.setItem → stored a value for this tab.",
				"success",
			);
		} catch {
			append("sessionStorage.setItem failed.", "error");
		}
	};

	const writeNote = async () => {
		if (!isIndexedDbAvailable()) return;
		let db: IDBDatabase | null = null;
		try {
			db = await openAppDb(1);
			await putNote(db, {
				title: noteTitle.trim() || "Untitled",
				tags: noteTags
					.split(",")
					.map((tag) => tag.trim())
					.filter(Boolean),
			});
			await refreshNotes(db);
			append("IndexedDB put() → stored a structured record.", "success");
		} catch (error) {
			const message = isQuotaError(error)
				? "The quota was exceeded, so the record was not saved."
				: error instanceof Error
					? error.message
					: "The record could not be saved.";
			setDbError(message);
			append(message, "error");
		} finally {
			db?.close();
		}
	};

	const clearAll = () => {
		window.localStorage.removeItem(LOCAL_KEY);
		window.sessionStorage.removeItem(SESSION_KEY);
		refreshLocal();
		refreshSession();
		append("Removed the values from both Web Storage APIs.", "info");
	};

	const panelState = match(panel)
		.with("localStorage", () => ({
			title: "localStorage",
			empty: "Nothing stored yet.",
			value: localValue,
			action: writeLocal,
			actionLabel: "Write a value",
		}))
		.with("sessionStorage", () => ({
			title: "sessionStorage",
			empty: "Nothing stored yet.",
			value: sessionValue,
			action: writeSession,
			actionLabel: "Write a value",
		}))
		.with("indexedDB", () => ({
			title: "IndexedDB",
			empty: "No records yet.",
			value: null,
			action: writeNote,
			actionLabel: "Add a record",
		}))
		.exhaustive();

	return (
		<DemoSection
			title="Demo 2: Live storage — write and read for real"
			description="This demo calls your browser's actual storage APIs. Write a value, then reload the page to see what survived. Everything below is stored on your machine, not in a simulation."
		>
			<div className="space-y-5">
				<div className="flex flex-wrap gap-2">
					{(["localStorage", "sessionStorage", "indexedDB"] as const).map(
						(id) => (
							<button
								key={id}
								type="button"
								onClick={() => setPanel(id)}
								className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
									panel === id
										? "border-orange-500/40 bg-orange-500/10 text-orange-300"
										: "border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:border-zinc-700"
								}`}
							>
								{id}
							</button>
						),
					)}
				</div>

				<div className="grid gap-4 md:grid-cols-2">
					<div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
						<div className="flex items-center justify-between">
							<span className="font-mono text-xs text-orange-300">
								{panelState.title}
							</span>
							<button
								type="button"
								onClick={panelState.action}
								className="rounded-md border border-orange-500/30 bg-orange-500/10 px-2 py-1 text-[11px] text-orange-300 transition-colors hover:bg-orange-500/20"
							>
								{panelState.actionLabel}
							</button>
						</div>

						{panel === "indexedDB" ? (
							<div className="mt-3 space-y-3">
								<label className="block text-xs text-zinc-400">
									Title
									<input
										type="text"
										value={noteTitle}
										onChange={(event) => setNoteTitle(event.target.value)}
										className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-100 outline-none focus:border-orange-500/40"
									/>
								</label>
								<label className="block text-xs text-zinc-400">
									Tags (comma separated)
									<input
										type="text"
										value={noteTags}
										onChange={(event) => setNoteTags(event.target.value)}
										className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-100 outline-none focus:border-orange-500/40"
									/>
								</label>
								<div className="space-y-1">
									{notes.length === 0 ? (
										<p className="text-xs text-zinc-600">
											{dbError ?? panelState.empty}
										</p>
									) : (
										notes.map((note) => (
											<div
												key={note.id}
												className="rounded-md border border-zinc-800 bg-zinc-900/60 px-2 py-1.5"
											>
												<div className="text-xs text-zinc-200">
													{note.title}
												</div>
												<div className="mt-0.5 text-[11px] text-zinc-500">
													id {note.id}
													{note.tags.length > 0 && ` · ${note.tags.join(", ")}`}
												</div>
											</div>
										))
									)}
								</div>
							</div>
						) : (
							<div className="mt-3 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-2">
								{panelState.value ? (
									<span className="font-mono text-xs text-zinc-200">
										{panelState.value}
									</span>
								) : (
									<span className="text-xs text-zinc-600">
										{panelState.empty}
									</span>
								)}
							</div>
						)}
					</div>

					<div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
						<div className="text-xs uppercase tracking-wider text-zinc-500">
							Activity log
						</div>
						<ul className="mt-2 space-y-1.5">
							{log.length === 0 ? (
								<li className="text-xs text-zinc-600">
									Write a value to see what happens.
								</li>
							) : (
								log.map((entry) => (
									<motion.li
										key={entry.id}
										initial={{ opacity: 0, x: -8 }}
										animate={{ opacity: 1, x: 0 }}
										className={`font-mono text-[11px] ${
											entry.tone === "error"
												? "text-rose-300"
												: entry.tone === "success"
													? "text-emerald-300"
													: "text-zinc-400"
										}`}
									>
										{entry.text}
									</motion.li>
								))
							)}
						</ul>
						<button
							type="button"
							onClick={clearAll}
							className="mt-3 rounded-md border border-zinc-800 px-2 py-1 text-[11px] text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
						>
							Clear Web Storage
						</button>
					</div>
				</div>

				<div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4 text-xs leading-relaxed text-zinc-400">
					<strong className="text-orange-300">Try it:</strong> write to{" "}
					<code className="font-mono text-zinc-200">localStorage</code>, then
					reload the page. The value is still there. Write to{" "}
					<code className="font-mono text-zinc-200">sessionStorage</code> and
					reload — it is still there too, because a reload keeps the same tab.
					Close the tab and reopen it, and the session value is gone while the
					local one remains. The IndexedDB records persist in the browser's
					storage on disk.
				</div>

				<ShikiCode
					language="javascript"
					showLineNumbers={false}
					className="text-xs"
					code={`// Web Storage — strings only, synchronous
localStorage.setItem("theme", "dark");
sessionStorage.setItem("wizardStep", "2");

// IndexedDB — structured records, asynchronous
const request = indexedDB.open("${DB_NAME}", 1);
request.onsuccess = () => {
  const db = request.result;
  const tx = db.transaction("${STORE_NAME}", "readwrite");
  tx.objectStore("${STORE_NAME}").add({ title: "Shopping list", tags: ["groceries"] });
};`}
				/>

				<p className="text-xs text-zinc-500">
					Web Storage stores strings only, so any object has to be converted
					with <code className="font-mono">JSON.stringify</code>. IndexedDB
					stores structured values directly, which is why it handles arrays and
					blobs without conversion.
				</p>
			</div>
		</DemoSection>
	);
}
