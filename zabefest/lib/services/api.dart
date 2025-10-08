import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:logger/logger.dart';
import 'api_config.dart';

final logger = Logger();

String get baseAuthUrl => '${ApiConfig.baseUrl}/api/auth';

/// USER LOGIN
Future<Map<String, dynamic>> loginUser(String email, String password) async {
  try {
    logger.d('Attempting login for email: $email');
    final response = await http.post(
      Uri.parse('$baseAuthUrl/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email.toLowerCase(), 'password': password}),
    ).timeout(
      const Duration(seconds: 10),
      onTimeout: () => throw TimeoutException('Login request timed out'),
    );

    logger.d('Login response status: ${response.statusCode}');
    
    final Map<String, dynamic> responseData = jsonDecode(response.body);
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      logger.i('Login successful');
      // Persist token securely, and store email for quick profile header
      if (responseData.containsKey('token')) {
        const storage = FlutterSecureStorage();
        await storage.write(key: 'auth_token', value: responseData['token']);
        final prefs = await SharedPreferences.getInstance();
        if (responseData.containsKey('email')) {
          await prefs.setString('userEmail', responseData['email']);
        }
      }
      return responseData;
    } else {
      logger.w('Login failed with status ${response.statusCode}: ${response.body}');
      return {
        'error': true,
        'message': responseData['message'] ?? 'Login failed. Please try again.',
        'status': response.statusCode,
      };
    }
  } catch (e) {
    logger.e('Login error: $e');
    if (e is TimeoutException) {
      return {
        'error': true,
        'message': 'Connection timed out. Please check your internet connection.',
      };
    } else if (e is FormatException) {
      return {
        'error': true,
        'message': 'Server response was not in the expected format.',
      };
    } else {
      return {
        'error': true,
        'message': 'An unexpected error occurred. Please try again.',
      };
    }
  }
}

/// USER SIGNUP
Future<Map<String, dynamic>> signupUser(String name,String email, String password) async {
  final response = await http.post(
    Uri.parse('$baseAuthUrl/signup'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({'name':name,'email': email.toLowerCase(), 'password': password}),
  );

  return jsonDecode(response.body);
}
Future<String?> fetchUserNameFromBackend() async {
  final prefs = await SharedPreferences.getInstance();
  final token = prefs.getString('token');
  if (token == null) return null;

  final response = await http.get(
    Uri.parse('$baseAuthUrl/me'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    },
  );

  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    return data['name'];
  } else {
    logger.e('Error fetching user: ${response.body}');
    return null;
  }
}

/// Fetch current user's result (requires participant JWT)
Future<Map<String, dynamic>?> fetchMyResult() async {
  final prefs = await SharedPreferences.getInstance();
  final token = prefs.getString('token');
  if (token == null) return null;

  try {
    final uri = Uri.parse('${ApiConfig.baseUrl}/api/participants/my/result');
    final response = await http.get(
      uri,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    }
    return {
      'error': true,
      'status': response.statusCode,
      'message': jsonDecode(response.body)['message'] ?? 'Unable to fetch result',
    };
  } catch (e) {
    return {
      'error': true,
      'message': 'Failed to connect to server',
    };
  }
}
