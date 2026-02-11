# @keyringnetwork/data-sharing-sdk

Platform-agnostic TypeScript SDK for Keyring Data Sharing API.

## Features

- **Platform Agnostic**: Works in browser, Node.js, and React Native
- **Headless**: No UI components - third party handles all presentation
- **Real-time Updates**: WebSocket connection with automatic reconnection
- **Fallback Support**: HTTP polling when WebSocket unavailable
- **Type Safe**: Full TypeScript support with comprehensive types
- **Lightweight**: Minimal dependencies (axios, ws)

## Installation

```bash
npm install @keyringnetwork/data-sharing-sdk
# or
yarn add @keyringnetwork/data-sharing-sdk
# or
pnpm add @keyringnetwork/data-sharing-sdk
```

## Quick Start

```typescript
import { DataSharingSDK } from '@keyringnetwork/data-sharing-sdk';

// Initialize SDK
const sdk = new DataSharingSDK({
  apiKey: 'your-api-key',
  environment: 'production', // or 'sandbox', 'development'
});

// Create session
const session = await sdk.createSession({
  originUrl: 'https://partner.example.com',
  requestedFields: ['user.country', 'user.kyc_level'],
  datasourceId: 'binance', // optional
});

console.log('QR Code:', session.qrCodeData);
console.log('Session ID:', session.sessionId);
```

## API Reference

### DataSharingSDK

#### Constructor

```typescript
const sdk = new DataSharingSDK({
  apiKey: string;           // Required: Partner API key
  baseUrl?: string;         // Optional: Custom API URL
  environment?: string;     // Optional: 'production' | 'sandbox' | 'development'
  timeout?: number;         // Optional: Request timeout in ms (default: 30000)
  debug?: boolean;          // Optional: Enable debug logging
});
```

#### Methods

##### `createSession(params)`

Create a new data sharing session.

```typescript
const session = await sdk.createSession({
  originUrl: string;        // Required: Origin URL
  requestedFields: string[]; // Required: Fields to request
  datasourceId?: string;    // Optional: Specific datasource
});

// Returns: Session
{
  sessionId: string;
  sessionToken: string;
  qrCodeData: string;
  expiresAt: string;
  status: SessionStatus;
  requestedFields: string[];
  allowedFields: string[];
}
```

##### `connect(sessionId, sessionToken, handlers)`

Connect to WebSocket for real-time updates.

```typescript
const connection = sdk.connect(sessionId, sessionToken, {
  onStatusChange: (status, data) => {
    console.log('Status:', status);
    // 'session_created' | 'client_connected' | 'processing_started' | 
    // 'processing_completed' | 'processing_failed' | 'session_expired'
    
    if (status === 'processing_completed') {
      console.log('Data:', data?.verifiedData);
    }
  },
  onError: (error) => {
    console.error('Error:', error.code, error.message);
  },
  onConnectionChange: (connected) => {
    console.log('Connected:', connected);
  },
});

// Disconnect when done
connection.disconnect();
```

##### `poll(sessionId, sessionToken, options)`

Start polling for updates (fallback when WebSocket unavailable).

```typescript
const stopPolling = sdk.poll(sessionId, sessionToken, {
  interval: 2000,      // Poll every 2 seconds
  timeout: 300000,     // Stop after 5 minutes
  onUpdate: (result) => {
    console.log('Status:', result.status);
    if (result.status === 'processing_completed') {
      console.log('Data:', result.verifiedData);
      stopPolling();    // Stop polling
    }
  },
});
```

##### `getSession(sessionId, sessionToken)`

Get current session status.

```typescript
const result = await sdk.getSession(sessionId, sessionToken);
console.log(result.status);
```

##### `getResult(sessionId, sessionToken)`

Get session result.

```typescript
const result = await sdk.getResult(sessionId, sessionToken);
console.log(result.verifiedData);
```

##### `disconnectAll()`

Disconnect all active connections (useful for cleanup).

```typescript
sdk.disconnectAll();
```

## Error Handling

```typescript
import { DataSharingError } from '@keyringnetwork/data-sharing-sdk';

try {
  const session = await sdk.createSession({...});
} catch (error) {
  if (error instanceof DataSharingError) {
    console.log(error.code);    // Error code
    console.log(error.message); // Error message
    console.log(error.details); // Additional details
  }
}
```

### Error Codes

- `SESSION_CREATION_FAILED` - Failed to create session
- `SESSION_NOT_FOUND` - Session not found
- `SESSION_EXPIRED` - Session has expired
- `NETWORK_ERROR` - Network communication error
- `WEBSOCKET_ERROR` - WebSocket connection error
- `POLLING_ERROR` - HTTP polling error
- `INVALID_CONFIG` - Invalid SDK configuration
- `ALREADY_CONNECTED` - WebSocket already connected
- `NOT_CONNECTED` - WebSocket not connected
- `TIMEOUT` - Operation timed out
- `UNKNOWN` - Unknown error

## Complete Example

```typescript
import { DataSharingSDK } from '@keyringnetwork/data-sharing-sdk';

async function startVerification() {
  // Initialize
  const sdk = new DataSharingSDK({
    apiKey: 'krn_ds_...',
    environment: 'production',
    debug: true,
  });

  try {
    // Create session
    const session = await sdk.createSession({
      originUrl: window.location.href,
      requestedFields: ['user.country', 'user.kyc_level'],
    });

    // Display QR code (third party handles UI)
    displayQRCode(session.qrCodeData);

    // Connect for real-time updates
    const connection = sdk.connect(
      session.sessionId,
      session.sessionToken,
      {
        onStatusChange: (status, data) => {
          updateUI(status);
          
          if (status === 'processing_completed') {
            console.log('Verification complete!', data?.verifiedData);
            connection.disconnect();
          }
          
          if (status === 'processing_failed' || status === 'session_expired') {
            console.error('Verification failed');
            connection.disconnect();
          }
        },
        onError: (error) => {
          console.error('Error:', error);
        },
      }
    );

    // Optional: Fallback polling if WebSocket fails
    // const stopPolling = sdk.poll(session.sessionId, session.sessionToken, {...});

  } catch (error) {
    console.error('Failed to start verification:', error);
  }
}
```

## Environment Configuration

| Environment | Base URL |
|-------------|----------|
| `production` | `https://api.keyring.network` |
| `sandbox` | `https://api.sandbox.keyring.network` |
| `development` | `http://localhost:8000` |

## License

ISC