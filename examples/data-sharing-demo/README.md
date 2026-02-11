# Data Sharing Demo

Complete demo application for the Keyring Data Sharing SDK, including:

- **SDK** (`../packages/data-sharing-sdk`): Platform-agnostic TypeScript SDK
- **Backend** (`apps/backend`): Express server with webhook handling
- **Frontend** (`apps/frontend`): Next.js web application

## Architecture

```
┌─────────────────┐
│   Next.js App   │  Frontend (User Interface)
│  (apps/frontend)│
└────────┬────────┘
         │ SDK
         ▼
┌─────────────────┐
│      SDK        │  TypeScript Library
│ (packages/sdk)  │
└────────┬────────┘
         │ HTTP / WebSocket
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Keyring API    │────▶│  Keyring Mobile │
│ (Data Sharing)  │     │   App (User)    │
└────────┬────────┘     └─────────────────┘
         │ Webhook
         ▼
┌─────────────────┐
│Express Backend  │  Webhook Handler
│ (apps/backend)  │
└─────────────────┘
```

## Quick Start

### 1. Install Dependencies

```bash

cd ../packages/data-sharing-sdk && pnpm install
cd ./apps/backend && pnpm install
cd .apps/frontend && pnpm install
```

### 2. Configure Environment

Backend:

```bash
cd apps/backend
cp .env.example .env
# Edit .env with your webhook secret
```

Frontend:

```bash
cd apps/frontend
cp .env.local.example .env.local
# Edit .env.local with your API key
```

### 3. Build SDK

```bash
cd ../packages/data-sharing-sdk && pnpm run build
```

### 4. Start Development Servers

Terminal 1 - Backend:

```bash
cd ./apps/backend && pnpm run dev
# Server runs on http://localhost:3001
```

Terminal 2 - Frontend:

```bash
cd ./apps/frontend && pnpm run dev
# App runs on http://localhost:3000
```

## Usage

1. Open http://localhost:3000
2. Select fields to request (e.g., `user.country`, `user.kyc_level`)
3. Optional: Choose specific datasource
4. Click "Start Verification"
5. Scan QR code with Keyring mobile app
6. Wait for verification to complete
7. View verified data on success page

## API Endpoints

### Backend

- `POST /webhooks/keyring` - Receive webhooks from Keyring
- `GET /api/sessions/:id` - Get session status
- `GET /api/sessions/:id/result` - Get session result
- `POST /api/sessions` - Store session reference

### Frontend Proxy

- `/api/backend/*` - Proxied to backend server

## SDK Features

- **Platform Agnostic**: Works in browser, Node.js, React Native
- **Real-time Updates**: WebSocket with auto-reconnect
- **Fallback Polling**: HTTP polling when WebSocket unavailable
- **Type Safe**: Full TypeScript support
- **Lightweight**: Minimal dependencies

## Development

### Project Structure

```
data-sharing-demo/
├── packages/
│   └── data-sharing-sdk/     # SDK package
├── apps/
│   ├── backend/              # Express server
│   └── frontend/             # Next.js app
└── package.json              # Root workspace config
```

### Available Scripts

SDK:

- `pnpm run build` - Compile TypeScript
- `pnpm run dev` - Watch mode

Backend:

- `pnpm run dev` - Development with hot reload
- `pnpm run build` - Compile for production
- `pnpm start` - Start production server

Frontend:

- `pnpm run dev` - Development server
- `pnpm run build` - Build for production
- `pnpm start` - Start production server

## Configuration

### Required Environment Variables

**Backend (.env)**:

- `KEYRING_WEBHOOK_SECRET` - From Keyring partner onboarding
- `PORT` - Server port (default: 3001)

**Frontend (.env.local)**:

- `NEXT_PUBLIC_KEYRING_API_KEY` - Your partner API key
- `NEXT_PUBLIC_KEYRING_ENV` - production | sandbox | development
- `NEXT_PUBLIC_BACKEND_URL` - Backend URL

## Testing

### Manual Testing Flow

1. Start backend and frontend
2. Open frontend in browser
3. Select fields and start verification
4. Use Keyring mobile app to scan QR
5. Complete verification flow in mobile app
6. Observe real-time updates in frontend
7. Verify webhook received in backend logs
8. Check stored session data via API

## Troubleshooting

### Common Issues

**SDK not found**: Make sure to build the SDK first (`pnpm run build:sdk`)

**CORS errors**: Check `FRONTEND_URL` in backend `.env`

**Webhook signature invalid**: Verify `KEYRING_WEBHOOK_SECRET` is correct

**WebSocket connection fails**: SDK will automatically fallback to polling
