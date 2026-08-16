import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/widgets/loading_view.dart';
import '../shell/shell_app_bar_actions.dart';
import 'dashboard_content.dart';
import 'dashboard_controller.dart';

/// Dashboard with today's metrics, charts and low-stock warnings.
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final controller = context.read<DashboardController>();
      if (!controller.hasLoaded) controller.load();
    });
  }

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<DashboardController>();
    final state = controller.state;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
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
              : DashboardContent(
                  dashboard: state.data!,
                  fromCache: state.fromCache,
                  lastUpdated: state.lastUpdated,
                  onRefresh: controller.refresh,
                ),
    );
  }
}