# Contracts

## Deploy to Ganache

From `web/contracts/`:

```bash
npm install
```

Set env vars:

- `GANACHE_RPC_URL` (default `http://127.0.0.1:8545`)
- `DEPLOYER_PRIVATE_KEY` (Ganache account private key)
- `AUTH_SIGNER_ADDRESS` (backend auth signer address)

Then:

```bash
npm run deploy
```

It prints `{ "contractAddress": "0x..." }`.
