import 'user.dart';

/// Result of `POST /api/auth/login` — the bearer token and its owner.
class AuthSession {
  const AuthSession({required this.token, required this.user});

  final String token;
  final User user;

  factory AuthSession.fromJson(Map<String, dynamic> json) {
    final token = json['token'] ??
        json['access_token'] ??
        json['bearer_token'] ??
        json['auth_token'];
    final rawUser = json['user'] ?? json['data'];
    return AuthSession(
      token: '$token',
      user: User.fromJson(
        rawUser is Map<String, dynamic> ? rawUser : <String, dynamic>{},
      ),
    );
  }
}