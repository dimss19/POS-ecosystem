import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/cache_banner.dart';
import '../../core/widgets/empty_state.dart';
import '../../core/widgets/loading_view.dart';
import '../../core/widgets/metric_card.dart';
import '../../core/widgets/section_card.dart';
import '../../models/reports.dart';
import '../shell/shell_app_bar_actions.dart';
import 'report_controller.dart';

/// Reports screen with a shared date range and three tabs:
/// Sales / Products / Cashiers.
class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final controller = context.read<ReportsController>();
      if (!controller.loadedOnce) controller.load();
    });
  }

  Future<void> _pickDate({required bool isFrom}) async {
    final controller = context.read<ReportsController>();
    final now = DateTime.now();
    final current = isFrom ? controller.from : controller.to;
    final picked = await showDatePicker(
      context: context,
      initialDate: current ?? now,
      firstDate: DateTime(now.year - 3),
      lastDate: now,
    );
    if (picked == null) return;
    if (isFrom) {
      controller.setRange(picked, controller.to);
    } else {
      controller.setRange(controller.from, picked);
    }
    controller.load();
  }

  Future<void> _clearRange() async {
    final controller = context.read<ReportsController>();
    controller.setRange(null, null);
    controller.load();
  }

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<ReportsController>();
    final scheme = Theme.of(context).colorScheme;

    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Reports'),
          actions: [
            IconButton(
              tooltip: 'Refresh',
              onPressed: controller.refresh,
              icon: const Icon(Icons.refresh),
            ),
            const ShellAppBarActions(),
          ],
        ),
        body: Column(
          children: [
            _RangeBar(
              from: controller.from,
              to: controller.to,
              onFromTap: () => _pickDate(isFrom: true),
              onToTap: () => _pickDate(isFrom: false),
              onClear: _clearRange,
            ),
            const TabBar(
              tabs: [
                Tab(text: 'Sales'),
                Tab(text: 'Products'),
                Tab(text: 'Cashiers'),
              ],
            ),
            Expanded(
              child: TabBarView(
                children: [
                  _SalesTab(controller: controller),
                  _ProductsTab(controller: controller),
                  _CashiersTab(controller: controller),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RangeBar extends StatelessWidget {
  const _RangeBar({
    required this.from,
    required this.to,
    required this.onFromTap,
    required this.onToTap,
    required this.onClear,
  });

  final DateTime? from;
  final DateTime? to;
  final VoidCallback onFromTap;
  final VoidCallback onToTap;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final hasRange = from != null || to != null;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 4),
      child: Row(
        children: [
          Expanded(
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _RangeChip(
                  icon: Icons.event,
                  label: from == null ? 'From today' : 'From ${AppFormatters.date(from)}',
                  onTap: onFromTap,
                ),
                _RangeChip(
                  icon: Icons.event,
                  label: to == null ? 'To today' : 'To ${AppFormatters.date(to)}',
                  onTap: onToTap,
                ),
              ],
            ),
          ),
          IconButton(
            tooltip: 'Clear date range',
            onPressed: hasRange ? onClear : null,
            icon: const Icon(Icons.close),
          ),
        ],
      ),
    );
  }
}

class _RangeChip extends StatelessWidget {
  const _RangeChip({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ActionChip(
      avatar: Icon(icon, size: 17),
      label: Text(label, style: const TextStyle(fontSize: 12.5)),
      onPressed: onTap,
    );
  }
}
class _SalesTab extends StatelessWidget {
  const _SalesTab({required this.controller});

  final ReportsController controller;

  @override
  Widget build(BuildContext context) {
    final state = controller.sales;

    return _ReportBody(
      isLoading: state.isLoading,
      hasData: state.hasData,
      fromCache: state.fromCache,
      lastUpdated: state.lastUpdated,
      onRetry: controller.refresh,
      emptyMessage: 'No sales data',
      child: _SalesSummary(report: state.data!),
    );
  }
}

class _SalesSummary extends StatelessWidget {
  const _SalesSummary({required this.report});

  final SalesReport report;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        LayoutBuilder(
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
                    label: 'Total sales',
                    value: AppFormatters.money(report.totalSales),
                    iconColor: AppTheme.seedColor,
                  ),
                ),
                SizedBox(
                  width: itemWidth,
                  child: MetricCard(
                    icon: Icons.receipt_long_outlined,
                    label: 'Transactions',
                    value: AppFormatters.number(report.transactionCount),
                    iconColor: AppTheme.accentColor,
                  ),
                ),
              ],
            );
          },
        ),
        const SizedBox(height: 16),
        SectionCard(
          title: 'Payment methods',
          child: Column(
            children: [
              _PaymentRow(
                icon: Icons.payments_outlined,
                label: 'Cash',
                value: AppFormatters.money(report.cashTotal),
              ),
              const Divider(height: 1),
              _PaymentRow(
                icon: Icons.account_balance_outlined,
                label: 'Transfer',
                value: AppFormatters.money(report.transferTotal),
              ),
              const Divider(height: 1),
              _PaymentRow(
                icon: Icons.qr_code_2,
                label: 'QRIS',
                value: AppFormatters.money(report.qrisTotal),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }
}

class _PaymentRow extends StatelessWidget {
  const _PaymentRow({required this.icon, required this.label, required this.value});

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: scheme.primaryContainer.withValues(alpha: 0.45),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 18, color: scheme.onPrimaryContainer),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(label,
                style: const TextStyle(fontWeight: FontWeight.w600)),
          ),
          Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
          ),
        ],
      ),
    );
  }
}
class _ProductsTab extends StatelessWidget {
  const _ProductsTab({required this.controller});

  final ReportsController controller;

  @override
  Widget build(BuildContext context) {
    final state = controller.products;
    final rows = state.data ?? const <ProductReportRow>[];

    return _ReportBody(
      isLoading: state.isLoading,
      hasData: state.hasData,
      fromCache: state.fromCache,
      lastUpdated: state.lastUpdated,
      onRetry: controller.refresh,
      emptyMessage: 'Unable to load product report.',
      child: rows.isEmpty
          ? const EmptyState(
              icon: Icons.shopping_bag_outlined,
              title: 'No product data',
            )
          : RefreshIndicator(
              onRefresh: controller.refresh,
              child: ListView.separated(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                itemCount: rows.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final row = rows[index];
                  return Card(
                    margin: EdgeInsets.zero,
                    child: ListTile(
                      leading: CircleAvatar(
                        radius: 18,
                        backgroundColor:
                            Theme.of(context).colorScheme.primaryContainer,
                        child: const Icon(Icons.shopping_bag_outlined,
                            size: 18),
                      ),
                      title: Text(
                        row.name.isEmpty ? 'Unknown product' : row.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                      subtitle: Text(
                        '${AppFormatters.quantity(row.quantitySold)} sold · '
                        'SKU ${row.sku.isEmpty ? '-' : row.sku}',
                        style: const TextStyle(fontSize: 12),
                      ),
                      trailing: Text(
                        AppFormatters.money(row.revenue),
                        style:
                            const TextStyle(fontWeight: FontWeight.w800),
                      ),
                    ),
                  );
                },
              ),
            ),
    );
  }
}
class _CashiersTab extends StatelessWidget {
  const _CashiersTab({required this.controller});

  final ReportsController controller;

  @override
  Widget build(BuildContext context) {
    final state = controller.cashiers;
    final rows = state.data ?? const <CashierReportRow>[];

    return _ReportBody(
      isLoading: state.isLoading,
      hasData: state.hasData,
      fromCache: state.fromCache,
      lastUpdated: state.lastUpdated,
      onRetry: controller.refresh,
      emptyMessage: 'Unable to load cashier report.',
      child: rows.isEmpty
          ? const EmptyState(
              icon: Icons.people_outline,
              title: 'No cashier data',
            )
          : RefreshIndicator(
              onRefresh: controller.refresh,
              child: ListView.separated(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                itemCount: rows.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final row = rows[index];
                  final scheme = Theme.of(context).colorScheme;
                  return Card(
                    margin: EdgeInsets.zero,
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Row(
                        children: [
                          Container(
                            width: 42,
                            height: 42,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: scheme.secondaryContainer,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              _initials(row.name),
                              style: TextStyle(
                                fontWeight: FontWeight.w800,
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
                                  row.name.isEmpty ? 'Cashier' : row.name,
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w700),
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  '${AppFormatters.number(row.transactionCount)} '
                                  'transaction(s)',
                                  style: TextStyle(
                                      fontSize: 12.5, color: scheme.outline),
                                ),
                              ],
                            ),
                          ),
                          Text(
                            AppFormatters.money(row.salesTotal),
                            style: const TextStyle(
                                fontSize: 15, fontWeight: FontWeight.w800),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
    );
  }

  static String _initials(String name) {
    final trimmed = name.trim();
    if (trimmed.isEmpty) return '?';
    final parts = trimmed.split(RegExp(r'\s+'));
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return (parts.first.substring(0, 1) + parts.last.substring(0, 1))
        .toUpperCase();
  }
}
class _ReportBody extends StatelessWidget {
  const _ReportBody({
    required this.isLoading,
    required this.hasData,
    required this.fromCache,
    required this.lastUpdated,
    required this.onRetry,
    required this.child,
    required this.emptyMessage,
  });

  final bool isLoading;
  final bool hasData;
  final bool fromCache;
  final DateTime? lastUpdated;
  final VoidCallback onRetry;
  final Widget child;
  final String emptyMessage;

  @override
  Widget build(BuildContext context) {
    if (isLoading && !hasData) return const LoadingView();
    if (!hasData) return ErrorView(message: emptyMessage, onRetry: onRetry);

    return Column(
      children: [
        CacheBanner(visible: fromCache, lastUpdated: lastUpdated),
        Expanded(child: child),
      ],
    );
  }
}