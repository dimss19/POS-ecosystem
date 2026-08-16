# KASIR POS - Backend API

Backend REST API untuk sistem Point of Sale (POS) offline-first menggunakan Laravel 13.

## Technology Stack

- **Framework**: Laravel 13
- **PHP**: 8.3+
- **Database**: PostgreSQL 16
- **Cache/Queue**: Redis
- **Testing**: Pest PHP
- **Container**: Docker & Docker Compose

## Features

- ✅ Authentication & Authorization (Sanctum)
- ✅ Role-based Access Control (Admin/Cashier)
- ✅ Product & Category Management
- ✅ Transaction Processing
- ✅ Inventory & Stock Movement
- ✅ Cashier Shift Management
- ✅ Offline Synchronization
- ✅ Idempotent Transaction Handling
- ✅ Audit Logging
- ✅ Reports & Dashboard

## Project Structure

```
backend/
├── app/
│   ├── Actions/        # Business actions
│   ├── Http/
│   │   ├── Controllers/
│   │   ├── Requests/
│   │   └── Resources/
│   ├── Models/
│   ├── Policies/       # Authorization policies
│   ├── Services/       # Business logic services
│   └── Jobs/           # Queue jobs
├── database/
│   ├── migrations/
│   ├── seeders/
│   └── factories/
├── docker/             # Docker configuration
│   ├── nginx/
│   └── php/
├── routes/
└── tests/
```

## Local Development Setup

### Prerequisites

- PHP 8.3+
- Composer
- PostgreSQL
- Redis (optional, can use database driver)

### Installation Steps

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   composer install
   ```

3. **Setup environment**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. **Configure database** (edit .env)
   ```
   DB_CONNECTION=pgsql
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_DATABASE=pos
   DB_USERNAME=postgres
   DB_PASSWORD=123
   ```

5. **Run migrations**
   ```bash
   php artisan migrate
   ```

6. **Seed database (optional)**
   ```bash
   php artisan db:seed
   ```

7. **Start development server**
   ```bash
   php artisan serve
   ```

   API will be available at: `http://localhost:8000`

### Running Tests

```bash
php artisan test
```

Or with Pest directly:
```bash
./vendor/bin/pest
```

## Docker Development Setup

### Prerequisites

- Docker Desktop
- Docker Compose

### Quick Start with Docker

1. **Build and start containers**
   ```bash
   docker-compose up -d --build
   ```

2. **Install dependencies**
   ```bash
   docker-compose exec app composer install
   ```

3. **Setup application**
   ```bash
   docker-compose exec app php artisan key:generate
   docker-compose exec app php artisan migrate
   docker-compose exec app php artisan db:seed
   ```

4. **Access the API**
   - API: http://localhost:8000

### Docker Services

- **app**: PHP 8.3-FPM application
- **nginx**: Web server (port 8000)
- **db**: PostgreSQL 16 (port 5432)
- **redis**: Redis cache (port 6379)
- **queue**: Laravel queue worker
- **scheduler**: Laravel task scheduler

### Useful Docker Commands

```bash
# View logs
docker-compose logs -f app

# Access application container
docker-compose exec app bash

# Run artisan commands
docker-compose exec app php artisan [command]

# Run tests
docker-compose exec app php artisan test

# Stop containers
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## Database Configuration

Default PostgreSQL credentials:
- **Host**: 127.0.0.1 (localhost) or `db` (in Docker)
- **Port**: 5432
- **Database**: pos
- **Username**: postgres
- **Password**: 123

## API Documentation

API Contract dokumentasi tersedia di: `/docs/API_CONTRACT.md`

Endpoint utama:
- Authentication: `/api/auth/*`
- Products: `/api/products`
- Categories: `/api/categories`
- Transactions: `/api/transactions`
- Shifts: `/api/shifts`
- Sync: `/api/sync/*`
- Reports: `/api/reports/*`

## Development Tools

### Code Quality

```bash
# Run PHP Pint (Laravel formatter)
./vendor/bin/pint

# Check code style
./vendor/bin/pint --test
```

### Testing

```bash
# Run all tests
php artisan test

# Run specific test
php artisan test --filter=ProductTest

# Run with coverage
php artisan test --coverage
```

### Queue & Jobs

```bash
# Start queue worker
php artisan queue:work

# List failed jobs
php artisan queue:failed

# Retry failed jobs
php artisan queue:retry all
```

### Cache Management

```bash
# Clear all cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Optimize for production
php artisan optimize
```

## Environment Variables

Key environment variables:

```env
# Application
APP_NAME="KASIR POS"
APP_ENV=local|production
APP_DEBUG=true|false

# Database
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=pos
DB_USERNAME=postgres
DB_PASSWORD=123

# Cache & Queue
CACHE_STORE=redis|database
QUEUE_CONNECTION=redis|database

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

## Deployment

### Production Checklist

- [ ] Set `APP_ENV=production`
- [ ] Set `APP_DEBUG=false`
- [ ] Generate new `APP_KEY`
- [ ] Configure production database
- [ ] Setup Redis for cache and queue
- [ ] Configure supervisor for queue workers
- [ ] Setup Laravel scheduler cron job
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS settings
- [ ] Setup backup strategy
- [ ] Configure monitoring (Sentry, etc.)

### Production Commands

```bash
# Optimize application
php artisan optimize
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Run migrations
php artisan migrate --force

# Start queue worker (use supervisor in production)
php artisan queue:work --tries=3 --timeout=60
```

## Troubleshooting

### Common Issues

**Database connection failed**
- Check PostgreSQL is running
- Verify credentials in .env
- Check port 5432 is not blocked

**Redis connection failed**
- Use `CACHE_STORE=database` and `QUEUE_CONNECTION=database` as fallback
- Check Redis is running on port 6379

**Permission denied on storage**
```bash
chmod -R 775 storage bootstrap/cache
```

**Composer install fails**
- Update composer: `composer self-update`
- Clear composer cache: `composer clear-cache`

## Contributing

Please follow Laravel coding standards and write tests for new features.

## License

Proprietary - All rights reserved

## Support

For issues and questions, please check documentation in `/docs/` folder.
