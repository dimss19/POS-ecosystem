<?php

use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DeviceController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\ShiftController;
use App\Http\Controllers\Api\StockController;
use App\Http\Controllers\Api\SyncController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\UserController;
use App\Http\Middleware\UpdateDeviceLastSeen;
use Illuminate\Support\Facades\Route;

// Public Auth routes
Route::post('/auth/login', [AuthController::class, 'login'])->name('login');

// Protected routes (Sanctum auth + device last seen tracking)
Route::middleware(['auth:sanctum', UpdateDeviceLastSeen::class])->group(function () {

    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Users
    Route::apiResource('users', UserController::class);

    // Categories
    Route::apiResource('categories', CategoryController::class)->except(['show']);

    // Products
    Route::apiResource('products', ProductController::class);

    // Stock Management
    Route::get('/stock', [StockController::class, 'index']);
    Route::get('/stock/movements', [StockController::class, 'movements']);
    Route::post('/stock/adjustments', [StockController::class, 'adjust']);

    // Shift Management
    Route::get('/shifts', [ShiftController::class, 'index']);
    Route::post('/shifts/open', [ShiftController::class, 'open']);
    Route::post('/shifts/{shift}/close', [ShiftController::class, 'close']);

    // Transactions
    Route::get('/transactions', [TransactionController::class, 'index']);
    Route::get('/transactions/{transaction}', [TransactionController::class, 'show']);
    Route::post('/transactions', [TransactionController::class, 'store']);
    Route::post('/transactions/{transaction}/void', [TransactionController::class, 'void']);

    // Devices
    Route::post('/devices/register', [DeviceController::class, 'register']);
    Route::get('/devices', [DeviceController::class, 'index']);

    // Offline Sync
    Route::post('/sync/push', [SyncController::class, 'push']);
    Route::post('/sync/pull', [SyncController::class, 'pull']);

    // Dashboard & Reports
    Route::get('/dashboard', [ReportController::class, 'dashboard']);
    Route::get('/reports/sales', [ReportController::class, 'sales']);
    Route::get('/reports/products', [ReportController::class, 'products']);
    Route::get('/reports/cashiers', [ReportController::class, 'cashiers']);

    // Audit Logs
    Route::get('/audit-logs', [AuditLogController::class, 'index']);
});
