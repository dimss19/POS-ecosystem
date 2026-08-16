import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/config/app_config.dart';
import 'core/database/app_cache.dart';
import 'core/network/api_client.dart';
import 'core/storage/token_storage.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/auth_controller.dart';
import 'features/auth/auth_gate.dart';
import 'features/dashboard/dashboard_controller.dart';
import 'features/inventory/inventory_controller.dart';
import 'features/products/product_controller.dart';
import 'features/reports/report_controller.dart';
import 'features/transactions/transaction_controller.dart';
import 'repositories/auth_repository.dart';
import 'repositories/inventory_repository.dart';
import 'repositories/product_repository.dart';
import 'repositories/report_repository.dart';
import 'repositories/transaction_repository.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const KasirMobileApp());
}

/// Root widget: builds the dependency graph once and wires the 401 callback.
class KasirMobileApp extends StatefulWidget {
  const KasirMobileApp({super.key});

  @override
  State<KasirMobileApp> createState() => _KasirMobileAppState();
}

class _KasirMobileAppState extends State<KasirMobileApp> {
  late final ApiClient _api;
  late final AppCache _cache;
  late final TokenStorage _tokenStorage;
  late final AuthController _authController;
  late final ReportRepository _reportRepository;

  @override
  void initState() {
    super.initState();
    _api = ApiClient(baseUrl: AppConfig.apiBaseUrl);
    _cache = AppCache();
    _tokenStorage = SecureTokenStorage();
    final authRepository =
        AuthRepository(api: _api, storage: _tokenStorage);
    _authController = AuthController(repository: authRepository);
    _reportRepository = ReportRepository(api: _api, cache: _cache);

    // Token expired / revoked -> clear session and go to login.
    _api.onUnauthorized = () {
      if (mounted) {
        _authController.expireSession();
      }
    };
  }

  @override
  void dispose() {
    _authController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider.value(value: _api),
        Provider.value(value: _cache),
        Provider.value(value: _tokenStorage),
        ChangeNotifierProvider.value(value: _authController),
        ChangeNotifierProvider(
          create: (_) => DashboardController(repository: _reportRepository),
        ),
        ChangeNotifierProvider(
          create: (_) => ProductsController(
            repository: ProductRepository(api: _api, cache: _cache),
          ),
        ),
        ChangeNotifierProvider(
          create: (_) => InventoryController(
            repository: InventoryRepository(api: _api, cache: _cache),
          ),
        ),
        ChangeNotifierProvider(
          create: (_) => TransactionsController(
            repository: TransactionRepository(api: _api, cache: _cache),
          ),
        ),
        ChangeNotifierProvider(
          create: (_) => ReportsController(repository: _reportRepository),
        ),
      ],
      child: MaterialApp(
        title: AppConfig.appName,
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light(),
        home: const AuthGate(),
      ),
    );
  }
}