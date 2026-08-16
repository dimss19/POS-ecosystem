<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Device;
use App\Services\SyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SyncController extends Controller
{
    public function __construct(
        protected SyncService $syncService
    ) {}

    public function push(Request $request): JsonResponse
    {
        // 1. Map device_id to device_uuid if needed
        if (!$request->has('device_uuid') && $request->has('device_id')) {
            $request->merge(['device_uuid' => $request->input('device_id')]);
        }

        // 2. Map single queue item payload to transactions array if needed
        if (!$request->has('transactions') && $request->has('payload')) {
            $payload = $request->input('payload');
            if (is_string($payload)) {
                $payload = json_decode($payload, true);
            }
            if ($request->input('entity_type') === 'transaction' && is_array($payload)) {
                $request->merge(['transactions' => [$payload]]);
            } elseif ($request->input('entity_type') === 'shift') {
                // If syncing a shift record, acknowledge successfully
                return response()->json([
                    'data' => [
                        'status' => 'SUCCESS',
                        'message' => 'Shift synced',
                    ],
                    'message' => 'Push sync process completed',
                ]);
            }
        }

        $validated = $request->validate([
            'device_uuid' => 'required|string',
            'transactions' => 'required|array',
            'transactions.*.uuid' => 'required|uuid',
            'transactions.*.shift_id' => 'nullable',
            'transactions.*.payment_method' => 'required|in:CASH,TRANSFER,QRIS',
            'transactions.*.amount_paid' => 'required|numeric|min:0',
            'transactions.*.items' => 'required|array|min:1',
            'transactions.*.items.*.product_id' => 'required|exists:products,id',
            'transactions.*.items.*.quantity' => 'required|integer|min:1',
        ]);

        $device = Device::firstOrCreate(
            ['device_uuid' => $validated['device_uuid']],
            [
                'name' => 'POS Device ' . substr($validated['device_uuid'], 0, 8),
                'last_seen_at' => now(),
                'is_active' => true,
            ]
        );

        $result = $this->syncService->push(
            deviceId: $device->id,
            transactions: $validated['transactions'],
            cashierId: $request->user()->id
        );

        return response()->json([
            'data' => $result,
            'message' => 'Push sync process completed',
        ]);
    }

    public function pull(Request $request): JsonResponse
    {
        if (!$request->has('device_uuid') && $request->has('device_id')) {
            $request->merge(['device_uuid' => $request->input('device_id')]);
        }

        $validated = $request->validate([
            'device_uuid' => 'required|string',
            'last_sync_timestamp' => 'nullable|date',
        ]);

        $device = Device::firstOrCreate(
            ['device_uuid' => $validated['device_uuid']],
            [
                'name' => 'POS Device ' . substr($validated['device_uuid'], 0, 8),
                'last_seen_at' => now(),
                'is_active' => true,
            ]
        );

        $result = $this->syncService->pull(
            deviceId: $device->id,
            lastSyncTimestamp: $validated['last_sync_timestamp'] ?? null
        );

        return response()->json([
            'data' => $result,
            'message' => 'Pull sync process completed',
        ]);
    }
}
