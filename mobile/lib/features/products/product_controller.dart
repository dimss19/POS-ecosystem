import 'package:flutter/foundation.dart';

import '../../core/network/api_exception.dart';
import '../../core/state/ui_state.dart';
import '../../models/category.dart';
import '../../models/product.dart';
import '../../repositories/product_repository.dart';

/// Products + categories state, including client-side search & category
/// filtering for the list screen.
class ProductsController extends ChangeNotifier {
  ProductsController({required ProductRepository repository})
      : _repository = repository;

  final ProductRepository _repository;

  UiState<List<Product>> _state = const UiState.loading();
  UiState<List<Category>> _categoriesState = const UiState.loading();
  bool _loadedOnce = false;

  String _search = '';
  int? _selectedCategoryId;

  bool _saving = false;
  String? _saveError;

  UiState<List<Product>> get state => _state;
  UiState<List<Category>> get categoriesState => _categoriesState;
  String get search => _search;
  int? get selectedCategoryId => _selectedCategoryId;
  bool get saving => _saving;
  String? get saveError => _saveError;

  bool get loadedOnce => _loadedOnce;

  List<Category> get categories => _categoriesState.data ?? const <Category>[];

  /// Products after search + category filters.
  List<Product> get visibleProducts {
    final all = _state.data ?? const <Product>[];
    final query = _search.trim().toLowerCase();
    return all.where((product) {
      if (_selectedCategoryId != null &&
          product.categoryId != _selectedCategoryId) {
        return false;
      }
      if (query.isEmpty) return true;
      return product.name.toLowerCase().contains(query) ||
          product.sku.toLowerCase().contains(query) ||
          (product.barcode ?? '').contains(query);
    }).toList();
  }

  void setSearch(String value) {
    _search = value;
    notifyListeners();
  }

  void setCategoryFilter(int? categoryId) {
    _selectedCategoryId = categoryId;
    notifyListeners();
  }

  Future<void> load() async {
    _state = const UiState.loading();
    _categoriesState = const UiState.loading();
    notifyListeners();

    final results = await Future.wait([
      _loadProducts(),
      _loadCategories(),
    ]);

    _state = results[0] as UiState<List<Product>>;
    _categoriesState = results[1] as UiState<List<Category>>;

    if (_state.hasData) {
      await _syncCategories();
    }
    notifyListeners();
  }

  Future<void> refresh() async {
    if (!_loadedOnce) {
      await load();
      return;
    }
    await _loadProducts();
    notifyListeners();
  }

  Future<void> _loadProducts() async {
    final previous = _state;
    try {
      final result = await _repository.fetchProducts();
      _loadedOnce = true;
      _state = result.fromCache
          ? UiState.cached(result.value, result.lastUpdated)
          : UiState.fresh(result.value);
    } catch (e) {
      if (previous.hasData) {
        _state = UiState.cached(previous.data!, previous.lastUpdated);
      } else {
        _state = UiState.failure(_friendlyError(e));
      }
    }
  }

  Future<void> _loadCategories() async {
    final previous = _categoriesState;
    try {
      final result = await _repository.fetchCategories();
      _categoriesState = result.fromCache
          ? UiState<List<Category>>.cached(result.value, result.lastUpdated)
          : UiState<List<Category>>.fresh(result.value);
    } catch (e) {
      if (previous.hasData) {
        _categoriesState =
            UiState.cached(previous.data!, previous.lastUpdated);
      } else {
        _categoriesState = UiState.failure(_friendlyError(e));
      }
    }
  }

  /// Attach category names to the cached products when the categories are
  /// available so detail screens can render names.
  Future<void> _syncCategories() async {
    final categories = _categoriesState.data;
    if (categories == null || categories.isEmpty) return;
    final byId = {for (final c in categories) c.id: c.name};
    final updated = (_state.data ?? const <Product>[])
        .map((p) => Product(
              id: p.id,
              sku: p.sku,
              barcode: p.barcode,
              name: p.name,
              categoryId: p.categoryId,
              categoryName: p.categoryName == null || p.categoryName!.isEmpty
                  ? p.categoryId != null && byId.containsKey(p.categoryId)
                      ? byId[p.categoryId]
                      : null
                  : p.categoryName,
              buyPrice: p.buyPrice,
              sellPrice: p.sellPrice,
              stock: p.stock,
              minimumStock: p.minimumStock,
              unit: p.unit,
              isActive: p.isActive,
              createdAt: p.createdAt,
              updatedAt: p.updatedAt,
            ))
        .toList();
    _state = _state.copyWith(data: updated);
  }

  Category? categoryFor(int? id) {
    if (id == null) return null;
    for (final category in _categoriesState.data ?? const <Category>[]) {
      if (category.id == id) return category;
    }
    return null;
  }

  /// Creates or updates a product, refreshing the list afterwards.
  Future<bool> saveProduct(ProductDraft draft, {Product? existing}) async {
    _saving = true;
    _saveError = null;
    notifyListeners();
    try {
      if (existing == null || existing.id == null) {
        await _repository.createProduct(draft);
      } else {
        await _repository.updateProduct(existing.id!, draft);
      }
      await refresh();
      return true;
    } on ApiException catch (e) {
      _saveError = e.firstFieldError ?? e.message;
      return false;
    } catch (e) {
      _saveError = _friendlyError(e);
      return false;
    } finally {
      _saving = false;
      notifyListeners();
    }
  }

  String _friendlyError(Object error) {
    final message = error.toString();
    if (message.contains('SocketException') ||
        message.contains('ClientException') ||
        message.contains('TimeoutException')) {
      return 'No internet connection. Please check your connection.';
    }
    return 'Unable to load products. Please try again.';
  }
}