# KASIR API Contract

This document is the shared contract between Backend, Desktop, and Mobile agents.

## Rules

- Backend owns API implementation.
- Desktop and Mobile consume the contract.
- Do not silently change endpoint names or response shapes.
- Breaking changes require updating this document first.
- All monetary values use decimal-safe representations.
- All timestamps use ISO 8601.
- Transaction UUIDs are generated client-side for offline transactions.

## Authentication

```http
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

## Products

```http
GET    /api/products
POST   /api/products
GET    /api/products/{id}
PUT    /api/products/{id}
DELETE /api/products/{id}
```

## Categories

```http
GET    /api/categories
POST   /api/categories
PUT    /api/categories/{id}
DELETE /api/categories/{id}
```

## Transactions

```http
GET  /api/transactions
GET  /api/transactions/{id}
POST /api/transactions
POST /api/transactions/{id}/void
```

## Shifts

```http
GET  /api/shifts
POST /api/shifts/open
POST /api/shifts/{id}/close
```

## Inventory

```http
GET  /api/stock
GET  /api/stock/movements
POST /api/stock/adjustments
```

## Reports

```http
GET /api/dashboard
GET /api/reports/sales
GET /api/reports/products
GET /api/reports/cashiers
```

## Sync

```http
POST /api/sync/push
POST /api/sync/pull
```

## Devices

```http
POST /api/devices/register
GET  /api/devices
```

## Response format

Success:

```json
{
  "data": {},
  "message": "Success"
}
```

Validation:

```json
{
  "message": "Validation failed",
  "errors": {}
}
```

Unauthorized:

```json
{
  "message": "Unauthenticated"
}
```

## Sync transaction identity

A transaction is uniquely identified by:

```text
device_id + transaction_uuid
```

The server must be idempotent.
