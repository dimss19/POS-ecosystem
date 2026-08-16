import '../core/utils/json_utils.dart';

/// Sales report from `GET /api/reports/sales`.
class SalesReport {
  const SalesReport({
    this.totalSales = 0,
    this.transactionCount = 0,
    this.cashTotal = 0,
    this.transferTotal = 0,
    this.qrisTotal = 0,
  });

  final double totalSales;
  final int transactionCount;
  final double cashTotal;
  final double transferTotal;
  final double qrisTotal;

  factory SalesReport.fromJson(Map<String, dynamic> json) {
    final raw = JsonUtils.map(json);
    // Payment method breakdown may be nested under `payment_methods`.
    final methods = raw['payment_methods'] is Map<String, dynamic>
        ? raw['payment_methods'] as Map<String, dynamic>
        : null;

    return SalesReport(
      totalSales: JsonUtils.money(raw['total_sales'] ?? raw['total']),
      transactionCount: JsonUtils.integer(
          raw['transaction_count'] ?? raw['transactionCount']),
      cashTotal: _methodTotal(methods, ['CASH', 'cash', 'Cash']),
      transferTotal: _methodTotal(methods, ['TRANSFER', 'transfer', 'Transfer']),
      qrisTotal: _methodTotal(methods, ['QRIS', 'qris', 'Qris']),
    );
  }

  static double _methodTotal(
    Map<String, dynamic>? methods,
    List<String> keys,
  ) {
    if (methods == null) return 0;
    for (final key in keys) {
      final value = methods[key];
      final total = value is Map<String, dynamic>
          ? JsonUtils.money(value['total'] ?? value['amount'])
          : JsonUtils.money(value);
      if (total > 0) return total;
    }
    return 0;
  }
}

/// One row of `GET /api/reports/products`.
class ProductReportRow {
  const ProductReportRow({
    this.productId,
    this.name = '',
    this.sku = '',
    this.quantitySold = 0,
    this.revenue = 0,
  });

  final int? productId;
  final String name;
  final String sku;
  final double quantitySold;
  final double revenue;

  factory ProductReportRow.fromJson(Map<String, dynamic> json) {
    final raw = JsonUtils.map(json);
    return ProductReportRow(
      productId: JsonUtils.integerOrNull(raw['product_id'] ?? raw['id']),
      name: JsonUtils.string(raw['name'] ?? raw['product_name'] ?? raw['product']),
      sku: JsonUtils.string(raw['sku']),
      quantitySold: JsonUtils.number(
          raw['quantity_sold'] ?? raw['quantity'] ?? raw['sold']),
      revenue: JsonUtils.money(raw['revenue'] ?? raw['total'] ?? raw['sales']),
    );
  }
}

/// One row of `GET /api/reports/cashiers`.
class CashierReportRow {
  const CashierReportRow({
    this.cashierId,
    this.name = '',
    this.transactionCount = 0,
    this.salesTotal = 0,
  });

  final int? cashierId;
  final String name;
  final int transactionCount;
  final double salesTotal;

  factory CashierReportRow.fromJson(Map<String, dynamic> json) {
    final raw = JsonUtils.map(json);
    return CashierReportRow(
      cashierId:
          JsonUtils.integerOrNull(raw['cashier_id'] ?? raw['user_id'] ?? raw['id']),
      name: JsonUtils.string(
          raw['name'] ?? raw['cashier_name'] ?? raw['cashier']),
      transactionCount: JsonUtils.integer(
          raw['transaction_count'] ?? raw['transactions']),
      salesTotal: JsonUtils.money(raw['sales_total'] ?? raw['total']),
    );
  }
}