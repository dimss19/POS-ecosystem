import '../core/utils/json_utils.dart';
import '../models/paginated.dart';

/// Payment methods defined by the API contract.
enum PaymentMethod {
  cash('CASH'),
  transfer('TRANSFER'),
  qris('QRIS'),
  unknown('');

  const PaymentMethod(this.apiValue);
  final String apiValue;

  static PaymentMethod fromApi(String? value) {
    final normalized = (value ?? '').toUpperCase();
    for (final method in PaymentMethod.values) {
      if (method.apiValue == normalized) return method;
    }
    return PaymentMethod.unknown;
  }

  String get displayName {
    switch (this) {
      case PaymentMethod.cash:
        return 'Cash';
      case PaymentMethod.transfer:
        return 'Transfer';
      case PaymentMethod.qris:
        return 'QRIS';
      case PaymentMethod.unknown:
        return 'Other';
    }
  }
}

/// Transaction statuses from the API contract.
enum TransactionStatus {
  completed('COMPLETED'),
  voided('VOID');

  const TransactionStatus(this.apiValue);
  final String apiValue;

  static TransactionStatus fromApi(String? value) {
    final normalized = (value ?? '').toUpperCase();
    for (final status in TransactionStatus.values) {
      if (status.apiValue == normalized) return status;
    }
    return TransactionStatus.completed;
  }

  String get displayName {
    switch (this) {
      case TransactionStatus.completed:
        return 'Completed';
      case TransactionStatus.voided:
        return 'Void';
    }
  }
}

/// Single product line inside a transaction.
class TransactionItem {
  const TransactionItem({
    this.productId,
    this.name = '',
    this.quantity = 0,
    this.unitPrice = 0,
    this.discount = 0,
    this.subtotal = 0,
  });

  final int? productId;
  final String name;
  final double quantity;
  final double unitPrice;
  final double discount;
  final double subtotal;

  factory TransactionItem.fromJson(dynamic json) {
    if (json is! Map<String, dynamic>) {
      return const TransactionItem();
    }
    final raw = JsonUtils.map(json);
    return TransactionItem(
      productId: JsonUtils.integerOrNull(
          raw['product_id'] ?? raw['productId']),
      name: JsonUtils.string(raw['name'] ?? raw['product_name'] ?? raw['product']),
      quantity: JsonUtils.number(raw['quantity'] ?? raw['qty']),
      unitPrice: JsonUtils.money(raw['unit_price'] ?? raw['price']),
      discount: JsonUtils.money(raw['discount']),
      subtotal: JsonUtils.money(raw['subtotal'] ?? raw['total']),
    );
  }
}

/// A completed sale read from `GET /api/transactions`.
class Transaction {
  const Transaction({
    this.id,
    this.uuid,
    this.transactionNumber,
    this.deviceId,
    this.cashierId,
    this.cashierName,
    this.shiftId,
    this.subtotal = 0,
    this.discount = 0,
    this.total = 0,
    this.paymentMethod = PaymentMethod.unknown,
    this.amountPaid = 0,
    this.changeAmount = 0,
    this.status = TransactionStatus.completed,
    this.items = const [],
    this.clientCreatedAt,
    this.createdAt,
  });

  final int? id;
  final String? uuid;
  final String? transactionNumber;
  final int? deviceId;
  final int? cashierId;
  final String? cashierName;
  final int? shiftId;
  final double subtotal;
  final double discount;
  final double total;
  final PaymentMethod paymentMethod;
  final double amountPaid;
  final double changeAmount;
  final TransactionStatus status;
  final List<TransactionItem> items;
  final DateTime? clientCreatedAt;
  final DateTime? createdAt;

  String get numberOrFallback {
    if (transactionNumber != null && transactionNumber!.isNotEmpty) {
      return transactionNumber!;
    }
    if (uuid != null && uuid!.isNotEmpty) {
      return uuid!.toUpperCase().substring(0, uuid!.length > 8 ? 8 : uuid!.length);
    }
    return 'TRX-${id ?? '-'}';
  }

  factory Transaction.fromJson(Map<String, dynamic> json) {
    final raw = JsonUtils.map(json);
    final nestedItems = raw['items'];
    return Transaction(
      id: JsonUtils.integerOrNull(raw['id']),
      uuid: JsonUtils.string(raw['uuid'], fallback: '').isEmpty
          ? null
          : '${raw['uuid']}',
      transactionNumber: JsonUtils.string(
          raw['transaction_number'] ?? raw['number'] ?? raw['code'],
          fallback: ''),
      deviceId: JsonUtils.integerOrNull(raw['device_id'] ?? raw['deviceId']),
      cashierId: JsonUtils.integerOrNull(raw['cashier_id'] ?? raw['cashierId']),
      cashierName: JsonUtils.string(
          raw['cashier_name'] ?? raw['cashier_name'] ?? raw['cashier'],
          fallback: ''),
      shiftId: JsonUtils.integerOrNull(raw['shift_id'] ?? raw['shiftId']),
      subtotal: JsonUtils.money(raw['subtotal']),
      discount: JsonUtils.money(raw['discount']),
      total: JsonUtils.money(raw['total'] ?? raw['grand_total']),
      paymentMethod: PaymentMethod.fromApi(
          raw['payment_method'] ?? raw['paymentMethod']),
      amountPaid: JsonUtils.money(raw['amount_paid'] ?? raw['paid']),
      changeAmount: JsonUtils.money(raw['change_amount'] ?? raw['change']),
      status: TransactionStatus.fromApi(raw['status']),
      items: ApiPaging.asList(nestedItems(raw), TransactionItem.fromJson),
      clientCreatedAt:
          JsonUtils.date(raw['client_created_at'] ?? raw['clientCreatedAt']),
      createdAt: JsonUtils.date(raw['created_at'] ?? raw['createdAt']),
    );
  }
}

dynamic nestedItems(Map<String, dynamic> raw) {
  final items = raw['items'] ?? raw['transaction_items'] ?? raw['lines'];
  if (items != null) return items;
  final nested = raw['transaction'];
  if (nested is Map<String, dynamic>) {
    return nested['items'] ?? nested['transaction_items'];
  }
  return <dynamic>[];
}