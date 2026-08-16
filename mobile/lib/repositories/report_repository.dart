import '../core/database/app_cache.dart';
import '../core/network/api_client.dart';
import '../core/network/api_exception.dart';
import '../core/state/repo_result.dart';
import '../models/dashboard.dart';
import '../models/paginated.dart';
import '../models/reports.dart';

/// Dashboard and reports (`/api/dashboard`, `/api/reports/*`).
class ReportRepository {
  ReportRepository({required ApiClient api, required AppCache cache})
      : _api = api,
        _cache = cache;

  final ApiClient _api;
  final AppCache _cache;

  Future<RepoResult<DashboardData>> fetchDashboard() async {
    try {
      final data = await _api.get('/dashboard');
      final dashboard = DashboardData.fromJson(
        data is Map<String, dynamic> ? data : <String, dynamic>{},
      );
      await _cache.put(CacheKeys.dashboard, data);
      return RepoResult.fresh(dashboard);
    } on ApiException catch (e) {
      if (!e.isNetwork) rethrow;
      final cached = await _cache.get(CacheKeys.dashboard);
      if (cached != null) {
        return RepoResult.cached(
          DashboardData.fromJson(
            cached.payload is Map<String, dynamic>
                ? cached.payload as Map<String, dynamic>
                : <String, dynamic>{},
          ),
          cached.lastUpdated,
        );
      }
      rethrow;
    }
  }

  Future<RepoResult<SalesReport>> fetchSalesReport({
    DateTime? from,
    DateTime? to,
  }) {
    return _fetchReport<SalesReport>(
      '/reports/sales',
      from: from,
      to: to,
      cacheKey: CacheKeys.salesReport,
      parse: (json) => SalesReport.fromJson(json),
    );
  }

  Future<RepoResult<List<ProductReportRow>>> fetchProductReport({
    DateTime? from,
    DateTime? to,
  }) {
    return _fetchReportList<ProductReportRow>(
      '/reports/products',
      from: from,
      to: to,
      cacheKey: CacheKeys.productReport,
      parse: (json) => ProductReportRow.fromJson(json),
    );
  }

  Future<RepoResult<List<CashierReportRow>>> fetchCashierReport({
    DateTime? from,
    DateTime? to,
  }) {
    return _fetchReportList<CashierReportRow>(
      '/reports/cashiers',
      from: from,
      to: to,
      cacheKey: CacheKeys.cashierReport,
      parse: (json) => CashierReportRow.fromJson(json),
    );
  }

  Map<String, dynamic> _rangeQuery(DateTime? from, DateTime? to) => {
        if (from != null) 'from': _date(from),
        if (to != null) 'to': _date(to),
      };

  Future<RepoResult<T>> _fetch<T>({
    required String path,
    required DateTime? from,
    required DateTime? to,
    required String cacheKey,
    required T Function(Map<String, dynamic>) parse,
  }) async {
    try {
      final data = await _api.get(path, query: _rangeQuery(from, to));
      final result = parse(
        data is Map<String, dynamic> ? data : const <String, dynamic>{},
      );
      await _cache.put(cacheKey, data);
      return RepoResult.fresh(result);
    } on ApiException catch (e) {
      if (!e.isNetwork) rethrow;
      final cached = await _cache.get(cacheKey);
      if (cached != null) {
        return RepoResult.cached(
          parse(cached.payload as Map<String, dynamic>),
          cached.lastUpdated,
        );
      }
      rethrow;
    }
  }

  Future<RepoResult<List<T>>> _fetchReportList<T>({
    required String path,
    required DateTime? from,
    required DateTime? to,
    required String cacheKey,
    required T Function(Map<String, dynamic>) parse,
  }) async {
    try {
      final data = await _api.get(path, query: _rangeQuery(from, to));
      final result = ApiPaging.asList(data, parse);
      await _cache.put(cacheKey, data);
      return RepoResult.fresh(result);
    } on ApiException catch (e) {
      if (!e.isNetwork) rethrow;
      final cached = await _cache.get(cacheKey);
      if (cached != null) {
        return RepoResult.cached(
          ApiPaging.asList(cached.payload, parse),
          cached.lastUpdated,
        );
      }
      rethrow;
    }
  }

  static String _date(DateTime value) =>
      '${value.year.toString().padLeft(4, '0')}-'
      '${value.month.toString().padLeft(2, '0')}-'
      '${value.day.toString().padLeft(2, '0')}';
}