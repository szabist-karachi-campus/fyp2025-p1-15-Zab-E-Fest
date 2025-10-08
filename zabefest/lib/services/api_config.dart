import 'package:flutter/foundation.dart';
import 'dart:io' show Platform;

class ApiConfig {
  static String get baseUrl {
    // Check if API_BASE_URL is provided as a Dart define
    const String? definedBaseUrl = String.fromEnvironment('API_BASE_URL');
    if (definedBaseUrl != null && definedBaseUrl.isNotEmpty) {
      print('DEBUG: Using API_BASE_URL from environment: $definedBaseUrl');
      return definedBaseUrl;
    }

    if (kIsWeb) {
      return 'http://localhost:5000';
    } else if (Platform.isAndroid) {
      // Always use your computer's IP for Android devices (both emulator and physical)
      print('DEBUG: Android device detected, using server IP:192.168.0.107:5000');
      return 'http://192.168.0.107:5000';
    } else if (Platform.isIOS) {
      // For iOS simulator, use localhost
      return 'http://localhost:5000';
    }
    // Default for other platforms
    print('DEBUG: Default platform, using server IP:192.168.0.107:5000');
    return 'http://192.168.0.107:5000';
  }
}


