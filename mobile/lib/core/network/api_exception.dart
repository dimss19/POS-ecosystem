/// A structured API error carrying the HTTP status and a human friendly
/// message. Network failures are flagged with [isNetwork] so callers can
/// decide to fall back to the local cache.
class ApiException implements Exception {
  const ApiException({
    this.statusCode,
    required this.message,
    this.errors,
    this.isNetwork = false,
  });

  const ApiException.network({String message = 'No internet connection.'})
      : this(statusCode: null, message: message, isNetwork: true);

  final int? statusCode;

  /// Human readable error message (from the backend or a local default).
  final String message;

  /// Backend validation errors: `{ field: [...] }`.
  final Map<String, dynamic>? errors;

  final bool isNetwork;

  bool get isUnauthorized => statusCode == 401;

  bool get isValidation => statusCode == 422;

  /// First field error as a friendly string, if any.
  String? get firstFieldError {
    if (errors == null) return null;
    for (final entry in errors!.entries) {
      final value = entry.value;
      if (value is List && value.isNotEmpty) return '${value.first}';
      if (value is String && value.isNotEmpty) return value;
    }
    return null;
  }

  @override
  String toString() => message;
}