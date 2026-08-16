import '../core/network/api_client.dart';
import '../core/network/api_exception.dart';
import '../core/storage/token_storage.dart';
import '../models/auth_session.dart';
import '../models/user.dart';

enum RestoreStatus { authenticated, offline, none }

class RestoreResult {
  const RestoreResult._(this.status, this.session);

  const RestoreResult.authenticated(AuthSession session)
      : this._(RestoreStatus.authenticated, session);

  const RestoreResult.offline(AuthSession session)
      : this._(RestoreStatus.offline, session);

  const RestoreResult.none() : this._(RestoreStatus.none, null);

  final RestoreStatus status;
  final AuthSession? session;
}

/// Talks to `/api/auth/*` and owns session persistence.
class AuthRepository {
  AuthRepository({required ApiClient api, required TokenStorage storage})
      : _api = api,
        _storage = storage;

  final ApiClient _api;
  final TokenStorage _storage;

  /// Some environments return `{ token: "..." }` at the top of `data`,
  /// others nest under `user`. This normalizes them.
  Future<AuthSession> login(String email, String password) async {
    final data = await _api.post('/auth/login', body: {
      'email': email.trim(),
      'password': password,
    });

    final session = AuthSession.fromJson(
      data is Map<String, dynamic> ? data : <String, dynamic>{},
    );

    if (session.token.isEmpty) {
      throw const ApiException(
        statusCode: 500,
        message: 'Login response did not contain a token.',
      );
    }

    _ensureAllowedRole(session.user);

    _api.token = session.token;
    await _storage.writeSession(session);
    return session;
  }

  Future<void> logout() async {
    // Best effort — always clear local credentials even if the server
    // is unreachable.
    try {
      await _api.post('/auth/logout');
    } on ApiException {
      // Ignore server side failures during logout.
    }
    _api.token = null;
    await _storage.clear();
  }

  /// Restores a previously stored session, validating it with the server
  /// when possible. Falls back to the cached session when offline.
  Future<RestoreResult> restore() async {
    final cached = await _storage.readSession();
    if (cached == null) return const RestoreResult.none();

    try {
      _ensureAllowedRole(cached.user);
    } on ApiException {
      await _storage.clear();
      return const RestoreResult.none();
    }

    _api.token = cached.token;
    try {
      final data = await _api.get('/auth/me');
      final user = User.fromJson(
        data is Map<String, dynamic> ? data : <String, dynamic>{},
      );
      _ensureAllowedRole(user);
      final session = AuthSession(token: cached.token, user: user);
      await _storage.writeSession(session);
      return RestoreResult.authenticated(session);
    } on ApiException catch (e) {
      if (e.isUnauthorized) {
        _api.token = null;
        await _storage.clear();
        return const RestoreResult.none();
      }
      if (e.isNetwork) {
        return RestoreResult.offline(cached);
      }
      rethrow;
    }
  }

  /// Mobile MVP only allows ADMIN / OWNER (see PRD §7).
  void _ensureAllowedRole(User user) {
    if (!user.isAdminOrOwner) {
      throw const ApiException(
        statusCode: 403,
        message: 'Access denied. This app is for ADMIN / OWNER accounts only.',
      );
    }
  }
}