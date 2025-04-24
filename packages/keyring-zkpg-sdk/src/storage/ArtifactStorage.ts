import { KeyringZKPGArtifacts } from '../core/types';

/**
 * Storage for ZK artifacts
 */
export class ArtifactStorage {
  private dbName = 'KEYRING_ZK_FILES';
  private version = 1;
  private db: IDBDatabase | null = null;
  private dbInitPromise: Promise<void> | null = null;
  private readonly storeName = 'artifacts';
  private readonly artifactKey = 'AUTHORISATION_CONSTRUCTION';

  constructor() {
    // Initialize DB when in browser environment
    if (typeof indexedDB !== 'undefined') {
      this.dbInitPromise = this.initDB();
    }
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(new Error('Failed to open IndexedDB'));

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create artifacts store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  private async ensureDB(): Promise<void> {
    if (this.dbInitPromise) {
      await this.dbInitPromise;
    }

    if (!this.db) {
      throw new Error('IndexedDB not initialized');
    }
  }

  /**
   * Get stored artifact
   */
  async getArtifact(): Promise<KeyringZKPGArtifacts | null> {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        return reject(new Error('IndexedDB not initialized'));
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(this.artifactKey);

      request.onerror = () => reject(new Error('Failed to get artifact'));
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  /**
   * Store artifact
   */
  async storeArtifact(artifact: KeyringZKPGArtifacts): Promise<void> {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        return reject(new Error('IndexedDB not initialized'));
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(artifact, this.artifactKey);

      request.onerror = () => reject(new Error('Failed to store artifact'));
      request.onsuccess = () => resolve();
    });
  }
}
