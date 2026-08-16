/// Global application configuration.
///
/// The API base URL can be overridden at build/run time:
/// ```bash
/// flutter run --dart-define=API_BASE_URL=http://192.168.1.8:8000/api
/// flutter build apk --dart-define=API_BASE_URL=https://pos.example.com/api
/// ```
///
/// `10.0.2.2` is the Android emulator alias for the host machine's
/// `localhost`. Physical devices must use the host LAN IP.
abstract final class AppConfig {
  AppConfig._();

  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:8000/api',
  );

  static const String appName = 'KASIR POS';

  static const String appVersion = '1.0.0';

  static const Duration httpTimeout = Duration(seconds: 20);
}