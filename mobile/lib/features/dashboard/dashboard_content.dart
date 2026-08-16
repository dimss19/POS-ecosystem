import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/cache_banner.dart';
import '../../core/widgets/metric_card.dart';
import '../../core/widgets/sales_bar_chart.dart';
import '../../core/widgets/sales_line_chart.dart';
import '../../core/widgets/section_card.dart';
import '../../models/dashboard.dart';

/// The scrollable dashboard body: metrics, charts, top products, low stock.
class DashboardContent extends StatelessWidget {
  const DashboardContent({
    super.key,
    required this.dashboard,
    this.fromCache = false,
    this.lastUpdated,
    this.onRefresh,
  });

  final DashboardData dashboard;
  final bool fromCache;
  final DateTime? lastUpdated;
  final Future<void> Function()? onRefresh;

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: onRefresh ?? () async {},
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(
            child: CacheBanner(visible: fromCache, lastUpdated: lastUpdated),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            sliver: SliverToBoxAdapter(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _buildMetrics(context),
                  const SizedBox(height: 16),
                  _buildCharts(),
                  const SizedBox(height: 16),
                  _buildTopProducts(),
                  const SizedBox(height: 16),
                  _buildLowStock(context),
                ],
              ),
            ),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 24)),
        ],
      ),
    );
  }

  Widget _buildMetrics(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final itemWidth = (constraints.maxWidth - 12) / 2;
        return Wrap(
          spacing: 12,
          runSpacing: 12,
          children: [
            SizedBox(
              width: itemWidth,
              child: MetricCard(
                icon: Icons.payments_outlined,
                label: "Today's Sales",
                value: AppFormatters.money(dashboard.todaySales),
                iconColor: AppTheme.seedColor,
              ),
            ),
            SizedBox(
              width: itemWidth,
              child: MetricCard(
                icon: Icons.receipt_long_outlined,
                label: 'Transactions',
                value: AppFormatters.number(dashboard.transactionCount),
                iconColor: AppTheme.accentColor,
              ),
            ),
            SizedBox(
              width: itemWidth,
              child: MetricCard(
                icon: Icons.shopping_bag_outlined,
                label: 'Items Sold',
                value: AppFormatters.number(dashboard.itemsSold),
                iconColor: AppTheme.successColor,
              ),
            ),
            SizedBox(
              width: itemWidth,
              child: MetricCard(
                icon: Icons.warning_amber_outlined,
                label: 'Low Stock Items',
                value: AppFormatters.number(dashboard.lowStockCount),
                iconColor: dashboard.lowStockCount > 0
                    ? AppTheme.dangerColor
                    : AppTheme.successColor,
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildCharts() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (dashboard.dailySales.isNotEmpty) ...[
          SectionCard(
            title: 'Daily Sales',
            child: SalesBarChart(points: dashboard.dailySales),
          ),
          const SizedBox(height: 16),
        ],
        if (dashboard.weeklySales.isNotEmpty) ...[
          SectionCard(
            title: 'Weekly Sales',
            child: SalesLineChart(points: dashboard.weeklySales),
          ),
        ],
      ],
    );
  }

  Widget _buildTopProducts() {
    final top = dashboard.topProducts;
    if (top.isEmpty) return const SizedBox.shrink();
    final maxRevenue = top.map((p) => p.revenue).reduce((a, b) => a > b ? a : b);

    return SectionCard(
      title: 'Top Products',
      child: Column(
        children: [
          for (var i = 0; i < top.length; i++) ...[
            _TopProductRow(
              rank: i + 1,
              name: top[i].name,
              detail: '${AppFormatters.quantity(top[i].quantity)} sold · '
                  '${AppFormatters.money(top[i].revenue)}',
              fraction: maxRevenue <= 0 ? 0 : top[i].revenue / maxRevenue,
            ),
            if (i != top.length - 1) const Divider(height: 20),
          ],
        ],
      ),
    );
  }

  Widget _buildLowStock(BuildContext context) {
    if (dashboard.lowStockProducts.isEmpty) return const SizedBox.shrink();
    final items = dashboard.lowStockProducts.take(5).toList();
    return SectionCard(
      title: 'Low Stock',
      trailing: Text(
        '${dashboard.lowStockCount} item(s)',
        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          for (final product in items) ...[
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.warning_amber, color: AppTheme.warningColor),
              title: Text(product.name, maxLines: 1, overflow: TextOverflow.ellipsis),
              subtitle: Text(
                'Stock ${AppFormatters.quantity(product.stock)} / min '
                '${AppFormatters.quantity(product.minimumStock)}',
              ),
              trailing: Text(
                '${AppFormatters.quantity(product.stock)} ${product.unit}',
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
            ),
            if (product != items.last) const Divider(height: 8),
          ],
        ],
      ),
    );
  }
}

class _TopProductRow extends StatelessWidget {
  const _TopProductRow({
    required this.rank,
    required this.name,
    required this.detail,
    required this.fraction,
  });

  final int rank;
  final String name;
  final String detail;
  final double fraction;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Row(
      children: [
        CircleAvatar(
          radius: 13,
          backgroundColor: scheme.secondaryContainer,
          child: Text(
            '$rank',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: scheme.onSecondaryContainer,
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style:
                    const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
              ),
              const SizedBox(height: 6),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: fraction.clamp(0.02, 1.0),
                  minHeight: 5,
                  backgroundColor: scheme.surfaceContainerHighest,
                  color: AppTheme.accentColor,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                detail,
                style: TextStyle(fontSize: 11.5, color: scheme.outline),
              ),
            ],
          ),
        ),
      ],
    );
  }
}