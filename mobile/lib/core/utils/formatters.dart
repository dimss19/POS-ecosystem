import 'package:intl/intl.dart';

/// Presentation helpers for money, dates and times.
class AppFormatters {
  AppFormatters._();

  static final NumberFormat _money =
      NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);

  static final NumberFormat _moneyDecimal =
      NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 2);

  static final NumberFormat _number = NumberFormat.decimalPattern('id_ID');

  static final DateFormat _date = DateFormat('dd MMM yyyy');
  static final DateFormat _time = DateFormat('HH:mm');
  static final DateFormat _dateTime = DateFormat('dd MMM yyyy, HH:mm');
  static final DateFormat _shortDate = DateFormat('dd/MM');

  static String money(num value) {
    return value == value.roundToDouble()
        ? _money.format(value)
        : _moneyDecimal.format(value);
  }

  static String number(num value) => _number.format(value);

  static String date(DateTime? value) =>
      value == null ? '-' : _date.format(value);

  static String time(DateTime? value) =>
      value == null ? '-' : _time.format(value);

  static String dateTime(DateTime? value) =>
      value == null ? '-' : _dateTime.format(value);

  static String shortDate(DateTime? value) =>
      value == null ? '-' : _shortDate.format(value);

  static String quantity(num value) =>
      value == value.roundToDouble() ? '${value.round()}' : '$value';
}