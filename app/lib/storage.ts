import { ActivityEntry } from "./types";

const DB_NAME = "good-times-journal";
const DB_VERSION = 1;
const STORE_NAME = "entries";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("date", "date", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const request = action(transaction.objectStore(STORE_NAME));

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getEntries(): Promise<ActivityEntry[]> {
  const entries = await withStore<ActivityEntry[]>("readonly", (store) =>
    store.getAll(),
  );

  return entries.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export async function saveEntry(entry: ActivityEntry): Promise<void> {
  await withStore<IDBValidKey>("readwrite", (store) => store.put(entry));
}

export async function saveEntries(entries: ActivityEntry[]): Promise<void> {
  const database = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    entries.forEach((entry) => store.put(entry));
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function deleteEntry(id: string): Promise<void> {
  await withStore<undefined>("readwrite", (store) => store.delete(id));
}

export async function clearEntries(): Promise<void> {
  await withStore<undefined>("readwrite", (store) => store.clear());
}
