import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../models/auth_session.dart';
import '../../models/user.dart';

/// Abstraction over where session credentials are stored.
///
/// The real implementation is [SecureTokenStorage] (platform keystore /
/// Keychain). Tests use an in-memory fake.
abstract class TokenStorage {
  Future<String?> readToken();

  Future<AuthSession?> readSession();

  Future<void> writeSession(AuthSession session);

  Future<void> clear();
}

/// Production storage backed by `flutter_secure_storage`.
class SecureTokenStorage implements TokenStorage {
  SecureTokenStorage([FlutterSecureStorage? storage])
      : _storage = storage ?? const FlutterSecureStorage(
          aOptions: AndroidOptions(encryptedSharedPreferences: true),
        );

  static const String _tokenKey = 'kasir_auth_token';
  static const String _userKey = 'kasir_auth_user';

  final FlutterSecureStorage _storage;

  @override
  Future<String?> readToken() => _storage.read(key: _tokenKey);

  @override
  Future<AuthSession?> readSession() async {
    final token = await _storage.read(key: _tokenKey);
    if (token == null || token.isEmpty) return null;
    final userEncoded = await _storage.read(key: _userKey);
    if (userEncoded == null || userEncoded.isEmpty) return null;
    try {
      final user = User.fromJson(jsonDecode(userEncoded) as Map<String, dynamic>);
      return AuthSession(token: token, user: user);
    } catch (_) {
      return null;
    }
  }

  @override
  Future<void> writeSession(AuthSession session) async {
    await _storage.write(key: _tokenKey, value: session.token);
    await _storage.write(
      key: _userKey,
      value: jsonEncode(session.user.toJson()),
    );
  }

  @override
  Future<void> clear() async {
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _userKey);
  }
}

/// In-memory implementation for widget/unit tests.
class InMemoryTokenStorage implements TokenStorage {
  String? token;
  AuthSession? session;

  @override
  Future<String?> readToken() async => token;

  @override
  Future<AuthSession?> readSession() async => session;

  @override
  Future<void> writeSession(AuthSession value) async {
    token = value.token;
    session = value;
  }

  @override
  Future<void> clear() async {
    token = null;
    session = null;
  }
}