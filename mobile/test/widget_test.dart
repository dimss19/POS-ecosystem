import 'package:flutter_test/flutter_test.dart';
import 'package:kasir_mobile/main.dart';

void main() {
  testWidgets('App boots into Login/AuthGate smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const KasirMobileApp());
    await tester.pump();
    expect(find.byType(KasirMobileApp), findsOneWidget);
  });
}
