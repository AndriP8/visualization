export const DB_NAME = "under-the-hood-notes";
export const STORE_NAME = "notes";

export interface Note {
	id: number;
	title: string;
	tags: string[];
	createdAt: number;
}

export interface UpgradeEvent {
	oldVersion: number;
	newVersion: number;
	addedIndex: string | null;
}

export function isIndexedDbAvailable(): boolean {
	return typeof indexedDB !== "undefined";
}

export function openAppDb(
	version: number,
	onUpgrade?: (event: UpgradeEvent) => void,
): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, version);

		request.onupgradeneeded = (event) => {
			const db = request.result;
			const tx = request.transaction;
			const oldVersion = event.oldVersion;

			let addedIndex: string | null = null;

			if (!db.objectStoreNames.contains(STORE_NAME)) {
				const store = db.createObjectStore(STORE_NAME, {
					keyPath: "id",
					autoIncrement: true,
				});
				store.createIndex("by-title", "title", { unique: false });
				addedIndex = "by-title";
			} else if (oldVersion < 2) {
				const store = tx?.objectStore(STORE_NAME);
				if (store && !store.indexNames.contains("by-tags")) {
					store.createIndex("by-tags", "tags", { multiEntry: true });
					addedIndex = "by-tags";
				}
			}

			onUpgrade?.({
				oldVersion,
				newVersion: event.newVersion ?? version,
				addedIndex,
			});
		};

		request.onsuccess = () => resolve(request.result);
		request.onerror = () =>
			reject(request.error ?? new Error("Could not open the database"));
		request.onblocked = () =>
			reject(new Error("The database is blocked by another open tab"));
	});
}

export async function putNote(
	db: IDBDatabase,
	note: Omit<Note, "id" | "createdAt">,
): Promise<Note> {
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, "readwrite");
		const store = tx.objectStore(STORE_NAME);
		const createdAt = Date.now();
		const request = store.add({ ...note, createdAt });

		let saved: Note | undefined;
		request.onsuccess = () => {
			saved = { ...note, id: request.result as number, createdAt };
		};
		tx.oncomplete = () => {
			if (saved) resolve(saved);
			else reject(new Error("The record was not saved"));
		};
		tx.onerror = () => reject(tx.error ?? new Error("The transaction failed"));
		tx.onabort = () => reject(tx.error ?? new Error("The transaction aborted"));
	});
}

export async function getAllNotes(db: IDBDatabase): Promise<Note[]> {
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, "readonly");
		const request = tx.objectStore(STORE_NAME).getAll();
		request.onsuccess = () => resolve((request.result ?? []) as Note[]);
		request.onerror = () =>
			reject(request.error ?? new Error("Could not read the records"));
	});
}

export function isQuotaError(error: unknown): boolean {
	return (
		error instanceof DOMException &&
		(error.name === "QuotaExceededError" ||
			error.name === "NS_ERROR_DOM_QUOTA_REACHED")
	);
}
