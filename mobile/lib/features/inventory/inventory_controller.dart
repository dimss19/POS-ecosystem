import 'package:flutter/foundation.dart';

import '../../core/network/api_exception.dart';
import '../../core/state/ui_state.dart';
import '../../models/product.dart';
import '../../models/stock_movement.dart';
import '../../repositories/inventory_repository.dart';

/// Inventory view model: stock overview, movements and adjustments.
class InventoryController extends ChangeNotifier {
  InventoryController({required InventoryRepository repository})
      : _repository = repository;

  final InventoryRepository _repository;

  UiState<List<Product>> _overview = const UiState.loading();
  UiState<List<StockMovement>> _movements = const UiState.loading();

  bool _lowStockOnly = false;
  bool _loadedOnce = false;
  int? _viewedProductId;

  bool _adjusting = false;
  String? _adjustmentError;

  UiState<List<Product>> get overview => _overview;
  UiState<List<StockMovement>> get movements => _movements;
  bool get lowStockOnly => _lowStockOnly;
  bool get adjusting => _adjusting;
  String? get adjustmentError => _adjustmentError;

  List<Product> get visibleStock {
    final all = _overview.data ?? const <Product>[];
    if (!_lowStockOnly) return all;
    return all.where((p) => p.isLowStock).toList();
  }

  void setLowStockOnly(bool value) {
    _lowStockOnly = value;
    notifyListeners();
  }

  Future<void> load() async {
    _overview = const UiState.loading();
    notifyListeners();
    try {
      final result = await _repository.fetchStockOverview();
      _loadedOnce = true;
      _overview = result.fromCache
          ? UiState.cached(result.value, result.lastUpdated)
          : UiState.fresh(result.value);
    } catch (e) {
      _overview = UiState.failure(_friendlyError(e));
    }
    notifyListeners();
  }

  Future<void> refresh() async {
    if (!_loadedOnce) {
      await load();
      return;
    }
    final previous = _overview;
    try {
      final result = await _repository.fetchStockOverview();
      _loadedOnce = true;
      _overview = result.fromCache
          ? UiState.cached(result.value, result.lastUpdated)
          : UiState.fresh(result.value);
    } catch (e) {
      _overview = previous.hasData
          ? UiState.cached(previous.data!, previous.lastUpdated)
          : UiState.failure(_friendlyError(e));
    }
    notifyListeners();
  }

  Future<void> loadMovements({int? productId}) async {
    _viewedProductId = productId;
    _movements = const UiState.loading();
    notifyListeners();
    try {
      final result = await _repository.fetchMovements(productId: productId);
      _movements = result.fromCache
          ? UiState.cached(result.value, result.lastUpdated)
          : UiState.fresh(result.value);
    } catch (e) {
      _movements = UiState.failure(_friendlyError(e));
    }
    notifyListeners();
  }

  /// Signed quantity: positive adds stock, negative removes it.
  Future<bool> adjustStock({
    required int productId,
    required double quantity,
    required String reason,
  }) async {
    _adjusting = true;
    _adjustmentError = null;
    notifyListeners();
    try {
      await _repository.adjustStock(
        productId: productId,
        quantity: quantity,
        reason: reason,
      );
      await refresh();
      return true;
    } on ApiException catch (e) {
      _adjustmentError = e.firstFieldError ?? e.message;
      return false;
    } catch (e) {
      _adjustmentError = 'Something went wrong while adjusting stock.';
      return false;
    } finally {
      _adjusting = false;
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
    return 'Unable to load inventory. Please try again.';
  }
}