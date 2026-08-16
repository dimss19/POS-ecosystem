import '../core/database/app_cache.dart';
import '../core/network/api_client.dart';
import '../core/network/api_exception.dart';
import '../core/state/repo_result.dart';
import '../models/paginated.dart';
import '../models/transaction.dart';

/// Filter options for the transaction list, matching the fields exposed by
/// the backend contract.
class TransactionFilters {
  const TransactionFilters({
    this.from,
    this.to,
    this.cashier,
    this.paymentMethod,
    this.status,
    this.search,
  });

  final DateTime? from;
  final DateTime? to;
  final String? cashier;
  final PaymentMethod? paymentMethod;
  final TransactionStatus? status;
  final String? search;

  bool get isActive =>
      from != null ||
      to != null ||
      cashier != null ||
      paymentMethod != null ||
      status != null ||
      (search != null && search!.isNotEmpty);

  Map<String, dynamic> toQuery() => {
        if (from != null) 'from': _date(from),
        if (to != null) 'to': _date(to),
        if (cashier != null && cashier!.isNotEmpty) 'cashier': cashier,
        if (paymentMethod != null) 'payment_method': paymentMethod!.apiValue,
        if (status != null) 'status': status!.apiValue,
        if (search != null && search!.isNotEmpty) 'search': search,
      };

  TransactionFilters copyWith({
    DateTime? from,
    DateTime? to,
    String? cashier,
    PaymentMethod? paymentMethod,
    TransactionStatus? status,
    String? search,
    bool clearFrom = false,
    bool clearTo = false,
    bool clearCashier = false,
    bool clearMethod = false,
    bool clearStatus = false,
    bool clearSearch = false,
  }) {
    return TransactionFilters(
      from: clearFrom ? null : (from ?? this.from),
      to: clearTo ? null : (to ?? this.to),
      cashier: clearCashier ? null : (cashier ?? this.cashier),
      paymentMethod: clearMethod ? null : (paymentMethod ?? this.paymentMethod),
      status: clearStatus ? null : (status ?? this.status),
      search: clearSearch ? null : (search ?? this.search),
    );
  }

  static String _date(DateTime? value) {
    final normalized = value ?? DateTime.now();
    return '${normalized.year.toString().padLeft(4, '0')}-'
        '${normalized.month.toString().padLeft(2, '0')}-'
        '${normalized.day.toString().padLeft(2, '0')}';
  }
}

/// Transaction reads (`/api/transactions`).
class TransactionRepository {
  TransactionRepository({
    required ApiClient api,
    required AppCache cache,
    this.perPage = 15,
  })  : _api = api,
        _cache = cache;

  final ApiClient _api;
  final AppCache _cache;
  final int perPage;

  Future<RepoResult<Paginated<Transaction>>> fetchTransactions({
    int page = 1,
    TransactionFilters filters = const TransactionFilters(),
  }) async {
    try {
      final data = await _api.get('/transactions', query: {
        'page': '$page',
        'per_page': '$perPage',
        ...filters.toQuery(),
      });
      final result = ApiPaging.paginate(data, Transaction.fromJson);
      if (page == 1 && result.items.isNotEmpty) {
        await _cache.put(CacheKeys.recentTransactions, data);
      }
      return RepoResult.fresh(result);
    } on ApiException catch (e) {
      if (!e.isNetwork) rethrow;
      if (page == 1) {
        final cached = await _cache.get(CacheKeys.recentTransactions);
        if (cached != null) {
          final cachedPage =
              ApiPaging.paginate(cached.payload, Transaction.fromJson);
          final filtered = _applyLocalFilters(cachedPage.items, filters);
          return RepoResult.cached(
            Paginated<Transaction>(
              items: filtered,
              page: 1,
              total: filtered.length,
              hasMore: false,
            ),
            cached.lastUpdated,
          );
        }
      }
      rethrow;
    }
  }

  Future<RepoResult<Transaction>> fetchTransaction(int id) async {
    try {
      final data = await _api.get('/transactions/$id');
      final transaction = Transaction.fromJson(
        data is Map<String, dynamic> ? data : <String, dynamic>{},
      );
      await _cache.put('${CacheKeys.transactionDetail}_$id', data);
      return RepoResult.fresh(transaction);
    } on ApiException catch (e) {
      if (!e.isNetwork) rethrow;
      final cached = await _cache.get('${CacheKeys.transactionDetail}_$id');
      if (cached != null) {
        return RepoResult.cached(
          Transaction.fromJson(cached.payload as Map<String, dynamic>),
          cached.lastUpdated,
        );
      }
      rethrow;
    }
  }

  List<Transaction> _applyLocalFilters(
    List<Transaction> items,
    TransactionFilters filters,
  ) {
    return items.where((t) {
      if (filters.paymentMethod != null &&
          t.paymentMethod != filters.paymentMethod) {
        return false;
      }
      if (filters.status != null && t.status != filters.status) return false;
      if (filters.cashier != null &&
          !(t.cashierName ?? '').toLowerCase().contains(filters.cashier!.toLowerCase())) {
        return false;
      }
      if (filters.from != null && t.createdAt != null && t.createdAt!.isBefore(filters.from!)) {
        return false;
      }
      if (filters.to != null && t.createdAt != null) {
        final end = filters.to!.add(const Duration(days: 1));
        if (t.createdAt!.isAfter(end)) return false;
      }
      if (filters.search != null &&
          !t.numberOrFallback.toLowerCase().contains(filters.search!.toLowerCase())) {
        return false;
      }
      return true;
    }).toList();
  }
}