# KASIR POS — FINAL FINISHING PRD

> FINAL implementation specification for the existing KASIR POS project.
> Goal: make the existing implementation conform to the required features and business logic before human QA.
> Do not rebuild working modules unnecessarily.

---

## 1. PRODUCT

KASIR is an offline-first POS for small retail stores.

Platforms:
- Desktop cashier app
- Mobile Owner/Admin app
- Laravel REST API
- PostgreSQL server database
- SQLite desktop database

Core requirement:

**Cashier must be able to complete sales without internet. Offline transactions must survive restart and synchronize exactly once when connectivity returns.**

---

## 2. FINISHING PHASE RULES

The project has already been implemented by multiple AI agents.

Before editing:
1. Inspect the existing repository.
2. Inspect current database/migrations.
3. Inspect API and existing screens.
4. Compare implementation against this PRD.
5. Fix gaps and incorrect logic.
6. Preserve working features.
7. Do not rewrite the architecture without a real reason.
8. Do not add features outside this PRD.
9. Do not replace real behavior with mock/placeholder behavior.
10. Do not declare completion because the UI merely renders.

Priority:
1. Business correctness
2. Data consistency
3. Offline/sync safety
4. Authentication/authorization
5. Complete feature behavior
6. Error handling
7. UI polish

---

# 3. STACK

## Backend
- Laravel 13
- PHP 8.4+
- PostgreSQL
- Laravel Sanctum
- Redis/Queue only where useful
- Pest/PHPUnit

## Desktop
- Tauri 2
- React
- TypeScript
- Vite
- Tailwind CSS
- SQLite

## Mobile
- Flutter
- Dart
- SQLite/local cache

Do not replace the selected frameworks during finishing.

---

# 4. ROLES

## ADMIN / OWNER

Can:
- Login/logout
- Dashboard
- Add/edit/deactivate products
- Manage categories
- Adjust stock
- View stock movements
- View all transactions
- Void transactions according to business rules
- View reports
- View shifts
- Manage cashier accounts
- View audit logs
- View device/sync status
- Store settings

## CASHIER

Can:
- Login/logout
- Open shift
- Search products
- Scan barcode
- Cart
- Checkout
- Print receipt
- View permitted transaction history
- Close shift
- Sell while offline

Cashier cannot:
- Add products
- Change prices
- Adjust stock
- Manage users
- Delete financial records
- Access admin settings

All authorization must be enforced server-side. Never trust role/permission values supplied by a client.

---

# 5. ADMIN PRODUCT MANAGEMENT — CRITICAL

Admin MUST be able to create a product through the application.

Path:

`Products -> Add Product`

Fields:

- Product Name **required**
- SKU optional but unique if provided
- Barcode optional but unique if provided
- Category **required**
- Buy Price
- Selling Price **required**
- Initial Stock
- Minimum Stock
- Unit **required**
- Active

## Creation logic

When Admin saves:
1. Validate required fields.
2. Validate prices are non-negative.
3. Validate initial stock is non-negative.
4. Validate SKU uniqueness.
5. Validate barcode uniqueness.
6. Validate category exists/active.
7. Create product.
8. If initial stock > 0, create an `INITIAL_STOCK` movement.
9. Update stock consistently.
10. Create audit log.
11. Return success.
12. Product must become available to desktop after synchronization.

Never change stock without a stock movement.

## Product fields

```text
id
uuid
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

Use decimal-safe types for money. Never use floating point for prices.

## Edit

Admin can change:
- Name
- SKU
- Barcode
- Category
- Buy price
- Selling price
- Minimum stock
- Unit
- Active

Price changes must be audited.

Historical transactions MUST NOT change when product data changes.

## Deactivation

Prefer `is_active=false` over physical deletion.

Inactive products:
- Do not appear in normal POS search.
- Cannot be sold in new transactions.
- Remain available in historical transactions.

---

# 6. CATEGORIES

Admin can:
- Create
- Rename
- Deactivate

A category referenced by products must not be physically deleted.

---

# 7. INVENTORY

Stock is movement-based.

Movement types:

```text
INITIAL_STOCK
PURCHASE
SALE
ADJUSTMENT
RETURN
VOID_REVERSAL
```

Movement fields:

```text
id
product_id
transaction_id nullable
type
quantity
before_stock
after_stock
reason nullable
created_by
created_at
```

Every stock-changing operation must create a movement.

## Stock adjustment

Admin enters:
- Product
- New/adjustment quantity
- Reason

Example:

```text
System stock: 20
Physical stock: 18
Adjustment: -2
Reason: Damaged
```

Result:
- Stock = 18
- Movement = ADJUSTMENT -2
- Reason saved
- Audit saved

## Low stock

```text
stock <= minimum_stock
```

Products meeting this condition appear in Admin/mobile low-stock views.

---

# 8. DESKTOP POS

Primary cashier screen:

```text
Search / Scan Barcode
Products
Cart
Subtotal
Discount
Total
Payment
```

Product lookup priority:
1. Barcode
2. Manual barcode
3. Name/SKU search

Barcode scanners should work as HID keyboard input where possible.

If barcode is unknown:
`Product not found`

If inactive:
`Product unavailable`

If insufficient stock:
`Insufficient stock`

## Cart

Each item contains:
- product
- quantity
- unit price snapshot
- discount
- subtotal

Actions:
- Increase/decrease quantity
- Remove item
- Clear cart

---

# 9. CHECKOUT

Show:
- Subtotal
- Discount
- Grand total
- Payment method
- Amount paid
- Change

Methods:

```text
CASH
TRANSFER
QRIS
```

For MVP, Transfer/QRIS are recorded payment methods only. No payment gateway verification.

Cash rule:

```text
amount_paid >= total
```

Change:

```text
amount_paid - total
```

Insufficient cash blocks checkout.

Checkout must work offline.

---

# 10. TRANSACTIONS

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

Transaction item:

```text
transaction_id
product_id
product_name_snapshot
sku_snapshot
barcode_snapshot
quantity
unit_price
discount
subtotal
```

Snapshots are mandatory so historical transactions remain correct after product edits.

Statuses:

```text
COMPLETED
VOID
```

Never physically delete a financial transaction.

---

# 11. TRANSACTION ATOMICITY

Creating a sale must atomically perform:

```text
Transaction
+ Transaction items
+ Stock movements
+ Stock update
+ Audit information
```

Use database transactions in both SQLite and PostgreSQL.

A partial sale must never remain after a critical failure.

---

# 12. VOID

Do not delete transactions.

Void workflow:

```text
Original transaction
-> VOID
-> VOID_REVERSAL stock movements
```

Store:
- Who voided
- When
- Reason
- Original transaction reference

Original transaction remains visible.

---

# 13. SHIFTS

Cashier must open a shift before selling.

Fields:

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

A cashier cannot have two active shifts.

Closing calculation:

```text
Expected cash =
Opening cash
+ cash sales
- cash refunds
```

Transfer/QRIS sales are not physical cash.

Example:

```text
Opening cash: 500000
Cash sales:   750000
Expected:    1250000
Actual:      1240000
Difference:   -10000
```

---

# 14. OFFLINE-FIRST DESKTOP

When offline, desktop MUST still support:
- Product search
- Barcode
- Cart
- Checkout
- Local stock reduction
- Local transaction history
- Current shift

Display clear:

```text
ONLINE
OFFLINE
```

Checkout must not wait for API/network.

SQLite must survive:
- Internet loss
- App restart
- OS restart
- Temporary crash

---

# 15. LOCAL DATABASE

Minimum SQLite tables:

```text
products
categories
transactions
transaction_items
stock_movements
shifts
sync_queue
devices
settings
```

Local writes for a completed sale must be atomic.

---

# 16. SYNC QUEUE

```text
sync_queue
-----------
id
entity_type
entity_id
operation
payload
status
retry_count
last_error
created_at
updated_at
```

Statuses:

```text
PENDING
SYNCING
SYNCED
FAILED
```

Triggers:
- App startup
- Connection recovery
- Periodic online sync
- Manual Sync Now

Never delete pending data before server acknowledgement.

---

# 17. SYNC + IDEMPOTENCY — CRITICAL

Every transaction gets a UUID on the device.

Identity:

```text
device_id + transaction_uuid
```

Flow:

```text
Local sale
 -> PENDING
 -> SYNCING
 -> POST /api/sync/push
 -> validate
 -> idempotency check
 -> PostgreSQL transaction
 -> ACK
 -> SYNCED
```

Failure:

```text
SYNCING -> FAILED -> RETRY
```

If the request times out after server persistence and the client retries:

```text
First request: create transaction
Retry: return existing transaction
```

The server MUST NOT create duplicates.

Never mark local data `SYNCED` before a successful server acknowledgement.

Never lose pending data because of a network error.

---

# 18. PRODUCT SYNC

When Admin adds/edits a product:

```text
Admin
 -> Server
 -> Product saved
 -> Desktop sync
 -> SQLite product cache updated
 -> Product available in POS
```

A desktop restart must not be required for normal product synchronization.

If desktop is offline, existing cached products continue working. New server products appear after connectivity returns and synchronization succeeds.

---

# 19. STOCK SYNC

Do not blindly overwrite server stock using a local stock number.

Stock changes are represented by movements.

Desktop may maintain local stock while offline.

When online:
1. Push local sales/movements.
2. Server validates and persists them.
3. Pull applicable server changes.
4. Reconcile local state.

Server is authoritative after synchronization.

---

# 20. DEVICES

Every desktop installation has a unique:

```text
device_id
```

Device fields:

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

Transactions must store the originating device.

---

# 21. THERMAL PRINTER

Support:
- 58mm
- 80mm

Receipt contains:

```text
Store
Address/contact
Items
Quantity
Price
Subtotal
Discount
Total
Payment
Paid
Change
Transaction number
Date/time
Cashier
```

Printer failure MUST NOT rollback the transaction.

Correct result:

```text
Transaction saved ✓
Printer failed ⚠
```

Allow reprint when possible.

---

# 22. MOBILE OWNER/ADMIN APP

Mobile is NOT the cashier for MVP.

Screens:

```text
Login
Dashboard
Products
Inventory
Transactions
Reports
Settings
```

## Dashboard

Show:
- Today's sales
- Transaction count
- Items sold
- Low stock count

Charts:
- Daily sales
- Weekly sales
- Top products

## Mobile products

Admin can:
- List
- Add
- Edit
- Deactivate
- View barcode/SKU
- Change price
- Change minimum stock

Product creation must use the same rules as the backend/Admin product specification.

## Mobile inventory

Show:
- Current stock
- Low stock
- Stock movements
- Adjust stock with reason

Do not directly manipulate stock values.

## Mobile transactions

Show:
- Transaction number
- Date
- Cashier
- Total
- Payment
- Status

Detail includes item snapshots.

## Mobile reports

Minimum:
- Sales
- Transaction count
- Cash/Transfer/QRIS
- Product quantity/revenue
- Cashier performance
- Date filtering

---

# 23. MOBILE OFFLINE

Mobile is read/monitoring oriented.

When offline:
- Cached data may be shown.
- Show offline status.
- Show last updated timestamp.
- Do not pretend unsupported writes succeeded.

Example:

```text
OFFLINE
Showing cached data
Last updated: 16:20
```

---

# 24. USER MANAGEMENT

Admin can create/manage cashier users.

Fields:

```text
name
username
password
role
is_active
```

Rules:
- Username unique
- Password hashed
- Inactive users cannot login
- Cashier cannot create users
- Plaintext passwords are never stored/displayed

---

# 25. AUDIT LOG

Log:

```text
LOGIN
LOGOUT
PRODUCT_CREATED
PRODUCT_UPDATED
PRICE_CHANGED
PRODUCT_DEACTIVATED
STOCK_ADJUSTED
TRANSACTION_CREATED
TRANSACTION_VOIDED
SHIFT_OPENED
SHIFT_CLOSED
USER_CREATED
USER_UPDATED
```

Fields:

```text
user_id
device_id nullable
action
entity_type
entity_id
old_values nullable
new_values nullable
ip_address nullable
created_at
```

Never log passwords or tokens.

---

# 26. API

Minimum endpoints:

```http
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me

GET    /api/products
POST   /api/products
GET    /api/products/{id}
PUT    /api/products/{id}
DELETE /api/products/{id}

GET    /api/categories
POST   /api/categories
PUT    /api/categories/{id}
DELETE /api/categories/{id}

GET  /api/transactions
GET  /api/transactions/{id}
POST /api/transactions
POST /api/transactions/{id}/void

GET  /api/stock
GET  /api/stock/movements
POST /api/stock/adjustments

GET  /api/shifts
POST /api/shifts/open
POST /api/shifts/{id}/close

GET /api/dashboard
GET /api/reports/sales
GET /api/reports/products
GET /api/reports/cashiers

POST /api/sync/push
POST /api/sync/pull

POST /api/devices/register
GET  /api/devices
```

Use consistent JSON responses and validation errors.

Do not change the shared API contract casually.

---

# 27. SECURITY

Mandatory:
- Sanctum
- RBAC/policies
- Request validation
- Rate limiting
- Secure password hashing
- No plaintext credentials
- No production secrets in Git
- `.env` ignored
- No sensitive tokens in logs
- Server-side authorization

Never trust client-provided:
- role
- price
- stock
- permission
- user identity

for privileged or financial decisions.

---

# 28. ERROR HANDLING

Never silently fail.

Required cases:
- Invalid credentials
- Unauthorized action
- Product not found
- Inactive product
- Insufficient stock
- Insufficient payment
- Server unavailable
- Sync failed
- Printer unavailable
- Invalid data

Provide a useful user-facing message and log technical details.

Do not expose stack traces in production.

---

# 29. PERFORMANCE

Desktop:
- Product search must be local/instant.
- Barcode-to-cart must not wait for API.
- Checkout must not wait for API.
- Sync runs in background.

Backend:
- Index barcode/SKU/UUID/timestamps.
- Paginate lists.
- Avoid N+1 queries.
- Use queues only where appropriate.

Mobile:
- Paginate large lists.
- Cache useful read data.
- Do not make unnecessary requests.

---

# 30. TESTING EXPECTATIONS BEFORE HUMAN QA

AI agents should at minimum verify implementation logic for:

### Admin
- Add product
- Edit product
- Deactivate product
- Initial stock
- Price changes
- Audit logs

### POS
- Barcode
- Search
- Cart
- Cash checkout
- Transfer/QRIS recording
- Stock deduction
- Receipt failure behavior

### Offline
- Sale with internet disabled
- App restart with pending transaction
- Multiple offline transactions
- Sync recovery

### Sync
- Successful sync
- Failed sync
- Retry
- Duplicate request/idempotency

### Inventory
- Sale movement
- Adjustment movement
- Void reversal
- Low stock

### Shift
- Open
- Prevent duplicate active shift
- Close
- Cash difference

### Mobile
- Login
- Dashboard
- Product management
- Inventory
- Transactions
- Reports
- Cached/offline read

---

# 31. CRITICAL ACCEPTANCE SCENARIOS

## A. Admin creates a product

```text
Admin login
-> Products
-> Add Product
-> Name
-> Barcode
-> Category
-> Buy price
-> Sell price
-> Initial stock
-> Save
```

Must result in:

```text
Server product exists
Initial stock is correct
INITIAL_STOCK movement exists
Audit exists
Product appears in Admin list
Desktop receives product after sync
Product can be searched/scanned
Product can be sold
```

## B. Normal sale

```text
Cashier login
-> Open shift
-> Scan product
-> Add quantity
-> Checkout
-> Pay cash
-> Print
```

Must result in:

```text
Transaction exists
Items exist
Stock decreases
SALE movement exists
Receipt printed if printer works
History updated
```

## C. Offline sale

```text
Internet OFF
-> Scan
-> Checkout
```

Must result in:

```text
Sale succeeds
Local stock decreases
Transaction survives restart
sync_status = PENDING
```

## D. Offline recovery

```text
10 offline sales
-> Close app
-> Restart
-> Internet ON
-> Sync
```

Must result in:

```text
10 transactions retained
10 transactions synchronized
0 duplicates
0 missing
All local records become SYNCED
```

## E. Duplicate sync

```text
Send transaction UUID ABC
-> server saves
-> client times out
-> resend ABC
```

Must result in:

```text
Exactly ONE server transaction
```

## F. Price history

```text
Product price = 5000
-> Transaction A
-> Admin changes price to 6000
-> Transaction B
```

Must result in:

```text
A = 5000
B = 6000
```

## G. Stock adjustment

```text
Stock = 20
-> physical = 18
-> adjustment -2
-> reason = damaged
```

Must result in:

```text
Stock = 18
ADJUSTMENT movement = -2
Reason stored
Audit stored
```

## H. Printer failure

```text
Checkout
-> printer disconnected
```

Must result in:

```text
Transaction succeeds
Stock changes
Printer error shown
Transaction can be reprinted
```

---

# 32. DEFINITION OF DONE

A feature is DONE only if:
- UI exists where required.
- Backend logic exists.
- Validation exists.
- Authorization exists.
- Persistence works.
- Error states exist.
- Offline behavior exists where applicable.
- Sync behavior exists where applicable.
- Critical tests/checks pass.
- No placeholder/mock implementation remains.
- Documentation is consistent.

---

# 33. AGENT OWNERSHIP

## Backend Agent

Own:
```text
/backend
```

Responsibilities:
- Laravel
- PostgreSQL
- API
- Auth/RBAC
- Products/categories
- Inventory
- Transactions
- Shifts
- Reports
- Sync
- Idempotency
- Audit
- Backend tests

## Desktop Agent

Own:
```text
/desktop
```

Responsibilities:
- Tauri
- React
- SQLite
- POS
- Barcode
- Checkout
- Offline
- Sync queue
- Sync UI
- Printer
- Desktop tests

## Mobile Agent

Own:
```text
/mobile
```

Responsibilities:
- Flutter
- Dashboard
- Admin product management UI
- Inventory
- Transactions
- Reports
- Local cache
- Mobile tests

Shared contracts:
```text
/docs/PRD.md
/docs/API_CONTRACT.md
/docs/ARCHITECTURE.md
/docs/DATABASE_SCHEMA.md
```

Do not silently break shared contracts.

---

# 34. FINAL FINISHING INSTRUCTION TO ALL AI AGENTS

The objective is NOT to add more features.

The objective is to make the current implementation match this specification.

For each requirement:

```text
Inspect existing implementation
-> Compare with PRD
-> Fix missing behavior
-> Preserve working behavior
-> Run checks
-> Re-check dependent flows
```

If something already works correctly:
**do not rewrite it just for stylistic reasons.**

If a feature is visually implemented but its backend/data logic is missing:
**finish the actual logic.**

If a feature works online but fails offline:
**fix the offline behavior.**

If sync works visually but can duplicate transactions:
**fix idempotency before anything else.**

If Admin can fill an Add Product form but the created product does not correctly flow through:

```text
Admin
-> Backend
-> Product database
-> Stock movement
-> Sync
-> Desktop SQLite
-> POS
```

then the feature is NOT finished.

The final goal is a coherent end-to-end system, not three independent demos.

After this finishing phase, the human owner will perform manual QA on real devices and hardware.
