import '../core/database/app_cache.dart';
import '../core/network/api_client.dart';
import '../core/network/api_exception.dart';
import '../core/state/repo_result.dart';
import '../models/category.dart';
import '../models/paginated.dart';
import '../models/product.dart';

/// Products and categories (`/api/products`, `/api/categories`).
class ProductRepository {
  ProductRepository({required ApiClient api, required AppCache cache})
      : _api = api,
        _cache = cache;

  final ApiClient _api;
  final AppCache _cache;

  static const int _perPage = 1000;

  Future<RepoResult<List<Product>>> fetchProducts() async {
    try {
      final data = await _api
          .get('/products', query: {'per_page': _perPage});
      final products = ApiPaging.asList(data, Product.fromJson);
      if (products.isNotEmpty) {
        await _cache.put(CacheKeys.products, data);
      }
      return RepoResult.fresh(products);
    } on ApiException catch (e) {
      if (!e.isNetwork) rethrow;
      final cached = await _cache.get(CacheKeys.products);
      if (cached != null) {
        return RepoResult.cached(
          ApiPaging.asList(cached.payload, Product.fromJson),
          cached.lastUpdated,
        );
      }
      rethrow;
    }
  }

  Future<RepoResult<List<Category>>> fetchCategories() async {
    try {
      final data = await _api.get('/categories');
      final categories = ApiPaging.asList(data, Category.fromJson);
      await _cache.put(CacheKeys.categories, data);
      return RepoResult.fresh(categories);
    } on ApiException catch (e) {
      if (!e.isNetwork) rethrow;
      final cached = await _cache.get(CacheKeys.categories);
      if (cached != null) {
        return RepoResult.cached(
          ApiPaging.asList(cached.payload, Category.fromJson),
          cached.lastUpdated,
        );
      }
      rethrow;
    }
  }

  Future<Product> createProduct(ProductDraft draft) async {
    final data = await _api.post('/products', body: draft.toJson());
    final product = Product.fromJson(
      data is Map<String, dynamic> ? data : <String, dynamic>{},
    );
    await _cache.remove(CacheKeys.products);
    return product;
  }

  Future<Product> updateProduct(int id, ProductDraft draft) async {
    final data = await _api.put('/products/$id', body: draft.toJson());
    final product = Product.fromJson(
      data is Map<String, dynamic> ? data : <String, dynamic>{},
    );
    await _cache.remove(CacheKeys.products);
    return product;
  }
}