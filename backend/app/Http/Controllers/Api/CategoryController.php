<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class CategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Category::query();

        if (!$request->user()->isAdmin()) {
            $query->where('is_active', true);
        }

        $categories = $query->orderBy('name')->get();

        return response()->json([
            'data' => $categories,
            'message' => 'Success',
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('create', Category::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $category = Category::create($validated);

        AuditService::log('CATEGORY_CREATED', Category::class, $category->id, null, $category->toArray());

        return response()->json([
            'data' => $category,
            'message' => 'Category created successfully',
        ], 201);
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        Gate::authorize('update', $category);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $oldValues = $category->toArray();
        $category->update($validated);

        AuditService::log('CATEGORY_UPDATED', Category::class, $category->id, $oldValues, $category->toArray());

        return response()->json([
            'data' => $category,
            'message' => 'Category updated successfully',
        ]);
    }

    public function destroy(Category $category): JsonResponse
    {
        Gate::authorize('delete', $category);

        $oldValues = $category->toArray();
        $category->update(['is_active' => false]);

        AuditService::log('CATEGORY_DEACTIVATED', Category::class, $category->id, $oldValues, $category->toArray());

        return response()->json([
            'message' => 'Category deactivated successfully',
        ]);
    }
}
