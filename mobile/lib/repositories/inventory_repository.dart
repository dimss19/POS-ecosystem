import '../core/database/app_cache.dart';
import '../core/network/api_client.dart';
import '../core/network/api_exception.dart';
import '../core/state/repo_result.dart';
import '../models/paginated.dart';
import '../models/product.dart';
import '../models/stock_movement.dart';

/// Inventory reads and adjustments (`/api/stock*`).
class InventoryRepository {
  InventoryRepository({required ApiClient api, required AppCache cache})
      : _api = api,
        _cache = cache;

  final ApiClient _api;
  final AppCache _cache;

  /// Current stock overview. Prefers `/api/stock`; falls back to the
  /// `/api/products` payload when the backend shapes it differently.
  Future<RepoResult<List<Product>>> fetchStockOverview() async {
    try {
      dynamic data;
      List<Product> products = <Product>[];

      try {
        data = await _api.get('/stock');
        products = ApiPaging.asList(data, Product.fromJson);
      } on ApiException {
        // Contract may expose the overview through /products instead.
      }

      if (products.isEmpty) {
        data = await _api.get('/products', query: {'per_page': 1000});
        products = ApiPaging.asList(data, Product.fromJson);
      }

      if (products.isNotEmpty) {
        await _cache.put(CacheKeys.stockOverview, data);
      }
      return RepoResult.fresh(products);
    } on ApiException catch (e) {
      if (!e.isNetwork) rethrow;
      final cached = await _cache.get(CacheKeys.stockOverview);
      if (cached != null) {
        return RepoResult.cached(
          ApiPaging.asList(cached.payload, Product.fromJson),
          cached.lastUpdated,
        );
      }
      rethrow;
    }
  }

  Future<RepoResult<List<StockMovement>>> fetchMovements(
      {int? productId}) async {
    try {
      final data = await _api.get('/stock/movements', query: {
        if (productId != null) 'product_id': '$productId',
        'per_page': 200,
      });
      final movements = ApiPaging.asList(data, StockMovement.fromJson);
      await _cache.put(CacheKeys.stockMovements, data);
      return RepoResult.fresh(movements);
    } on ApiException catch (e) {
      if (!e.isNetwork) rethrow;
      final cached = await _cache.get(CacheKeys.stockMovements);
      if (cached != null) {
        return RepoResult.cached(
          ApiPaging.asList(cached.payload, StockMovement.fromJson),
          cached.lastUpdated,
        );
      }
      rethrow;
    }
  }

  /// Signed quantity: positive adds stock, negative removes it.
  Future<void> adjustStock({
    required int productId,
    required double quantity,
    required String reason,
  }) async {
    await _api.post('/stock/adjustments', body: {
      'product_id': productId,
      'quantity': quantity,
      'reason': reason.trim(),
    });
    // Invalidate caches so the next view reflects the adjustment.
    await _cache.remove(CacheKeys.stockOverview);
    await _cache.remove(CacheKeys.products);
    await _cache.remove(CacheKeys.stockMovements);
  }
}