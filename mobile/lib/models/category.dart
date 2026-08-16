import '../core/utils/json_utils.dart';

/// Product category.
class Category {
  const Category({
    this.id,
    required this.name,
    this.createdAt,
    this.updatedAt,
  });

  final int? id;
  final String name;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  factory Category.fromJson(Map<String, dynamic> json) {
    final raw = JsonUtils.map(json);
    return Category(
      id: JsonUtils.integerOrNull(raw['id']),
      name: JsonUtils.string(raw['name']),
      createdAt: JsonUtils.date(raw['created_at'] ?? raw['createdAt']),
      updatedAt: JsonUtils.date(raw['updated_at'] ?? raw['updatedAt']),
    );
  }
}