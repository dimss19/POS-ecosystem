import '../core/utils/json_utils.dart';

/// Authenticated user. Roles follow the backend contract:
/// `ADMIN`, `OWNER`, `CASHIER`.
class User {
  const User({
    this.id,
    required this.name,
    required this.email,
    this.role,
    this.createdAt,
  });

  final int? id;
  final String name;
  final String email;
  final String? role;
  final DateTime? createdAt;

  bool get isAdminOrOwner {
    final normalized = (role ?? '').toUpperCase();
    return normalized == 'ADMIN' || normalized == 'OWNER';
  }

  String get displayRole => role == null ? '-' : role!.toUpperCase();

  factory User.fromJson(Map<String, dynamic> json) {
    // Accept `{ user: {...} }` wrappers.
    final raw = JsonUtils.map(json);
    return User(
      id: JsonUtils.integerOrNull(raw['id']),
      name: JsonUtils.string(raw['name'], fallback: raw['full_name'] == null ? 'Unnamed' : '${raw['full_name']}'),
      email: JsonUtils.string(raw['email']),
      role: JsonUtils.string(raw['role'], fallback: 'CASHIER'),
      createdAt: JsonUtils.date(raw['created_at'] ?? raw['createdAt']),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'email': email,
    'role': role,
    'created_at': createdAt?.toIso8601String(),
  };
}