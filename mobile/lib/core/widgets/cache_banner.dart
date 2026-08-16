import 'package:flutter/material.dart';

/// Banner shown when the current data was served from the local cache
/// because the server was unreachable.
class CacheBanner extends StatelessWidget {
  const CacheBanner({
    super.key,
    this.visible = false,
    this.lastUpdated,
  });

  final bool visible;
  final DateTime? lastUpdated;

  @override
  Widget build(BuildContext context) {
    if (!visible) return const SizedBox.shrink();
    final scheme = Theme.of(context).colorScheme;
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.orange.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.orange.shade200),
      ),
      child: Row(
        children: [
          Icon(Icons.cloud_off, size: 18, color: scheme.error),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              lastUpdated == null
                  ? 'Offline · showing cached data'
                  : 'Offline · showing cached data · last updated '
                      '${_format(lastUpdated!)}',
              style: TextStyle(
                fontSize: 12.5,
                color: scheme.onSurface,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _format(DateTime value) {
    final now = DateTime.now();
    final sameDay = value.year == now.year &&
        value.month == now.month &&
        value.day == now.day;
    final time = '${value.hour.toString().padLeft(2, '0')}:'
        '${value.minute.toString().padLeft(2, '0')}';
    if (sameDay) return time;
    return '${value.day}/${value.month} $time';
  }
}