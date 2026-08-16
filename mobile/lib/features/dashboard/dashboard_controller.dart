import 'package:flutter/foundation.dart';

import '../../core/state/ui_state.dart';
import '../../models/dashboard.dart';
import '../../repositories/report_repository.dart';

/// Dashboard view model. Keeps the last known payload so the screen can
/// render cached data while offline.
class DashboardController extends ChangeNotifier {
  DashboardController({required ReportRepository repository})
      : _repository = repository;

  final ReportRepository _repository;

  UiState<DashboardData> _state = const UiState.loading();
  bool _loadedOnce = false;

  UiState<DashboardData> get state => _state;

  Future<void> load() async {
    _state = const UiState.loading();
    notifyListeners();

    try {
      final result = await _repository.fetchDashboard();
      _loadedOnce = true;
      if (result.fromCache) {
        _state = UiState.cached(result.value, result.lastUpdated);
      } else {
        _state = UiState.fresh(result.value);
      }
    } catch (e) {
      _state = UiState.failure(_friendlyError(e));
    }
    notifyListeners();
  }

  /// Refresh keeping the old data visible while it reloads.
  Future<void> refresh() async {
    if (!_loadedOnce) {
      await load();
      return;
    }

    final previous = _state;
    if (previous.hasError) {
      _state = const UiState.loading();
    }
    notifyListeners();

    try {
      final result = await _repository.fetchDashboard();
      _loadedOnce = true;
      _state = result.fromCache
          ? UiState.cached(result.value, result.lastUpdated)
          : UiState.fresh(result.value);
    } catch (e) {
      // Keep previous data when a background refresh fails.
      _state = previous.hasData
          ? UiState.cached(previous.data!, previous.lastUpdated)
          : UiState.failure(_friendlyError(e));
    }
    notifyListeners();
  }

  String _friendlyError(Object error) {
    if (error is Exception || error is Error) {
      final message = error.toString();
      if (message.contains('SocketException') ||
          message.contains('ClientException') ||
          message.contains('TimeoutException')) {
        return 'No internet connection. Please check your connection.';
      }
    }
    return 'Unable to load dashboard. Please try again.';
  }
}