import '../core/utils/json_utils.dart';

/// A page of results plus pagination metadata.
class Paginated<T> {
  const Paginated({
    required this.items,
    this.page = 1,
    this.total,
    this.hasMore = false,
  });

  final List<T> items;
  final int page;
  final int? total;
  final bool hasMore;
}

/// Robust list/pagination extraction.
///
/// The API contract leaves the exact pagination shape open; this handles a
/// plain list, Laravel-style `{items, meta}` and `{data: [...], meta}`.
class ApiPaging {
  ApiPaging._();

  static List<T> asList<T>(dynamic raw, T Function(Map<String, dynamic>) fromJson) {
    if (raw is List) {
      return raw
          .map((e) => fromJson(e is Map<String, dynamic> ? e : <String, dynamic>{}))
          .toList();
    }
    if (raw is Map<String, dynamic>) {
      for (final key in const ['data', 'items', 'results', 'records']) {
        final value = raw[key];
        if (value is List) {
          return value
              .map((e) => fromJson(e is Map<String, dynamic> ? e : <String, dynamic>{}))
              .toList();
        }
      }
    }
    return <T>[];
  }

  static Paginated<T> paginate<T>(dynamic raw, T Function(Map<String, dynamic>) fromJson) {
    if (raw is List) {
      final items = raw
          .map((e) => fromJson(e is Map<String, dynamic> ? e : <String, dynamic>{}))
          .toList();
      return Paginated<T>(items: items, page: 1);
    }

    if (raw is Map<String, dynamic>) {
      final listRaw = raw['data'] ?? raw['items'] ?? raw['results'] ?? raw['records'];
      List<dynamic> list = <dynamic>[];
      if (listRaw is List) {
        list = listRaw;
      } else if (listRaw is Map<String, dynamic>) {
        for (final key in const ['data', 'items', 'results', 'records']) {
          final value = listRaw[key];
          if (value is List) {
            list = value;
            break;
          }
        }
      }

      final meta = (raw['meta'] is Map<String, dynamic>
          ? raw['meta'] as Map<String, dynamic>
          : null) ??
          (raw['pagination'] is Map<String, dynamic>
              ? raw['pagination'] as Map<String, dynamic>
              : null);

      final page = JsonUtils.integer(
          meta?['current_page'] ?? meta?['page'] ?? raw['current_page'],
          fallback: 1);
      final total =
          JsonUtils.integerOrNull(meta?['total'] ?? raw['total']);
      final lastPage = JsonUtils.integer(
          meta?['last_page'] ?? meta?['total_pages'] ?? raw['last_page'],
          fallback: page);

      final items = list
          .map((e) => fromJson(e is Map<String, dynamic> ? e : <String, dynamic>{}))
          .toList();

      return Paginated<T>(
        items: items,
        page: page,
        total: total,
        hasMore: page < lastPage,
      );
    }

    return Paginated<T>(items: <T>[], page: 1);
  }
}