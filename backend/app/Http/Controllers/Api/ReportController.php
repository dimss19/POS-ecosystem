<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Shift;
use App\Models\Transaction;
use App\Models\TransactionItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function dashboard(): JsonResponse
    {
        $today = now()->startOfDay();

        $todaySales = (float) Transaction::where('status', 'COMPLETED')
            ->where('created_at', '>=', $today)
            ->sum('total');

        $todayTransactionCount = Transaction::where('status', 'COMPLETED')
            ->where('created_at', '>=', $today)
            ->count();

        $itemsSold = (int) TransactionItem::whereHas('transaction', function ($q) use ($today) {
            $q->where('status', 'COMPLETED')->where('created_at', '>=', $today);
        })->sum('quantity');

        $lowStockQuery = Product::with('category')->where('is_active', true)
            ->whereColumn('stock', '<=', 'minimum_stock');

        $lowStockCount = $lowStockQuery->count();
        $lowStockProducts = $lowStockQuery->orderBy('stock', 'asc')->limit(10)->get();

        $activeShiftsCount = Shift::where('status', 'OPEN')->count();

        $topProductsRaw = TransactionItem::select(
                'product_name_snapshot',
                DB::raw('SUM(quantity) as total_quantity'),
                DB::raw('SUM(subtotal) as total_revenue')
            )
            ->whereHas('transaction', function ($q) {
                $q->where('status', 'COMPLETED');
            })
            ->groupBy('product_name_snapshot')
            ->orderByDesc('total_quantity')
            ->limit(5)
            ->get();

        $topProducts = $topProductsRaw->map(function ($item) {
            return [
                'name' => $item->product_name_snapshot,
                'quantity' => (float) $item->total_quantity,
                'revenue' => (float) $item->total_revenue,
            ];
        });

        // Daily sales (last 7 days)
        $dailySales = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $salesOnDate = (float) Transaction::where('status', 'COMPLETED')
                ->whereDate('created_at', $date)
                ->sum('total');
            $dailySales[] = [
                'date' => $date,
                'label' => now()->subDays($i)->format('D, d M'),
                'total' => $salesOnDate,
                'value' => $salesOnDate,
            ];
        }

        // Weekly sales (last 4 weeks)
        $weeklySales = [];
        for ($w = 3; $w >= 0; $w--) {
            $start = now()->subWeeks($w)->startOfWeek();
            $end = now()->subWeeks($w)->endOfWeek();
            $salesOnWeek = (float) Transaction::where('status', 'COMPLETED')
                ->whereBetween('created_at', [$start, $end])
                ->sum('total');
            $weeklySales[] = [
                'label' => 'Mg ' . $start->format('d/m'),
                'total' => $salesOnWeek,
                'value' => $salesOnWeek,
            ];
        }

        return response()->json([
            'data' => [
                'today_sales' => $todaySales,
                'today_transactions' => $todayTransactionCount,
                'transaction_count' => $todayTransactionCount,
                'items_sold' => $itemsSold,
                'low_stock_count' => $lowStockCount,
                'low_stock_products' => $lowStockProducts,
                'active_shifts' => $activeShiftsCount,
                'top_products' => $topProducts,
                'daily_sales' => $dailySales,
                'weekly_sales' => $weeklySales,
            ],
            'message' => 'Success',
        ]);
    }

    public function sales(Request $request): JsonResponse
    {
        $dateFrom = $request->input('date_from', now()->startOfMonth()->toDateTimeString());
        $dateTo = $request->input('date_to', now()->endOfDay()->toDateTimeString());

        $query = Transaction::where('status', 'COMPLETED')
            ->whereBetween('created_at', [$dateFrom, $dateTo]);

        if ($request->filled('cashier_id')) {
            $query->where('cashier_id', $request->cashier_id);
        }

        $totalSales = (float) $query->sum('total');
        $transactionCount = $query->count();

        $paymentBreakdown = Transaction::select('payment_method', DB::raw('SUM(total) as total_amount'), DB::raw('COUNT(*) as count'))
            ->where('status', 'COMPLETED')
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->groupBy('payment_method')
            ->get();

        return response()->json([
            'data' => [
                'total_sales' => $totalSales,
                'transaction_count' => $transactionCount,
                'payment_breakdown' => $paymentBreakdown,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
            'message' => 'Success',
        ]);
    }

    public function products(Request $request): JsonResponse
    {
        $dateFrom = $request->input('date_from', now()->startOfMonth()->toDateTimeString());
        $dateTo = $request->input('date_to', now()->endOfDay()->toDateTimeString());

        $report = TransactionItem::select(
                'product_id',
                'product_name_snapshot',
                DB::raw('SUM(quantity) as total_sold'),
                DB::raw('SUM(subtotal) as total_revenue')
            )
            ->whereHas('transaction', function ($q) use ($dateFrom, $dateTo) {
                $q->where('status', 'COMPLETED')
                  ->whereBetween('created_at', [$dateFrom, $dateTo]);
            })
            ->groupBy('product_id', 'product_name_snapshot')
            ->orderByDesc('total_sold')
            ->get();

        return response()->json([
            'data' => $report,
            'message' => 'Success',
        ]);
    }

    public function cashiers(Request $request): JsonResponse
    {
        $dateFrom = $request->input('date_from', now()->startOfMonth()->toDateTimeString());
        $dateTo = $request->input('date_to', now()->endOfDay()->toDateTimeString());

        $report = Transaction::with('cashier:id,name,email')
            ->select(
                'cashier_id',
                DB::raw('COUNT(*) as total_transactions'),
                DB::raw('SUM(total) as total_sales')
            )
            ->where('status', 'COMPLETED')
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->groupBy('cashier_id')
            ->get();

        return response()->json([
            'data' => $report,
            'message' => 'Success',
        ]);
    }
}
