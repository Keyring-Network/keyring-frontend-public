/**
 * In-memory session storage
 * In production, use Redis or database
 */

export interface StoredSession {
  sessionId: string;
  sessionToken?: string;
  verifiedData?: Record<string, unknown>;
  proofMetadata?: {
    datasourceId: string;
    proverVersion: string;
    verifiedAt: string;
  };
  createdAt?: string;
  receivedAt?: string;
  webhookEventId?: string;
  webhookTimestamp?: string;
}

class SessionStore {
  private sessions: Map<string, StoredSession> = new Map();
  private readonly MAX_SESSIONS = 1000; // Prevent memory leaks
  private readonly SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Store a session
   */
  storeSession(sessionId: string, data: StoredSession): void {
    // Cleanup old sessions if limit reached
    if (this.sessions.size >= this.MAX_SESSIONS) {
      this.cleanupOldSessions();
    }

    this.sessions.set(sessionId, {
      ...data,
      sessionId,
    });

    console.log(
      `💾 Session stored: ${sessionId} (${this.sessions.size} total)`,
    );
  }

  /**
   * Get a session by ID
   */
  getSession(sessionId: string): StoredSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Delete a session
   */
  deleteSession(sessionId: string): boolean {
    const deleted = this.sessions.delete(sessionId);
    if (deleted) {
      console.log(`🗑️  Session deleted: ${sessionId}`);
    }
    return deleted;
  }

  /**
   * Get all sessions (for debugging)
   */
  getAllSessions(): StoredSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Cleanup old sessions to prevent memory leaks
   */
  private cleanupOldSessions(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      const sessionTime = new Date(
        session.receivedAt || session.createdAt || 0,
      ).getTime();

      if (now - sessionTime > this.SESSION_TTL_MS) {
        this.sessions.delete(sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} old sessions`);
    }

    // If still at limit, remove oldest
    if (this.sessions.size >= this.MAX_SESSIONS) {
      const oldestKey = this.sessions.keys().next().value;
      if (oldestKey) {
        this.sessions.delete(oldestKey);
        console.log(`🧹 Removed oldest session: ${oldestKey}`);
      }
    }
  }

  /**
   * Get session count
   */
  getCount(): number {
    return this.sessions.size;
  }

  /**
   * Clear all sessions (use with caution)
   */
  clearAll(): void {
    this.sessions.clear();
    console.log("🧹 All sessions cleared");
  }
}

// Singleton instance
export const sessionStore = new SessionStore();
