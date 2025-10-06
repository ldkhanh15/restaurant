import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../data/services/auth_app_user_service_app_user.dart';
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
        final result = await service.login(_emailCtrl.text.trim(), _passwordCtrl.text);
        // Debug: log result and token
        // ignore: avoid_print
        print('[LoginScreen] login result: $result');
        if (result != null) {
          // service tries to save token to ApiConfig.authToken; if token is present here, ensure it's saved
          if (result['token'] != null) {
            ApiConfig.authToken = result['token'];
            // ignore: avoid_print
            print('[LoginScreen] token set, length=${ApiConfig.authToken.length}');
          }

          // If backend returns a server-side user id (uuid), store it for later reservation linking
          try {
            final serverUserId = (result['user'] != null ? result['user']['id'] : result['id'])?.toString();
            if (serverUserId != null) ApiConfig.currentUserId = serverUserId;
          } catch (_) {}

          final userJson = result['user'] ?? result['data'] ?? result;
          if (userJson != null) {
            var parsed = false;
            try {
              // Try canonical parsing first
              final appUser = AppUser.fromJson(Map<String, dynamic>.from(userJson));
              ref.read(userProvider.notifier).setUser(appUser);
              parsed = true;
            } catch (_) {}

            if (!parsed) {
              // Fallback: backend may return UUID id and 'username' instead of numeric id and 'name'
              try {
                final dynamic idRaw = userJson['id'];
                final int id = idRaw is int ? idRaw : idRaw?.toString().hashCode ?? DateTime.now().millisecondsSinceEpoch;
                final name = (userJson['name'] ?? userJson['username'] ?? 'User').toString();
                final email = (userJson['email'] ?? '').toString();
                final appUser = AppUser(
                  id: id,
                  name: name,
                  email: email,
                  loyaltyPoints: 0,
                  totalOrders: 0,
                  membershipTier: (userJson['membershipTier'] ?? userJson['role'] ?? 'Regular').toString(),
                );
                ref.read(userProvider.notifier).setUser(appUser);
                parsed = true;
              } catch (e) {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Không thể phân tích dữ liệu user')));
                return;
              }
            }

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
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Đăng nhập thất bại')));
          }
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
