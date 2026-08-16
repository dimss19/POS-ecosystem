<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Shift;
use App\Models\Transaction;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShiftController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Shift::with('cashier');

        if (!$request->user()->isAdmin()) {
            $query->where('cashier_id', $request->user()->id);
        }

        if ($request->filled('status')) {
            $query->where('status', strtoupper($request->status));
        }

        $shifts = $query->orderBy('opened_at', 'desc')->paginate($request->input('per_page', 50));

        return response()->json([
            'data' => $shifts->items(),
            'meta' => [
                'current_page' => $shifts->currentPage(),
                'last_page' => $shifts->lastPage(),
                'total' => $shifts->total(),
            ],
            'message' => 'Success',
        ]);
    }

    public function open(Request $request): JsonResponse
    {
        $user = $request->user();

        // Check if there is already an open shift
        $existingOpen = Shift::where('cashier_id', $user->id)->where('status', 'OPEN')->first();
        if ($existingOpen) {
            return response()->json([
                'message' => 'Cashier already has an active open shift.',
                'data' => $existingOpen,
            ], 422);
        }

        $validated = $request->validate([
            'opening_cash' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $shift = Shift::create([
            'cashier_id' => $user->id,
            'opening_cash' => $validated['opening_cash'],
            'opened_at' => now(),
            'status' => 'OPEN',
            'notes' => $validated['notes'] ?? null,
        ]);

        AuditService::log('SHIFT_OPENED', Shift::class, $shift->id, null, $shift->toArray());

        return response()->json([
            'data' => $shift->load('cashier'),
            'message' => 'Shift opened successfully',
        ], 201);
    }

    public function close(Request $request, Shift $shift): JsonResponse
    {
        $user = $request->user();

        if (!$user->isAdmin() && $user->id !== $shift->cashier_id) {
            return response()->json([
                'message' => 'Unauthorized to close this shift.',
            ], 403);
        }

        if ($shift->status === 'CLOSED') {
            return response()->json([
                'message' => 'Shift is already closed.',
            ], 422);
        }

        $validated = $request->validate([
            'closing_cash' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        // Calculate expected cash from transactions
        $cashSales = Transaction::where('shift_id', $shift->id)
            ->where('status', 'COMPLETED')
            ->where('payment_method', 'CASH')
            ->sum('total');

        $expectedCash = $shift->opening_cash + $cashSales;
        $closingCash = (float) $validated['closing_cash'];
        $difference = $closingCash - $expectedCash;

        $shift->update([
            'closing_cash' => $closingCash,
            'expected_cash' => $expectedCash,
            'difference' => $difference,
            'closed_at' => now(),
            'status' => 'CLOSED',
            'notes' => $validated['notes'] ?? $shift->notes,
        ]);

        AuditService::log('SHIFT_CLOSED', Shift::class, $shift->id, null, $shift->toArray());

        return response()->json([
            'data' => $shift->load('cashier'),
            'message' => 'Shift closed successfully',
        ]);
    }
}
