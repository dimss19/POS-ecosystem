import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/cache_banner.dart';
import '../../core/widgets/loading_view.dart';
import '../../core/widgets/section_card.dart';
import '../../core/widgets/status_chip.dart';
import '../../models/transaction.dart';
import 'transaction_controller.dart';

/// Full transaction detail including product lines.
class TransactionDetailScreen extends StatefulWidget {
  const TransactionDetailScreen({
    super.key,
    required this.transactionId,
    this.initial,
  });

  final int transactionId;
  final Transaction? initial;

  @override
  State<TransactionDetailScreen> createState() =>
      _TransactionDetailScreenState();
}

class _TransactionDetailScreenState extends State<TransactionDetailScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context
          .read<TransactionsController>()
          .openTransaction(widget.transactionId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<TransactionsController>();
    final state = controller.detailState;
    final transaction = state.data ?? widget.initial;

    return Scaffold(
      appBar: AppBar(title: const Text('Transaction Details')),
      body: transaction == null
          ? (state.isLoading
              ? const LoadingView()
              : ErrorView(
                  message: state.error ?? 'Unable to load transaction.',
                  onRetry: () =>
                      controller.openTransaction(widget.transactionId),
                ))
          : _buildContent(context, state, transaction),
    );
  }

  Widget _buildContent(BuildContext context, dynamic state, Transaction t) {
    final scheme = Theme.of(context).colorScheme;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        CacheBanner(visible: state.fromCache, lastUpdated: state.lastUpdated),
        const SizedBox(height: 10),
        SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      t.numberOrFallback,
                      style: const TextStyle(
                          fontSize: 17, fontWeight: FontWeight.w800),
                    ),
                  ),
                  StatusChip.forTransaction(t.status),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                AppFormatters.dateTime(t.createdAt),
                style: TextStyle(fontSize: 13, color: scheme.outline),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        SectionCard(
          title: 'Payment',
          child: Column(
            children: [
              _InfoRow(label: 'Subtotal', value: AppFormatters.money(t.subtotal)),
              _InfoRow(
                label: 'Discount',
                value: '- ${AppFormatters.money(t.discount)}',
                valueColor: scheme.outline,
              ),
              const Divider(height: 1),
              _InfoRow(
                label: 'Total',
                value: AppFormatters.money(t.total),
                isBold: true,
              ),
              const Divider(height: 12),
              _InfoRow(
                label: 'Payment method',
                value: t.paymentMethod.displayName,
              ),
              _InfoRow(
                label: 'Amount paid',
                value: AppFormatters.money(t.amountPaid),
              ),
              _InfoRow(
                label: 'Change',
                value: AppFormatters.money(t.changeAmount),
                valueColor: AppTheme.successColor,
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        SectionCard(
          title: 'Items (${t.items.length})',
          child: Column(
            children: [
              for (var i = 0; i < t.items.length; i++) ...[
                _ItemRow(item: t.items[i]),
                if (i != t.items.length - 1) const Divider(height: 1),
              ],
            ],
          ),
        ),
        const SizedBox(height: 12),
        SectionCard(
          title: 'Cashier',
          child: _InfoRow(
            label: 'Cashier',
            value: (t.cashierName ?? '').isEmpty ? '-' : t.cashierName!,
          ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }
}
class _ItemRow extends StatelessWidget {
  const _ItemRow({required this.item});

  final TransactionItem item;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.name.isEmpty ? 'Item' : item.name,
                  style:
                      const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                ),
                const SizedBox(height: 3),
                Text(
                  '${AppFormatters.quantity(item.quantity)} × '
                  '${AppFormatters.money(item.unitPrice)}'
                  '${item.discount > 0 ? ' (disc ${AppFormatters.money(item.discount)})' : ''}',
                  style: TextStyle(fontSize: 12.5, color: scheme.outline),
                ),
              ],
            ),
          ),
          Text(
            AppFormatters.money(item.subtotal),
            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.label,
    required this.value,
    this.valueColor,
    this.isBold = false,
  });

  final String label;
  final String value;
  final Color? valueColor;
  final bool isBold;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: 13.5, color: scheme.outline)),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: TextStyle(
                fontSize: isBold ? 16 : 14,
                fontWeight: isBold ? FontWeight.w800 : FontWeight.w600,
                color: valueColor ?? scheme.onSurface,
              ),
            ),
          ),
        ],
      ),
    );
  }
}