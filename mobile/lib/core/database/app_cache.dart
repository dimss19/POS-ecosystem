import 'dart:convert';
import 'dart:io';

import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:sqflite/sqflite.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';

/// Simple key/value JSON cache persisted in SQLite.
///
/// The backend remains authoritative; this cache only stores the last known
/// good payload per view so that read operations keep working offline.
class AppCache {
  AppCache({DatabaseFactory? factoryOverride, this.useInMemory = false})
      : _factoryOverride = factoryOverride;

  static const String _dbName = 'kasir_mobile_cache.db';
  static const int _dbVersion = 1;

  final DatabaseFactory? _factoryOverride;

  /// When true, uses an in-memory database (tests / transient sessions).
  final bool useInMemory;

  Database? _db;

  Future<Database> get database async {
    if (_db != null && _db!.isOpen) return _db!;

    var factory = _factoryOverride ?? databaseFactory;
    final options = OpenDatabaseOptions(
      version: _dbVersion,
      onCreate: (db, version) => _onCreate(db, version),
    );

    if (useInMemory) {
      _db = await factory.openDatabase(inMemoryDatabasePath, options: options);
      return _db!;
    }

    // Provide an FFI SQLite for desktop so the cache also works during local
    // development and tests on Windows/Linux/macOS.
    if (!Platform.isAndroid && !Platform.isIOS) {
      sqfliteFfiInit();
      if (_factoryOverride == null) {
        factory = databaseFactoryFfi;
      }
    }

    final documents = await getApplicationDocumentsDirectory();
    final path = p.join(documents.path, _dbName);
    _db = await factory.openDatabase(path, options: options);
    return _db!;
  }

  Future<void> _onCreate(Database db, int version) async {
    await db.execute('''
      CREATE TABLE cache (
        key TEXT PRIMARY KEY,
        payload TEXT NOT NULL,
        last_updated TEXT NOT NULL
      )
    ''');
  }

  Future<void> put(String key, dynamic payload) async {
    final db = await database;
    await db.insert('cache', {
      'key': key,
      'payload': jsonEncode(payload),
      'last_updated': DateTime.now().toIso8601String(),
    }, conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<CachedEntry?> get(String key) async {
    final db = await database;
    final rows = await db.query('cache',
        where: 'key = ?', whereArgs: [key], limit: 1);
    if (rows.isEmpty) return null;
    final row = rows.first;
    return CachedEntry(
      payload: jsonDecode(row['payload'] as String),
      lastUpdated: DateTime.tryParse(row['last_updated'] as String),
    );
  }

  Future<void> remove(String key) async {
    final db = await database;
    await db.delete('cache', where: 'key = ?', whereArgs: [key]);
  }

  Future<void> clearAll() async {
    final db = await database;
    await db.delete('cache');
  }
}

/// [AppCache] entry: decoded payload plus the time it was written.
class CachedEntry {
  const CachedEntry({required this.payload, required this.lastUpdated});

  final dynamic payload;
  final DateTime? lastUpdated;
}

/// Well-known cache keys.
abstract final class CacheKeys {
  CacheKeys._();

  static const products = 'products';
  static const categories = 'categories';
  static const stockOverview = 'stock_overview';
  static const stockMovements = 'stock_movements';
  static const recentTransactions = 'recent_transactions';
  static const transactionDetail = 'transaction_detail';
  static const dashboard = 'dashboard';
  static const salesReport = 'report_sales';
  static const productReport = 'report_products';
  static const cashierReport = 'report_cashiers';
}