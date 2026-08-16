import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/section_card.dart';
import '../../models/product.dart';
import 'product_form_screen.dart';

/// Read-only product detail.
class ProductDetailScreen extends StatelessWidget {
  const ProductDetailScreen({super.key, required this.product});

  final Product product;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Product Details'),
        actions: [
          IconButton(
            tooltip: 'Edit product',
            icon: const Icon(Icons.edit_outlined),
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => ProductFormScreen(product: product),
              ),
            ),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildHeader(scheme),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _StockBadge(
                  icon: Icons.sell_outlined,
                  label: 'Selling Price',
                  value: AppFormatters.money(product.sellPrice),
                  color: AppTheme.seedColor,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _StockBadge(
                  icon: Icons.shopping_cart_outlined,
                  label: 'Buy Price',
                  value: AppFormatters.money(product.buyPrice),
                  color: scheme.outline,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SectionCard(
            title: 'Stock',
            child: Row(
              children: [
                Expanded(
                  child: _InlineMetric(
                    label: 'Available',
                    value:
                        '${AppFormatters.quantity(product.stock)} ${product.unit}',
                  ),
                ),
                Expanded(
                  child: _InlineMetric(
                    label: 'Minimum',
                    value:
                        '${AppFormatters.quantity(product.minimumStock)} ${product.unit}',
                  ),
                ),
                Expanded(
                  child: _InlineMetric(
                    label: 'Status',
                    value: product.isLowStock ? 'LOW STOCK' : 'OK',
                    valueColor: product.isLowStock
                        ? AppTheme.dangerColor
                        : AppTheme.successColor,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          SectionCard(
            title: 'Information',
            child: Column(
              children: [
                _InfoRow(
                  label: 'Category',
                  value: product.categoryName == null ||
                          product.categoryName!.isEmpty
                      ? '-'
                      : product.categoryName!,
                ),
                const Divider(height: 1),
                _InfoRow(
                  label: 'Barcode',
                  value:
                      (product.barcode ?? '').isEmpty ? '-' : product.barcode!,
                ),
                const Divider(height: 1),
                _InfoRow(
                  label: 'Unit',
                  value: product.unit.isEmpty ? '-' : product.unit,
                ),
                const Divider(height: 1),
                _InfoRow(
                  label: 'Created',
                  value: AppFormatters.date(product.createdAt),
                ),
                const Divider(height: 1),
                _InfoRow(
                  label: 'Last updated',
                  value: AppFormatters.dateTime(product.updatedAt),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(ColorScheme scheme) {
    return Row(
      children: [
        Container(
          width: 56,
          height: 56,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: scheme.primaryContainer.withValues(alpha: 0.5),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Icon(Icons.shopping_bag_outlined, color: scheme.primary),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                product.name,
                style:
                    const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 4),
              Text(
                'SKU ${product.sku.isEmpty ? '-' : product.sku}',
                style: TextStyle(fontSize: 13, color: scheme.outline),
              ),
            ],
          ),
        ),
        if (!product.isActive)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: scheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              'INACTIVE',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: scheme.outline,
              ),
            ),
          ),
      ],
    );
  }
}
class _InlineMetric extends StatelessWidget {
  const _InlineMetric({required this.label, required this.value, this.valueColor});

  final String label;
  final String value;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(fontSize: 12, color: scheme.outline)),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w800,
            color: valueColor ?? scheme.onSurface,
          ),
        ),
      ],
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: 13.5, color: scheme.outline)),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style:
                  const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}

class _StockBadge extends StatelessWidget {
  const _StockBadge({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(fontSize: 11.5, color: color.withValues(alpha: 0.9)),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: color,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}