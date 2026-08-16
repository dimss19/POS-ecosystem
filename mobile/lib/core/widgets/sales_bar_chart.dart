import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../models/dashboard.dart';

/// Compact daily sales bar chart for the dashboard.
class SalesBarChart extends StatelessWidget {
  const SalesBarChart({super.key, required this.points});

  final List<SalesPoint> points;

  @override
  Widget build(BuildContext context) {
    if (points.isEmpty) {
      return const _ChartPlaceholder(message: 'No daily sales data');
    }

    final visible =
        points.length > 14 ? points.sublist(points.length - 14) : points;
    final maxValue = visible.map((p) => p.value).reduce((a, b) => a > b ? a : b);
    final idealMax = (maxValue * 1.2).clamp(1000, double.infinity);

    return SizedBox(
      height: 180,
      child: BarChart(
        BarChartData(
          maxY: idealMax,
          minY: 0,
          alignment: BarChartAlignment.spaceAround,
          gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            horizontalInterval: (idealMax / 4).ceilToDouble(),
            getDrawingHorizontalLine: (value) => const FlLine(
              color: Color(0xFFE8EAED),
              strokeWidth: 1,
            ),
          ),
          borderData: FlBorderData(show: false),
          titlesData: _titles(visible),
          barTouchData: BarTouchData(
            touchTooltipData: BarTouchTooltipData(
              getTooltipColor: (_) => const Color(0xFF37474F),
              getTooltipItem: (group, groupIndex, rod, rodIndex) =>
                  BarTooltipItem(
                '${visible[group.x.toInt()].label}\n'
                '${AppFormatters.money(rod.toY)}',
                const TextStyle(color: Colors.white, fontSize: 12),
              ),
            ),
          ),
          barGroups: [
            for (var i = 0; i < visible.length; i++)
              BarChartGroupData(
                x: i,
                barRods: [
                  BarChartRodData(
                    toY: visible[i].value,
                    width: 14,
                    borderRadius: BorderRadius.circular(4),
                    color: AppTheme.seedColor,
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }

  FlTitlesData _titles(List<SalesPoint> visible) {
    return FlTitlesData(
      topTitles: const AxisTitles(),
      rightTitles: const AxisTitles(),
      leftTitles: const AxisTitles(
        sideTitles: SideTitles(showTitles: true, reservedSize: 46),
      ),
      bottomTitles: AxisTitles(
        sideTitles: SideTitles(
          showTitles: true,
          reservedSize: 28,
          interval: _labelInterval(visible.length),
          getTitlesWidget: (value, meta) {
            final index = value.toInt();
            if (index < 0 || index >= visible.length) {
              return const SizedBox.shrink();
            }
            return Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text(
                visible[index].label,
                style: const TextStyle(fontSize: 10, color: Colors.grey),
              ),
            );
          },
        ),
      ),
    );
  }

  static double _labelInterval(int count) {
    if (count <= 7) return 1;
    if (count <= 14) return 2;
    return 3;
  }
}

/// Shared placeholder used by the chart widgets.
class _ChartPlaceholder extends StatelessWidget {
  const _ChartPlaceholder({this.message = 'No data'});

  final String message;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 180,
      child: Center(
        child: Text(
          message,
          style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
        ),
      ),
    );
  }
}