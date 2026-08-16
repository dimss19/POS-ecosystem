/// Lenient JSON value readers tolerant of the shapes emitted by the backend
/// (whole numbers, strings, nulls, snake_case, ...).
class JsonUtils {
  JsonUtils._();

  static String string(dynamic value, {String fallback = ''}) {
    if (value == null) return fallback;
    if (value is String) return value;
    return '$value';
  }

  static bool boolValue(dynamic value) {
    if (value == null) return false;
    if (value is bool) return value;
    final s = '$value'.toLowerCase();
    return s == 'true' || s == '1' || s == 'yes' || s == 'active';
  }

  static int integer(dynamic value, {int fallback = 0}) {
    if (value == null) return fallback;
    if (value is int) return value;
    if (value is num) return value.round();
    return int.tryParse('$value') ?? fallback;
  }

  static int? integerOrNull(dynamic value) {
    if (value == null) return null;
    if (value is int) return value;
    if (value is num) return value.round();
    return int.tryParse('$value');
  }

  static double number(dynamic value, {double fallback = 0}) {
    if (value == null) return fallback;
    if (value is num) return value.toDouble();
    return double.tryParse('$value') ?? fallback;
  }

  static double money(dynamic value) => number(value);

  static DateTime? date(dynamic value) {
    if (value == null) return null;
    if (value is DateTime) return value;
    return DateTime.tryParse('$value');
  }

  /// Some backends return a nested single object under `entity` e.g.
  /// `{ "product": {...} }`. This flattens the first nested key.
  static Map<String, dynamic> map(Map<String, dynamic> raw) {
    if (raw.length == 1) {
      for (final value in raw.values) {
        if (value is Map<String, dynamic>) return value;
      }
    }
    return raw;
  }
}