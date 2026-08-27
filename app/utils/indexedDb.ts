const DB_NAME = 'lensflow-local'
const DB_VERSION = 1
export type LocalStore = 'handles' | 'settings' | 'fingerprints' | 'jobs' | 'assets'

function database(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('IndexedDB tidak tersedia.'))
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      for (const name of ['handles', 'settings', 'fingerprints', 'jobs', 'assets'] as LocalStore[]) if (!request.result.objectStoreNames.contains(name)) request.result.createObjectStore(name)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Gagal membuka penyimpanan lokal.'))
  })
}

export async function idbGet<T>(store: LocalStore, key: IDBValidKey): Promise<T | undefined> {
  const db = await database()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(store, 'readonly')
    const request = transaction.objectStore(store).get(key)
    request.onsuccess = () => resolve(request.result as T | undefined)
    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => db.close()
  })
}

export async function idbSet<T>(store: LocalStore, key: IDBValidKey, value: T): Promise<void> {
  const db = await database()
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(store, 'readwrite')
    transaction.objectStore(store).put(value, key)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  }).finally(() => db.close())
}

export async function idbDelete(store: LocalStore, key: IDBValidKey): Promise<void> {
  const db = await database()
  await new Promise<void>((resolve, reject) => { const tx = db.transaction(store, 'readwrite'); tx.objectStore(store).delete(key); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error) }).finally(() => db.close())
}
