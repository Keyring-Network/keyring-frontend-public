'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { DataSharingSDK, Session, SessionResult, SessionStatus, DataSharingError } from '@keyringnetwork/data-sharing-sdk';

interface UseDataSharingOptions {
  requestedFields: string[];
  datasourceId?: string;
  onComplete?: (data: SessionResult) => void;
  onError?: (error: DataSharingError) => void;
}

interface UseDataSharingReturn {
  session: Session | null;
  status: SessionStatus | null;
  result: SessionResult | null;
  error: DataSharingError | null;
  isLoading: boolean;
  startVerification: () => Promise<void>;
  reset: () => void;
}

/**
 * React hook for Keyring Data Sharing SDK
 * Manages session lifecycle, WebSocket connection, and state
 */
export function useDataSharing(options: UseDataSharingOptions): UseDataSharingReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<SessionStatus | null>(null);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [error, setError] = useState<DataSharingError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const sdkRef = useRef<DataSharingSDK | null>(null);
  const connectionRef = useRef<{ disconnect: () => void } | null>(null);

  // Initialize SDK once
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_KEYRING_API_KEY;
    if (!apiKey) {
      setError(new DataSharingError('INVALID_CONFIG', 'API key not configured'));
      return;
    }

    sdkRef.current = new DataSharingSDK({
      apiKey,
      environment: (process.env.NEXT_PUBLIC_KEYRING_ENV as any) || 'production',
      debug: process.env.NODE_ENV === 'development'
    });

    return () => {
      // Cleanup connections on unmount
      connectionRef.current?.disconnect();
      sdkRef.current?.disconnectAll();
    };
  }, []);

  const startVerification = useCallback(async () => {
    if (!sdkRef.current) {
      setError(new DataSharingError('INVALID_CONFIG', 'SDK not initialized'));
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Create session
      const newSession = await sdkRef.current.createSession({
        originUrl: window.location.href,
        requestedFields: options.requestedFields,
        datasourceId: options.datasourceId
      });

      setSession(newSession);
      setStatus(newSession.status);

      // Store session in backend for tracking
      try {
        await fetch('/api/backend/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: newSession.sessionId,
            sessionToken: newSession.sessionToken,
            createdAt: new Date().toISOString()
          })
        });
      } catch (err) {
        console.warn('Failed to store session in backend:', err);
      }

      // Connect to WebSocket for real-time updates
      const connection = sdkRef.current.connect(
        newSession.sessionId,
        newSession.sessionToken,
        {
          onStatusChange: (newStatus, data) => {
            setStatus(newStatus);
            
            if (data) {
              setResult(data);
            }

            // Handle completion
            if (newStatus === 'processing_completed' && data) {
              setResult(data);
              options.onComplete?.(data);
              connectionRef.current?.disconnect();
            }

            // Handle failure or expiration
            if (newStatus === 'processing_failed' || newStatus === 'session_expired') {
              if (data) {
                setResult(data);
              }
              connectionRef.current?.disconnect();
            }
          },
          onError: (err) => {
            setError(err);
            options.onError?.(err);
          }
        }
      );

      connectionRef.current = connection;

    } catch (err) {
      const dsError = err instanceof DataSharingError 
        ? err 
        : new DataSharingError('UNKNOWN', err instanceof Error ? err.message : 'Unknown error');
      
      setError(dsError);
      options.onError?.(dsError);
    } finally {
      setIsLoading(false);
    }
  }, [options.requestedFields, options.datasourceId]);

  const reset = useCallback(() => {
    connectionRef.current?.disconnect();
    connectionRef.current = null;
    
    setSession(null);
    setStatus(null);
    setResult(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    session,
    status,
    result,
    error,
    isLoading,
    startVerification,
    reset
  };
}