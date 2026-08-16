import 'package:flutter/foundation.dart' show kIsWeb;

/// Global application configuration.
///
/// The API base URL can be overridden at build/run time:
/// ```bash
/// flutter run --dart-define=API_BASE_URL=http://192.168.1.8:8000/api
/// flutter build apk --dart-define=API_BASE_URL=https://pos.example.com/api
/// ```
abstract final class AppConfig {
  AppConfig._();

  static String get apiBaseUrl {
    const fromEnv = String.fromEnvironment('API_BASE_URL');
    if (fromEnv.isNotEmpty) return fromEnv;
    if (kIsWeb) return 'http://localhost:8000/api';
    return 'http://10.0.2.2:8000/api';
  }

  static const String appName = 'KASIR POS';

  static const String appVersion = '1.0.0';

  static const Duration httpTimeout = Duration(seconds: 20);
}