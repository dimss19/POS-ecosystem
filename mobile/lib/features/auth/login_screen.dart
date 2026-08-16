import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/config/app_config.dart';
import 'auth_controller.dart';

/// Login screen (`POST /api/auth/login`).
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit(AuthController controller) async {
    if (!_formKey.currentState!.validate()) return;
    FocusScope.of(context).unfocus();
    await controller.login(_emailController.text, _passwordController.text);
  }

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<AuthController>();
    final scheme = Theme.of(context).colorScheme;
    final progress = controller.loginInProgress;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Form(
                key: _formKey,
                child: _buildForm(scheme, controller, progress),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildForm(
      ColorScheme scheme, AuthController controller, bool progress) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          width: 72,
          height: 72,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: scheme.primary,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Icon(Icons.storefront, size: 38, color: scheme.onPrimary),
        ),
        const SizedBox(height: 20),
        Text(
          AppConfig.appName,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w800,
            color: scheme.onSurface,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Sign in to monitor sales, inventory & reports',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 13.5, color: scheme.outline),
        ),
        const SizedBox(height: 32),
        if (controller.loginError.isNotEmpty)
          _buildErrorBanner(scheme, controller.loginError),
        const SizedBox(height: 16),
        TextFormField(
          controller: _emailController,
          enabled: !progress,
          keyboardType: TextInputType.emailAddress,
          autofillHints: const [AutofillHints.email],
          textInputAction: TextInputAction.next,
          decoration: const InputDecoration(
            labelText: 'Email',
            prefixIcon: Icon(Icons.mail_outline),
          ),
          validator: (value) {
            final email = value?.trim() ?? '';
            if (email.isEmpty) return 'Email is required';
            if (!email.contains('@') || !email.contains('.')) {
              return 'Enter a valid email address';
            }
            return null;
          },
        ),
        const SizedBox(height: 14),
        TextFormField(
          controller: _passwordController,
          enabled: !progress,
          obscureText: _obscurePassword,
          textInputAction: TextInputAction.done,
          onFieldSubmitted: (_) => _submit(controller),
          decoration: InputDecoration(
            labelText: 'Password',
            prefixIcon: const Icon(Icons.lock_outline),
            suffixIcon: IconButton(
              icon: Icon(_obscurePassword ? Icons.visibility_off : Icons.visibility),
              onPressed: () {
                setState(() => _obscurePassword = !_obscurePassword);
              },
            ),
          ),
          validator: (value) =>
              (value ?? '').isEmpty ? 'Password is required' : null,
        ),
        const SizedBox(height: 24),
        FilledButton(
          onPressed: progress ? null : () => _submit(controller),
          child: progress
              ? const SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(strokeWidth: 2.5),
                )
              : const Text('Sign In'),
        ),
        const SizedBox(height: 16),
        Text(
          'Available for ADMIN / OWNER accounts only',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 12, color: scheme.outline),
        ),
      ],
    );
  }

  Widget _buildErrorBanner(ColorScheme scheme, String message) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: scheme.errorContainer.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(Icons.error_outline, size: 20, color: scheme.error),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: TextStyle(
                fontSize: 13,
                color: scheme.onErrorContainer,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}