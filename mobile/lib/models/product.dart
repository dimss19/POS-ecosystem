import '../core/utils/json_utils.dart';

/// Product as returned by `GET /api/products` (and friends).
///
/// Money values are handled as decimal-safe doubles; display always uses
/// [AppFormatters.money] so no precision is implied.
class Product {
  const Product({
    this.id,
    this.sku = '',
    this.barcode,
    required this.name,
    this.categoryId,
    this.categoryName,
    this.buyPrice = 0,
    this.sellPrice = 0,
    this.stock = 0,
    this.minimumStock = 0,
    this.unit = '',
    this.isActive = true,
    this.createdAt,
    this.updatedAt,
  });

  final int? id;
  final String sku;
  final String? barcode;
  final String name;
  final int? categoryId;
  final String? categoryName;
  final double buyPrice;
  final double sellPrice;
  final double stock;
  final double minimumStock;
  final String unit;
  final bool isActive;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  bool get isLowStock => stock <= minimumStock;

  double get stockValue => stock * sellPrice;

  factory Product.fromJson(Map<String, dynamic> json) {
    final raw = JsonUtils.map(json);
    final nestedProduct = raw['product'] is Map<String, dynamic>
        ? raw['product'] as Map<String, dynamic>
        : raw;
    final nestedCategory = raw['category'] is Map<String, dynamic>
        ? raw['category'] as Map<String, dynamic>
        : null;
    return Product(
      id: JsonUtils.integerOrNull(nestedProduct['id']),
      sku: JsonUtils.string(nestedProduct['sku'], fallback: nestedProduct['sku_code']?.toString() ?? ''),
      barcode: JsonUtils.string(nestedProduct['barcode'], fallback: '').isEmpty
          ? null
          : '${nestedProduct['barcode']}',
      name: JsonUtils.string(nestedProduct['name']),
      categoryId: JsonUtils.integerOrNull(
          nestedProduct['category_id'] ?? nestedCategory?['id']),
      categoryName: nestedCategory != null
          ? JsonUtils.string(nestedCategory['name'])
          : JsonUtils.string(nestedProduct['category_name'], fallback: ''),
      buyPrice: JsonUtils.money(nestedProduct['buy_price'] ?? nestedProduct['purchase_price']),
      sellPrice: JsonUtils.money(nestedProduct['sell_price'] ?? nestedProduct['price']),
      stock: JsonUtils.number(
          nestedProduct['stock'] ?? nestedProduct['current_stock'] ?? nestedProduct['quantity']),
      minimumStock: JsonUtils.number(nestedProduct['minimum_stock'] ?? nestedProduct['min_stock']),
      unit: JsonUtils.string(nestedProduct['unit']),
      isActive: JsonUtils.boolValue(
          nestedProduct['is_active'] ?? nestedProduct['active']),
      createdAt: JsonUtils.date(nestedProduct['created_at'] ?? nestedProduct['createdAt']),
      updatedAt: JsonUtils.date(nestedProduct['updated_at'] ?? nestedProduct['updatedAt']),
    );
  }
}

/// Editable product input used by the create/edit form.
///
/// Raw strings are used so the forms control parsing and can send
/// decimal-safe money values to the API.
class ProductDraft {
  const ProductDraft({
    this.sku = '',
    this.barcode = '',
    this.name = '',
    this.categoryId,
    this.buyPrice = '',
    this.sellPrice = '',
    this.unit = 'pcs',
    this.minimumStock = '0',
    this.isActive = true,
  });

  final String sku;
  final String barcode;
  final String name;
  final int? categoryId;
  final String buyPrice;
  final String sellPrice;
  final String unit;
  final String minimumStock;
  final bool isActive;

  Map<String, dynamic> toJson() => {
        'sku': sku.trim(),
        'barcode': barcode.trim().isEmpty ? null : barcode.trim(),
        'name': name.trim(),
        'category_id': categoryId,
        'buy_price': _money(buyPrice),
        'sell_price': _money(sellPrice),
        'unit': unit.trim().isEmpty ? 'pcs' : unit.trim(),
        'minimum_stock': _money(minimumStock),
        'is_active': isActive,
      };

  /// Keep two decimals for all monetary payloads.
  static String _money(String raw) {
    var parsed = double.tryParse(raw.replaceAll(',', '.').trim());
    if (parsed == null) parsed = 0;
    return parsed.toStringAsFixed(2);
  }
}