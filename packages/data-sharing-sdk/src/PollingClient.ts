import { HttpClient } from './HttpClient';
import {
  SessionResult,
  PollOptions,
  StopFunction,
  DataSharingError,
  SessionStatus,
} from './types';

/**
 * Polling client for HTTP-based session updates
 * Used as fallback when WebSocket is unavailable
 */
export class PollingClient {
  private httpClient: HttpClient;
  private debug: boolean;

  constructor(httpClient: HttpClient, debug = false) {
    this.httpClient = httpClient;
    this.debug = debug;
  }

  /**
   * Start polling for session updates
   * Returns a function to stop polling
   */
  startPolling(
    sessionId: string,
    sessionToken: string,
    options: PollOptions = {}
  ): StopFunction {
    const {
      interval = 2000,
      timeout = 300000, // 5 minutes
      onUpdate,
    } = options;

    let isPolling = true;
    let timeoutId: NodeJS.Timeout | null = null;
    let intervalId: NodeJS.Timeout | null = null;
    let startTime = Date.now();

    const poll = async () => {
      if (!isPolling) return;

      try {
        // Check timeout
        if (Date.now() - startTime > timeout) {
          if (this.debug) {
            console.log('[DataSharingSDK] Polling timeout reached');
          }
          stop();
          return;
        }

        const result = await this.httpClient.getResult(sessionId, sessionToken);

        if (this.debug) {
          console.log(`[DataSharingSDK] Poll result: ${result.status}`);
        }

        onUpdate?.(result);

        // Stop polling if session is in a terminal state
        if (
          result.status === 'processing_completed' ||
          result.status === 'processing_failed' ||
          result.status === 'session_expired'
        ) {
          stop();
          return;
        }

        // Schedule next poll
        if (isPolling) {
          intervalId = setTimeout(poll, interval);
        }
      } catch (error) {
        if (this.debug) {
          console.error('[DataSharingSDK] Polling error:', error);
        }

        // Continue polling despite errors (network might recover)
        if (isPolling) {
          intervalId = setTimeout(poll, interval);
        }
      }
    };

    const stop = () => {
      if (this.debug) {
        console.log('[DataSharingSDK] Stopping polling');
      }
      isPolling = false;
      
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      if (intervalId) {
        clearTimeout(intervalId);
        intervalId = null;
      }
    };

    // Start polling
    poll();

    // Return stop function
    return stop;
  }

  /**
   * Poll once and return result
   */
  async pollOnce(sessionId: string, sessionToken: string): Promise<SessionResult> {
    return this.httpClient.getResult(sessionId, sessionToken);
  }
}