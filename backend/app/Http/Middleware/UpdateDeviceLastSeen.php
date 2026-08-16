<?php

namespace App\Http\Middleware;

use App\Models\Device;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class UpdateDeviceLastSeen
{
    public function handle(Request $request, Closure $next): Response
    {
        $deviceUuid = $request->header('X-Device-UUID');
        if ($deviceUuid) {
            Device::where('device_uuid', $deviceUuid)->update([
                'last_seen_at' => now(),
            ]);
        }

        return $next($request);
    }
}
