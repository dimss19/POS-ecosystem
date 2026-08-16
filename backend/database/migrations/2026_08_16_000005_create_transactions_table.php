<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('device_id')->nullable()->constrained('devices')->onDelete('set null');
            $table->foreignId('cashier_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('shift_id')->constrained('shifts')->onDelete('cascade');
            $table->decimal('subtotal', 15, 2);
            $table->decimal('discount', 15, 2)->default(0);
            $table->decimal('total', 15, 2);
            $table->enum('payment_method', ['CASH', 'TRANSFER', 'QRIS']);
            $table->decimal('amount_paid', 15, 2);
            $table->decimal('change_amount', 15, 2);
            $table->enum('status', ['COMPLETED', 'VOID'])->default('COMPLETED');
            $table->enum('sync_status', ['PENDING', 'SYNCED'])->default('SYNCED');
            $table->timestamp('client_created_at')->useCurrent();
            $table->timestamp('server_created_at')->useCurrent();
            $table->timestamps();

            $table->index('uuid');
            $table->index('device_id');
            $table->index('cashier_id');
            $table->index('status');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
