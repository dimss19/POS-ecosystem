<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Device;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class DeviceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Device::class);

        $devices = Device::orderBy('created_at', 'desc')->get();

        return response()->json([
            'data' => $devices,
            'message' => 'Success',
        ]);
    }

    public function register(Request $request): JsonResponse
    {
        if (!$request->has('device_uuid') && $request->has('device_id')) {
            $request->merge(['device_uuid' => $request->input('device_id')]);
        }

        $validated = $request->validate([
            'device_uuid' => 'required|string|max:255',
            'name' => 'required|string|max:255',
            'app_version' => 'nullable|string|max:50',
        ]);

        $device = Device::updateOrCreate(
            ['device_uuid' => $validated['device_uuid']],
            [
                'name' => $validated['name'],
                'app_version' => $validated['app_version'] ?? null,
                'last_seen_at' => now(),
                'is_active' => true,
            ]
        );

        AuditService::log('DEVICE_REGISTERED', Device::class, $device->id, null, $device->toArray(), $device->id);

        return response()->json([
            'data' => $device,
            'message' => 'Device registered successfully',
        ]);
    }
}
