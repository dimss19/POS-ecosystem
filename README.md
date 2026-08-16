# KASIR POS Ecosystem

Enterprise Point of Sale (POS) Ecosystem with Offline-First Architecture, Real-Time Synchronization, and Multi-Platform Clients (Desktop, Mobile, and Backend API).

---

## Architecture Overview

The system consists of three main components engineered to operate seamlessly in retail and commerce environments:

1. **Backend REST API**: Centralized business logic, multi-tier authentication (RBAC), database synchronization, idempotent transaction processing, and analytics reporting.
2. **Desktop POS Application**: High-performance cashier workstation with offline-first local SQLite storage, hardware thermal receipt printing, and background sync queues.
3. **Mobile Monitoring Application**: Administrative and executive application for real-time sales tracking, inventory monitoring, stock movement audits, and business reports.

```
+------------------------------------------------------------------+
|                       Backend REST API                           |
|       Laravel 11/12 | PostgreSQL | Sanctum | Audit Logs          |
+---------------------------------+--------------------------------+
                                  ^
                                  |
              +-------------------+-------------------+
              |                                       |
              v                                       v
+-------------------------------+   +----------------------------------+
|     Desktop POS Client        |   |     Mobile Monitoring Client     |
| Tauri | React | SQLite Local  |   | Flutter | Multi-Tier Cache       |
| Cashier Operations & Offline  |   | Owner & Admin Analytics          |
+-------------------------------+   +----------------------------------+
```

---

## Technology Stack

### Backend Service
- **Framework**: Laravel 11/12 (PHP 8.2+)
- **Database**: PostgreSQL (Production) / SQLite (Testing)
- **Security & Auth**: Laravel Sanctum with Token Authentication & RBAC Policy Gates
- **CORS Handling**: Native Middleware for Desktop & Mobile clients
- **Automated Tests**: Pest PHP & PHPUnit (Unit & Feature Coverage)

### Desktop POS Client
- **Core Runtime**: Tauri 2
- **Frontend Framework**: React 18 with TypeScript
- **Bundler & Tooling**: Vite
- **Styling**: Tailwind CSS
- **Local Persistence**: Embedded SQLite (Offline-First)
- **Peripherals**: 58mm / 80mm ESC/POS Thermal Receipt Printing Engine

### Mobile Management Client
- **Framework**: Flutter 3 (Android / iOS / Web)
- **Language**: Dart
- **State Management**: Provider with Controller Architecture
- **Caching Layer**: Tiered SQLite Cache with In-Memory Web Fallback

---

## Core System Modules

### 1. Authentication and Authorization (RBAC)
- Multi-role support: `ADMIN`, `OWNER`, and `CASHIER`.
- Token-based API access via Laravel Sanctum.
- Automatic session invalidation upon token revocation (HTTP 401 handling).
- Rate-limiting protection against brute-force authentication attempts.
- Centralized audit logging for sensitive system events.

### 2. POS Cashier Workflow (Desktop)
- **Fast Cart Operations**: Instant barcode search, SKU lookup, item increments, discount calculation, and subtotaling.
- **Payment Processing**: Multi-method support (`CASH`, `TRANSFER`, `QRIS`), cash denomination calculator, and accurate change computation.
- **Shift Management**: Cashier shift lifecycle (`OPEN` with starting cash, `CLOSE` with cash tallying, expected cash verification, and difference reporting).
- **Thermal Printing**: Direct printing engine with formatted receipts, store metadata, itemized pricing, discounts, cashier information, and payment breakdown.

### 3. Inventory and Stock Control
- Multi-category product hierarchy.
- Stock level tracking with automated deduction upon transaction completion.
- Stock movement logs (`SALE`, `MANUAL_ADJUSTMENT`, `VOID_RESTORE`, `INITIAL_STOCK`).
- Low stock threshold indicators and restock alerts.
- Soft-deactivation mechanism preserving historical transaction references.

### 4. Offline-First Synchronization Engine
- **Local Queueing**: Transactions completed during offline periods are saved to local SQLite with unique client UUIDs.
- **Idempotent Ingestion**: Backend rejects duplicates using transaction UUIDs while returning existing records safely.
- **Bi-Directional Sync**:
  - `PUSH`: Dispatches queued offline transactions to `/api/sync/push`.
  - `PULL`: Fetches master product and category updates from `/api/sync/pull` based on timestamps.
- **Device Management**: Device registration, token authentication, and heartbeat tracking (`last_seen_at`).

### 5. Business Analytics and Reports
- **Executive Dashboard**: Gross revenue, transaction volume, average basket size, and active cashiers.
- **Product Sales Performance**: Itemized revenue rankings, units sold, and category breakdowns.
- **Cashier Performance**: Shift summaries, sales volume per cashier, and payment method distribution.
- **Date Range Filters**: Configurable daily, weekly, monthly, and custom date range queries.

---

## Project Structure

```
.
├── backend/                  # Laravel API application
│   ├── app/
│   │   ├── Http/Controllers/Api/  # REST API Controllers
│   │   ├── Models/                # Eloquent Models
│   │   ├── Policies/              # Authorization Policies
│   │   └── Services/              # Business Logic & Sync Services
│   ├── config/                    # Application & CORS configurations
│   ├── database/
│   │   ├── migrations/            # Database schema migrations
│   │   └── seeders/               # Initial system seeders
│   ├── routes/api.php             # API route definitions
│   └── tests/Feature/             # Automated test suites
│
├── dekstop app/              # Desktop POS client (Tauri + React)
│   ├── src/
│   │   ├── components/            # UI components (Cart, Grid, Modals)
│   │   ├── pages/                 # Main POS, Shift, Inventory, Settings pages
│   │   ├── services/              # SQLite database, Sync, Printer services
│   │   ├── stores/                # Global state stores (Zustand)
│   │   └── types/                 # TypeScript type definitions
│   └── src-tauri/                 # Tauri native configuration
│
├── mobile/                   # Mobile client (Flutter)
│   ├── lib/
│   │   ├── core/                  # Network, Caching, Theme, Config
│   │   ├── features/              # Modular screens & controllers
│   │   ├── models/                # Data models and serializations
│   │   └── repositories/          # Data repository layer
│   └── test/                      # Flutter widget and smoke tests
│
└── screenshot/               # System interface documentation
    ├── desktop/              # Desktop POS application screenshots
    └── mobile/               # Mobile monitoring application screenshots
```

---

## Installation and Setup

### Prerequisites
- PHP 8.2+ with Composer
- Node.js 18+ with npm
- Flutter SDK 3.22+
- PostgreSQL or SQLite
- Tauri CLI prerequisites (Rust toolchain)

### Backend Configuration
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan test
php artisan serve --port=8000
```

### Desktop POS Application
```bash
cd "dekstop app"
npm install
npm run dev
# To run with Tauri native wrapper:
npm run tauri dev
```

### Mobile Monitoring Application
```bash
cd mobile
flutter pub get
flutter analyze
flutter test
flutter run
```

---

## Default Credentials

The initial database seed provides the following default accounts:

| Role | Email | Password | Access Scope |
|---|---|---|---|
| **Admin / Owner** | `admin@pos.com` | `password123` | Full administrative & monitoring access across Desktop and Mobile clients |
| **Cashier** | `cashier@pos.com` | `password123` | Operational POS access on Desktop client (Sales, Shift, Receipts) |

---

## Verification and Quality Assurance

All core application flows have been audited and verified:
- **Backend**: Automated feature tests covering Authentication, Categories, Products, Shifts, Stock Adjustments, Idempotent Transactions, Sync Push/Pull, Reports, and User Management.
- **Desktop**: Full POS cashier workflow, payment calculation, printer simulation, and offline-to-online sync verification.
- **Mobile**: Flutter analyzer validation (`0 issues`), unit/widget tests passing, and responsive layouts across platforms.
