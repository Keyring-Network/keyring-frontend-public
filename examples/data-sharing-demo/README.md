# Data Sharing Demo

Complete demo application for the Keyring Data Sharing SDK, including:

- **Backend** (`apps/backend`): Express server with webhook handling
- **Frontend** (`apps/frontend`): Next.js web application
- **Local SDK link** (`@keyringnetwork/data-sharing-sdk`): Linked via pnpm for local development

## Architecture

```
                                  Flow Selection (Step 2)
                             ┌──────────────┬──────────────┐
                             │   Mobile     │  Extension   │
                             │   (QR)       │ (No QR)      │
                             └──────┬───────┴──────┬───────┘
                                    │              │
┌───────────────────────────────────▼──────────────▼──────────────────────────┐
│                    Next.js App (apps/frontend)                              │
│         Step 1: Select Fields -> Step 2: Choose Flow -> Step 3: Verify      │
└───────────────────────────────────┬──────────────────────────────────────────┘
                                    │ SDK (HTTP / WebSocket)
                                    ▼
                          ┌─────────────────────────┐
                          │ Keyring Data Sharing API│
                          └───────────┬─────────────┘
                                      │
                     ┌────────────────┴────────────────┐
                     ▼                                 ▼
           ┌─────────────────────┐          ┌──────────────────────┐
           │ Keyring Mobile App  │          │ Browser Extension    │
           │ (scan QR to verify) │          │ (launches directly)  │
           └─────────────────────┘          └──────────────────────┘
                                      │
                                      │ Webhook
                                      ▼
                           ┌─────────────────────────┐
                           │ Express Backend         │
                           │ (apps/backend)          │
                           │ Session + webhook logic │
                           └─────────────────────────┘
```

## Features

- Mobile verification via QR code
- Extension verification (no QR)
- Real-time status updates
- Session cleanup
- Error handling

## Quick Start

### 1. Install Dependencies

From the repository root:

```bash
cd /Users/joelekpenyong/Keyring/keyring-frontend-public
pnpm install
```

### 2. Link SDK

```bash
pnpm link "@keyringnetwork/data-sharing-sdk"
```

### 3. Configure Environment

Frontend:

```bash
cd examples/data-sharing-demo/apps/frontend
cp .env.example .env.local
# Edit .env.local with your API key
```

Backend:

```bash
cd examples/data-sharing-demo/apps/backend
cp .env.example .env
# Edit .env with your webhook secret
```

### 4. Start Development Servers

Terminal 1 - Backend:

```bash
pnpm --filter data-sharing-backend dev
# Server runs on http://localhost:8000
```

Terminal 2 - Frontend:

```bash
pnpm --filter data-sharing-frontend dev
# App runs on http://localhost:3000
```

## Flow Selection

The demo supports two verification flows after field selection:

- **Mobile flow (QR code)**: The app generates a QR code that the user scans with the Keyring mobile app to continue verification.
- **Extension flow (browser extension)**: The app triggers the Keyring browser extension directly, without QR scanning.

Users choose the flow in the UI during **Step 2: Choose Flow**.

## Usage

1. Open `http://localhost:3000`
2. **Select Fields**: Choose the data fields to request (for example `user.country`, `user.kyc_level`)
3. **Choose Flow**:
   - Mobile: scan QR with the Keyring app
   - Extension: browser extension launches automatically
4. **Verify**: Complete the flow and wait for status updates
5. Review verification results when the session completes

## API Endpoints

### Backend

- `POST /webhooks/keyring` - Receive webhooks from Keyring
- `GET /api/sessions/:id` - Get session status
- `GET /api/sessions/:id/result` - Get session result
- `POST /api/sessions` - Store session reference
- `DELETE /api/sessions/:id` - Cleanup/remove session records when no longer needed

### Frontend Proxy

- `/api/backend/*` - Proxied to backend server

## Configuration

### Environment Files

- Use `.env.example` in each app as the source template
- Create local `.env` files for development
- Do not commit `.env` files to git

### Required Environment Variables

**Backend (`apps/backend/.env`)**:

- `KEYRING_WEBHOOK_SECRET` - From Keyring partner onboarding
- `PORT` - Server port (default: `8000`)
- `FRONTEND_URL` - Frontend URL for CORS (default: `http://localhost:3000`)

**Frontend (`apps/frontend/.env`)**:

- `NEXT_PUBLIC_KEYRING_API_KEY` - Your partner API key
- `NEXT_PUBLIC_KEYRING_ENV` - `production` | `sandbox` | `development`
- `NEXT_PUBLIC_BACKEND_URL` - Keyring API base URL used by SDK
- `NEXT_PUBLIC_APP_API_URL` - Local backend URL (default: `http://localhost:8000`)

## Development

### Project Structure

```
data-sharing-demo/
├── apps/
│   ├── backend/              # Express server (webhook + sessions)
│   └── frontend/             # Next.js app (3-step flow UI)
│       ├── components.json   # shadcn/ui configuration
│       └── src/components/   # modular frontend components
└── README.md
```

### Available Scripts

Backend:

- `pnpm run dev` - Development with hot reload
- `pnpm run build` - Compile for production
- `pnpm start` - Start production server

Frontend:

- `pnpm run dev` - Development server
- `pnpm run build` - Build for production
- `pnpm start` - Start production server

## Troubleshooting

- **Extension not installed**: Install/enable the Keyring browser extension to use Extension flow.
- **Port conflicts**: Ensure frontend uses `3000` and backend uses `8000`, or update env values consistently.
- **SDK linking issues**: Re-run `pnpm link "@keyringnetwork/data-sharing-sdk"` and reinstall dependencies.
- **CORS errors**: Verify `FRONTEND_URL` in `apps/backend/.env` matches your frontend origin.
- **Webhook signature invalid**: Confirm `KEYRING_WEBHOOK_SECRET` is correct.
- **WebSocket connection fails**: SDK falls back to polling automatically.
