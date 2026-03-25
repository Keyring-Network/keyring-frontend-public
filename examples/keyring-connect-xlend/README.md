# Keyring Connect xLend Demo

This demo showcases the integration of [Keyring Connect SDK](https://www.npmjs.com/package/@keyringnetwork/keyring-connect-sdk) with a fictional lending platform called xLend. The application demonstrates how to implement Keyring Connect verification flow in a DeFi lending application.

## Overview

The demo simulates a complete Keyring Connect verification flow with four stages:

1. **Install Extension**: Prompts users to install the Keyring Connect browser extension
2. **Start Verification**: Initiates the Keyring Connect verification process
3. **In Progress**: Shows verification status and allows checking progress
4. **Completed**: Displays successful verification and unlocks lending features

## Key Components

- `KeyringConnectModule`: A component that demonstrates the Keyring Connect SDK integration for Keyring Connect verification, handling extension installation checks, verification initiation, status monitoring, and displaying appropriate UI states based on the verification progress.
- `XLendAppInterface`: A mock lending application UI that integrates the `KeyringConnectModule` within a card-based interface, showcasing how Keyring Connect verification can be embedded into a DeFi lending platform's user flow.

## Running the Demo

First, run the development server:

```bash
npm install && npm run dev
# or
yarn install && yarn dev
# or
pnpm install && pnpm dev
# or
bun install && bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Keyring Connect E2E Flow

The Keyring Connect flow integrates identity verification into DeFi applications. This document outlines the complete user journey through the Keyring Connect onboardings process including the ZKP generation and on-chain broadcast, from wallet connection to credential validation.

### First-Time User Flow

1. Not Connected

- User arrives at the application without a connected wallet
- App displays "Connect wallet" prompt
- User clicks to connect their wallet

2. Loading

- App checks credential status on-chain via useReactContract hook and `checkCredentialStatus` function
- App displays loading state to the user

3. No Credential

- App determines user has no valid credential
- App checks if Keyring Connect extension is installed (returns false)
- User is prompted to install the extension

4. Install Extension

- User clicks "Install Extension"
- KeyringConnect.launchExtension() redirects user to extension installation page
- After installation, user is redirected back to the App

5. Extension Installed

- App re-runs previous steps (1-3)
- App confirms extension is installed
- User is prompted to start verification

6. Start Verification

- User clicks "Start Verification"
- App launches the extension for user authentication
- Initially, KeyringConnect.getExtensionState() returns undefined user state (user needs to log in)

7. Verification / ZKP Generation In Progress

- App periodically checks extension state via KeyringConnect.getExtensionState()
- User completes identity verification in the extension
- Extension generates ZKP and provided calldata for on-chain credential update

8. Transaction Creation

- User signs transaction
- App broadcasts transaction to blockchain
- Loading state is displayed while transaction confirms

9. Credential Valid

- On-chain credential status becomes "valid"
- User can access permissions-based DeFi features

### Subsequent User Flow

Returning User Flow

1. Not Connected → Loading

- User connects wallet
- App checks credential status

2. Valid Credential

- App confirms user has a valid credential
- User immediately gains access to permissions-based DeFi features

3. Expired Credential (e.g., after 24 hours)

- If credential has expired, App launches extension for user to verify again
- User signs transaction to renew credential

## State Management

The App manages the E2E flow through a unified `flowState` state with the following possible values:

- "not-connected": Wallet not connected
- "loading": Checking credential status
- "error": Error occurred during verification
- "install": Extension installation required
- "start": Ready to begin verification
- "progress": Verification in progress
- "calldata-ready": ZKP generated and calldata prepared for on-chain credential update
- "transaction-ready": Transaction ready to be signed
- "valid": Has a valid on-chain credential
