# PRD — KASIR Mobile Agent

## 1. Role

You are responsible ONLY for the mobile application.

Scope:
- `/mobile`
- Mobile-specific documentation under `/docs` when explicitly required

Do NOT implement desktop or Laravel backend internals.

## 2. Objective

Build a Flutter mobile application for Owner/Admin monitoring.

The mobile app is NOT the primary cashier application in MVP.

Its purpose is:
- Monitor sales
- Monitor inventory
- View transactions
- Manage products
- View reports
- Monitor low stock

## 3. Technology

- Flutter
- Dart
- SQLite for local cache
- REST API
- Secure local token storage

Do not replace Flutter with React Native.

## 4. Architecture

```text
mobile/
├── lib/
│   ├── core/
│   ├── features/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── inventory/
│   │   ├── transactions/
│   │   └── reports/
│   ├── services/
│   ├── models/
│   ├── repositories/
│   └── main.dart
├── test/
└── pubspec.yaml
```

Use a clear separation between:
- UI
- State
- Repository
- API
- Local storage

## 5. Backend Contract

Use:

```text
/docs/API_CONTRACT.md
```

Do not invent backend endpoints.

If an endpoint is missing:
- Document the requirement
- Do not fake server behavior

## 6. Authentication

Screens:
- Splash
- Login
- Dashboard

Endpoints:

```http
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

Store authentication credentials securely.

Do not store plaintext passwords.

If authentication expires:
- Clear invalid credentials/token
- Return user to login

## 7. Roles

Mobile MVP is restricted to:

```text
ADMIN
OWNER
```

Cashier mobile access is not required unless explicitly added later.

## 8. Dashboard

Show:

```text
Today's Sales
Transaction Count
Items Sold
Low Stock Count
```

Charts:
- Daily sales
- Weekly sales
- Top-selling products

Date range should be configurable where supported by API.

## 9. Products

Screens:
- Product list
- Product detail
- Create product
- Edit product

Fields:

```text
SKU
Barcode
Name
Category
Buy price
Sell price
Stock
Minimum stock
Unit
Active
```

Admin may edit product information according to backend authorization.

## 10. Inventory

Show:
- Current stock
- Minimum stock
- Low-stock indicator
- Stock movement history

Stock adjustments should require:
- Quantity
- Reason

The mobile app must use the backend inventory API.

Do not directly manipulate server stock.

## 11. Transactions

Transaction list:

```text
Transaction number
Date
Cashier
Total
Payment method
Status
```

Filters:
- Date
- Cashier
- Payment method
- Status

Transaction detail:
- Products
- Quantity
- Unit price
- Discount
- Subtotal
- Total
- Payment
- Change
- Cashier
- Timestamp

## 12. Reports

Minimum reports:

### Sales

```text
Total sales
Transaction count
Cash
Transfer
QRIS
```

### Products

```text
Product
Quantity sold
Revenue
```

### Cashiers

```text
Cashier
Transaction count
Sales total
```

Use backend report endpoints.

## 13. Local Cache

Use SQLite for useful read-only/cache data.

Cache may contain:
- User session metadata
- Products
- Categories
- Recent transactions
- Dashboard data

Server remains authoritative.

Do not treat mobile cache as the source of truth for financial data.

## 14. Offline Mobile Behavior

MVP does NOT require mobile cashier functionality.

When offline:
- Show cached dashboard/data when available
- Clearly indicate offline state
- Do not allow unsupported write operations to pretend they succeeded

Example:

```text
Offline

Showing cached data
Last updated:
16 Aug 2026 16:20
```

## 15. Data Refresh

Provide:
- Pull to refresh
- Manual refresh button where appropriate
- Last updated timestamp

Do not continuously poll aggressively.

## 16. Notifications

MVP UI should support low-stock indicators.

Push notification infrastructure is optional and NOT required for MVP.

Do not add Firebase push notifications unless explicitly requested.

## 17. UI/UX

Design goals:
- Clean
- Modern
- Simple
- Mobile-first
- Fast
- Easy to understand

Dashboard should prioritize:
1. Sales
2. Transactions
3. Inventory warnings
4. Reports

Use:
- Clear cards
- Charts
- Lists
- Search
- Filters
- Empty states
- Loading states
- Error states

## 18. Error Handling

Example:

```text
Unable to load dashboard.

Please check your connection.

[Retry]
```

For cached data:

```text
Showing cached data
Last synchronized:
16:20
```

Never show fake successful values when the API failed.

## 19. Security

- Secure token storage
- No plaintext password
- Clear credentials on logout
- Respect backend authorization
- Do not hardcode API secrets
- Do not commit production credentials

## 20. Testing

Test:
- Login
- Logout
- Dashboard
- Product list
- Product detail
- Inventory
- Transactions
- Reports
- API error handling
- Offline cache behavior
- Token expiration

Critical scenario:

```text
Load dashboard online
→ disable internet
→ reopen dashboard
→ cached data appears
→ UI says cached/offline
```

## 21. Performance

- Paginate large transaction lists.
- Avoid loading entire datasets.
- Cache frequently viewed data.
- Do not block UI during API calls.
- Use appropriate loading states.
- Avoid unnecessary API requests.

## 22. Agent Rules

1. Work only inside mobile scope.
2. Do not modify desktop source.
3. Do not modify backend source.
4. Follow API contract exactly.
5. Do not build cashier functionality for MVP.
6. Do not invent backend data.
7. Do not claim offline writes succeeded when backend support does not exist.
8. Do not add push notifications unless explicitly requested.
9. Do not add unnecessary dependencies.
10. Write tests for critical flows.
11. Keep UI and API logic separated.
12. Do not store plaintext passwords.

## 23. Definition of Done

Mobile is complete when:
- Flutter app builds
- Login works
- Authentication works
- Dashboard works
- Products work
- Inventory works
- Transactions work
- Reports work
- Local cache works
- Offline read behavior works
- Error handling works
- Secure logout works
- Critical tests pass
