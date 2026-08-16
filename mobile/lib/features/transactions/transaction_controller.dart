import 'package:flutter/foundation.dart';

import '../../core/state/ui_state.dart';
import '../../models/transaction.dart';
import '../../repositories/transaction_repository.dart';

/// Transaction list + detail state, with pagination and filters.
class TransactionsController extends ChangeNotifier {
  TransactionsController({required TransactionRepository repository})
      : _repository = repository;

  final TransactionRepository _repository;

  UiState<List<Transaction>> _state = const UiState.loading();
  TransactionFilters _filters = const TransactionFilters();
  int _page = 1;
  bool _hasMore = false;
  bool _loadingMore = false;
  bool _loadedOnce = false;

  UiState<Transaction> _detailState = const UiState.loading();

  UiState<List<Transaction>> get state => _state;
  TransactionFilters get filters => _filters;
  bool get hasMore => _hasMore;
  bool get loadingMore => _loadingMore;
  UiState<Transaction> get detailState => _detailState;

  bool get hasActiveFilters => _filters.isActive;

  Future<void> load() async {
    _page = 1;
    _state = const UiState.loading();
    notifyListeners();
    await _fetchPage(page: 1);
  }

  Future<void> refresh() => load();

  Future<void> loadMore() async {
    if (_loadingMore || !_hasMore) return;
    _loadingMore = true;
    notifyListeners();
    await _fetchPage(page: _page + 1, append: true);
    _loadingMore = false;
    notifyListeners();
  }

  Future<void> setFilters(TransactionFilters filters) async {
    _filters = filters;
    await load();
  }

  Future<void> clearFilters() async {
    _filters = const TransactionFilters();
    await load();
  }

  Future<void> _fetchPage({required int page, bool append = false}) async {
    final previous = _state;
    try {
      final result =
          await _repository.fetchTransactions(page: page, filters: _filters);
      _loadedOnce = true;
      final items = append
          ? [...(previous.data ?? const <Transaction>[]), ...result.value.items]
          : result.value.items;
      _page = result.value.page;
      _hasMore = result.value.hasMore;
      _state = result.fromCache
          ? UiState.cached(items, result.lastUpdated)
          : UiState.fresh(items);
    } catch (e) {
      if (!append && previous.hasData) {
        _state = UiState.cached(previous.data!, previous.lastUpdated);
      } else if (!append) {
        _state = UiState.failure(_friendlyError(e));
      }
    }
    notifyListeners();
  }

  Future<void> openTransaction(int id) async {
    _detailState = const UiState.loading();
    notifyListeners();
    try {
      final result = await _repository.fetchTransaction(id);
      _detailState = result.fromCache
          ? UiState.cached(result.value, result.lastUpdated)
          : UiState.fresh(result.value);
    } catch (e) {
      _detailState = UiState.failure(_friendlyError(e));
    }
    notifyListeners();
  }

  String _friendlyError(Object error) {
    final message = error.toString();
    if (message.contains('SocketException') ||
        message.contains('ClientException') ||
        message.contains('TimeoutException')) {
      return 'No internet connection. Please check your connection.';
    }
    return 'Unable to load transactions. Please try again.';
  }
}