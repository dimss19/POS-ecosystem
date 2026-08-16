import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/product.dart';
import 'inventory_controller.dart';

/// Stock adjustment form. Requires quantity (signed) and a reason.
class StockAdjustmentScreen extends StatefulWidget {
  const StockAdjustmentScreen({super.key, this.initialProduct});

  final Product? initialProduct;

  @override
  State<StockAdjustmentScreen> createState() => _StockAdjustmentScreenState();
}

class _StockAdjustmentScreenState extends State<StockAdjustmentScreen> {
  final _formKey = GlobalKey<FormState>();
  final _quantityController = TextEditingController();
  final _reasonController = TextEditingController();

  int? _selectedProductId;

  @override
  void initState() {
    super.initState();
    _selectedProductId = widget.initialProduct?.id;
  }

  @override
  void dispose() {
    _quantityController.dispose();
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _submit(InventoryController controller) async {
    if (!_formKey.currentState!.validate()) return;

    final product = controller.productById(_selectedProductId);
    if (product == null || product.id == null) return;

    final quantity = double.parse(_quantityController.text.replaceAll(',', '.'));

    final success = await controller.adjustStock(
      productId: product.id!,
      quantity: quantity,
      reason: _reasonController.text,
    );
    if (!mounted) return;
    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            quantity >= 0
                ? 'Stock added: ${product.name} (+$quantity)'
                : 'Stock reduced: ${product.name} ($quantity)',
          ),
        ),
      );
      Navigator.of(context).pop();
    }
  }
@override
  Widget build(BuildContext context) {
    final controller = context.watch<InventoryController>();
    final products = controller.overview.data ?? const <Product>[];
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Adjust Stock')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (controller.adjustmentError != null)
              Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: scheme.errorContainer.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Icon(Icons.error_outline, color: scheme.error, size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        controller.adjustmentError!,
                        style: TextStyle(
                          fontSize: 13,
                          color: scheme.onErrorContainer,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            DropdownButtonFormField<int>(
              initialValue: _selectedProductId,
              decoration: const InputDecoration(
                labelText: 'Product *',
                prefixIcon: Icon(Icons.inventory_2_outlined),
              ),
              items: [
                for (final product in products)
                  DropdownMenuItem<int>(
                    value: product.id,
                    child: Text(
                      '${product.name} (${_stock(product)})',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
              ],
              onChanged: (value) => setState(() => _selectedProductId = value),
              validator: (value) => value == null ? 'Select a product' : null,
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _quantityController,
              keyboardType:
                  const TextInputType.numberWithOptions(decimal: true, signed: true),
              decoration: const InputDecoration(
                labelText: 'Quantity (use +/- for add / remove)',
                prefixIcon: Icon(Icons.swap_vert),
                helperText: 'Example: 10 adds stock, -3 removes stock',
              ),
              validator: (value) {
                final raw = (value ?? '').trim();
                if (raw.isEmpty) return 'Quantity is required';
                if (double.tryParse(raw.replaceAll(',', '.')) == null) {
                  return 'Invalid quantity';
                }
                return null;
              },
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _reasonController,
              maxLines: 2,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(
                labelText: 'Reason *',
                hintText: 'e.g. stock opname, damaged goods, restock…',
                alignLabelWithHint: true,
              ),
              validator: (value) =>
                  (value ?? '').trim().isEmpty ? 'Reason is required' : null,
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed:
                  controller.adjusting ? null : () => _submit(controller),
              child: controller.adjusting
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(strokeWidth: 2.5),
                    )
                  : const Text('Apply Adjustment'),
            ),
            const SizedBox(height: 8),
            Text(
              'Adjustments are recorded via /api/stock/adjustments and '
              'visible in the stock movement history.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12, color: scheme.outline),
            ),
          ],
        ),
      ),
    );
  }

  String _stock(Product product) {
    final count = product.stock == product.stock.roundToDouble()
        ? '${product.stock.round()}'
        : '$product.stock';
    return product.unit.isEmpty ? count : '$count ${product.unit}';
  }
}