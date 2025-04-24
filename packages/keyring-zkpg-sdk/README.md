# Keyring Network ZKPG SDK

## Overview

The Keyring Network ZKPG SDK is a TypeScript library that provides a set of functions to interact with the Keyring Network.

## Installation

```bash
npm install @keyringnetwork/keyring-zkpg-sdk
yarn add @keyringnetwork/keyring-zkpg-sdk
pnpm add @keyringnetwork/keyring-zkpg-sdk
```

## Required Dependencies

These are the dependencies that are required to be installed in the frontend project that uses this SDK.

```js
"@iden3/js-crypto": "1.1.0",
"@keyringnetwork/circuits": "3.0.2",
"ffjavascript": "^0.3.1",
"snarkjs": "0.7.5",
```

These dependencies are injected into the SDK via the `jsCrypto` and `snarkjs` parameters in the `KeyringZKPG.getInstance` function.
