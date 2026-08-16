import 'package:flutter/material.dart';

import '../../models/transaction.dart';

/// Small colored chip for transaction status / payment method.
class StatusChip extends StatelessWidget {
  const StatusChip({
    super.key,
    required this.label,
    this.color = Colors.blueGrey,
    this.icon,
  });

  final String label;
  final MaterialColor color;
  final IconData? icon;

  factory StatusChip.forTransaction(TransactionStatus status,
      [VoidCallback? onTap]) {
    final (label, color) = switch (status) {
      TransactionStatus.completed => ('Completed', Colors.green),
      TransactionStatus.voided => ('Void', Colors.red),
    };
    return StatusChip(
      label: label,
      color: color,
      icon: status == TransactionStatus.voided ? Icons.block : Icons.check_circle,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.shade50,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.shade200),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 13, color: color.shade700),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: color.shade700,
            ),
          ),
        ],
      ),
    );
  }
}