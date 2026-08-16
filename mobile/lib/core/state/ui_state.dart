/// Immutable UI state for a single view.
///
/// A view is either loading, holding data (fresh or read from the local
/// cache) or failed. `fromCache` is used to render the offline banner.
class UiState<T> {
  const UiState._({required this.isLoading, this.data, this.error, this.fromCache = false, this.lastUpdated});

  const UiState.loading() : this._(isLoading: true);

  const UiState.fresh(T data) : this._(data: data);

  const UiState.cached(T data, this.lastUpdated)
      : this._(data: data, fromCache: true);

  const UiState.failure(String error) : this._(error: error);

  final bool isLoading;
  final T? data;
  final String? error;
  final bool fromCache;

  /// When [fromCache] is true, when the cached payload was last refreshed
  /// from the server.
  final DateTime? lastUpdated;

  bool get hasData => data != null;

  bool get hasError => error != null && error!.isNotEmpty;

  UiState<T> copyWith({bool? isLoading, T? data, String? error, bool? fromCache, DateTime? lastUpdated}) {
    return UiState._(
      isLoading: isLoading ?? this.isLoading,
      data: data ?? this.data,
      error: error ?? this.error,
      fromCache: fromCache ?? this.fromCache,
      lastUpdated: lastUpdated ?? this.lastUpdated,
    );
  }
}