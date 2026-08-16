<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('devices', function (Blueprint $table) {
            $table->id();
            $table->string('device_uuid')->unique();
            $table->string('name');
            $table->timestamp('last_seen_at')->nullable();
            $table->string('app_version')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('device_uuid');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('devices');
    }
};
