import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/config/app_config.dart';
import '../../models/user.dart';
import 'splash_screen.dart';
import '../shell/main_shell.dart';
import 'login_screen.dart';
import 'auth_controller.dart';

/// Root-level switch: Splash → Login ↔ MainShell, driven by [AuthController].
class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<AuthController>();

    if (controller.isChecking) return const SplashScreen();
    if (controller.isAuthenticated) return const MainShell();
    return const LoginScreen();
  }
}

/// Short display helper for session information.
String sessionGreeting(User? user) =>
    user == null ? 'Welcome' : 'Hi, ${user.name.split(' ').first}';