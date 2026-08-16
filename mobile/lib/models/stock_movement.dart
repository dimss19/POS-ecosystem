import '../core/utils/json_utils.dart';

/// Stock movement types from the backend contract.
enum StockMovementType {
  sale('SALE'),
  purchase('PURCHASE'),
  adjustment('ADJUSTMENT'),
  returned('RETURN'),
  voidReversal('VOID_REVERSAL'),
  unknown('');

  const StockMovementType(this.apiValue);
  final String apiValue;

  static StockMovementType fromApi(String? value) {
    final normalized = (value ?? '').toUpperCase();
    for (final type in StockMovementType.values) {
      if (type.apiValue == normalized) return type;
    }
    return StockMovementType.unknown;
  }

  String get displayName {
    switch (this) {
      case StockMovementType.sale:
        return 'Sale';
      case StockMovementType.purchase:
        return 'Purchase';
      case StockMovementType.adjustment:
        return 'Adjustment';
      case StockMovementType.returned:
        return 'Return';
      case StockMovementType.voidReversal:
        return 'Void reversal';
      case StockMovementType.unknown:
        return 'Other';
    }
  }
}

/// A single stock movement from `GET /api/stock/movements`.
class StockMovement {
  const StockMovement({
    this.id,
    this.productId,
    this.productName,
    this.type = StockMovementType.unknown,
    required this.quantity,
    this.beforeStock,
    this.afterStock,
    this.reference = '',
    this.createdAt,
  });

  final int? id;
  final int? productId;
  final String? productName;
  final StockMovementType type;
  final double quantity;
  final double? beforeStock;
  final double? afterStock;
  final String reference;
  final DateTime? createdAt;

  bool get isIncoming => quantity > 0;

  factory StockMovement.fromJson(Map<String, dynamic> json) {
    final raw = JsonUtils.map(json);
    final nestedProduct = raw['product'] is Map<String, dynamic>
        ? raw['product'] as Map<String, dynamic>
        : null;
    return StockMovement(
      id: JsonUtils.integerOrNull(raw['id']),
      productId: JsonUtils.integerOrNull(
          raw['product_id'] ?? nestedProduct?['id']),
      productName: JsonUtils.string(
          raw['product_name'] ?? raw['name'] ?? nestedProduct?['name'],
          fallback: ''),
      type: StockMovementType.fromApi(raw['type']),
      quantity: JsonUtils.number(raw['quantity'] ?? raw['qty']),
      beforeStock: JsonUtils.integerOrNull(raw['before_stock'])?.toDouble(),
      afterStock: JsonUtils.integerOrNull(raw['after_stock'])?.toDouble(),
      reference: JsonUtils.string(raw['reference'] ?? raw['reason']),
      createdAt: JsonUtils.date(raw['created_at'] ?? raw['createdAt']),
    );
  }
}