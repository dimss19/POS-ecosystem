<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\AuditService;
use App\Services\StockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class ProductController extends Controller
{
    public function __construct(
        protected StockService $stockService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Product::with('category');

        if (!$request->user()->isAdmin()) {
            $query->where('is_active', true);
        } elseif ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ILIKE', "%{$search}%")
                  ->orWhere('barcode', $search)
                  ->orWhere('sku', $search);
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('barcode')) {
            $query->where('barcode', $request->barcode);
        }

        $products = $query->orderBy('name')->paginate($request->input('per_page', 50));

        return response()->json([
            'data' => $products->items(),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
            'message' => 'Success',
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('create', Product::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:100|unique:products,sku',
            'barcode' => 'nullable|string|max:100|unique:products,barcode',
            'category_id' => 'required|exists:categories,id',
            'buy_price' => 'nullable|numeric|min:0',
            'sell_price' => 'required|numeric|min:0',
            'stock' => 'nullable|integer|min:0',
            'minimum_stock' => 'nullable|integer|min:0',
            'unit' => 'required|string|max:50',
            'is_active' => 'boolean',
        ]);

        $product = DB::transaction(function () use ($validated, $request) {
            $initialStock = (int) ($validated['stock'] ?? 0);
            $validated['stock'] = 0; // set to 0 initially, StockService will adjust if > 0

            $product = Product::create($validated);

            if ($initialStock > 0) {
                $this->stockService->adjustStock(
                    product: $product,
                    quantityChange: $initialStock,
                    type: 'INITIAL_STOCK',
                    reason: 'Initial stock creation',
                    userId: $request->user()->id
                );
                $product->refresh();
            }

            AuditService::log('PRODUCT_CREATED', Product::class, $product->id, null, $product->toArray());

            return $product;
        });

        return response()->json([
            'data' => $product->load('category'),
            'message' => 'Product created successfully',
        ], 201);
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json([
            'data' => $product->load('category'),
            'message' => 'Success',
        ]);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        Gate::authorize('update', $product);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'sku' => 'nullable|string|max:100|unique:products,sku,' . $product->id,
            'barcode' => 'nullable|string|max:100|unique:products,barcode,' . $product->id,
            'category_id' => 'sometimes|required|exists:categories,id',
            'buy_price' => 'nullable|numeric|min:0',
            'sell_price' => 'sometimes|required|numeric|min:0',
            'minimum_stock' => 'nullable|integer|min:0',
            'unit' => 'sometimes|required|string|max:50',
            'is_active' => 'boolean',
        ]);

        $oldValues = $product->toArray();

        // Check if price changed
        if (isset($validated['sell_price']) && (float)$validated['sell_price'] !== (float)$product->sell_price) {
            AuditService::log('PRICE_CHANGED', Product::class, $product->id, [
                'sell_price' => $product->sell_price
            ], [
                'sell_price' => $validated['sell_price']
            ]);
        }

        $product->update($validated);

        AuditService::log('PRODUCT_UPDATED', Product::class, $product->id, $oldValues, $product->toArray());

        return response()->json([
            'data' => $product->load('category'),
            'message' => 'Product updated successfully',
        ]);
    }

    public function destroy(Product $product): JsonResponse
    {
        Gate::authorize('delete', $product);

        $oldValues = $product->toArray();
        $product->update(['is_active' => false]);

        AuditService::log('PRODUCT_DEACTIVATED', Product::class, $product->id, $oldValues, $product->toArray());

        return response()->json([
            'message' => 'Product deactivated successfully',
        ]);
    }
}
