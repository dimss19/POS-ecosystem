# PRD — KASIR Backend Agent

## 1. Role

You are responsible ONLY for the backend of the KASIR POS system.

Scope:
- `/backend`
- Backend-related documentation under `/docs` when explicitly required

Do NOT implement desktop or mobile UI.

## 2. Objective

Build a production-ready Laravel REST API that supports:
- Authentication
- Role-based authorization
- Products/categories
- Transactions
- Inventory and stock movements
- Cashier shifts
- Reports
- Offline synchronization
- Idempotent transaction ingestion
- Audit logging

The backend must be designed around an offline-first desktop POS.

## 3. Technology

- Laravel 13
- PHP 8.4+
- PostgreSQL
- Laravel Sanctum
- Redis
- Laravel Queue
- Laravel Scheduler
- Pest/PHPUnit
- Docker
- Nginx in production

## 4. Architecture

Use layered, maintainable Laravel architecture.

Recommended:

```text
backend/
├── app/
│   ├── Actions/
│   ├── Http/
│   │   ├── Controllers/
│   │   ├── Requests/
│   │   └── Resources/
│   ├── Models/
│   ├── Policies/
│   ├── Services/
│   └── Jobs/
├── database/
│   ├── migrations/
│   ├── seeders/
│   └── factories/
├── routes/
│   └── api.php
├── tests/
└── docker/
```

Do not over-engineer. Keep business logic testable and separate from controllers.

## 5. Roles

### Admin/Owner

Can:
- Dashboard
- Products
- Categories
- Inventory
- Transactions
- Reports
- Users
- Audit logs
- Settings

### Cashier

Can:
- POS-related transaction operations
- Own shift
- Own permitted transaction history

Cannot:
- Modify prices
- Manage users
- Modify products
- Delete financial records
- Access administrative functions

Use Laravel Policies/Gates for authorization.

## 6. Authentication

Endpoints:

```http
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

Use Laravel Sanctum.

Requirements:
- Password hashing
- Validation
- Login rate limiting
- Token revocation/logout
- Role authorization
- No plaintext password storage

## 7. Database

Minimum tables:

```text
users
roles
categories
products
transactions
transaction_items
stock_movements
shifts
devices
sync_logs
audit_logs
```

Requirements:
- Foreign keys
- Unique constraints
- Proper indexes
- Decimal/numeric for money
- UUID for transaction identity
- No floating point for money

Important indexes:
- products.barcode
- products.sku
- transactions.uuid
- transactions.created_at
- stock_movements.product_id
- stock_movements.created_at

## 8. Product API

```http
GET    /api/products
POST   /api/products
GET    /api/products/{id}
PUT    /api/products/{id}
DELETE /api/products/{id}
```

Product:

```text
id
sku
barcode
name
category_id
buy_price
sell_price
stock
minimum_stock
unit
is_active
created_at
updated_at
```

Deletion means deactivation wherever possible.

## 9. Category API

```http
GET    /api/categories
POST   /api/categories
PUT    /api/categories/{id}
DELETE /api/categories/{id}
```

## 10. Transaction API

```http
GET  /api/transactions
GET  /api/transactions/{id}
POST /api/transactions
POST /api/transactions/{id}/void
```

Transaction:

```text
id
uuid
device_id
cashier_id
shift_id
subtotal
discount
total
payment_method
amount_paid
change_amount
status
sync_status
client_created_at
server_created_at
created_at
updated_at
```

Statuses:

```text
COMPLETED
VOID
```

Payment methods:

```text
CASH
TRANSFER
QRIS
```

## 11. Transaction Integrity

Creating a transaction must atomically handle:

1. Transaction
2. Transaction items
3. Stock movement
4. Stock update
5. Audit information

Use database transactions.

Never create a transaction without corresponding stock movement where stock is affected.

Never physically delete financial transactions.

## 12. Idempotency

This is mandatory.

Every transaction must have a UUID.

The server must detect repeated requests for the same:

```text
device_id + transaction_uuid
```

Repeated requests must return the existing transaction instead of creating a duplicate.

The implementation must be safe against:
- Network retry
- Client timeout
- Duplicate HTTP request
- Application restart during sync

## 13. Sync API

Required:

```http
POST /api/sync/push
POST /api/sync/pull
```

### Push

Desktop sends pending operations.

The backend must:
1. Validate payload
2. Authenticate device/user
3. Check idempotency
4. Process transaction atomically
5. Create server records
6. Return acknowledgement

Never acknowledge a transaction before successful persistence.

### Pull

Used to obtain server-side changes required by the desktop.

Changes must be ordered deterministically.

Use server timestamps/versioning as appropriate.

## 14. Stock

Stock changes must be represented by `stock_movements`.

Types:

```text
SALE
PURCHASE
ADJUSTMENT
RETURN
VOID_REVERSAL
```

Stock movement:

```text
id
product_id
transaction_id nullable
type
quantity
before_stock
after_stock
reference
created_by
created_at
```

Do not silently overwrite stock.

## 15. Shift API

```http
GET  /api/shifts
POST /api/shifts/open
POST /api/shifts/{id}/close
```

Shift:

```text
id
cashier_id
opening_cash
closing_cash
expected_cash
difference
opened_at
closed_at
status
```

Statuses:

```text
OPEN
CLOSED
```

One cashier cannot have multiple active shifts.

## 16. Reports

Endpoints:

```http
GET /api/dashboard
GET /api/reports/sales
GET /api/reports/products
GET /api/reports/cashiers
```

Support date ranges.

Minimum metrics:
- Sales total
- Transaction count
- Items sold
- Payment method totals
- Top-selling products
- Cashier performance
- Low-stock products

## 17. Devices

Endpoint:

```http
POST /api/devices/register
GET  /api/devices
```

Device:

```text
id
device_uuid
name
last_seen_at
app_version
is_active
created_at
updated_at
```

Every desktop installation gets a unique device UUID.

## 18. Audit Log

Log:

```text
LOGIN
LOGOUT
PRODUCT_CREATED
PRODUCT_UPDATED
PRICE_CHANGED
STOCK_ADJUSTED
TRANSACTION_CREATED
TRANSACTION_VOIDED
SHIFT_OPENED
SHIFT_CLOSED
USER_CREATED
USER_UPDATED
```

Never log passwords or authentication tokens.

## 19. API Response Format

Use consistent JSON.

Success example:

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

Do not expose stack traces in production.

## 20. Testing

Must test:
- Authentication
- Authorization
- Product CRUD
- Transaction creation
- Stock deduction
- Void/reversal
- Shift
- Idempotent transaction sync
- Duplicate sync requests
- Inventory adjustment
- Reports
- Device authorization

Critical test:

```text
Send same transaction twice
→ only one server transaction exists
```

## 21. Security

Mandatory:
- Sanctum
- Policies
- Validation
- Rate limiting
- Secure secrets
- No `.env` in Git
- SQL injection protection
- Authorization on every protected endpoint
- No plaintext passwords/tokens in logs

## 22. Agent Rules

1. Work only on backend scope.
2. Do not modify desktop/mobile implementation.
3. Do not change API contracts without documenting the change.
4. Do not add unrequested features.
5. Do not break idempotency.
6. Do not use floating-point money.
7. Do not physically delete transactions.
8. Always write tests for critical business logic.
9. Run tests before declaring work complete.
10. Keep API responses predictable.
11. Keep migrations reversible where practical.
12. Update API documentation when endpoints change.

## 23. Definition of Done

Backend is complete only when:
- API works locally
- Database migrations work from clean state
- Authentication works
- RBAC works
- Product API works
- Transaction API works
- Inventory works
- Shift works
- Sync works
- Idempotency works
- Reports work
- Audit logs work
- Tests pass
- API documentation matches implementation
