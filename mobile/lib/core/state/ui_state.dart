/// Immutable UI state for a single view.
///
/// A view is either loading, holding data (fresh or read from the local
/// cache) or failed. `fromCache` is used to render the offline banner.
class UiState<T> {
  const UiState._({
    required this.isLoading,
    this.data,
    this.error,
    required this.fromCache,
    this.lastUpdated,
  });

  const UiState.loading()
      : isLoading = true,
        data = null,
        error = null,
        fromCache = false,
        lastUpdated = null;

  const UiState.fresh(this.data)
      : isLoading = false,
        error = null,
        fromCache = false,
        lastUpdated = null;

  const UiState.cached(this.data, this.lastUpdated)
      : isLoading = false,
        error = null,
        fromCache = true;

  const UiState.failure(this.error)
      : isLoading = false,
        data = null,
        fromCache = false,
        lastUpdated = null;

  final bool isLoading;
  final T? data;
  final String? error;
  final bool fromCache;
  final DateTime? lastUpdated;

  bool get hasData => data != null;

  bool get hasError => error != null && error!.isNotEmpty;

  UiState<T> copyWith({
    bool? isLoading,
    T? data,
    String? error,
    bool? fromCache,
    DateTime? lastUpdated,
  }) {
    return UiState<T>._(
      isLoading: isLoading ?? this.isLoading,
      data: data ?? this.data,
      error: error ?? this.error,
      fromCache: fromCache ?? this.fromCache,
      lastUpdated: lastUpdated ?? this.lastUpdated,
    );
  }
}