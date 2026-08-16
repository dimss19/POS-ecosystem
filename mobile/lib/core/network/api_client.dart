import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/app_config.dart';
import 'api_exception.dart';

/// Thin REST client that only talks to the KASIR backend.
///
/// - Follows the shared envelope from `../API_CONTRACT.md`:
///   success `{"data": ..., "message": ...}`, failure `{"message": ...}`.
/// - Attaches `Authorization: Bearer <token>` when a token is set.
/// - Converts network/timeout failures to [ApiException.isNetwork].
/// - Fires [onUnauthorized] exactly once per 401 so the app can clear the
///   session and return to the login screen.
class ApiClient {
  ApiClient({required this.baseUrl, http.Client? httpClient})
      : _http = httpClient ?? http.Client();

  final String baseUrl;
  final http.Client _http;

  /// Stored token, attached as a bearer token to every request.
  String? token;

  /// Called once when the backend rejects the current token.
  void Function()? onUnauthorized;

  /// Envelope helpers (see `API_CONTRACT.md`).
  static Object? unwrapData(dynamic response) {
    if (response is Map<String, dynamic>) {
      if (response.containsKey('data')) return response['data'];
      if (response.containsKey('token')) return response;
    }
    return response;
  }

  Map<String, String> get _headers => {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    if (token != null && token!.isNotEmpty) 'Authorization': 'Bearer $token',
  };

  Future<dynamic> get(String path, {Map<String, dynamic>? query}) =>
      _send('GET', path, query: query);

  Future<dynamic> post(String path,
      {Object? body, Map<String, dynamic>? query}) =>
      _send('POST', path, body: body, query: query);

  Future<dynamic> put(String path,
      {Object? body, Map<String, dynamic>? query}) =>
      _send('PUT', path, body: body, query: query);

  Future<dynamic> delete(String path, {Map<String, dynamic>? query}) =>
      _send('DELETE', path, query: query);

  Future<dynamic> _send(String method, String path,
      {Object? body, Map<String, dynamic>? query}) async {
    var uri = Uri.parse('$baseUrl$path');
    if (query != null && query.isNotEmpty) {
      uri = uri.replace(queryParameters: query.map((k, v) => MapEntry(k, '$v')));
    }

    final request = http.Request(method, uri);
    request.headers.addAll(_headers);
    if (body != null) {
      request.body = jsonEncode(body);
    }

    http.Response response;
    try {
      final streamed =
          await _http.send(request).timeout(AppConfig.httpTimeout);
      response = await http.Response.fromStream(streamed);
    } on TimeoutException {
      throw const ApiException.network(
          message: 'The server took too long to respond.');
    } on http.ClientException {
      throw const ApiException.network();
    }

    final decoded = _decode(response);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return unwrapData(decoded);
    }

    final error = _toApiException(response.statusCode, decoded);

    if (error.isUnauthorized) {
      onUnauthorized?.call();
    }

    throw error;
  }

  dynamic _decode(http.Response response) {
    if (response.body.isEmpty) return null;
    try {
      return jsonDecode(response.body);
    } catch (_) {
      return null;
    }
  }

  ApiException _toApiException(int status, dynamic decoded) {
    var message = 'Request failed (HTTP $status).';
    Map<String, dynamic>? errors;

    if (decoded is Map<String, dynamic>) {
      final rawMessage = decoded['message'];
      if (rawMessage is String && rawMessage.isNotEmpty) message = rawMessage;
      final rawErrors = decoded['errors'];
      if (rawErrors is Map) {
        errors = rawErrors.map((k, v) => MapEntry('$k', v));
      }
    }

    return ApiException(statusCode: status, message: message, errors: errors);
  }
}