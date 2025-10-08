import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '/theme/theme_provider.dart';

class ThemeToggleScreen extends StatelessWidget {
  const ThemeToggleScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context);
    final isDark = themeProvider.themeMode == ThemeMode.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text("Theme Mode"),
        backgroundColor: Colors.deepPurple,
      ),
      body: SwitchListTile(
        title: const Text("Dark Mode"),
        value: isDark,
        onChanged: (val) => themeProvider.toggleTheme(val),
      ),
    );
  }
}
