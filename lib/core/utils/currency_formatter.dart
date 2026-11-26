import 'package:intl/intl.dart';
import '../constants/app_constants.dart';

/// Global Currency Formatting Utility supporting multi-currency representation.
class CurrencyFormatter {
  static final NumberFormat _formatter = NumberFormat('#,##0.00', 'en_US');
  static final NumberFormat _compactFormatter = NumberFormat('#,##0', 'en_US');

  /// Active default currency symbol (defaults to '$', configurable per country/shop)
  static String activeSymbol = AppConstants.currencySymbol;
  static String activeCode = AppConstants.currencyCode;

  /// Sets the active currency representation across the application.
  static void setCurrency({required String symbol, required String code}) {
    activeSymbol = symbol;
    activeCode = code;
  }

  /// Formats numeric amount into a global currency representation (e.g. "$12.50" or "Rs. 1,250.00").
  static String format(num? amount, {String? symbol}) {
    final sym = symbol ?? activeSymbol;
    if (amount == null) return '$sym 0.00';
    final space = sym.length > 1 ? ' ' : '';
    return '$sym$space${_formatter.format(amount)}';
  }

  /// Compact formatting without decimals (e.g. "$12" or "Rs. 1,250").
  static String formatCompact(num? amount, {String? symbol}) {
    final sym = symbol ?? activeSymbol;
    if (amount == null) return '$sym 0';
    final space = sym.length > 1 ? ' ' : '';
    return '$sym$space${_compactFormatter.format(amount)}';
  }

  /// Backward-compatible alias for formatCompact.
  static String formatLKR(num? amount) {
    return formatCompact(amount);
  }
}
