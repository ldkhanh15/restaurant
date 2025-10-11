import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../data/services/auth_app_user_service_app_user.dart';
import '../../../data/services/app_user_initializer_app_user.dart'; // Use the consolidated initializer
import '../../../application/providers.dart';
import '../../../data/datasources/api_config.dart';
import '../../../domain/models/user.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _loading = false;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);

    try {
      if (ApiConfig.baseUrl.isEmpty) {
        // Mock login: set mock user from MockData if available
        ref.read(userProvider.notifier).setUser(ref.read(userProvider)!);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Đăng nhập (mock) thành công')));
      } else {
        final service = AuthAppUserService();
        final loggedInUser = await service.login(_emailCtrl.text.trim(), _passwordCtrl.text);
        // Debug: log result and token
        // ignore: avoid_print
        print('[LoginScreen] login result: ${loggedInUser?.name}');
        if (loggedInUser != null) {
            // The service now returns a full AppUser object.
            // Token and user ID are already set in ApiConfig inside the service.
            ref.read(userProvider.notifier).setUser(loggedInUser);

            // After successful login, fetch user-specific data like reservations
            await initializeUserDependentData_app_user(ref); // This function is now in app_user_initializer_app_user.dart
            // show a dialog so the success message is always visible
            await showDialog<void>(
              context: context,
              barrierDismissible: false,
              builder: (ctx) => AlertDialog(
                title: const Text('Thành công'),
                content: const Text('Đăng nhập thành công'),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.of(ctx).pop(),
                    child: const Text('OK'),
                  ),
                ],
              ),
            );
            if (!mounted) return;
            context.go('/');

        } else {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Đăng nhập thất bại hoặc không thể kết nối')));
        }
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Lỗi: $e')));
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Đăng nhập')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              TextFormField(
                controller: _emailCtrl,
                decoration: const InputDecoration(labelText: 'Email'),
                keyboardType: TextInputType.emailAddress,
                validator: (v) => (v == null || v.isEmpty) ? 'Vui lòng nhập email' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _passwordCtrl,
                decoration: const InputDecoration(labelText: 'Mật khẩu'),
                obscureText: true,
                validator: (v) => (v == null || v.isEmpty) ? 'Vui lòng nhập mật khẩu' : null,
              ),
              const SizedBox(height: 20),
              _loading ? const CircularProgressIndicator() : SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _submit,
                  child: const Text('Đăng nhập'),
                ),
              ),
              const SizedBox(height: 8),
              TextButton(
                onPressed: () {
                  // navigate to register
                  context.go('/signup');
                },
                child: const Text('Đăng ký'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
