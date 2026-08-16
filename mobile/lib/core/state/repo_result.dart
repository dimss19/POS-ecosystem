/// Result of a repository read operation.
///
/// [fromCache] marks data that was served from the SQLite cache because the
/// server was unreachable (offline fallback). The server always remains
/// authoritative.
class RepoResult<T> {
  const RepoResult._({required this.value, required this.fromCache, this.lastUpdated});

  const RepoResult.fresh(T value) : this._(value: value, fromCache: false);

  const RepoResult.cached(T value, this.lastUpdated)
      : this._(value: value, fromCache: true);

  final T value;

  final bool fromCache;

  final DateTime? lastUpdated;
}