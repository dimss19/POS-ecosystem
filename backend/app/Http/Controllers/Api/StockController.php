<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockMovement;
use App\Services\StockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class StockController extends Controller
{
    public function __construct(
        protected StockService $stockService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Product::with('category')->where('is_active', true);

        if ($request->boolean('low_stock_only')) {
            $query->whereColumn('stock', '<=', 'minimum_stock');
        }

        $products = $query->orderBy('name')->paginate($request->input('per_page', 50));

        return response()->json([
            'data' => $products->items(),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'total' => $products->total(),
            ],
            'message' => 'Success',
        ]);
    }

    public function movements(Request $request): JsonResponse
    {
        $query = StockMovement::with(['product', 'creator', 'transaction']);

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('date_from')) {
            $query->where('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('created_at', '<=', $request->date_to);
        }

        $movements = $query->orderBy('created_at', 'desc')->paginate($request->input('per_page', 50));

        return response()->json([
            'data' => $movements->items(),
            'meta' => [
                'current_page' => $movements->currentPage(),
                'last_page' => $movements->lastPage(),
                'total' => $movements->total(),
            ],
            'message' => 'Success',
        ]);
    }

    public function adjust(Request $request): JsonResponse
    {
        Gate::authorize('adjust', StockMovement::class);

        if (!$request->has('quantity_change') && $request->has('quantity')) {
            $request->merge(['quantity_change' => $request->input('quantity')]);
        }

        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity_change' => 'required|integer|not_in:0',
            'reason' => 'required|string|max:255',
        ]);

        $product = Product::findOrFail($validated['product_id']);

        $updatedProduct = $this->stockService->adjustStock(
            product: $product,
            quantityChange: (int) $validated['quantity_change'],
            type: 'ADJUSTMENT',
            reason: $validated['reason'],
            userId: $request->user()->id
        );

        return response()->json([
            'data' => $updatedProduct->load('category'),
            'message' => 'Stock adjusted successfully',
        ]);
    }
}
