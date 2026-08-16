import 'package:flutter/foundation.dart';

import '../../core/state/ui_state.dart';
import '../../models/reports.dart';
import '../../repositories/report_repository.dart';

/// Reports view model (Sales / Products / Cashiers) with shared date range.
class ReportsController extends ChangeNotifier {
  ReportsController({required ReportRepository repository})
      : _repository = repository;

  final ReportRepository _repository;

  DateTime? _from;
  DateTime? _to;
  bool _loadedOnce = false;

  UiState<SalesReport> _sales = const UiState.loading();
  UiState<List<ProductReportRow>> _products = const UiState.loading();
  UiState<List<CashierReportRow>> _cashiers = const UiState.loading();

  DateTime? get from => _from;
  DateTime? get to => _to;
  UiState<SalesReport> get sales => _sales;
  UiState<List<ProductReportRow>> get products => _products;
  UiState<List<CashierReportRow>> get cashiers => _cashiers;

  bool get loadedOnce => _loadedOnce;

  void setRange(DateTime? from, DateTime? to) {
    _from = from;
    _to = to;
    notifyListeners();
  }

  Future<void> load() async {
    _sales = const UiState.loading();
    _products = const UiState.loading();
    _cashiers = const UiState.loading();
    notifyListeners();

    final results = await Future.wait([
      _loadSales(),
      _loadProducts(),
      _loadCashiers(),
    ]);

    _sales = results[0] as UiState<SalesReport>;
    _products = results[1] as UiState<List<ProductReportRow>>;
    _cashiers = results[2] as UiState<List<CashierReportRow>>;
    notifyListeners();
  }

  Future<void> refresh() => load();

  Future<UiState<SalesReport>> _loadSales() async {
    final previous = _sales;
    try {
      final result =
          await _repository.fetchSalesReport(from: _from, to: _to);
      _loadedOnce = true;
      return result.fromCache
          ? UiState.cached(result.value, result.lastUpdated)
          : UiState.fresh(result.value);
    } catch (e) {
      if (previous.hasData) {
        return UiState.cached(previous.data!, previous.lastUpdated);
      }
      return UiState.failure(_friendlyError(e));
    }
  }

  Future<UiState<List<ProductReportRow>>> _loadProducts() async {
    final previous = _products;
    try {
      final result =
          await _repository.fetchProductReport(from: _from, to: _to);
      _loadedOnce = true;
      return result.fromCache
          ? UiState.cached(result.value, result.lastUpdated)
          : UiState.fresh(result.value);
    } catch (e) {
      if (previous.hasData) {
        return UiState.cached(previous.data!, previous.lastUpdated);
      }
      return UiState.failure(_friendlyError(e));
    }
  }

  Future<UiState<List<CashierReportRow>>> _loadCashiers() async {
    final previous = _cashiers;
    try {
      final result =
          await _repository.fetchCashierReport(from: _from, to: _to);
      _loadedOnce = true;
      return result.fromCache
          ? UiState.cached(result.value, result.lastUpdated)
          : UiState.fresh(result.value);
    } catch (e) {
      if (previous.hasData) {
        return UiState.cached(previous.data!, previous.lastUpdated);
      }
      return UiState.failure(_friendlyError(e));
    }
  }

  String _friendlyError(Object error) {
    final message = error.toString();
    if (message.contains('SocketException') ||
        message.contains('ClientException') ||
        message.contains('TimeoutException')) {
      return 'No internet connection. Please check your connection.';
    }
    return 'Unable to load reports. Please try again.';
  }
}