<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Services\TransactionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class TransactionController extends Controller
{
    public function __construct(
        protected TransactionService $transactionService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Transaction::with(['items', 'cashier', 'device']);

        if (!$request->user()->isAdmin()) {
            $query->where('cashier_id', $request->user()->id);
        } elseif ($request->filled('cashier_id')) {
            $query->where('cashier_id', $request->cashier_id);
        }

        if ($request->filled('status')) {
            $query->where('status', strtoupper($request->status));
        }

        if ($request->filled('payment_method')) {
            $query->where('payment_method', strtoupper($request->payment_method));
        }

        if ($request->filled('date_from')) {
            $query->where('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('created_at', '<=', $request->date_to);
        }

        $transactions = $query->orderBy('created_at', 'desc')->paginate($request->input('per_page', 50));

        return response()->json([
            'data' => $transactions->items(),
            'meta' => [
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'total' => $transactions->total(),
            ],
            'message' => 'Success',
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'uuid' => 'nullable|uuid',
            'device_id' => 'nullable|exists:devices,id',
            'shift_id' => 'nullable|exists:shifts,id',
            'discount' => 'nullable|numeric|min:0',
            'payment_method' => 'required|in:CASH,TRANSFER,QRIS',
            'amount_paid' => 'required|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'nullable|numeric|min:0',
            'items.*.discount' => 'nullable|numeric|min:0',
            'sync_status' => 'nullable|in:PENDING,SYNCED',
            'client_created_at' => 'nullable|date',
        ]);

        $transaction = $this->transactionService->createTransaction(
            data: $validated,
            cashierId: $request->user()->id
        );

        $status = $transaction->wasRecentlyCreated ? 201 : 200;

        return response()->json([
            'data' => $transaction->load(['items', 'cashier']),
            'message' => $transaction->wasRecentlyCreated ? 'Transaction created successfully' : 'Transaction already exists',
        ], $status);
    }

    public function show(Request $request, Transaction $transaction): JsonResponse
    {
        Gate::authorize('view', $transaction);

        return response()->json([
            'data' => $transaction->load(['items', 'cashier', 'device', 'shift', 'stockMovements']),
            'message' => 'Success',
        ]);
    }

    public function void(Request $request, Transaction $transaction): JsonResponse
    {
        Gate::authorize('void', $transaction);

        $validated = $request->validate([
            'reason' => 'required|string|max:255',
        ]);

        $voidedTx = $this->transactionService->voidTransaction(
            transactionId: $transaction->id,
            reason: $validated['reason'],
            userId: $request->user()->id
        );

        return response()->json([
            'data' => $voidedTx->load(['items', 'cashier']),
            'message' => 'Transaction voided successfully',
        ]);
    }
}
