import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/services/auth_app_user_service_app_user.dart';
import '../../../application/providers.dart';
import '../../../domain/models/user.dart';
import '../../../data/datasources/api_config.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _username = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _passwordConfirm = TextEditingController();
  final _fullName = TextEditingController();
  bool _loading = false;
  Map<String, String?> _fieldErrors = {};

  @override
  void dispose() {
    _username.dispose();
    _email.dispose();
    _password.dispose();
    _passwordConfirm.dispose();
    _fullName.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    _fieldErrors = {};

    try {
      if (ApiConfig.baseUrl.isEmpty) {
        // Mock: create a local AppUser from inputs (id mocked)
        final mockUser = AppUser(
          id: DateTime.now().millisecondsSinceEpoch,
          name: _fullName.text.isEmpty ? _username.text : _fullName.text,
          email: _email.text.trim(),
          loyaltyPoints: 0,
          totalOrders: 0,
          membershipTier: 'Regular',
        );
        ref.read(userProvider.notifier).setUser(mockUser);
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Đăng ký (mock) thành công')));
      } else {
        final client = AuthAppUserService();
        final payload = {
          'username': _username.text.trim(),
          'email': _email.text.trim(),
          'password': _password.text,
          'full_name': _fullName.text.trim(),
        };
        final resp = await client.signup(payload);
        if (resp == null) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Không thể kết nối server')));
        } else {
          // handle possible validation errors from backend
    if (resp['errors'] != null) {
            // express-validator typical shape: { errors: [ { msg, param, ... } ] }
            try {
              final errors = resp['errors'];
              if (errors is List) {
                for (final e in errors) {
                  if (e is Map && e['param'] != null) {
                    _fieldErrors[e['param'].toString()] = e['msg']?.toString() ?? e.toString();
                  }
                }
                setState(() {});
                return;
              }
            } catch (_) {}
          }

          // try to extract user object from multiple possible keys
          dynamic userJson;
          userJson = resp['user'] ?? resp['data'] ?? resp['result'] ?? resp['account'] ?? resp;

          try {
            if (userJson != null && userJson is Map) {
              final appUser = AppUser.fromJson(Map<String, dynamic>.from(userJson));
              ref.read(userProvider.notifier).setUser(appUser);
              Navigator.of(context).pop();
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Đăng ký thành công')));
            } else {
              final msg = (resp['message'] != null) ? resp['message'].toString() : 'Đăng ký thất bại';
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
            }
          } catch (e) {
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Lỗi xử lý dữ liệu: $e')));
          }
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
      appBar: AppBar(title: const Text('Đăng ký')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: SingleChildScrollView(
            child: Column(
              children: [
                TextFormField(
                  controller: _username,
                  decoration: const InputDecoration(labelText: 'Tên đăng nhập'),
                  validator: (v) => (v == null || v.isEmpty) ? 'Vui lòng nhập tên đăng nhập' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _fullName,
                  decoration: const InputDecoration(labelText: 'Họ và tên (tùy chọn)'),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _email,
                  decoration: const InputDecoration(labelText: 'Email'),
                  keyboardType: TextInputType.emailAddress,
                  validator: (v) => (v == null || v.isEmpty) ? 'Vui lòng nhập email' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _password,
                  decoration: InputDecoration(
                    labelText: 'Mật khẩu',
                    errorText: _fieldErrors['password'],
                  ),
                  obscureText: true,
                  validator: (v) => (v == null || v.length < 6) ? 'Mật khẩu ít nhất 6 ký tự' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _passwordConfirm,
                  decoration: InputDecoration(
                    labelText: 'Xác nhận mật khẩu',
                    errorText: _fieldErrors['password_confirm'] ?? _fieldErrors['passwordConfirmation'],
                  ),
                  obscureText: true,
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Vui lòng xác nhận mật khẩu';
                    if (v != _password.text) return 'Mật khẩu không khớp';
                    return null;
                  },
                ),
                const SizedBox(height: 20),
                _loading ? const CircularProgressIndicator() : SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _submit,
                    child: const Text('Đăng ký'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
