import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'screens/splash_screen.dart';
import 'screens/auth_page.dart';
import 'screens/home_screen.dart';
import 'screens/modules_screen.dart';
import 'screens/profile/profile_screen.dart';
import 'screens/profile/edit_profile_screen.dart';
import 'screens/profile/theme_toggle_screen.dart';
import 'screens/profile/help_support_screen.dart';
import 'theme/theme_provider.dart';
import 'screens/forgot_password_page.dart'; // Import the ForgotPasswordPage
import 'providers/profile_provider.dart';
import 'services/api_service.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (_) => ProfileProvider(ApiService())),
      ],
      child: const ZabEFestApp(),
    ),
  );
}

class ZabEFestApp extends StatelessWidget {
  const ZabEFestApp({super.key});

  @override
  Widget build(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context);
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      themeMode: themeProvider.themeMode,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.light(
          primary: Colors.deepPurple,
          secondary: Colors.deepPurpleAccent,
        ),
        textTheme: GoogleFonts.robotoTextTheme(ThemeData.light().textTheme).copyWith(
          bodyMedium: GoogleFonts.roboto(),
          bodyLarge: GoogleFonts.roboto(),
          titleMedium: GoogleFonts.roboto(),
          titleLarge: GoogleFonts.roboto(),
          labelLarge: GoogleFonts.roboto(),
        ),
      ),
      darkTheme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.dark(
          primary: Colors.deepPurple,
          secondary: Colors.deepPurpleAccent,
        ),
        textTheme: GoogleFonts.robotoTextTheme(ThemeData.dark().textTheme).copyWith(
          bodyMedium: GoogleFonts.roboto(),
          bodyLarge: GoogleFonts.roboto(),
          titleMedium: GoogleFonts.roboto(),
          titleLarge: GoogleFonts.roboto(),
          labelLarge: GoogleFonts.roboto(),
        ),
      ),
      initialRoute: '/splash',
      routes: {
        '/splash': (context) => const SplashScreen(),
        '/forgot-password': (context) => const ForgotPasswordPage(), // Define the route
        '/auth': (context) => const AuthPage(),
        '/home': (context) => const HomeScreen(),
        '/modules': (context) => const ModulesScreen(),
        '/profile': (context) => const ProfileScreen(),
        '/profile/edit': (context) => const EditProfileScreen(),
        '/theme': (context) => const ThemeToggleScreen(),
        '/help': (context) => const HelpSupportScreen(),
      },
    );
  }
}
