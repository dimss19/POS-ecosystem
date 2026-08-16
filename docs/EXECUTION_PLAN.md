# Backend Execution Plan - KASIR POS System

## Overview

Implementasi backend Laravel untuk sistem POS offline-first dengan fokus pada:
- **Idempotency**: Transaksi tidak boleh duplikat
- **RBAC**: Admin/Owner vs Cashier
- **Stock Management**: Inventory tracking yang akurat
- **Sync Mechanism**: Offline-to-server synchronization
- **Audit Trail**: Complete logging

## Technology Stack

- **Framework**: Laravel 13
- **PHP**: 8.4+
- **Database**: PostgreSQL
- **Cache**: Redis
- **Auth**: Laravel Sanctum
- **Testing**: Pest
- **Container**: Docker

---

## PART 1: Foundation & Infrastructure Setup

**Estimasi**: 2-3 jam
**Priority**: CRITICAL - Must complete first

### Tasks:

1. **Laravel Project Initialization**
   - Install Laravel 13
   - Configure PostgreSQL database connection
   - Setup Redis connection
   - Configure environment variables
   - Setup .gitignore properly

2. **Docker Configuration**
   - Create Dockerfile for PHP 8.4
   - docker-compose.yml (PHP, PostgreSQL, Redis, Nginx)
   - Configure Nginx for Laravel
   - Setup development environment

3. **Project Structure**
   - Create recommended folder structure:
     - `app/Actions/`
     - `app/Services/`
     - `app/Policies/`
     - `app/Jobs/`
   - Configure PSR-4 autoloading

4. **Development Tools Setup**
   - Install Pest for testing
   - Configure Laravel IDE Helper
   - Setup code quality tools (PHPStan/Larastan)
   - Configure Git hooks (optional)

### Deliverables:
- ✅ Working Laravel installation
- ✅ Docker containers running
- ✅ Database connection working
- ✅ Redis connection working
- ✅ Folder structure ready

---

## PART 2: Authentication & Authorization

**Estimasi**: 3-4 jam
**Priority**: CRITICAL - Required for all other features
**Dependencies**: PART 1

### Tasks:

1. **Database Schema - Users & Roles**
   ```
   - users table (id, name, email, password, role, is_active)
   - roles table (id, name, description)
   - user_role relationship
   ```
   - Create migrations
   - Create seeders for default roles (Admin, Cashier)
   - Create factory for testing

2. **Laravel Sanctum Setup**
   - Install & configure Sanctum
   - Setup token configuration
   - Configure CORS if needed
   - Setup rate limiting

3. **Authentication Endpoints**
   - POST `/api/auth/login`
   - POST `/api/auth/logout`
   - GET `/api/auth/me`
   - Create AuthController
   - Create LoginRequest with validation
   - Create UserResource for response

4. **Authorization System**
   - Create RoleEnum (Admin, Cashier)
   - Setup Laravel Policies
   - Create middleware for role checking
   - Implement Gates for complex permissions

5. **Testing**
   - Test login success/fail
   - Test rate limiting
   - Test token generation
   - Test logout & token revocation
   - Test `/auth/me` endpoint
   - Test unauthorized access

### Deliverables:
- ✅ Users can login and get token
- ✅ Role-based authorization working
- ✅ Auth tests passing
- ✅ Rate limiting working

---

## PART 3: Master Data - Products & Categories

**Estimasi**: 3-4 jam
**Priority**: HIGH - Core data needed for transactions
**Dependencies**: PART 2

### Tasks:

1. **Database Schema**
   ```
   - categories table (id, name, description, is_active)
   - products table (id, sku, barcode, name, category_id, 
                     buy_price, sell_price, stock, minimum_stock, 
                     unit, is_active)
   ```
   - Create migrations with proper indexes (barcode, sku)
   - Use DECIMAL for prices (not float!)
   - Create seeders with sample data
   - Create factories

2. **Category API**
   - GET `/api/categories` (list with pagination)
   - POST `/api/categories` (admin only)
   - PUT `/api/categories/{id}` (admin only)
   - DELETE `/api/categories/{id}` (soft delete/deactivate)
   - Create CategoryController
   - Create CategoryRequest for validation
   - Create CategoryResource

3. **Product API**
   - GET `/api/products` (list with filters, search, pagination)
   - POST `/api/products` (admin only)
   - GET `/api/products/{id}`
   - PUT `/api/products/{id}` (admin only)
   - DELETE `/api/products/{id}` (soft delete/deactivate)
   - Create ProductController
   - Create ProductRequest for validation
   - Create ProductResource

4. **Business Logic**
   - Validate unique SKU & Barcode
   - Validate category exists
   - Ensure prices are positive
   - Handle category deletion (check product relationships)

5. **Authorization**
   - Create ProductPolicy
   - Create CategoryPolicy
   - Only Admin can create/update/delete
   - Cashier can only view active items

6. **Testing**
   - CRUD operations for categories
   - CRUD operations for products
   - Test authorization (Admin vs Cashier)
   - Test validation rules
   - Test search & filtering
   - Test pagination

### Deliverables:
- ✅ Category CRUD working
- ✅ Product CRUD working
- ✅ Authorization enforced
- ✅ Tests passing
- ✅ Sample data seeded

---

## PART 4: Stock Management & Movements

**Estimasi**: 4-5 jam
**Priority**: HIGH - Critical for inventory accuracy
**Dependencies**: PART 3

### Tasks:

1. **Database Schema**
   ```
   - stock_movements table (id, product_id, transaction_id, type,
                            quantity, before_stock, after_stock,
                            reference, created_by, created_at)
   ```
   - Create migration with indexes
   - Create StockMovementTypeEnum (SALE, PURCHASE, ADJUSTMENT, RETURN, VOID_REVERSAL)
   - Create seeder
   - Create factory

2. **Stock Service Layer**
   - Create `StockService` class
   - Method: `adjustStock(product, quantity, type, reference, userId)`
   - Method: `recordMovement(product, type, quantity, ...)`
   - Method: `getMovementHistory(product, dateRange)`
   - Ensure atomic stock updates (DB transactions)
   - Calculate before_stock and after_stock

3. **Stock Movement API**
   - GET `/api/stock` (current stock levels)
   - GET `/api/stock/movements` (history with filters)
   - POST `/api/stock/adjustments` (manual adjustment, admin only)
   - Create StockController
   - Create StockAdjustmentRequest
   - Create StockMovementResource

4. **Business Rules**
   - Never allow negative stock (configurable)
   - Always create movement record when stock changes
   - Lock product row during stock update (pessimistic locking)
   - Validate movement type
   - Track who made the change

5. **Authorization**
   - Create StockPolicy
   - Only Admin can adjust stock manually
   - Both can view stock levels
   - Both can view movement history (filtered by role)

6. **Testing**
   - Test stock adjustment
   - Test concurrent stock updates (race condition)
   - Test movement history recording
   - Test negative stock prevention
   - Test authorization
   - Test locking mechanism

### Deliverables:
- ✅ Stock movements tracked accurately
- ✅ Manual adjustments working
- ✅ No race conditions in stock updates
- ✅ Movement history queryable
- ✅ Tests passing

---

## PART 5: Shift Management

**Estimasi**: 2-3 jam
**Priority**: MEDIUM - Required for transaction tracking
**Dependencies**: PART 2

### Tasks:

1. **Database Schema**
   ```
   - shifts table (id, cashier_id, opening_cash, closing_cash,
                   expected_cash, difference, opened_at, closed_at,
                   status, notes)
   ```
   - Create migration
   - Create ShiftStatusEnum (OPEN, CLOSED)
   - Create seeder
   - Create factory

2. **Shift API**
   - GET `/api/shifts` (list shifts with filters)
   - POST `/api/shifts/open` (open new shift)
   - POST `/api/shifts/{id}/close` (close shift with cash count)
   - Create ShiftController
   - Create OpenShiftRequest
   - Create CloseShiftRequest
   - Create ShiftResource

3. **Business Rules**
   - One cashier cannot have multiple open shifts
   - Validate opening cash is positive
   - Calculate expected cash from transactions
   - Calculate difference (closing - expected)
   - Only cashier can close their own shift (or admin)

4. **Authorization**
   - Create ShiftPolicy
   - Cashier can only view/manage their own shifts
   - Admin can view all shifts

5. **Testing**
   - Test opening shift
   - Test closing shift with correct calculation
   - Test multiple open shifts prevention
   - Test authorization
   - Test difference calculation

### Deliverables:
- ✅ Shift open/close working
- ✅ Cash tracking accurate
- ✅ One active shift per cashier
- ✅ Tests passing

---

## PART 6: Transactions & Transaction Items (Core!)

**Estimasi**: 5-6 jam
**Priority**: CRITICAL - Core business feature
**Dependencies**: PART 3, PART 4, PART 5

### Tasks:

1. **Database Schema**
   ```
   - transactions table (id, uuid, device_id, cashier_id, shift_id,
                        subtotal, discount, total, payment_method,
                        amount_paid, change_amount, status, sync_status,
                        client_created_at, server_created_at)
   - transaction_items table (id, transaction_id, product_id, quantity,
                              price, subtotal, discount)
   ```
   - Create migrations with proper indexes (uuid, device_id)
   - Create StatusEnum (COMPLETED, VOID)
   - Create PaymentMethodEnum (CASH, TRANSFER, QRIS)
   - Create SyncStatusEnum (PENDING, SYNCED)
   - Create seeders
   - Create factories

2. **Transaction Service Layer**
   - Create `TransactionService` class
   - Method: `createTransaction(data)` - atomic creation
   - Method: `voidTransaction(transactionId, reason, userId)`
   - Handle idempotency check (device_id + uuid)
   - Integrate with StockService for stock deduction
   - Calculate totals, change, etc.

3. **Transaction API**
   - GET `/api/transactions` (list with filters, pagination)
   - GET `/api/transactions/{id}` (detail with items)
   - POST `/api/transactions` (create transaction)
   - POST `/api/transactions/{id}/void` (void transaction)
   - Create TransactionController
   - Create StoreTransactionRequest (complex validation)
   - Create TransactionResource with nested items

4. **Business Rules - CREATE**
   - Generate server timestamp
   - Validate all products exist and active
   - Validate sufficient stock
   - Calculate totals correctly
   - Create transaction record
   - Create transaction items
   - Deduct stock via StockService (type: SALE)
   - Record audit log
   - **ALL IN ONE DB TRANSACTION** (critical!)

5. **Business Rules - VOID**
   - Only COMPLETED transactions can be voided
   - Reverse stock (add back, type: VOID_REVERSAL)
   - Update status to VOID
   - Record audit log with reason
   - Cannot void already voided transaction

6. **Idempotency Implementation**
   - Check if transaction with (device_id + uuid) exists
   - If exists, return existing record (200 OK)
   - If not, create new transaction
   - Use database unique constraint as safety net

7. **Authorization**
   - Create TransactionPolicy
   - Both roles can create transactions (if in shift)
   - Cashier can only view their own transactions
   - Admin can view all transactions
   - Only Admin can void transactions (configurable)

8. **Testing**
   - Test transaction creation (happy path)
   - Test stock deduction integration
   - Test idempotency (send same transaction twice)
   - Test concurrent transaction creation
   - Test void transaction
   - Test stock reversal on void
   - Test authorization
   - Test validation (insufficient stock, invalid product)
   - Test calculation accuracy
   - Test atomic rollback on failure

### Deliverables:
- ✅ Transaction creation working atomically
- ✅ Stock automatically deducted
- ✅ Idempotency working perfectly
- ✅ Void functionality working
- ✅ Tests passing (especially idempotency tests!)

---

## PART 7: Device Management

**Estimasi**: 2 jam
**Priority**: MEDIUM - Required for sync mechanism
**Dependencies**: PART 2

### Tasks:

1. **Database Schema**
   ```
   - devices table (id, device_uuid, name, last_seen_at,
                    app_version, is_active)
   ```
   - Create migration with unique index on device_uuid
   - Create seeder
   - Create factory

2. **Device API**
   - POST `/api/devices/register` (register/update device)
   - GET `/api/devices` (list devices, admin only)
   - Create DeviceController
   - Create RegisterDeviceRequest
   - Create DeviceResource

3. **Business Rules**
   - Update last_seen_at on every API request (middleware)
   - Store app_version for compatibility checking
   - Device can re-register to update info

4. **Authorization**
   - Create DevicePolicy
   - Any authenticated user can register device
   - Only Admin can list all devices

5. **Testing**
   - Test device registration
   - Test duplicate registration (update scenario)
   - Test last_seen_at update
   - Test authorization

### Deliverables:
- ✅ Device registration working
- ✅ Device tracking working
- ✅ Tests passing

---

## PART 8: Sync Mechanism (Push/Pull)

**Estimasi**: 5-6 jam
**Priority**: HIGH - Core offline-first feature
**Dependencies**: PART 6, PART 7

### Tasks:

1. **Database Schema**
   ```
   - sync_logs table (id, device_id, sync_type, status, 
                     records_count, errors, synced_at)
   ```
   - Create migration
   - Create SyncTypeEnum (PUSH, PULL)
   - Create SyncStatusEnum (SUCCESS, FAILED, PARTIAL)
   - Create seeder
   - Create factory

2. **Sync Service Layer**
   - Create `SyncService` class
   - Method: `pushTransactions(deviceId, transactions[])`
   - Method: `pullChanges(deviceId, lastSyncTimestamp)`
   - Handle batch processing
   - Handle partial failures gracefully
   - Log sync operations

3. **Push API**
   - POST `/api/sync/push`
   - Accept array of transactions
   - Validate each transaction
   - Process using TransactionService (idempotency included)
   - Return success/failure per transaction
   - Create PushSyncRequest
   - Create SyncController

4. **Pull API**
   - POST `/api/sync/pull`
   - Accept last_sync_timestamp
   - Return changes since timestamp:
     - New/updated products
     - Category changes
     - Price changes
     - System settings
   - Use server_created_at / updated_at for ordering
   - Create PullSyncRequest

5. **Business Rules - Push**
   - Validate device is registered and active
   - Process transactions in order
   - Use idempotency for each transaction
   - Never acknowledge before successful persistence
   - Handle network retry scenarios
   - Return detailed status per transaction

6. **Business Rules - Pull**
   - Return deterministic, ordered results
   - Include only changes after last_sync_timestamp
   - Paginate if needed (large change sets)
   - Include deleted/deactivated items

7. **Error Handling**
   - Partial success handling
   - Detailed error messages per record
   - Retry mechanism for failed records
   - Log all sync operations

8. **Testing**
   - Test push with single transaction
   - Test push with multiple transactions
   - Test push with duplicate transactions (idempotency)
   - Test push with invalid data
   - Test push with network retry simulation
   - Test pull with no changes
   - Test pull with many changes
   - Test pull pagination
   - Test authorization
   - Test concurrent push from multiple devices

### Deliverables:
- ✅ Push sync working with idempotency
- ✅ Pull sync working with proper ordering
- ✅ Error handling robust
- ✅ Sync logging working
- ✅ Tests passing (especially concurrent scenarios)

---

## PART 9: Audit Logging

**Estimasi**: 2-3 jam
**Priority**: MEDIUM - Important for compliance
**Dependencies**: ALL previous parts

### Tasks:

1. **Database Schema**
   ```
   - audit_logs table (id, user_id, action, entity_type, entity_id,
                      old_values, new_values, ip_address, user_agent,
                      created_at)
   ```
   - Create migration with indexes (user_id, action, created_at)
   - Create AuditActionEnum (all actions from PRD)
   - Create seeder
   - Create factory

2. **Audit Service Layer**
   - Create `AuditService` class
   - Method: `log(action, entityType, entityId, oldValues, newValues)`
   - Method: `getAuditTrail(filters)`
   - Auto-capture IP and User Agent

3. **Audit Integration**
   - Integrate into existing services:
     - AuthController (LOGIN, LOGOUT)
     - ProductService (PRODUCT_CREATED, PRODUCT_UPDATED, PRICE_CHANGED)
     - StockService (STOCK_ADJUSTED)
     - TransactionService (TRANSACTION_CREATED, TRANSACTION_VOIDED)
     - ShiftService (SHIFT_OPENED, SHIFT_CLOSED)
   - Use Laravel Events/Observers pattern (recommended)

4. **Audit API**
   - GET `/api/audit-logs` (admin only)
   - Filter by: user, action, entity, date range
   - Create AuditLogController
   - Create AuditLogResource

5. **Security**
   - Never log passwords
   - Never log authentication tokens
   - Sanitize sensitive data

6. **Authorization**
   - Only Admin can view audit logs

7. **Testing**
   - Test audit log creation on various actions
   - Test sensitive data is not logged
   - Test authorization
   - Test filtering and pagination

### Deliverables:
- ✅ All critical actions logged
- ✅ No sensitive data in logs
- ✅ Audit trail queryable
- ✅ Tests passing

---

## PART 10: Reports & Dashboard

**Estimasi**: 4-5 jam
**Priority**: MEDIUM - Business intelligence
**Dependencies**: PART 6, PART 5

### Tasks:

1. **Dashboard API**
   - GET `/api/dashboard`
   - Return metrics:
     - Today's sales total
     - Transaction count (today, this week, this month)
     - Top 5 products (by quantity sold)
     - Low stock alerts
     - Active shifts count
     - Payment method breakdown
   - Create DashboardController
   - Create DashboardResource

2. **Sales Report API**
   - GET `/api/reports/sales`
   - Filters: date_from, date_to, cashier_id, payment_method
   - Return:
     - Total sales
     - Transaction count
     - Items sold
     - Payment method breakdown
     - Sales by cashier
     - Sales by hour/day (time series)
   - Create SalesReportController
   - Create ReportRequest for validation
   - Create SalesReportResource

3. **Product Report API**
   - GET `/api/reports/products`
   - Filters: date_from, date_to, category_id
   - Return:
     - Top selling products
     - Slow moving products
     - Revenue by product
     - Stock movement summary
   - Create ProductReportController
   - Create ProductReportResource

4. **Cashier Report API**
   - GET `/api/reports/cashiers`
   - Filters: date_from, date_to
   - Return:
     - Sales by cashier
     - Transaction count by cashier
     - Shift summary
     - Average transaction value
   - Create CashierReportController
   - Create CashierReportResource

5. **Report Service Layer**
   - Create `ReportService` class
   - Optimize queries (use indexes, aggregations)
   - Cache results where appropriate (Redis)
   - Use query builder efficiently

6. **Authorization**
   - Admin: access all reports
   - Cashier: only their own performance (limited)

7. **Testing**
   - Test dashboard metrics accuracy
   - Test report filtering
   - Test date range queries
   - Test authorization
   - Test caching
   - Test performance with large datasets

### Deliverables:
- ✅ Dashboard working with accurate metrics
- ✅ All report endpoints working
- ✅ Reports performant (< 2 seconds)
- ✅ Authorization enforced
- ✅ Tests passing

---

## PART 11: Testing, Documentation & Deployment

**Estimasi**: 3-4 jam
**Priority**: HIGH - Quality assurance
**Dependencies**: ALL previous parts

### Tasks:

1. **Integration Testing**
   - Create end-to-end test scenarios:
     - Complete transaction flow (login → create transaction → check stock)
     - Shift workflow (open → transactions → close)
     - Sync workflow (offline transactions → push → verify)
   - Test cross-feature interactions

2. **Performance Testing**
   - Test API response times
   - Test concurrent request handling
   - Test database query performance
   - Identify and fix N+1 queries

3. **Security Testing**
   - Test authorization on all endpoints
   - Test rate limiting
   - Test SQL injection prevention
   - Test XSS prevention
   - Test CSRF protection

4. **API Documentation**
   - Generate API documentation (OpenAPI/Swagger)
   - Document all endpoints
   - Document request/response examples
   - Document error codes
   - Update API_CONTRACT.md if needed

5. **Deployment Preparation**
   - Create production .env.example
   - Document deployment steps
   - Create database backup strategy
   - Setup Laravel scheduler commands
   - Setup Laravel queue workers
   - Configure logging (production)
   - Configure error monitoring (Sentry, etc.)

6. **Code Quality**
   - Run PHPStan/Larastan
   - Fix code quality issues
   - Ensure PSR-12 coding standards
   - Remove debug code

7. **Run Full Test Suite**
   - Ensure ALL tests pass
   - Achieve good test coverage (aim for >80%)
   - Fix any failing tests

8. **Documentation**
   - Update README.md with:
     - Installation instructions
     - Development setup
     - Testing instructions
     - Deployment instructions
   - Document environment variables
   - Document API endpoints (link to Swagger)

### Deliverables:
- ✅ All tests passing (unit + integration)
- ✅ API documentation complete
- ✅ Code quality verified
- ✅ Deployment ready
- ✅ README.md updated

---

## Summary

### Critical Path (Must Complete in Order):
1. PART 1: Foundation
2. PART 2: Authentication
3. PART 3: Products & Categories
4. PART 4: Stock Management
5. PART 6: Transactions (Core)
6. PART 8: Sync Mechanism

### Can Be Done in Parallel After Prerequisites:
- PART 5: Shifts (after PART 2)
- PART 7: Devices (after PART 2)
- PART 9: Audit (after all features)
- PART 10: Reports (after PART 6)

### Total Estimated Time: **35-42 hours**

### Definition of Done (from PRD):
- ✅ API works locally
- ✅ Database migrations work from clean state
- ✅ Authentication works
- ✅ RBAC works
- ✅ Product API works
- ✅ Transaction API works
- ✅ Inventory works
- ✅ Shift works
- ✅ Sync works with idempotency
- ✅ Reports work
- ✅ Audit logs work
- ✅ Tests pass
- ✅ API documentation matches implementation

---

## Execution Strategy

### Recommended Approach:

1. **Day 1-2**: PART 1, PART 2, PART 3
2. **Day 3**: PART 4, PART 5
3. **Day 4-5**: PART 6 (most critical!)
4. **Day 6**: PART 7, PART 8
5. **Day 7**: PART 9, PART 10
6. **Day 8**: PART 11 (testing & docs)

### When to Ask for Execution:

Kamu bisa request eksekusi per-part dengan command:
```
"Execute PART 1: Foundation & Infrastructure Setup"
```

Atau jika ingin eksekusi beberapa part sekaligus:
```
"Execute PART 1 and PART 2"
```

### Progress Tracking:

Gunakan file ini untuk tracking progress:
- [ ] PART 1: Foundation ✅
- [ ] PART 2: Auth ✅
- [ ] PART 3: Products ✅
- [ ] PART 4: Stock ✅
- [ ] PART 5: Shifts ✅
- [ ] PART 6: Transactions ✅
- [ ] PART 7: Devices ✅
- [ ] PART 8: Sync ✅
- [ ] PART 9: Audit ✅
- [ ] PART 10: Reports ✅
- [ ] PART 11: Testing ✅

---

**Ready to start? Berikan command untuk part mana yang ingin dieksekusi!** 🚀
