import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../models/dashboard.dart';

/// Weekly sales line chart for the dashboard.
class SalesLineChart extends StatelessWidget {
  const SalesLineChart({super.key, required this.points});

  final List<SalesPoint> points;

  @override
  Widget build(BuildContext context) {
    if (points.isEmpty) {
      return const _LinePlaceholder(message: 'No weekly sales data');
    }

    final maxValue =
        points.map((p) => p.value.toDouble()).reduce((a, b) => a > b ? a : b);
    final idealMax = (maxValue * 1.2).clamp(1000, double.infinity).toDouble();

    return SizedBox(
      height: 180,
      child: LineChart(
        LineChartData(
          minY: 0,
          maxY: idealMax,
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
          titlesData: _titles(points),
          lineBarsData: [
            LineChartBarData(
              spots: [
                for (var i = 0; i < points.length; i++)
                  FlSpot(i.toDouble(), points[i].value),
              ],
              isCurved: true,
              curveSmoothness: 0.3,
              color: AppTheme.accentColor,
              barWidth: 3,
              dotData: const FlDotData(show: false),
              belowBarData: BarAreaData(
                show: true,
                color: AppTheme.accentColor.withValues(alpha: 0.12),
              ),
            ),
          ],
          lineTouchData: LineTouchData(
            touchTooltipData: LineTouchTooltipData(
              getTooltipItems: (spots) => [
                for (final spot in spots)
                  LineTooltipItem(
                    '${points[spot.x.toInt()].label}\n'
                    '${AppFormatters.money(spot.y)}',
                    const TextStyle(color: Colors.white, fontSize: 12),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  FlTitlesData _titles(List<SalesPoint> data) {
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
          interval: _labelInterval(data.length),
          getTitlesWidget: (value, meta) {
            final index = value.toInt();
            if (index < 0 || index >= data.length) {
              return const SizedBox.shrink();
            }
            return Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text(
                data[index].label,
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

class _LinePlaceholder extends StatelessWidget {
  const _LinePlaceholder({this.message = 'No data'});

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