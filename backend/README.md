# Backend (Go)

This folder contains the Go backend for Predicate Developer Studio.

It provides:

- An HTTP API used by the Next.js frontend.
- MongoDB persistence for policies, evaluations, and audit logs.
- Policy evaluation (compile-time JSON stored on the policy + runtime evaluation against a transaction payload).
- Authorization signing for approved evaluations (EVM-compatible signature flow).

## Entry point

### `cmd/api/main.go`

Starts the HTTP server:

- Loads config from env (`internal/api/config.go`).
- Connects to Mongo (`internal/database/mongo.go`).
- Wires repositories + services + HTTP handlers (`internal/api/handler.go`).
- Runs the server with graceful shutdown.

## HTTP layer (`internal/api`)

This package defines HTTP routing and request/response handling.

- **`handler.go`**
  - Dependency wiring and route registration.
  - Instantiates repositories/services and attaches handlers to the mux.
  - Applies middleware (CORS, request ID, recovery, access logs).

- **`config.go`**
  - Loads required env vars and provides the bind address.

- **`http.go`**
  - Small helpers for JSON responses (`writeJSON`, `writeError`).

- **`health.go`**
  - `GET /health` endpoint.

- **`policies_http.go`**
  - CRUD endpoints for policies:
    - `GET /policies`
    - `POST /policies`
    - `GET /policies/{id}`
    - `PUT /policies/{id}`
    - `DELETE /policies/{id}`

- **`evaluate_http.go`**
  - `POST /evaluate` endpoint.
  - Accepts a policy ID + transaction payload and returns an evaluation result.

- **`authorize_http.go`**
  - `POST /authorize` endpoint.
  - Creates an authorization signature for an approved evaluation.

- **`evaluations_http.go`**
  - `GET /evaluations` endpoint (list evaluations).

- **`evaluation_get_http.go`**
  - `GET /evaluations/{id}` endpoint.

- **`audit_http.go`**
  - `GET /audit` endpoint (list audit log entries).

- **`phase2_misc_http.go`**
  - Miscellaneous endpoints used for the demo / phase-2 iteration work.

## Middleware (`internal/middleware`)

Small, composable HTTP middleware.

- **`middleware.go`**
  - Middleware chaining helper.

- **`cors.go`**
  - CORS handling used by the frontend.

- **`request_id.go`**
  - Adds/propagates a request ID.

- **`recover.go`**
  - Panic recovery middleware.

- **`access_log.go`**
  - Request logging.

## Services (`internal/services`)

Business logic layer. Services depend on repository interfaces.

- **`policies.go`**
  - Policy CRUD business logic.
  - Emits audit log entries on create/update/delete.

- **`evaluations.go`**
  - Evaluation listing/get logic.

- **`evaluate.go`**
  - Evaluates a compiled policy against a transaction.
  - Persists the resulting evaluation and (optionally) writes an audit log.

- **`authorize.go`**
  - Authorization issuance for an evaluation.
  - Validates evaluation is approved.
  - Builds a signing payload and returns a signature + authorization metadata.

- **`audit_logs.go`**
  - Audit log listing logic.

## Repositories (`internal/repositories`)

Storage interfaces and MongoDB implementations.

Interfaces:

- **`policies.go`**
- **`evaluations.go`**
- **`evaluations_get.go`**
- **`audit_logs.go`**

Mongo implementations:

- **`mongo_policies.go`**
  - Stores policies in the `policies` collection.

- **`mongo_evaluations.go`**
  - Stores evaluations in the `evaluations` collection.

- **`mongo_audit_logs.go`**
  - Stores audit logs in the `audit_logs` collection.

## Models (`internal/models`)

Types that map to persisted MongoDB documents and API payloads.

- **`id.go`**
  - ID type helpers (Mongo ObjectID wrapper + JSON conversion helpers).

- **`policy.go`**
  - Policy record schema.

- **`evaluation.go`**
  - Evaluation record schema (decision, reason, trace, tx snapshot, policy snapshot).

- **`authorization.go`**
  - Authorization metadata returned by `POST /authorize`.

- **`audit_log.go`**
  - Audit log record schema.

- **`trace.go`**
  - Trace event types emitted during evaluation.

## Policy evaluation engine (`internal/policy`)

Core policy evaluation logic used by `EvaluateService`.

- **`dsl.go`**
  - DSL/shape types for compiled policy input.

- **`evaluator.go`**
  - Main evaluation implementation.

- **`conditions.go`**
  - Condition implementations (the leaf predicates used in policies).

## Blockchain helpers (`internal/blockchain`)

EVM-oriented utilities used by authorization signing.

- **`auth_hash.go`**
  - Nonce generation, hashing, message construction, and signature helpers.

## Database (`internal/database`)

- **`mongo.go`**
  - MongoDB connection + ping.

## Configuration

The backend expects these environment variables:

- `HOST` (default `127.0.0.1`)
- `PORT` (default `8080`)
- `MONGODB_URI` (required)
- `MONGODB_DB` (default `predicate_developer_studio`)
- `AUTH_SIGNER_PRIVATE_KEY` (required)
- `CONTRACT_ADDRESS` (required)
- `CHAIN_ID` (default `1337`)
