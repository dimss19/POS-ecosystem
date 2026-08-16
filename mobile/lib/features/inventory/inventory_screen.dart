import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/cache_banner.dart';
import '../../core/widgets/empty_state.dart';
import '../../core/widgets/loading_view.dart';
import '../../models/product.dart';
import '../products/product_detail_screen.dart';
import '../shell/shell_app_bar_actions.dart';
import 'inventory_controller.dart';
import 'stock_adjustment_screen.dart';
import 'stock_movements_screen.dart';

/// Inventory overview: stock levels, low-stock filter and shortcuts.
class InventoryScreen extends StatefulWidget {
  const InventoryScreen({super.key});

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final controller = context.read<InventoryController>();
      if (!controller.loadedOnce) controller.load();
    });
  }

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<InventoryController>();
    final state = controller.overview;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Inventory'),
        actions: [
          IconButton(
            tooltip: 'Stock movements',
            icon: const Icon(Icons.history),
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const StockMovementsScreen()),
            ),
          ),
          IconButton(
            tooltip: 'Refresh',
            onPressed: controller.refresh,
            icon: const Icon(Icons.refresh),
          ),
          const ShellAppBarActions(),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        heroTag: 'adjustStock',
        onPressed: () => _openAdjustment(context),
        icon: const Icon(Icons.sync_alt),
        label: const Text('Adjust'),
      ),
      body: state.isLoading && !state.hasData
          ? const LoadingView()
          : state.hasError && !state.hasData
              ? ErrorView(message: state.error!, onRetry: controller.load)
              : _buildBody(context, controller, state),
    );
  }

  Widget _buildBody(BuildContext context, InventoryController controller,
      dynamic state) {
    final scheme = Theme.of(context).colorScheme;
    final lowStockCount =
        (state.data ?? const <Product>[]).where((p) => p.isLowStock).length;

    return Column(
      children: [
        CacheBanner(visible: state.fromCache, lastUpdated: state.lastUpdated),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 4),
          child: Row(
            children: [
              Expanded(
                child: Wrap(
                  spacing: 10,
                  children: [
                    _FilterChip(
                      label: 'All',
                      selected: !controller.lowStockOnly,
                      onTap: () => controller.setLowStockOnly(false),
                    ),
                    _FilterChip(
                      label: 'Low stock ($lowStock)',
                      selected: controller.lowStockOnly,
                      onTap: () => controller.setLowStockOnly(true),
                    ),
                  ],
                ),
              ),
              Text(
                '${controller.visibleStock.length} item(s)',
                style: TextStyle(fontSize: 12.5, color: scheme.outline),
              ),
            ],
          ),
        ),
        Expanded(
          child: controller.visibleStock.isEmpty
              ? EmptyState(
                  icon: Icons.inventory_outlined,
                  title: controller.lowStockOnly
                      ? 'No low-stock items'
                      : 'No stock data',
                  subtitle: controller.lowStockOnly
                      ? 'Everything is above its minimum stock.'
                      : 'Pull to refresh, or adjust stock with the button below.',
                )
              : RefreshIndicator(
                  onRefresh: controller.refresh,
                  child: ListView.separated(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
                    itemCount: controller.visibleStock.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final product = controller.visibleStock[index];
                      return _StockCard(
                        product: product,
                        onTap: () => Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => ProductDetailScreen(product: product),
                          ),
                        ),
                        onAdjust: () => _openAdjustment(context, product: product),
                      );
                    },
                  ),
                ),
        ),
      ],
    );
  }

  Future<void> _openAdjustment(BuildContext context, {Product? product}) async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => StockAdjustmentScreen(initialProduct: product),
      ),
    );
  }
}