<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditService
{
    public static function log(
        string $action,
        ?string $entityType = null,
        ?int $entityId = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?int $deviceId = null
    ): AuditLog {
        // Filter out sensitive keys from old & new values
        $filterSensitive = function (?array $data) {
            if (!$data) return null;
            $sensitiveKeys = ['password', 'token', 'secret', 'remember_token'];
            foreach ($sensitiveKeys as $key) {
                if (array_key_exists($key, $data)) {
                    unset($data[$key]);
                }
            }
            return $data;
        };

        return AuditLog::create([
            'user_id' => Auth::id(),
            'device_id' => $deviceId,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'old_values' => $filterSensitive($oldValues),
            'new_values' => $filterSensitive($newValues),
            'ip_address' => Request::ip(),
            'created_at' => now(),
        ]);
    }
}
