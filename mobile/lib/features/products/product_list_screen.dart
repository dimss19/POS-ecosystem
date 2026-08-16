import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/cache_banner.dart';
import '../../core/widgets/empty_state.dart';
import '../../core/widgets/loading_view.dart';
import '../../models/product.dart';
import '../shell/shell_app_bar_actions.dart';
import 'product_controller.dart';
import 'product_detail_screen.dart';
import 'product_form_screen.dart';

/// Product list with client-side search + category filter.
class ProductListScreen extends StatefulWidget {
  const ProductListScreen({super.key});

  @override
  State<ProductListScreen> createState() => _ProductListScreenState();
}

class _ProductListScreenState extends State<ProductListScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final controller = context.read<ProductsController>();
      if (!controller.loadedOnce) controller.load();
    });
  }

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<ProductsController>();
    final state = controller.state;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Products'),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            onPressed: controller.refresh,
            icon: const Icon(Icons.refresh),
          ),
          const ShellAppBarActions(),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        heroTag: 'addProduct',
        onPressed: () => _openForm(context),
        icon: const Icon(Icons.add),
        label: const Text('Add'),
      ),
      body: state.isLoading && !state.hasData
          ? const LoadingView()
          : state.hasError && !state.hasData
              ? ErrorView(message: state.error!, onRetry: controller.load)
              : _Body(controller: controller, state: state),
    );
  }

  Future<void> _openForm(BuildContext context) async {
    await Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const ProductFormScreen()),
    );
  }
}
class _Body extends StatelessWidget {
  const _Body({required this.controller, required this.state});

  final ProductsController controller;
  final dynamic state;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        CacheBanner(visible: state.fromCache, lastUpdated: state.lastUpdated),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
          child: TextField(
            onChanged: controller.setSearch,
            decoration: const InputDecoration(
              hintText: 'Search by name, SKU or barcode…',
              prefixIcon: Icon(Icons.search),
              isDense: true,
            ),
          ),
        ),
        if (controller.categories.isNotEmpty)
          _CategoryFilterBar(controller: controller),
        Expanded(
          child: controller.visibleProducts.isEmpty
              ? const EmptyState(
                  icon: Icons.inventory_2_outlined,
                  title: 'No products found',
                  subtitle: 'Try a different search, or add a new product.',
                )
              : RefreshIndicator(
                  onRefresh: controller.refresh,
                  child: ListView.separated(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
                    itemCount: controller.visibleProducts.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final product = controller.visibleProducts[index];
                      return _ProductCard(
                        product: product,
                        onTap: () => Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => ProductDetailScreen(product: product),
                          ),
                        ),
                      );
                    },
                  ),
                ),
        ),
      ],
    );
  }
}
class _CategoryFilterBar extends StatelessWidget {
  const _CategoryFilterBar({required this.controller});

  final ProductsController controller;

  @override
  Widget build(BuildContext context) {
    final categories = controller.categoriesState.data ?? const [];
    return SizedBox(
      height: 44,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        children: [
          _FilterChip(
            label: 'All',
            selected: controller.selectedCategoryId == null,
            onSelected: () => controller.setCategoryFilter(null),
          ),
          const SizedBox(width: 8),
          for (final category in categories) ...[
            _FilterChip(
              label: category.name,
              selected: controller.selectedCategoryId == category.id,
              onSelected: () => controller.setCategoryFilter(category.id),
            ),
            const SizedBox(width: 8),
          ],
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onSelected,
  });

  final String label;
  final bool selected;
  final VoidCallback onSelected;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: onSelected,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? scheme.primary : scheme.surface,
          borderRadius: BorderRadius.circular(999),
          border: selected ? null : Border.all(color: scheme.outlineVariant),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: selected ? scheme.onPrimary : scheme.onSurface,
          ),
        ),
      ),
    );
  }
}
class _ProductCard extends StatelessWidget {
  const _ProductCard({required this.product, required this.onTap});

  final Product product;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Card(
      margin: EdgeInsets.zero,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Container(
                width: 46,
                height: 46,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: scheme.primaryContainer.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(Icons.shopping_bag_outlined, color: scheme.primary),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            product.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                                fontWeight: FontWeight.w700, fontSize: 15),
                          ),
                        ),
                        if (!product.isActive) ...[
                          const SizedBox(width: 6),
                          Text(
                            'INACTIVE',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: scheme.outline,
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'SKU ${product.sku.isEmpty ? '-' : product.sku}'
                      '${product.categoryName == null || product.categoryName!.isEmpty ? '' : ' · ${product.categoryName}'}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontSize: 12, color: scheme.outline),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    AppFormatters.money(product.sellPrice),
                    style:
                        const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: product.isLowStock
                          ? AppTheme.dangerColor.withValues(alpha: 0.1)
                          : scheme.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      '${AppFormatters.quantity(product.stock)} ${product.unit}',
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w700,
                        color: product.isLowStock
                            ? AppTheme.dangerColor
                            : scheme.onSurface,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}