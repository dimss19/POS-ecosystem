import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/product.dart';
import 'product_controller.dart';

/// Create / edit product form.
class ProductFormScreen extends StatefulWidget {
  const ProductFormScreen({super.key, this.product});

  final Product? product;

  @override
  State<ProductFormScreen> createState() => _ProductFormScreenState();
}

class _ProductFormScreenState extends State<ProductFormScreen> {
  final _formKey = GlobalKey<FormState>();

  late final TextEditingController _sku;
  late final TextEditingController _barcode;
  late final TextEditingController _name;
  late final TextEditingController _buyPrice;
  late final TextEditingController _sellPrice;
  late final TextEditingController _unit;
  late final TextEditingController _minimumStock;
  int? _categoryId;
  bool _isActive = true;

  bool get isEditing => widget.product != null;

  @override
  void initState() {
    super.initState();
    final product = widget.product;
    _sku = TextEditingController(text: product?.sku ?? '');
    _barcode = TextEditingController(text: product?.barcode ?? '');
    _name = TextEditingController(text: product?.name ?? '');
    _buyPrice =
        TextEditingController(text: product == null ? '' : _asText(product.buyPrice));
    _sellPrice =
        TextEditingController(text: product == null ? '' : _asText(product.sellPrice));
    _unit = TextEditingController(text: product?.unit ?? 'pcs');
    _minimumStock = TextEditingController(
        text: product == null ? '0' : _asText(product.minimumStock));
    _categoryId = product?.categoryId;
    _isActive = product?.isActive ?? true;
  }

  static String _asText(double value) =>
      value == value.roundToDouble() ? '${value.round()}' : '$value';

  @override
  void dispose() {
    _sku.dispose();
    _barcode.dispose();
    _name.dispose();
    _buyPrice.dispose();
    _sellPrice.dispose();
    _unit.dispose();
    _minimumStock.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    final controller = context.read<ProductsController>();
    final draft = ProductDraft(
      sku: _sku.text,
      barcode: _barcode.text,
      name: _name.text,
      categoryId: _categoryId,
      buyPrice: _buyPrice.text,
      sellPrice: _sellPrice.text,
      unit: _unit.text,
      minimumStock: _minimumStock.text,
      isActive: _isActive,
    );

    final success = await controller.saveProduct(draft, existing: widget.product);
    if (!mounted) return;
    if (success) Navigator.of(context).pop();
  }
  @override
  Widget build(BuildContext context) {
    final controller = context.watch<ProductsController>();
    final categories = controller.categories;

    return Scaffold(
      appBar: AppBar(title: Text(isEditing ? 'Edit Product' : 'New Product')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (controller.saveError != null)
              _ErrorBanner(message: controller.saveError!),
            _Field(
              controller: _name,
              label: 'Name *',
              icon: Icons.label_outline,
              validator: (v) =>
                  (v ?? '').trim().isEmpty ? 'Product name is required' : null,
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: _Field(
                    controller: _sku,
                    label: 'SKU',
                    icon: Icons.qr_code_2,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _Field(
                    controller: _barcode,
                    label: 'Barcode',
                    icon: Icons.barcode_reader,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            _Field(
              controller: _unit,
              label: 'Unit',
              icon: Icons.straighten,
              helperText: 'e.g. pcs, kg, box',
            ),
            const SizedBox(height: 14),
            DropdownButtonFormField<int?>(
              initialValue: _categoryId,
              decoration: const InputDecoration(
                labelText: 'Category',
                prefixIcon: Icon(Icons.category_outlined),
              ),
              items: [
                const DropdownMenuItem<int?>(
                  value: null,
                  child: Text('No category'),
                ),
                for (final category in categories)
                  DropdownMenuItem<int?>(
                    value: category.id,
                    child: Text(category.name),
                  ),
              ],
              onChanged: (value) => setState(() => _categoryId = value),
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: _MoneyField(controller: _buyPrice, label: 'Buy Price'),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _MoneyField(
                    controller: _sellPrice,
                    label: 'Sell Price *',
                    required: true,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            _MoneyField(controller: _minimumStock, label: 'Minimum Stock'),
            const SizedBox(height: 14),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Active'),
              subtitle: const Text('Inactive products are hidden from sale'),
              value: _isActive,
              onChanged: (value) => setState(() => _isActive = value),
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: controller.saving ? null : _save,
              child: controller.saving
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(strokeWidth: 2.5),
                    )
                  : Text(isEditing ? 'Save Changes' : 'Create Product'),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}
class _Field extends StatelessWidget {
  const _Field({
    required this.controller,
    required this.label,
    this.icon,
    this.helperText,
    this.validator,
  });

  final TextEditingController controller;
  final String label;
  final IconData? icon;
  final String? helperText;
  final String? Function(String?)? validator;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: icon == null ? null : Icon(icon),
        helperText: helperText,
      ),
      validator: validator,
    );
  }
}

class _MoneyField extends StatelessWidget {
  const _MoneyField({
    required this.controller,
    required this.label,
    this.required = false,
  });

  final TextEditingController controller;
  final String label;
  final bool required;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      keyboardType:
          const TextInputType.numberWithOptions(decimal: true, signed: true),
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: const Icon(Icons.attach_money),
      ),
      validator: (value) {
        final raw = (value ?? '').trim();
        if (required && raw.isEmpty) return 'Required';
        if (raw.isEmpty) return null;
        final parsed = double.tryParse(raw.replaceAll(',', '.'));
        if (parsed == null) return 'Invalid number';
        if (parsed < 0) return 'Cannot be negative';
        return null;
      },
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
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
              message,
              style: TextStyle(
                fontSize: 13,
                color: scheme.onErrorContainer,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}