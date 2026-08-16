import 'package:flutter/foundation.dart';

import '../../core/network/api_exception.dart';
import '../../core/state/ui_state.dart';
import '../../models/auth_session.dart';
import '../../repositories/auth_repository.dart';

enum AuthStatus { checking, authenticated, unauthenticated }

/// Global authentication state: login/logout/restore + 401 handling.
class AuthController extends ChangeNotifier {
  AuthController({required AuthRepository repository}) : _repository = repository;

  final AuthRepository _repository;

  AuthStatus _status = AuthStatus.checking;
  AuthSession? _session;

  /// True while the restore-from-storage check is running.
  bool get isChecking => _status == AuthStatus.checking;

  /// True when a session is usable (server-verified or cached-offline).
  bool get isAuthenticated => _status == AuthStatus.authenticated;

  AuthSession? get session => _session;

  String _loginError = '';
  bool _loginInProgress = false;

  String get loginError => _loginError;
  bool get loginInProgress => _loginInProgress;

  Future<void> bootstrap() async {
    _status = AuthStatus.checking;
    notifyListeners();

    final result = await _repository.restore();
    switch (result.status) {
      case RestoreStatus.authenticated:
      case RestoreStatus.offline:
        _session = result.session;
        _status = AuthStatus.authenticated;
        break;
      case RestoreStatus.none:
        _session = null;
        _status = AuthStatus.unauthenticated;
        break;
    }
    notifyListeners();
  }

  Future<void> login(String email, String password) async {
    _loginInProgress = true;
    _loginError = '';
    notifyListeners();

    try {
      final session = await _repository.login(email, password);
      _session = session;
      _status = AuthStatus.authenticated;
    } on ApiException catch (e) {
      _loginError = e.firstFieldError ?? e.message;
    } finally {
      _loginInProgress = false;
      notifyListeners();
    }
  }

  /// Called from [ApiClient.onUnauthorized] when the token is rejected.
  Future<void> expireSession() async {
    _session = null;
    _status = AuthStatus.unauthenticated;
    _loginError = '';
    notifyListeners();
  }

  Future<void> logout() async {
    await _repository.logout();
    _session = null;
    _status = AuthStatus.unauthenticated;
    _loginError = '';
    notifyListeners();
  }
}

/// Helper deferred view state builder used by screens.
extension UiStateX<T> on UiState<T> {
  bool get isReady => hasData && !isLoading;
}