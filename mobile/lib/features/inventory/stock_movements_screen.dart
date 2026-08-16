import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/cache_banner.dart';
import '../../core/widgets/empty_state.dart';
import '../../core/widgets/loading_view.dart';
import '../../models/stock_movement.dart';
import '../shell/shell_app_bar_actions.dart';
import 'inventory_controller.dart';

/// Stock movement history (`GET /api/stock/movements`).
class StockMovementsScreen extends StatefulWidget {
  const StockMovementsScreen({super.key});

  @override
  State<StockMovementsScreen> createState() => _StockMovementsScreenState();
}

class _StockMovementsScreenState extends State<StockMovementsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<InventoryController>().loadMovements();
    });
  }

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<InventoryController>();
    final state = controller.movements;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Stock Movements'),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            onPressed: () => controller.loadMovements(),
            icon: const Icon(Icons.refresh),
          ),
          const ShellAppBarActions(),
        ],
      ),
      body: state.isLoading && !state.hasData
          ? const LoadingView()
          : state.hasError && !state.hasData
              ? ErrorView(
                  message: state.error!,
                  onRetry: () => controller.loadMovements(),
                )
              : Column(
                  children: [
                    CacheBanner(
                      visible: state.fromCache,
                      lastUpdated: state.lastUpdated,
                    ),
                    Expanded(
                      child: (state.data ?? const <StockMovement>[]).isEmpty
                          ? const EmptyState(
                              icon: Icons.history,
                              title: 'No stock movements',
                              subtitle:
                                  'Adjustments will appear here once recorded.',
                            )
                          : RefreshIndicator(
                              onRefresh: () => controller.loadMovements(),
                              child: ListView.separated(
                                physics: const AlwaysScrollableScrollPhysics(),
                                padding: const EdgeInsets.all(16),
                                itemCount:
                                    (state.data ?? const <StockMovement>[]).length,
                                separatorBuilder: (_, __) =>
                                    const SizedBox(height: 10),
                                itemBuilder: (context, index) {
                                  final movement =
                                      (state.data ?? const <StockMovement>[])[index];
                                  return _MovementCard(movement: movement);
                                },
                              ),
                            ),
                    ),
                  ],
                ),
    );
  }
}

class _MovementCard extends StatelessWidget {
  const _MovementCard({required this.movement});

  final StockMovement movement;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final incoming = movement.isIncoming;
    final color = incoming ? AppTheme.successColor : AppTheme.dangerColor;

    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                incoming ? Icons.trending_up : Icons.trending_down,
                color: color,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    movement.productName ?? 'Product #${movement.productId ?? '-'}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        fontWeight: FontWeight.w700, fontSize: 14),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    '${movement.type.displayName}'
                    '${movement.reference.isEmpty ? '' : ' · ${movement.reference}'}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 12, color: scheme.outline),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    AppFormatters.dateTime(movement.createdAt),
                    style: TextStyle(fontSize: 11.5, color: scheme.outline),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Text(
              '${incoming ? '+' : ''}${AppFormatters.quantity(movement.quantity)}',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}