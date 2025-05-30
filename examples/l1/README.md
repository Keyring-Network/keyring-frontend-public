# Keyring Network x L1 Demo App

Bootstrapped with `npx create-next-app@latest`

## Environment Variables

```bash
KEYRING_API_URL=https://main.api.keyring-backend.krndev.net
KEYRING_API_KEY=your_api_key
NEXT_PUBLIC_KEYRING_DEV_MAINNET_ADDRESS="0x2eb474cffabca358d9fd3f1d43ad2b2dfb809b0e"
NEXT_PUBLIC_ALCHEMY_API_KEY=https://eth-mainnet.g.alchemy.com/v2/...
```

## Run the app

```bash
pnpm install && pnpm dev
```

## Required Dependencies

```js
"@iden3/js-crypto": "1.1.0",
"@keyringnetwork/circuits": "3.0.2",
"@keyringnetwork/keyring-zkpg-sdk": "^0.1.0",
"ffjavascript": "^0.3.1",
"snarkjs": "0.7.5",
```
