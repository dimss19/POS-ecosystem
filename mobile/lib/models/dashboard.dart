import '../core/utils/json_utils.dart';
import 'product.dart';

/// A single point in a sales series (daily / weekly / top products).
class SalesPoint {
  const SalesPoint({required this.label, required this.value});

  final String label;
  final double value;

  factory SalesPoint.fromJson(Map<String, dynamic> json, {String fallbackLabel = ''}) {
    return SalesPoint(
      label: JsonUtils.string(
          json['date'] ?? json['label'] ?? json['day'] ?? fallbackLabel),
      value: JsonUtils.money(
          json['total'] ?? json['sales'] ?? json['amount'] ?? json['value']),
    );
  }
}

/// Top performing product inside the dashboard.
class TopProduct {
  const TopProduct({this.name = '', this.quantity = 0, this.revenue = 0});

  final String name;
  final double quantity;
  final double revenue;

  factory TopProduct.fromJson(Map<String, dynamic> json) {
    final raw = JsonUtils.map(json);
    return TopProduct(
      name: JsonUtils.string(
          raw['name'] ?? raw['product_name'] ?? raw['product']),
      quantity: JsonUtils.number(
          raw['quantity'] ?? raw['qty_sold'] ?? raw['sold']),
      revenue: JsonUtils.money(raw['revenue'] ?? raw['total']),
    );
  }
}

/// Aggregated payload of `GET /api/dashboard`.
class DashboardData {
  const DashboardData({
    this.todaySales = 0,
    this.transactionCount = 0,
    this.itemsSold = 0,
    this.lowStockCount = 0,
    this.dailySales = const [],
    this.weeklySales = const [],
    this.topProducts = const [],
    this.lowStockProducts = const [],
  });

  final double todaySales;
  final int transactionCount;
  final int itemsSold;
  final int lowStockCount;
  final List<SalesPoint> dailySales;
  final List<SalesPoint> weeklySales;
  final List<TopProduct> topProducts;
  final List<Product> lowStockProducts;

  factory DashboardData.fromJson(Map<String, dynamic> json) {
    final raw = JsonUtils.map(json);

    final lowStockList = ApiList.jsonList(raw['low_stock_products'] ?? raw['lowStockProducts']);
    final topList = ApiList.jsonList(raw['top_products'] ?? raw['topProducts']);

    return DashboardData(
      todaySales: JsonUtils.money(raw['today_sales'] ?? raw['todaySales']),
      transactionCount: JsonUtils.integer(
          raw['transaction_count'] ?? raw['transactionCount']),
      itemsSold: JsonUtils.integer(raw['items_sold'] ?? raw['itemsSold']),
      lowStockCount: JsonUtils.integer(
          raw['low_stock_count'] ?? raw['lowStockCount'],
          fallback: lowStockList.length),
      dailySales: dynamicSalesList(raw['daily_sales'] ?? raw['dailySales']),
      weeklySales: dynamicSalesList(raw['weekly_sales'] ?? raw['weeklySales']),
      topProducts:
          topList.map((e) => TopProduct.fromJson(e)).toList(),
      lowStockProducts:
          lowStockList.map((e) => Product.fromJson(e)).toList(),
    );
  }

  static List<SalesPoint> dynamicSalesList(dynamic value) {
    if (value is List) {
      return value
          .whereType<Map<String, dynamic>>()
          .map((e) => SalesPoint.fromJson(e))
          .toList();
    }
    // Map form: `{ "2026-08-16": "500000", ... }`
    if (value is Map<String, dynamic>) {
      return value.entries
          .map((entry) => SalesPoint(
                label: entry.key,
                value: JsonUtils.money(entry.value),
              ))
          .toList();
    }
    return const [];
  }
}

/// Minimal JSON list reader used internally by the dashboard model.
abstract final class ApiPricing {
  ApiPricing._();

  static List<Map<String, dynamic>> jsonList(dynamic value) {
    if (value is List) {
      return value
          .whereType<Map<String, dynamic>>()
          .toList();
    }
    return const [];
  }

  static List<Map<String, dynamic>> namedList(dynamic value) => jsonList(value);
}

// Re-export for callers that import this file.
typedef ApiList = ApiPricing;