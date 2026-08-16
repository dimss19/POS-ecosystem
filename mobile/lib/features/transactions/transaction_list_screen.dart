import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/utils/formatters.dart';
import '../../core/widgets/cache_banner.dart';
import '../../core/widgets/empty_state.dart';
import '../../core/widgets/loading_view.dart';
import '../../models/transaction.dart';
import '../../repositories/transaction_repository.dart';
import '../shell/shell_app_bar_actions.dart';
import 'transaction_controller.dart';
import 'transaction_detail_screen.dart';

/// Transaction list with date/cashier/payment/status filters + load more.
class TransactionListScreen extends StatefulWidget {
  const TransactionListScreen({super.key});

  @override
  State<TransactionListScreen> createState() => _TransactionListScreenState();
}

class _TransactionListScreenState extends State<TransactionListScreen> {
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final controller = context.read<TransactionsController>();
      if (!controller.loadedOnce) controller.load();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _applySearch(TransactionsController controller, String query) {
    controller.setFilters(
      controller.filters.copyWith(
        search: query.trim().isEmpty ? null : query.trim(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<TransactionsController>();
    final state = controller.state;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Transactions'),
        actions: [
          IconButton(
            tooltip: 'Filters',
            icon: Badge(
              isLabelVisible: controller.hasActiveFilters,
              smallSize: 8,
              child: const Icon(Icons.filter_list),
            ),
            onPressed: () => _openFilters(context, controller),
          ),
          IconButton(
            tooltip: 'Refresh',
            onPressed: controller.refresh,
            icon: const Icon(Icons.refresh),
          ),
          const ShellAppBarActions(),
        ],
      ),
      body: state.isLoading && !state.hasData
          ? const LoadingView()
          : state.hasError && !state.hasData
              ? ErrorView(message: state.error!, onRetry: controller.load)
              : _buildBody(context, controller, state),
    );
  }

  Widget _buildBody(BuildContext context, TransactionsController controller,
      dynamic state) {
    final items = state.data ?? const <Transaction>[];

    return Column(
      children: [
        CacheBanner(visible: state.fromCache, lastUpdated: state.lastUpdated),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 4),
          child: TextField(
            controller: _searchController,
            onChanged: (value) => _applySearch(controller, value),
            decoration: const InputDecoration(
              hintText: 'Search transaction number…',
              prefixIcon: Icon(Icons.search),
              isDense: true,
            ),
          ),
        ),
        Expanded(
          child: items.isEmpty
              ? EmptyState(
                  icon: Icons.receipt_long_outlined,
                  title: controller.hasActiveFilters
                      ? 'No transactions match the filters'
                      : 'No transactions yet',
                  subtitle: controller.hasActiveFilters
                      ? 'Try clearing the filters.'
                      : 'Completed sales will show up here.',
                )
              : RefreshIndicator(
                  onRefresh: controller.refresh,
                  child: ListView.separated(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
                    itemCount: items.length + (controller.hasMore ? 1 : 0),
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      if (index >= items.length) {
                        return _LoadMoreButton(controller: controller);
                      }
                      final transaction = items[index];
                      return _TransactionCard(
                        transaction: transaction,
                        onTap: () => Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => TransactionDetailScreen(
                              transactionId: transaction.id ?? 0,
                              initial: transaction,
                            ),
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

  Future<void> _openFilters(
      BuildContext context, TransactionsController controller) async {
    final result = await showModalBottomSheet<TransactionFilters>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => _FilterSheet(current: controller.filters),
    );
    if (result != null) controller.setFilters(result);
  }
}
class _LoadMoreButton extends StatelessWidget {
  const _LoadMoreButton({required this.controller});

  final TransactionsController controller;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Center(
        child: controller.loadingMore
            ? const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(strokeWidth: 2.5),
              )
            : OutlinedButton(
                onPressed: controller.loadMore,
                child: const Text('Load more'),
              ),
      ),
    );
  }
}

class _TransactionCard extends StatelessWidget {
  const _TransactionCard({required this.transaction, required this.onTap});

  final Transaction transaction;
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
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      transaction.numberOrFallback,
                      style: const TextStyle(
                          fontWeight: FontWeight.w800, fontSize: 14.5),
                    ),
                  ),
                  StatusChip.forTransaction(transaction.status),
                ],
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  Icon(Icons.person_outline,
                      size: 15, color: scheme.outline),
                  const SizedBox(width: 6),
                  Text(
                    (transaction.cashierName ?? '').isEmpty
                        ? 'Unknown cashier'
                        : transaction.cashierName!,
                    style: TextStyle(fontSize: 13, color: scheme.outline),
                  ),
                  const SizedBox(width: 14),
                  Icon(Icons.schedule, size: 15, color: scheme.outline),
                  const SizedBox(width: 6),
                  Text(
                    AppFormatters.dateTime(transaction.createdAt),
                    style: TextStyle(fontSize: 13, color: scheme.outline),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: scheme.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      transaction.paymentMethod.displayName,
                      style: TextStyle(fontSize: 12, color: scheme.onSurface),
                    ),
                  ),
                  const Spacer(),
                  Text(
                    AppFormatters.money(transaction.total),
                    style: const TextStyle(
                        fontSize: 16, fontWeight: FontWeight.w800),
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
class _FilterSheet extends StatefulWidget {
  const _FilterSheet({required this.current});

  final TransactionFilters current;

  @override
  State<_FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends State<_FilterSheet> {
  late DateTime? _from;
  late DateTime? _to;
  late String _cashier;
  PaymentMethod? _paymentMethod;
  TransactionStatus? _status;

  @override
  void initState() {
    super.initState();
    _from = widget.current.from;
    _to = widget.current.to;
    _cashier = widget.current.cashier ?? '';
    _paymentMethod = widget.current.paymentMethod;
    _status = widget.current.status;
  }

  Future<void> _pickDate({required bool isFrom}) async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: (isFrom ? _from : _to) ?? now,
      firstDate: DateTime(now.year - 3),
      lastDate: now,
    );
    if (picked == null) return;
    setState(() {
      if (isFrom) {
        _from = picked;
      } else {
        _to = picked;
      }
    });
  }

  void _submit() {
    Navigator.of(context).pop(TransactionFilters(
      from: _from,
      to: _to,
      cashier: _cashier.trim().isEmpty ? null : _cashier.trim(),
      paymentMethod: _paymentMethod,
      status: _status,
    ));
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(
            16, 0, 16, MediaQuery.of(context).viewInsets.bottom + 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Filter transactions',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _DateField(
                    label: 'From',
                    value: _from,
                    onTap: () => _pickDate(isFrom: true),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _DateField(
                    label: 'To',
                    value: _to,
                    onTap: () => _pickDate(isFrom: false),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            DropdownButtonFormField<PaymentMethod?>(
              initialValue: _paymentMethod,
              decoration: const InputDecoration(
                labelText: 'Payment method',
                prefixIcon: Icon(Icons.payment),
              ),
              items: [
                const DropdownMenuItem<PaymentMethod?>(
                  value: null,
                  child: Text('All methods'),
                ),
                for (final method in const [
                  PaymentMethod.cash,
                  PaymentMethod.transfer,
                  PaymentMethod.qris,
                ])
                  DropdownMenuItem<PaymentMethod?>(
                    value: method,
                    child: Text(method.displayName),
                  ),
              ],
              onChanged: (value) => setState(() => _paymentMethod = value),
            ),
            DropdownButtonFormField<TransactionStatus?>(
              initialValue: _status,
              decoration: const InputDecoration(
                labelText: 'Status',
                prefixIcon: Icon(Icons.flag_outlined),
              ),
              items: [
                const DropdownMenuItem<TransactionStatus?>(
                  value: null,
                  child: Text('All statuses'),
                ),
                const DropdownMenuItem<TransactionStatus?>(
                  value: TransactionStatus.completed,
                  child: Text('Completed'),
                ),
                const DropdownMenuItem<TransactionStatus?>(
                  value: TransactionStatus.voided,
                  child: Text('Void'),
                ),
              ],
              onChanged: (value) => setState(() => _status = value),
            ),
            const SizedBox(height: 14),
            TextField(
              initialValue: _cashier,
              onChanged: (value) => _cashier = value,
              decoration: const InputDecoration(
                labelText: 'Cashier name',
                prefixIcon: Icon(Icons.person_search_outlined),
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      setState(() {
                        _from = null;
                        _to = null;
                        _cashier = '';
                        _paymentMethod = null;
                        _status = null;
                      });
                    },
                    child: const Text('Clear'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton(
                    onPressed: _submit,
                    child: const Text('Apply Filters'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
class _DateField extends StatelessWidget {
  const _DateField({
    required this.label,
    required this.value,
    required this.onTap,
  });

  final String label;
  final DateTime? value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: const Icon(Icons.calendar_today_outlined),
        ),
        child: Text(
          value == null ? 'Any date' : AppFormatters.date(value),
          style: TextStyle(
            fontSize: 14,
            color: value == null ? Colors.grey : scheme.onSurface,
          ),
        ),
      ),
    );
  }
}