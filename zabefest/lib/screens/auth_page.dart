// auth_page.dart
import 'package:flutter/material.dart';
import 'login_page.dart';
import 'signup_page.dart';
class AuthPage extends StatefulWidget {
  const AuthPage({super.key});

  @override
  State<AuthPage> createState() => _AuthPageState();
}

class _AuthPageState extends State<AuthPage> {
  bool isLogin = true;

  @override
  Widget build(BuildContext context) {
    return isLogin
        ? LoginPage(onSignUpTap: () => setState(() => isLogin = false))
        : SignupPage(onLoginTap: () => setState(() => isLogin = true));
  }
}
