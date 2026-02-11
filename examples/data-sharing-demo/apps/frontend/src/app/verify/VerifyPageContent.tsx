'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { useDataSharing } from '@/hooks/useDataSharing';

export default function VerifyPageContent() {
  const searchParams = useSearchParams();
  const fieldsParam = searchParams.get('fields');
  const datasourceParam = searchParams.get('datasource');
  
  const requestedFields = fieldsParam ? fieldsParam.split(',') : [];
  const datasource = datasourceParam || undefined;

  const {
    session,
    status,
    result,
    error,
    isLoading,
    startVerification,
    reset
  } = useDataSharing({
    requestedFields,
    datasourceId: datasource,
    onComplete: (data) => {
      console.log('Verification complete:', data);
    },
    onError: (err) => {
      console.error('Verification error:', err);
    }
  });

  useEffect(() => {
    if (requestedFields.length > 0 && !session && !isLoading && !error) {
      startVerification();
    }
  }, [requestedFields]);

  const getStatusDisplay = () => {
    switch (status) {
      case 'session_created':
        return { text: 'Waiting for user to scan QR code...', color: 'text-blue-600' };
      case 'client_connected':
        return { text: 'User connected! Processing...', color: 'text-yellow-600' };
      case 'processing_started':
        return { text: 'Verifying data...', color: 'text-yellow-600' };
      case 'processing_completed':
        return { text: 'Verification complete!', color: 'text-green-600' };
      case 'processing_failed':
        return { text: 'Verification failed', color: 'text-red-600' };
      case 'session_expired':
        return { text: 'Session expired', color: 'text-red-600' };
      default:
        return { text: 'Initializing...', color: 'text-gray-600' };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Data Verification
        </h1>

        {isLoading && !session && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Creating session...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-semibold mb-2">Error</h3>
            <p className="text-red-600">{error.message}</p>
            <button
              onClick={reset}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {session && status !== 'processing_completed' && status !== 'processing_failed' && (
          <>
            <div className="text-center mb-8">
              <p className="text-gray-600 mb-2">
                Scan this QR code with the Keyring mobile app
              </p>
              <div className="inline-block p-4 bg-white rounded-xl shadow-lg">
                <QRCodeSVG
                  value={session.qrCodeData}
                  size={256}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>

            <div className="text-center">
              <div className={`text-lg font-semibold ${statusDisplay.color} mb-2`}>
                {statusDisplay.text}
              </div>
              <p className="text-sm text-gray-500">
                Session ID: {session.sessionId.slice(0, 8)}...
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Expires: {new Date(session.expiresAt).toLocaleTimeString()}
              </p>
            </div>

            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">Requested Fields:</h3>
              <ul className="list-disc list-inside text-gray-600">
                {session.requestedFields.map((field) => (
                  <li key={field}>{field}</li>
                ))}
              </ul>
            </div>
          </>
        )}

        {status === 'processing_completed' && result && (
          <div className="text-center">
            <div className="text-green-600 text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Verification Successful!
            </h2>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6 text-left">
              <h3 className="font-semibold text-green-800 mb-4">Verified Data:</h3>
              <div className="space-y-2">
                {result.verifiedData && Object.entries(result.verifiedData).map(([key, value]) => (
                  <div key={key} className="flex justify-between border-b border-green-200 pb-2">
                    <span className="text-green-700 font-medium">{key}:</span>
                    <span className="text-green-900">{String(value)}</span>
                  </div>
                ))}
              </div>
              
              {result.proofMetadata && (
                <div className="mt-4 pt-4 border-t border-green-200">
                  <p className="text-sm text-green-600">
                    <strong>Datasource:</strong> {result.proofMetadata.datasourceId}
                  </p>
                  <p className="text-sm text-green-600">
                    <strong>Verified at:</strong> {new Date(result.proofMetadata.verifiedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700"
            >
              Start New Verification
            </button>
          </div>
        )}

        {status === 'processing_failed' && (
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">✗</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Verification Failed
            </h2>
            <p className="text-gray-600 mb-6">
              {result?.error || 'The verification process failed. Please try again.'}
            </p>
            <button
              onClick={reset}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700"
            >
              Try Again
            </button>
          </div>
        )}

        {status === 'session_expired' && (
          <div className="text-center">
            <div className="text-orange-600 text-6xl mb-4">⏱</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Session Expired
            </h2>
            <p className="text-gray-600 mb-6">
              The verification session has expired. Please start a new one.
            </p>
            <button
              onClick={reset}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700"
            >
              Start New Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
}