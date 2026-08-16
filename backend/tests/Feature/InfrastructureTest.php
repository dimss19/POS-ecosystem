<?php

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

test('database connection is working', function () {
    expect(DB::connection()->getPdo())->not->toBeNull();
    
    $result = DB::select('SELECT 1 as test');
    expect($result[0]->test)->toBe(1);
});

test('cache is working', function () {
    $key = 'test_cache_key';
    $value = 'test_value';
    
    Cache::put($key, $value, 60);
    
    expect(Cache::get($key))->toBe($value);
    
    Cache::forget($key);
    expect(Cache::get($key))->toBeNull();
});

test('application environment is configured correctly', function () {
    expect(config('app.name'))->toBe('KASIR POS');
    expect(config('database.default'))->toBeIn(['pgsql', 'sqlite']);
    expect(config('cache.default'))->toBeIn(['database', 'array']);
});

test('required directories exist', function () {
    $directories = [
        app_path('Actions'),
        app_path('Services'),
        app_path('Policies'),
        app_path('Jobs'),
        app_path('Http/Controllers'),
        app_path('Models'),
    ];
    
    foreach ($directories as $dir) {
        expect(is_dir($dir))->toBeTrue("Directory {$dir} should exist");
    }
});

test('migrations have run successfully', function () {
    $connection = config('database.default');
    
    if ($connection === 'pgsql') {
        $tables = DB::select("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
        $tableNames = array_column($tables, 'tablename');
    } else {
        $tables = DB::select("SELECT name FROM sqlite_master WHERE type='table'");
        $tableNames = array_column($tables, 'name');
    }
    
    expect($tableNames)->toContain('migrations');
    expect($tableNames)->toContain('users');
    expect($tableNames)->toContain('products');
    expect($tableNames)->toContain('transactions');
});
